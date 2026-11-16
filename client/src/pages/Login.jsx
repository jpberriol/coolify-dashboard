import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { login } from "../api/auth";

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(username, password);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      toast.success(t("auth.loginSuccess"), {
        icon: <CheckCircleIcon className="w-6 h-6" />,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.loginError"), {
        icon: <XCircleIcon className="w-5 h-5" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-slate-900 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
            ◈
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {t("dashboard.title")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              {t("auth.username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white/5 border border-slate-800 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
              placeholder={t("auth.username")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white/5 border border-slate-800 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base pr-12 overflow-hidden text-ellipsis"
                placeholder={t("auth.password")}
                required
              />

              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition-colors z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 drop-shadow-lg" />
                  ) : (
                    <EyeIcon className="w-5 h-5 drop-shadow-lg" />
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2.5 md:py-3 rounded-lg font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 touch-manipulation"
          >
            {loading ? t("common.loading") : t("auth.login")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

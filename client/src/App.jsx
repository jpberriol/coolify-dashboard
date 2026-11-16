import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Tooltip } from "react-tooltip";
import { Toaster } from "react-hot-toast";
import { isAuthenticated } from "./api/auth";
import { SoundProvider } from "./hooks/useSoundEffects";
import { QueryProvider } from "./providers/QueryProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import SoundToggle from "./components/SoundToggle";
import BackToTop from "./components/BackToTop";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SoundProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            <Tooltip id="backup-tooltip" />
            <Tooltip id="internal-url-tooltip" />
            <Tooltip id="external-url-tooltip" />
            <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "0.5rem",
                padding: "1rem 1.25rem",
                fontSize: "0.95rem",
                fontWeight: "500",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
                minWidth: "320px",
                maxWidth: "420px",
              },
              success: {
                style: {
                  background: "#059669",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#10b981",
                },
              },
              error: {
                style: {
                  background: "#dc2626",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#ef4444",
                },
              },
              loading: {
                style: {
                  background: "#2563eb",
                  color: "#ffffff",
                },
                iconTheme: {
                  primary: "#ffffff",
                  secondary: "#2563eb",
                },
              },
            }}
          />
          <SoundToggle />
          <BackToTop />
        </BrowserRouter>
      </SoundProvider>
    </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;

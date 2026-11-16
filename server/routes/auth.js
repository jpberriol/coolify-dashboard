import express from "express";
import { verifyToken } from "../middleware/auth.js";
import authService from "../services/authService.js";
import { asyncHandler, AppError } from "../utils/errorHandler.js";

const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const validation = authService.validateCredentials(username, password);

    if (!validation.valid) {
      throw new AppError(validation.error, 401);
    }

    const token = authService.generateToken(username);
    const user = authService.getUserInfo(username);

    res.json({
      message: "Giriş başarılı",
      token,
      user,
    });
  })
);

router.get("/verify", verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: authService.getUserInfo(req.user.username),
  });
});

router.get("/me", verifyToken, (req, res) => {
  res.json(authService.getUserInfo(req.user.username));
});

export default router;

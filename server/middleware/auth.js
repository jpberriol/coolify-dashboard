import authService from '../services/authService.js';
import {AppError} from '../utils/errorHandler.js';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("Token not found", 401);
    }

    req.user = authService.verifyToken(token);
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      message: error.message || "Invalid token",
    });
  }
};

export const verifyTokenForSSE = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const headerToken = authHeader && authHeader.split(" ")[1];
    const queryToken = req.query.token;

    const token = headerToken || queryToken;

    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      message: error.message || "Invalid token",
    });
  }
};

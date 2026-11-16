import jwt from "jsonwebtoken";

class AuthService {
  validateCredentials(username, password) {
    if (!username || !password) {
      return {
        valid: false,
        error: "Username and password are required",
      };
    }

    if (
      username.toLowerCase() !== process.env.ADMIN_USERNAME.toLowerCase() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return {
        valid: false,
        error: "Invalid username or password",
      };
    }

    return { valid: true };
  }

  generateToken(username) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign({ username }, jwtSecret, {
      expiresIn: "24h",
    });
  }

  verifyToken(token) {
    if (!token) {
      throw new Error("Token is required");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    try {
      return jwt.verify(token, jwtSecret);
    } catch (_error) {
      throw new Error("Invalid or expired token");
    }
  }

  getUserInfo(username) {
    return {
      username,
    };
  }
}

export default new AuthService();

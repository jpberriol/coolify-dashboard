import jwt from "jsonwebtoken";

class AuthService {
  validateCredentials(username, password) {
    if (!username || !password) {
      return {
        valid: false,
        error: "Kullanıcı adı ve şifre zorunludur",
      };
    }

    if (
      username.toLowerCase() !== process.env.ADMIN_USERNAME.toLowerCase() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return {
        valid: false,
        error: "Geçersiz kullanıcı adı veya şifre",
      };
    }

    return { valid: true };
  }

  generateToken(username) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET yapılandırılmamış");
    }

    return jwt.sign({ username }, jwtSecret, {
      expiresIn: "24h",
    });
  }

  verifyToken(token) {
    if (!token) {
      throw new Error("Token zorunludur");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET yapılandırılmamış");
    }

    try {
      return jwt.verify(token, jwtSecret);
    } catch (_error) {
      throw new Error("Geçersiz veya süresi dolmuş token");
    }
  }

  getUserInfo(username) {
    return {
      username,
    };
  }
}

export default new AuthService();

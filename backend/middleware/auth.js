import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // Assume "Bearer <token>" format
        // But for simplicity, we allow raw token or Bearer
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length).trim() : token;

        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || "default_secret_please_change");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

export default authMiddleware;

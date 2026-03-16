import rateLimit from "express-rate-limit";

// General API Rate Limit: 500 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown",
});

// Authentication Rate Limit: 5 login attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts, please try again after 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes("signup") && req.method === "POST",
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown",
});

// File Upload Rate Limit: 10 uploads per hour per authenticated user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Upload limit exceeded. Maximum 10 files per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `upload_${req.user.id}`;
    }
    return `upload_${
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown"
    }`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Upload limit exceeded. Maximum 10 files per hour.",
      retryAfter: "1 hour",
    });
  },
});

// Discussion/Comment Rate Limit: 20 posts per hour per authenticated user
export const discussionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: "Discussion posting limit exceeded. Maximum 20 posts per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `discussion_${req.user.id}`;
    }
    return `discussion_${
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown"
    }`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Discussion posting limit exceeded. Maximum 20 posts per hour.",
      retryAfter: "1 hour",
    });
  },
});

// AI Chat Rate Limit: 30 requests per hour per authenticated user
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    error: "Chat limit exceeded. Maximum 30 messages per hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `chat_${req.user.id}`;
    }
    return `chat_${
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown"
    }`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Chat limit exceeded. Maximum 30 messages per hour.",
      retryAfter: "1 hour",
    });
  },
});

// Password Reset Rate Limit: 3 attempts per hour per email/IP
export const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many password reset attempts. Please try again after 1 hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email;
    if (email) {
      return `passwordreset_${email.toLowerCase()}`;
    }
    return `passwordreset_${
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown"
    }`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many password reset attempts. Please try again after 1 hour.",
      retryAfter: "1 hour",
    });
  },
});

// Custom rate limiter factory for fine-grained control
export const createCustomLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  };
  return rateLimit({ ...defaults, ...options });
};

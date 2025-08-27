import prisma from "./lib/prisma.js";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Database connection test
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to MongoDB via Prisma");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
  }
};

// Test connection on import
testConnection();

// Export prisma client for direct use
export default prisma;

// Legacy helper functions for backward compatibility
export const dbGet = async (model, where) => {
  return await prisma[model].findFirst({ where });
};

export const dbAll = async (model, options = {}) => {
  return await prisma[model].findMany(options);
};

export const dbRun = async (model, operation, data) => {
  switch (operation) {
    case "create":
      return await prisma[model].create({ data });
    case "update":
      return await prisma[model].update(data);
    case "delete":
      return await prisma[model].delete(data);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

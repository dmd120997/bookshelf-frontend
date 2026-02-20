import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
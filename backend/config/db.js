import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// MySQL Connection Pool — traveloop_db
// ============================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "traveloop_db",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: "utf8mb4",
  timezone: "+00:00",
});

// Test connection on startup
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
};

export default pool;

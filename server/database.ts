import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mysqlPool: mysql.Pool | null = null;

const getMysqlPool = () => {
  if (mysqlPool) return mysqlPool;
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shandy_cleaner',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  return mysqlPool;
};

// Unified query interface (only MySQL)
export const query = async (sql: string, params: any[] = []) => {
  const pool = getMysqlPool();
  return await pool.query(sql, params);
};

export const initDb = async () => {
  try {
    console.log('Initializing MySQL database...');
    const pool = getMysqlPool();
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        passwordHash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'editor') DEFAULT 'editor',
        gemini_api_key TEXT,
        anthropic_api_key TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add gemini_api_key column if it doesn't exist (for existing tables)
    try {
      await pool.query('ALTER TABLE users ADD COLUMN gemini_api_key TEXT');
    } catch (e: any) {
      // Ignore error if column already exists
      if (e.code !== 'ER_DUP_FIELDNAME') {
        // console.log('Column gemini_api_key might already exist or error:', e.message);
      }
    }

    // Add anthropic_api_key column if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN anthropic_api_key TEXT');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        // console.log('Column anthropic_api_key might already exist or error:', e.message);
      }
    }

    // History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        mode VARCHAR(50) NOT NULL,
        original_code TEXT,
        cleaned_code TEXT,
        file_name VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id INT PRIMARY KEY DEFAULT 1,
        totalFilesProcessed INT DEFAULT 0,
        totalBytesSaved BIGINT DEFAULT 0,
        totalErrors INT DEFAULT 0,
        totalVisits INT DEFAULT 0,
        lastRun DATETIME
      )
    `);
    
    const [rows]: any = await pool.query('SELECT * FROM stats WHERE id = 1');
    if (rows.length === 0) {
      await pool.query('INSERT INTO stats (id) VALUES (1)');
    }

    // Config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    // Email Templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html TEXT NOT NULL,
        variables JSON
      )
    `);
    
    console.log('Database initialized successfully (MySQL)');
  } catch (error) {
    console.error('Database initialization failed (MySQL):', error);
    throw error;
  }
};

export default { query };

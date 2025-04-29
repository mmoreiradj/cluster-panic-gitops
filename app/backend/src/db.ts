import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'muller',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

export async function initializeDatabase() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Test the connection
      await pool.query('SELECT 1');
      
      // Create the table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          value DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Database initialized successfully');
      return;
    } catch (error) {
      retries++;
      console.log(`Database connection attempt ${retries} failed, retrying in ${RETRY_DELAY/1000} seconds...`);
      if (retries === MAX_RETRIES) {
        console.error('Failed to initialize database after maximum retries:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

export default pool; 
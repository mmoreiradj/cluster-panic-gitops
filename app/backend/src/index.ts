import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT as string),
});

// Middleware
app.use(cors());
app.use(express.json());

// Create items table if it doesn't exist
async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                value NUMERIC(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created or already exists');
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        environment: process.env.NODE_ENV,
        database: {
            host: process.env.DB_HOST,
            name: process.env.DB_NAME,
            user: process.env.DB_USER,
        }
    });
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Error fetching items' });
    }
});

// Create item
app.post('/api/items', async (req, res) => {
    try {
        const { name, value } = req.body;
        const result = await pool.query(
            'INSERT INTO items (name, value) VALUES ($1, $2) RETURNING *',
            [name, value]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Error creating item' });
    }
});

// Initialize database and start server
createTable().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});


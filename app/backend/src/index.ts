import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Add startup logging
console.log('Starting backend server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Current working directory:', process.cwd());
console.log('Server file location:', __dirname);

const app = express();
const port = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
console.log('Validating environment variables...');
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
    console.log(`Environment variable ${envVar} is set`);
}

// PostgreSQL connection
console.log('Initializing PostgreSQL connection...');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT as string),
});

// Add database connection error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    console.error('Error stack:', err.stack);
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Create items table if it doesn't exist
async function createTable() {
    try {
        console.log('Checking/creating items table...');
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
        console.error('Error stack:', (error as Error).stack);
        process.exit(1);
    }
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        console.log('Health check requested');
        // Test database connection
        await pool.query('SELECT 1');
        console.log('Database connection test successful');
        
        res.status(200).json({ 
            status: 'ok',
            environment: process.env.NODE_ENV,
            database: {
                host: process.env.DB_HOST,
                name: process.env.DB_NAME,
                user: process.env.DB_USER,
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        console.error('Error stack:', (error as Error).stack);
        res.status(500).json({ 
            status: 'error',
            error: 'Database connection failed',
            details: (error as Error).message
        });
    }
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        console.log('Fetching all items...');
        const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
        console.log(`Successfully fetched ${result.rows.length} items`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching items:', error);
        console.error('Error stack:', (error as Error).stack);
        res.status(500).json({ 
            error: 'Error fetching items',
            details: (error as Error).message
        });
    }
});

// Create item
app.post('/api/items', async (req, res) => {
    try {
        const { name, value } = req.body;
        console.log('Creating new item:', { name, value });
        
        const result = await pool.query(
            'INSERT INTO items (name, value) VALUES ($1, $2) RETURNING *',
            [name, value]
        );
        console.log('Successfully created item:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating item:', error);
        console.error('Error stack:', (error as Error).stack);
        res.status(500).json({ 
            error: 'Error creating item',
            details: (error as Error).message
        });
    }
});

// Add error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Add process error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    console.error('Error stack:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});

// Initialize database and start server
createTable().then(() => {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
        console.log('Server process ID:', process.pid);
    });

    // Add graceful shutdown handler
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM signal. Starting graceful shutdown...');
        server.close(() => {
            console.log('Server closed. Exiting process...');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT signal. Starting graceful shutdown...');
        server.close(() => {
            console.log('Server closed. Exiting process...');
            process.exit(0);
        });
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
});


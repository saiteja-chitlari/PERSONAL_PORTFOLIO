import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/db.js';
import apiRouter from './routes/api.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Enable request body parsing
app.use(express.json());

// Initialize Database (MongoDB with JSON fallback)
await initializeDatabase();

// Mount REST API endpoints
app.use('/api', apiRouter);

// Serve Static Frontend Assets (Production deployment setup)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// For any route not handled by the API, serve client's index.html
app.get('*', (req, res) => {
  // Only serve index.html if the build directory exists
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      // In development when build is missing, return simple API status
      res.status(200).json({ 
        status: 'Server is running', 
        message: 'React client build not found. Run client in dev mode (port 5173).' 
      });
    }
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Portfolio backend server listening on port ${PORT}`);
  console.log(` REST endpoints mounted at http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});

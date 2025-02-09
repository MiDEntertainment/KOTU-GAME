// Import necessary modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');
const playerRoutes = require('./routes/playerRoutes'); // Import player routes

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());           
app.use(express.json());  

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

// ✅ Make `pool` available to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Attach routes
app.use('/api', playerRoutes);

// Start Server
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}/`);
});

module.exports = app;
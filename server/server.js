// Import necessary modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
require('dotenv').config();
const { Pool } = require('pg');
const playerRoutes = require('./routes/playerRoutes'); // Import player routes

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

const corsOptions = {
    origin: "*", // Allow all origins (for testing)
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization"
};

app.use(cors(corsOptions));          
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

// ✅ Load the PFX certificate with the password
const sslOptions = {
    pfx: fs.readFileSync('D:/KOTU-Game/ssl/server.pfx'),
    passphrase: "testpassword"  // Use the password you set during export
};

// ✅ Start HTTPS Server
https.createServer(sslOptions, app).listen(port, () => {
    console.log(`✅ Secure Server running at https://localhost:${port}/`);
});

module.exports = app;
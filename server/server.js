// Import necessary modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const http = require('http'); // ✅ Use HTTP for Render
const https = require('https');
require('dotenv').config();
const { Pool } = require('pg');

const playerRoutes = require('./routes/playerRoutes'); // Import player routes
const { startTwitchChatListener } = require('./twitchApp/twitchChatListener');

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

// ✅ Check if running on Render
if (process.env.RENDER) {
    console.log("🚀 Running on Render: Using HTTP (Render provides HTTPS automatically)");
    http.createServer(app).listen(port, () => {
        console.log(`✅ Server running on render`);
    });
} else {
    console.log("🔒 Running Locally: Using HTTPS with self-signed certificate");
    const sslOptions = {
        pfx: fs.readFileSync('D:/KOTU-Game/ssl/server.pfx'),
        passphrase: "testpassword" // Use the password you set during export
    };

    https.createServer(sslOptions, app).listen(port, () => {
        console.log(`✅ Secure Server running at https://localhost:${port}/`);
    });
}

module.exports = app;

startTwitchChatListener();
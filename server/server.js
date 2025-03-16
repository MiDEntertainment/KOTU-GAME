// Import necessary modules
const express = require('express');
const fs = require('fs');
const http = require('http'); // ✅ Use HTTP for Render
const https = require('https');
require('dotenv').config();

const { startTwitchChatListener} = require('./twitchApp/twitchChatListener');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;       
app.use(express.json());  

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
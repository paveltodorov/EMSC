import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 5000;

// Load credentials
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

const { client_id, client_secret, redirect_uris } = credentials.web;
const REDIRECT_URI = "http://localhost:5000/callback";

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

// Middleware to parse query params
app.use(express.urlencoded({ extended: true }));

app.get('/callback', (req, res) => {
  const code = req.query.code;
  if (code) {
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) {
        return res.status(400).send('Error retrieving access token');
      }
      oauth2Client.setCredentials(tokens);
      fs.writeFileSync(path.join(__dirname, 'token.json'), JSON.stringify(tokens));
      res.send('Authorization successful. You can close this window.');
    });
  } else {
    res.status(400).send('Authorization code not found');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
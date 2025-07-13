import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the credentials file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
// Path to the file containing YouTube URLs
const LINKS_PATH = path.join(__dirname, 'youtube_links.txt');
// Path to store the tokens
const TOKEN_PATH = path.join(__dirname, 'token-emsc.json');

// Read credentials from the JSON file
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
const { client_id, client_secret, redirect_uris } = credentials.web;

// Use a predefined redirect URI or set your own
const REDIRECT_URI = "http://localhost:5000/callback";

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

// Function to get and store the new access token
async function getNewToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
  });
  console.log('Authorize this app by visiting this URL:', authUrl);

  const code = await new Promise((resolve) => {
    process.stdin.resume();
    process.stdout.write('Enter the code from that page here: ');

    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  process.stdin.pause();
}

// Check if we have previously stored a token
if (fs.existsSync(TOKEN_PATH)) {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2Client.setCredentials(token);

  // Automatically refresh access token when needed
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      token.refresh_token = tokens.refresh_token;
    }
    token.access_token = tokens.access_token;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  });
} else {
  // No token found, initiate the token generation process
  await getNewToken();
}

// Initialize YouTube API
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

// Function to create a playlist
async function createPlaylist(title, description) {
  try {
    const response = await youtube.playlists.insert({
      part: 'snippet,status',
      resource: {
        snippet: {
          title: title,
          description: description,
        },
        status: {
          privacyStatus: 'private',
        },
      },
    });

    console.log('Playlist created:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating playlist:', error.message);
  }
}

// Function to add a video to the playlist
async function addVideoToPlaylist(playlistId, videoId) {
  try {
    await youtube.playlistItems.insert({
      part: 'snippet',
      resource: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId,
          },
        },
      },
    });
    console.log(`Video ${videoId} added to playlist ${playlistId}`);
  } catch (error) {
    console.error('Error adding video to playlist:', error.message);
  }
}

// Function to extract video ID from a YouTube URL
function extractVideoId(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('v');
}

// Function to read YouTube URLs from a file
function readYouTubeLinks(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return data.split('\n').filter(url => url.trim() !== '');
}

// Main function to create a playlist and add videos
async function main() {
  const playlistTitle = 'UNSC 2024 - FIRST HALF OF YEAR (part 2)';
  const playlistDescription = 'A playlist created using the YouTube API';

  // Create a new playlist
  const playlistId = await createPlaylist(playlistTitle, playlistDescription);

  // Read YouTube URLs from the file
  const youtubeUrls = readYouTubeLinks(LINKS_PATH);

  // Add each video to the playlist
  for (const url of youtubeUrls) {
    const videoId = extractVideoId(url);
    if (videoId) {
      await addVideoToPlaylist(playlistId, videoId);
    } else {
      console.error(`Invalid URL: ${url}`);
    }
  }
}

// run local server
await getNewToken()

// main();

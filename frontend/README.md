# StorePal Frontend

A modern React-based web interface for real-time AI conversations with StorePal assistant.

## Features

- 🎤 Real-time voice recording from browser
- 💬 Live transcript display during conversations
- 🔴 Visual indicator when AI is speaking
- 🎨 Beautiful, modern UI with smooth animations
- 📱 Responsive design for all devices
- ⚡ WebSocket-based real-time communication

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- StorePal backend running on `http://localhost:8000`

## Installation

```bash
cd frontend
npm install
```

## Running the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

**Important:** Make sure the backend server is running first!

```bash
cd ../backend
python main.py
```

## Usage

1. Click **Connect** to establish connection with the AI agent
2. Allow microphone access when prompted
3. Click **Start Recording** to begin conversation
4. Speak naturally - your speech will be transcribed in real-time
5. Watch for the "AI Speaking" indicator when the agent responds
6. View the full conversation transcript on screen

## Technology Stack

- **React 18** - Modern UI framework
- **WebSocket API** - Real-time bidirectional communication
- **MediaRecorder API** - Browser audio recording
- **Web Audio API** - Audio playback

## Browser Support

- Chrome/Edge 85+
- Firefox 79+
- Safari 14.1+

Requires browsers with WebSocket, MediaRecorder, and Web Audio API support.

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js              # Main application component
│   ├── App.css             # Application styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Configuration

By default, the app connects to `ws://localhost:8000/ws/conversation`.

To change the backend URL, edit `WS_URL` in `src/App.js`:

```javascript
const WS_URL = 'ws://your-backend-url:8000/ws/conversation';
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Can't connect** | Make sure backend is running on port 8000 |
| **Microphone not working** | Check browser permissions for microphone access |
| **No audio playback** | Check browser audio settings and speaker volume |
| **WebSocket errors** | Verify CORS is enabled on backend |

## License

Part of the StorePal project.


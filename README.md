# StorePal - Conversational AI Agent

A real-time conversational AI agent powered by ElevenLabs ConvAI API, built with FastAPI and Python. This application allows you to have voice conversations using your computer's microphone and speakers.

## Features

- 🎤 Real-time microphone input capture
- 🔊 Speaker output for AI responses
- 🤖 Natural conversation with ElevenLabs AI agents
- ⚡ WebSocket-based communication for low latency
- 🎯 Built with FastAPI for robust backend
- 🔄 Automatic audio format handling (PCM 16kHz)

## Prerequisites

- Python 3.8 or higher
- Microphone and speakers/headphones
- ElevenLabs API account with API key and Agent ID

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv .venv

# Activate virtual environment:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install packages:
pip install -r requirements.txt
```

**Note:** If PyAudio fails to install:
- **Windows:** `pip install pipwin && pipwin install pyaudio`
- **macOS:** `brew install portaudio` then `pip install pyaudio`
- **Linux:** `sudo apt-get install portaudio19-dev python3-pyaudio`

### 2. Configure API Keys

Create a `.env` file in the **root directory** (not in backend):

```bash
ELEVENLABS_API_KEY=your_api_key_here
AGENT_ID=your_agent_id_here
```

### 3. Run the Application

**Terminal 1 - Start API Server:**
```bash
cd backend
python main.py
```

**Terminal 2 - Start Voice Client:**
```bash
cd backend
python audio_client.py
```

That's it! Start speaking into your microphone 🎤

## Usage

Once both the server and audio client are running:

1. **Speak naturally** into your microphone
2. The AI will **transcribe** your speech in real-time
3. Get **intelligent responses** spoken back through your speakers
4. Press `Ctrl+C` to stop

### Example Output:
```
🎉 Conversation started! ID: conv_123456789
💬 Start speaking... (Press Ctrl+C to stop)

👤 You: What products do you have?
🤖 Agent: I can help you find products! What are you looking for today?
```

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│             │         │              │         │                 │
│  Audio      │ ◄─────► │   FastAPI    │ ◄─────► │  ElevenLabs     │
│  Client     │ WebSocket   Backend    │ WebSocket  ConvAI API     │
│             │         │              │         │                 │
└─────────────┘         └──────────────┘         └─────────────────┘
     ▲  │                                                │  ▲
     │  │                                                │  │
     │  └─── Audio Capture (Mic)                        │  │
     └────── Audio Playback (Speaker)  Audio Streaming ─┘  │
                                       Text Transcription ─┘
```

## API Endpoints

The FastAPI server provides a clean REST + WebSocket API ready for frontend integration:

### HTTP Endpoints

- `GET /` - API info and status
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

### WebSocket Endpoint

- `WS /ws/conversation` - Real-time voice conversation stream

Visit `http://localhost:8000/docs` for interactive API documentation!

## Project Structure

```
StorePal/
├── backend/
│   ├── main.py             # FastAPI server (run this first)
│   ├── audio_client.py     # Voice client (run this second)
│   ├── requirements.txt    # Python dependencies
│   └── .venv/              # Virtual environment (auto-created)
├── frontend/               # (Future: React/Vue frontend)
├── .env                    # Your API credentials (create this!)
├── .env.example            # Template for credentials
├── .gitignore             # Git ignore rules
└── README.md              # Documentation
```

## Customization

Edit the agent's personality in `backend/main.py`:

```python
config_override = {
    "agent": {
        "prompt": {
            "prompt": "You are a helpful AI assistant for StorePal..."
        },
        "first_message": "Hi! I'm your StorePal assistant...",
        "language": "en"
    }
}
```

Restart the server to apply changes.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **PyAudio won't install** | Windows: `pipwin install pyaudio`<br>macOS: `brew install portaudio`<br>Linux: `sudo apt-get install portaudio19-dev` |
| **Microphone not working** | Check system audio settings<br>Grant microphone permissions to Python |
| **Connection refused** | Make sure `main.py` is running first<br>Check if port 8000 is available |
| **API errors** | Verify `.env` has correct credentials<br>Check ElevenLabs API status |
| **No audio playback** | Check speaker settings<br>Test with system audio |

## Technologies Used

- **FastAPI** - Modern web framework for building APIs
- **WebSockets** - Real-time bidirectional communication
- **PyAudio** - Audio I/O library for Python
- **ElevenLabs ConvAI** - Advanced conversational AI platform
- **Python-dotenv** - Environment variable management

## License

This project is part of StorePal application.

## Support

For issues related to:
- **ElevenLabs API**: Visit [ElevenLabs Documentation](https://elevenlabs.io/docs)
- **FastAPI**: Visit [FastAPI Documentation](https://fastapi.tiangolo.com/)
- **Project Issues**: Open an issue in the project repository

---

Made with ❤️ for StorePal


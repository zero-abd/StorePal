# Quick Start Guide

## Setup (One-time)

1. **Create .env file** in root directory:
   ```
   ELEVENLABS_API_KEY=your_key_here
   AGENT_ID=your_agent_id_here
   ```

2. **Install dependencies** (from backend folder):
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate    # Windows
   pip install -r requirements.txt
   ```

## Running the App

**Terminal 1:**
```bash
cd backend
python main.py
```

**Terminal 2:**
```bash
cd backend
python audio_client.py
```

Start talking! 🎤

## What's What

- `main.py` - FastAPI server (your API backend for future frontend)
- `audio_client.py` - Voice test client (uses mic/speaker)
- `requirements.txt` - Python packages needed

## For Future Frontend Integration

The API is ready at `http://localhost:8000`:
- WebSocket: `ws://localhost:8000/ws/conversation`
- API Docs: `http://localhost:8000/docs`


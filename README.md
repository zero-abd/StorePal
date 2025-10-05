# StorePal - AI Shopping Assistant 🛒

**Built for HackUTA 2025** 🎓

A real-time conversational AI shopping assistant that helps customers navigate stores effortlessly. Powered by ElevenLabs ConvAI API, Pinecone Vector Database, and built with FastAPI and React.

## 🎯 Problem Statement

When new incoming students or residents visit local Walmart stores or any superstore, they often face a frustrating shopping experience:

- **Lost and Confused**: Navigating large stores with thousands of products across multiple aisles can be overwhelming
- **Time Wasted**: Customers spend valuable time wandering around trying to locate specific items
- **Limited Help**: Finding store employees for assistance is often difficult, especially during peak hours
- **Language Barriers**: International students and new residents may struggle to communicate their needs
- **Inefficient Shopping**: The traditional "search and wander" approach leads to longer shopping trips and reduced customer satisfaction

## 💡 Our Solution

StorePal revolutionizes the in-store shopping experience by deploying **interactive AI kiosks** at strategic locations:

- **Entry Points**: Welcome customers with immediate assistance
- **Key Locations**: Positioned throughout the store at major intersections and departments
- **24/7 Availability**: Always ready to help, no waiting for staff assistance
- **Natural Conversation**: Speak naturally and get instant, accurate product location information
- **Multilingual Support**: Break language barriers with AI-powered understanding
- **Smart Search**: Powered by semantic search to understand what you need, even with vague descriptions

Simply walk up to a kiosk, ask "Where can I find organic almond milk?" and get precise aisle and section information instantly!

## ✨ Features

### Customer-Facing
- 🎤 **Voice-Activated Search**: Simply speak to find products
- 🗣️ **Natural Language Understanding**: Ask questions like you would to a human
- 📍 **Precise Location Info**: Get exact aisle and section numbers
- 🔊 **Audio Responses**: Hear clear, spoken directions
- 📱 **Web-Based Interface**: Accessible on kiosks or mobile devices
- 🌍 **Multilingual Support**: Help customers in multiple languages

### Technical Features
- 🤖 **AI-Powered Conversations**: ElevenLabs ConvAI for natural dialogue
- 🔍 **Semantic Search**: Pinecone vector database for intelligent product search
- ⚡ **Real-Time Communication**: WebSocket-based low-latency interactions
- 🎯 **Robust API**: FastAPI backend with comprehensive endpoints
- 🎨 **Modern UI**: Beautiful React interface with live transcripts and speaking indicators
- 🔄 **Automatic Audio Processing**: PCM 16kHz format handling
- 📊 **Inventory Integration**: Real-time product database with 500+ items

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher (for web frontend)
- Microphone and speakers/headphones
- **ElevenLabs API** account with API key and Agent ID ([Get Started](https://elevenlabs.io))
- **Pinecone API** key for vector database ([Get Started](https://www.pinecone.io/))

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
PINECONE_API_KEY=your_pinecone_api_key_here
```

### 3. Set Up Product Database

Initialize the Pinecone vector database with store inventory:

```bash
cd backend/pinecone_vdb
python upload_data.py
```

This will upload the Walmart inventory data from `backend/data/winmart_inventory.csv` to Pinecone for semantic search.

### 4. Run the Application

#### Option A: Web Frontend (Recommended)

**Terminal 1 - Start API Server:**
```bash
cd backend
python main.py
```

**Terminal 2 - Start Web Frontend:**
```bash
cd frontend
npm install
npm start
```

Open your browser to `http://localhost:3000` and start talking! 🎤

#### Option B: Python Audio Client

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

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│             │         │              │         │                 │
│   React     │ ◄─────► │   FastAPI    │ ◄─────► │  ElevenLabs     │
│  Frontend   │ WebSocket   Backend    │ WebSocket  ConvAI API     │
│  (Kiosk/    │         │              │         │                 │
│   Mobile)   │         │              │         └─────────────────┘
└─────────────┘         │              │                │  ▲
    ▲  │                │              │                │  │
    │  │                │              │    Audio ──────┘  │
    │  ├─── Live        │              │    Streaming      │
    │  │    Transcripts │              │                   │
    │  ├─── Speaking    └──────────────┘    Text ──────────┘
    │  │    Indicator          │            Transcription
    │  └─── Audio              │
    │       Capture            ▼
    │                   ┌──────────────┐
    │                   │              │
    └───────────────────│   Pinecone   │
                        │    Vector    │
         Semantic       │   Database   │
         Product        │              │
         Search         └──────────────┘
                               ▲
                               │
                        Store Inventory
                        (500+ Products)
```

**How It Works:**
1. Customer speaks at kiosk → Voice captured by React frontend
2. Audio streamed to FastAPI backend via WebSocket
3. Backend forwards to ElevenLabs ConvAI for processing
4. User query triggers semantic search in Pinecone vector database
5. Relevant products with aisle/section info returned
6. AI agent speaks the response back to customer

## API Endpoints

The FastAPI server provides a clean REST + WebSocket API ready for frontend integration:

### HTTP Endpoints

- `GET /` - API info and status
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

### WebSocket Endpoint

- `WS /ws/conversation` - Real-time voice conversation stream

Visit `http://localhost:8000/docs` for interactive API documentation!

## 📁 Project Structure

```
StorePal/
├── backend/
│   ├── main.py                      # FastAPI server with WebSocket
│   ├── audio_client.py              # Python voice client (testing)
│   ├── requirements.txt             # Python dependencies
│   ├── data/
│   │   └── winmart_inventory.csv    # Store product database (500+ items)
│   ├── pinecone_vdb/
│   │   ├── upload_data.py           # Upload inventory to Pinecone
│   │   ├── vector_search.py         # Semantic search functions
│   │   ├── example_usage.py         # Usage examples
│   │   ├── README.md                # Vector DB documentation
│   │   ├── QUICK_REFERENCE.md       # Quick reference guide
│   │   └── IMPLEMENTATION_SUMMARY.md # Implementation details
│   ├── PINECONE_SETUP.md            # Pinecone setup guide
│   ├── QUICKSTART.md                # Backend quick start
│   └── .venv/                       # Virtual environment (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.js                   # Main React component with WebSocket
│   │   ├── App.css                  # Beautiful UI styles
│   │   └── index.js                 # React entry point
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── package.json                 # Node dependencies
│   └── README.md                    # Frontend documentation
├── .env                             # Your API credentials (create this!)
├── .env.example                     # Template for credentials
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
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

## 🛠️ Technologies Used

### AI & Machine Learning
- **ElevenLabs ConvAI** - Advanced conversational AI with natural voice synthesis
- **Pinecone Vector Database** - Serverless vector database for semantic search
- **OpenAI Embeddings** - Text embeddings for intelligent product matching

### Backend
- **FastAPI** - Modern, high-performance Python web framework
- **WebSockets** - Real-time bidirectional communication
- **PyAudio** - Professional audio I/O for Python
- **Python-dotenv** - Secure environment variable management
- **Pandas** - Data processing for inventory management

### Frontend
- **React 18** - Modern component-based UI framework
- **WebSocket API** - Browser-native real-time communication
- **MediaRecorder API** - Browser audio capture
- **Web Audio API** - High-quality audio playback

### Data & Storage
- **CSV Inventory System** - 500+ product database with aisle/section mapping
- **Vector Embeddings** - Semantic search for natural language queries

## 🎓 HackUTA 2025

This project was built for HackUTA 2025 to solve real-world challenges faced by new students and residents when shopping at large superstores. Our goal is to make shopping more accessible, efficient, and enjoyable for everyone.

### Impact
- **Saves Time**: Reduces average shopping time by providing instant product location
- **Improves Accessibility**: Helps international students and non-native speakers
- **Enhances Experience**: Makes shopping less stressful and more efficient
- **Scalable Solution**: Can be deployed in any retail environment

## 📚 Documentation

- **Backend Setup**: See `backend/QUICKSTART.md` for detailed backend setup
- **Pinecone Guide**: See `backend/PINECONE_SETUP.md` for vector database setup
- **Vector Search**: See `backend/pinecone_vdb/README.md` for search implementation
- **Frontend**: See `frontend/README.md` for React app details
- **API Docs**: Visit `http://localhost:8000/docs` when running

## 🤝 Support

For issues related to:
- **ElevenLabs API**: Visit [ElevenLabs Documentation](https://elevenlabs.io/docs)
- **Pinecone**: Visit [Pinecone Documentation](https://docs.pinecone.io/)
- **FastAPI**: Visit [FastAPI Documentation](https://fastapi.tiangolo.com/)
- **React**: Visit [React Documentation](https://react.dev/)

## 👥 Team

Built with passion and dedication for HackUTA 2025 🎓

---

**StorePal** - Making Shopping Easier, One Voice at a Time 🛒✨


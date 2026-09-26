# StorePal - AI Shopping Assistant 🛒

**Built for HackUTA 2025** 🎓

**Live demo: https://storepal-app.vercel.app**

A comprehensive AI-powered shopping assistant that combines voice interaction, interactive store mapping, and intelligent product search to revolutionize the in-store shopping experience. Built with ElevenLabs ConvAI API, Pinecone Vector Database, FastAPI, and React.

## 🎯 Problem Statement

When new incoming students or residents visit local Walmart stores or any superstore, they often face a frustrating shopping experience:

- **Lost and Confused**: Navigating large stores with thousands of products across multiple aisles can be overwhelming
- **Time Wasted**: Customers spend valuable time wandering around trying to locate specific items
- **Limited Help**: Finding store employees for assistance is often difficult, especially during peak hours
- **Language Barriers**: International students and new residents may struggle to communicate their needs
- **Inefficient Shopping**: The traditional "search and wander" approach leads to longer shopping trips and reduced customer satisfaction

## 💡 Our Solution

StorePal revolutionizes the in-store shopping experience with a comprehensive suite of features:

### 🎤 Voice-First Interface
- **Natural Conversation**: Speak naturally and get instant, accurate product location information
- **Real-time Transcription**: See your words transcribed live as you speak
- **Audio Responses**: Hear clear, spoken directions and product information
- **Multilingual Support**: Break language barriers with AI-powered understanding

### 🗺️ Interactive Store Mapping
- **Visual Navigation**: Interactive store map with real-time product location pins
- **Aisle Highlighting**: Products are highlighted on the map with color-coded pins
- **Smart Routing**: Get visual guidance to your desired products
- **Department Overview**: Navigate by store sections and departments

### 📊 Intelligent Dashboard
- **Product Analytics**: View detailed product information and availability
- **Search History**: Track your previous searches and recommendations
- **Store Insights**: Get insights about store layout and popular products

### 🔍 Advanced Search
- **Semantic Search**: Powered by Pinecone vector database for intelligent product matching
- **Natural Language**: Ask questions like "Where can I find organic almond milk?" and get precise aisle and section information
- **Context Awareness**: Understand vague descriptions and provide relevant suggestions

Simply walk up to a kiosk, ask "Where can I find organic almond milk?" and get both spoken directions and visual map guidance instantly!

## 🎥 Demo Video

[![StorePal Demo](https://img.youtube.com/vi/rxeN7fq5p6w/maxresdefault.jpg)](https://youtu.be/rxeN7fq5p6w)

*Click the thumbnail above to watch our StorePal demo video!*

## 🗺️ UI Example
### Home Page Kiosk
<img width="1699" height="981" alt="home_page" src="https://github.com/user-attachments/assets/b5119b94-9769-40f2-80df-f178acfededd" />

### Map Page Kiosk
<img width="1698" height="977" alt="map_page" src="https://github.com/user-attachments/assets/9a78d8d4-77fe-4631-9a9b-d994ecb54e7e" />



## 🌐 Hosted version (live demo)

The live demo at **https://storepal-app.vercel.app** runs the core flow with no server of its own: ask for a product by voice or text, StorePal says which aisle it's in, and the aisle is pinned on the store map.

- **Works with no keys.** The 1,000-product WinMart catalog ships as `frontend/public/inventory.json`, and search runs in the browser (keyword ranking with IDF weighting). Voice input uses the browser's speech recognition (Chrome, Edge, Safari) and answers are read out with the browser's own text-to-speech.
- **Optional keys (bring your own).** An OpenAI key turns on semantic search: the catalog is embedded once with `text-embedding-3-small` and each question is matched by cosine similarity. An ElevenLabs key reads answers in an ElevenLabs voice. Keys live only in the page's memory and go out only with your own requests: OpenAI calls pass through the stateless `frontend/api/embeddings.js` route (OpenAI's error responses lack CORS headers), and ElevenLabs is called directly from the browser. Nothing is logged or stored.
- **What changed from the hackathon build.** The original needed a local FastAPI server that proxied a WebSocket to an ElevenLabs ConvAI agent and queried a Pinecone index. Visitors can't bring their own ConvAI agent or Pinecone index, so the hosted version does the search in the browser instead. The original backend is still in `backend/` for reference, and the original frontend is at commit `cfff84d`.

Run the hosted version locally:

```bash
cd frontend
npm install
npm start          # keyword search, map and browser voice work right away
# semantic search needs the /api route: run `vercel dev` from the repo root instead
```

## 🏗️ Technical Architecture & Design Decisions

### Why These Technologies?

#### 🔗 **Pinecone Vector Search + ElevenLabs Integration (Core Innovation)**
- **Problem**: ElevenLabs Knowledge Base can't handle large retail datasets (100k+ products) and lacks semantic search capabilities
- **Solution**: Custom integration of Pinecone vector database with ElevenLabs ConvAI for intelligent product search
- **Technical Implementation**:
  - Pinecone handles semantic search across 500+ products with millisecond response times
  - ElevenLabs ConvAI processes natural language and triggers Pinecone searches via function calls
  - Vector embeddings enable understanding of product relationships and synonyms
  - Real-time search results fed back to ElevenLabs for natural conversation flow
- **Why This Matters**: Enables natural queries like "organic almond milk" to find products even with vague descriptions
- **Performance**: Sub-second search + natural voice responses create seamless shopping experience

#### 🎤 **ElevenLabs ConvAI + Function Calling**
- **Problem**: Traditional chatbots can't trigger visual map updates or perform complex actions
- **Solution**: ElevenLabs ConvAI with function calling allows the AI to decide when to show maps, search products, or provide directions
- **Implementation**: AI agent uses function calls to trigger map pin placement and product search based on user queries
- **Benefit**: Seamless voice-to-visual interaction without manual UI controls

#### 🗺️ **SVG-Based Interactive Store Maps**
- **Problem**: Static images can't show dynamic product locations or provide interactive navigation
- **Solution**: Custom SVG store layouts with programmatic pin placement
- **Technical Implementation**:
  - SVG allows precise coordinate-based pin placement at exact aisle locations
  - Real-time pin updates based on search results
  - Zoom/pan functionality for large store navigation
  - Color-coded pins for different product categories
- **UI Points**: Precisely positioned at aisle intersections and department entrances for customer guidance

#### 🎨 **Modern Glassy UI Theme (iOS-Inspired Design)**
- **Problem**: Traditional kiosk interfaces look outdated and uninviting to modern users
- **Solution**: Glassmorphism design with frosted glass effects, subtle transparency, and modern iOS-style aesthetics
- **Technical Implementation**:
  - CSS backdrop-filter for glassy blur effects
  - Semi-transparent backgrounds with subtle gradients
  - Smooth animations and micro-interactions
  - Modern typography and spacing following iOS design principles
- **User Experience**: Creates premium, approachable interface that encourages interaction

#### ⚡ **WebSocket Real-Time Communication**
- **Problem**: HTTP requests create lag in voice interactions
- **Solution**: WebSocket streaming for instant audio processing
- **Benefits**: 
  - Sub-200ms response times for natural conversation flow
  - Real-time transcription display
  - Instant map updates as user speaks
  - Bidirectional audio streaming for seamless interaction

#### 🎯 **App Architecture**
```
User: "Where's the milk?"
↓
ElevenLabs ConvAI processes speech
↓
Function Call: search_products("milk")
↓
Pinecone vector search returns dairy products
↓
Function Call: show_on_map(aisle_7, dairy_section)
↓
SVG map updates with pin at exact aisle location
↓
AI responds: "I found milk in the dairy section, aisle 7. Let me show you on the map..."
```

### 🏆 **Why This Architecture Wins**

1. **Scalability**: Pinecone handles enterprise-scale product catalogs (100k+ items)
2. **Performance**: Sub-second search + real-time voice interaction
3. **User Experience**: Natural conversation with instant visual feedback
4. **Accuracy**: Semantic search finds products even with vague descriptions
5. **Flexibility**: Function calling allows complex multi-step interactions

## ✨ Features

### 🎤 Voice & Conversation
- **Voice-Activated Search**: Simply speak to find products
- **Natural Language Understanding**: Ask questions like you would to a human
- **Real-time Transcription**: See your words transcribed live as you speak
- **Audio Responses**: Hear clear, spoken directions and product information
- **Multilingual Support**: Help customers in multiple languages
- **Conversation History**: Track your interaction history

### 🗺️ Interactive Store Mapping
- **Visual Store Layout**: Interactive SVG-based store map
- **Real-time Product Pins**: Products highlighted with color-coded pins on the map
- **Aisle Navigation**: Visual guidance to specific aisles and sections
- **Department Overview**: Navigate by store sections and departments
- **Smart Pin Management**: Automatic pin placement and removal
- **Map Controls**: Zoom, pan, and interact with the store layout

### 📊 Intelligent Dashboard
- **Product Analytics**: View detailed product information and availability
- **Search History**: Track your previous searches and recommendations
- **Store Insights**: Get insights about store layout and popular products
- **Real-time Status**: Connection status and system health monitoring
- **User Interface**: Clean, modern dashboard for data visualization

### 🔍 Advanced Search & AI
- **Semantic Search**: Pinecone vector database for intelligent product search
- **Context-Aware Responses**: Understand vague descriptions and provide relevant suggestions
- **Product Matching**: Advanced algorithms for finding the right products
- **Inventory Integration**: Real-time product database with 500+ items
- **AI-Powered Conversations**: ElevenLabs ConvAI for natural dialogue

### ⚡ Technical Features
- **Real-Time Communication**: WebSocket-based low-latency interactions
- **Robust API**: FastAPI backend with comprehensive endpoints
- **Modern UI**: Beautiful React interface with live transcripts and speaking indicators
- **Automatic Audio Processing**: PCM 16kHz format handling
- **Cross-Platform**: Web-based interface accessible on kiosks or mobile devices
- **Responsive Design**: Optimized for various screen sizes and devices

## Prerequisites

### System Requirements
- **Python 3.8+** (recommended: Python 3.9 or 3.10)
- **Node.js 16+** (recommended: Node.js 18 LTS)
- **Microphone and speakers/headphones** for voice interaction
- **Modern web browser** with WebSocket and Web Audio API support

### API Accounts Required
- **ElevenLabs API** account with API key and Agent ID ([Get Started](https://elevenlabs.io))
- **Pinecone API** key for vector database ([Get Started](https://www.pinecone.io/))

## 🚀 Quick Start Guide (original hackathon build)

> These steps run the original FastAPI + ElevenLabs ConvAI + Pinecone version. The current `frontend/` no longer talks to the backend, so check out commit `cfff84d` first (`git checkout cfff84d`).

### Step 1: Clone and Navigate
```bash
git clone <your-repo-url>
cd StorePal
```

### Step 2: Backend Setup

#### 2.1 Create Python Virtual Environment
```bash
cd backend
python -m venv .venv

# Activate virtual environment:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

#### 2.2 Install Python Dependencies
```bash
pip install -r requirements.txt
```

**⚠️ PyAudio Installation Issues?**
- **Windows:** `pip install pipwin && pipwin install pyaudio`
- **macOS:** `brew install portaudio` then `pip install pyaudio`
- **Linux:** `sudo apt-get install portaudio19-dev python3-pyaudio`

#### 2.3 Configure API Keys
Create a `.env` file in the **backend directory**:

```bash
# Create .env file
touch .env  # Linux/macOS
# or create manually on Windows

# Add your API credentials:
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
PINECONE_API_KEY=your_pinecone_api_key_here
```

#### 2.4 Initialize Vector Database
```bash
cd backend/pinecone_vdb
python upload_data.py
```

This uploads the Walmart inventory data to Pinecone for semantic search.

### Step 3: Frontend Setup

#### 3.1 Install Node.js Dependencies
```bash
cd frontend
npm install
```

### Step 4: Run the Application

#### Option A: Full Web Application (Recommended)

**Terminal 1 - Start Backend Server:**
```bash
cd backend
python main.py
```
Server will start at `http://localhost:8000`

**Terminal 2 - Start React Frontend:**
```bash
cd frontend
npm start
```
Frontend will start at `http://localhost:3000`

**🎉 Success!** Open your browser to `http://localhost:3000` and start talking! 🎤

#### Option B: Python Audio Client (Testing)

**Terminal 1 - Start Backend Server:**
```bash
cd backend
python main.py
```

**Terminal 2 - Start Voice Client:**
```bash
cd backend
python audio_client.py
```

### Step 5: Verify Installation

1. **Backend Health Check:** Visit `http://localhost:8000/health`
2. **API Documentation:** Visit `http://localhost:8000/docs`
3. **Frontend Interface:** Visit `http://localhost:3000`
4. **Test Voice:** Click the microphone button and speak
5. **Test Map:** Ask for a product and watch the map update

## 🎯 Usage Guide

### Getting Started

1. **Open the Application**: Navigate to `http://localhost:3000`
2. **Connect**: Click the "Connect" button to establish WebSocket connection
3. **Start Speaking**: Click the microphone button and speak naturally
4. **View Results**: Watch the interactive map update with product locations
5. **Access Dashboard**: Click the dashboard button for analytics and insights

### Voice Interaction

#### Basic Commands
- **"Where can I find [product]?"** - Get product location and map pin
- **"What products do you have in [category]?"** - Browse by category
- **"Show me [product] on the map"** - Visual product location
- **"What's in aisle [number]?"** - Aisle-specific browsing

#### Example Conversation:
```
👤 You: "Where can I find organic almond milk?"
🤖 Agent: "I found organic almond milk in the dairy section, aisle 7. 
          Let me show you on the map..."
🗺️ Map: [Product pin appears on aisle 7]
👤 You: "What other dairy products are nearby?"
🤖 Agent: "In the dairy section, you'll find milk, yogurt, cheese, 
          and butter. Let me highlight those areas..."
🗺️ Map: [Multiple pins appear in dairy section]
```

### Interactive Store Map

#### Map Features
- **Zoom & Pan**: Navigate around the store layout
- **Product Pins**: Color-coded pins show product locations
- **Aisle Navigation**: Click on aisles for detailed information
- **Department Overview**: Browse by store sections

#### Map Controls
- **Zoom In/Out**: Mouse wheel or zoom buttons
- **Pan**: Click and drag to move around
- **Reset View**: Return to full store view
- **Pin Management**: Pins automatically appear/disappear based on search

### Analytics Dashboard

#### Dashboard Features
- **Search History**: Track your previous queries
- **Product Analytics**: View popular products and categories
- **Store Insights**: Understand store layout and traffic patterns
- **Performance Metrics**: Connection status and response times

#### Dashboard Sections
- **Recent Searches**: Your last 10 product queries
- **Popular Products**: Most searched items
- **Category Breakdown**: Search distribution by department
- **System Status**: Real-time connection and performance data

### Advanced Features

#### Multi-Product Search
```
👤 You: "I need milk, bread, and eggs"
🤖 Agent: "I'll help you find all three items. Milk is in dairy (aisle 7), 
          bread is in bakery (aisle 3), and eggs are in dairy (aisle 7). 
          Let me show you the optimal route..."
🗺️ Map: [Multiple pins with suggested route]
```

#### Category Browsing
```
👤 You: "What's in the produce section?"
🤖 Agent: "The produce section has fresh fruits, vegetables, and herbs. 
          You'll find apples, bananas, lettuce, tomatoes, and more. 
          Let me show you the produce area..."
🗺️ Map: [Produce section highlighted]
```

### Tips for Best Results

1. **Speak Clearly**: Use a good microphone in a quiet environment
2. **Be Specific**: "Organic almond milk" works better than "milk"
3. **Use Natural Language**: Ask questions like you would to a human
4. **Check the Map**: Visual guidance helps with navigation
5. **Use the Dashboard**: Track your shopping patterns and preferences

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Voice     │  │   Store     │  │  Dashboard  │            │
│  │ Interface   │  │    Map      │  │   Analytics │            │
│  │             │  │             │  │             │            │
│  │ • Microphone│  │ • SVG Map   │  │ • Product   │            │
│  │ • Transcript│  │ • Pins      │  │   Analytics │            │
│  │ • Audio     │  │ • Navigation│  │ • History   │            │
│  │   Playback  │  │ • Controls  │  │ • Insights  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
    │                    │                    │
    │                    │                    │
    │ WebSocket          │ WebSocket          │ WebSocket
    │ Real-time          │ Map Updates        │ Data Updates
    │ Communication      │                    │
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ WebSocket   │  │   Vector    │  │   Static    │            │
│  │ Handler     │  │   Search    │  │   Files     │            │
│  │             │  │   Engine    │  │   Server    │            │
│  │ • Audio     │  │             │  │             │            │
│  │   Streaming │  │ • Pinecone  │  │ • Store     │            │
│  │ • Message   │  │   Queries   │  │   Maps      │            │
│  │   Routing   │  │ • Semantic  │  │ • Assets    │            │
│  │ • Response  │  │   Search    │  │             │            │
│  │   Handling  │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
    │                    │                    │
    │ WebSocket          │ HTTP API           │ File Serving
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ ElevenLabs  │  │   Pinecone   │  │   Store     │            │
│  │ ConvAI API  │  │   Vector    │  │  Inventory  │            │
│  │             │  │   Database  │  │   Database  │            │
│  │ • Voice     │  │             │  │             │            │
│  │   Synthesis │  │ • Semantic  │  │ • 500+      │            │
│  │ • Speech    │  │   Search    │  │   Products  │            │
│  │   Recognition│  │ • Vector   │  │ • Aisle     │            │
│  │ • Natural   │  │   Storage   │  │   Mapping   │            │
│  │   Language  │  │             │  │ • Pricing  │            │
│  │   Processing│  │             │  │   Info      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**How It Works:**
1. **Voice Input**: Customer speaks at kiosk → Voice captured by React frontend
2. **Audio Streaming**: Audio streamed to FastAPI backend via WebSocket
3. **AI Processing**: Backend forwards to ElevenLabs ConvAI for natural language processing
4. **Semantic Search**: User query triggers semantic search in Pinecone vector database
5. **Map Visualization**: Relevant products with aisle/section info displayed on interactive map
6. **Audio Response**: AI agent speaks the response back to customer
7. **Dashboard Updates**: Analytics and search history updated in real-time

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
├── backend/                         # FastAPI Backend Server
│   ├── main.py                      # Main FastAPI server with WebSocket
│   ├── audio_client.py              # Python voice client (testing)
│   ├── requirements.txt             # Python dependencies
│   ├── data/
│   │   └── winmart_inventory.csv    # Store product database (500+ items)
│   ├── pinecone_vdb/               # Vector Database Integration
│   │   ├── upload_data.py           # Upload inventory to Pinecone
│   │   ├── vector_search.py         # Semantic search functions
│   │   ├── example_usage.py         # Usage examples
│   │   ├── README.md                # Vector DB documentation
│   │   ├── QUICK_REFERENCE.md       # Quick reference guide
│   │   └── IMPLEMENTATION_SUMMARY.md # Implementation details
│   ├── static/                      # Static files (store maps, assets)
│   │   └── store_map.svg            # Interactive store map
│   ├── PINECONE_SETUP.md            # Pinecone setup guide
│   ├── QUICKSTART.md                # Backend quick start
│   └── .venv/                       # Virtual environment (auto-created)
├── frontend/                        # React Frontend Application
│   ├── src/
│   │   ├── App.js                   # Main React component with WebSocket
│   │   ├── App.css                  # Beautiful UI styles
│   │   ├── StoreMap.js              # Interactive store map component
│   │   ├── Dashboard.js             # Analytics dashboard component
│   │   ├── Dashboard.css            # Dashboard styles
│   │   └── index.js                 # React entry point
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── build/                       # Production build (auto-generated)
│   ├── package.json                 # Node dependencies
│   └── README.md                    # Frontend documentation
├── .env                             # Your API credentials (create this!)
├── .env.example                     # Template for credentials
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

### Key Components

#### 🎤 Voice Interface (`frontend/src/App.js`)
- Real-time WebSocket communication
- Audio recording and playback
- Live transcription display
- Connection status management

#### 🗺️ Interactive Store Map (`frontend/src/StoreMap.js`)
- SVG-based store layout visualization
- Dynamic product pin placement
- Interactive navigation controls
- Real-time map updates

#### 📊 Analytics Dashboard (`frontend/src/Dashboard.js`)
- Product search analytics
- User interaction tracking
- Store performance insights
- Search history visualization

#### ⚡ Backend API (`backend/main.py`)
- FastAPI server with WebSocket support
- ElevenLabs ConvAI integration
- Pinecone vector search
- Static file serving for maps

#### 🔍 Vector Search Engine (`backend/pinecone_vdb/`)
- Semantic product search
- Inventory data management
- Vector database operations
- Search optimization

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

## 🔧 Troubleshooting

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **PyAudio Installation Fails** | `ERROR: Failed building wheel for pyaudio` | **Windows:** `pip install pipwin && pipwin install pyaudio`<br>**macOS:** `brew install portaudio && pip install pyaudio`<br>**Linux:** `sudo apt-get install portaudio19-dev python3-pyaudio` |
| **Microphone Not Detected** | No audio input, silent recording | 1. Check system audio settings<br>2. Grant microphone permissions to browser/Python<br>3. Test with system audio recorder<br>4. Try different microphone |
| **WebSocket Connection Failed** | `Connection refused` or `WebSocket closed` | 1. Ensure backend is running: `python main.py`<br>2. Check if port 8000 is available<br>3. Verify firewall settings<br>4. Try `http://localhost:8000/health` |
| **API Authentication Errors** | `401 Unauthorized` or `Invalid API key` | 1. Verify `.env` file exists in backend directory<br>2. Check API keys are correct and active<br>3. Ensure no extra spaces in `.env` values<br>4. Test API keys independently |
| **No Audio Playback** | Silent responses, no sound | 1. Check system volume and speakers<br>2. Test with system audio player<br>3. Verify browser audio permissions<br>4. Try different browser |
| **Map Not Loading** | Blank map or "Map not available" | 1. Check if `backend/static/` directory exists<br>2. Verify static file serving is working<br>3. Check browser console for errors<br>4. Ensure SVG files are present |
| **Vector Search Fails** | "No products found" for all queries | 1. Run `python upload_data.py` in `backend/pinecone_vdb/`<br>2. Check Pinecone API key and index name<br>3. Verify inventory data is uploaded<br>4. Check Pinecone dashboard for index status |
| **Frontend Build Errors** | `npm start` fails or build errors | 1. Delete `node_modules` and `package-lock.json`<br>2. Run `npm install` again<br>3. Check Node.js version (16+ required)<br>4. Clear npm cache: `npm cache clean --force` |
| **Port Already in Use** | `Address already in use` | 1. Find process using port: `netstat -ano \| findstr :8000`<br>2. Kill process: `taskkill /PID <pid> /F`<br>3. Or change port in `main.py` |
| **Slow Performance** | Laggy audio, delayed responses | 1. Check internet connection<br>2. Close other applications<br>3. Verify API rate limits<br>4. Check system resources |

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# Backend debug mode
export DEBUG=1
python main.py

# Frontend debug mode
REACT_APP_DEBUG=true npm start
```

### Health Checks

Test each component individually:

```bash
# 1. Backend health
curl http://localhost:8000/health

# 2. API documentation
open http://localhost:8000/docs

# 3. Frontend
open http://localhost:3000

# 4. WebSocket connection
# Check browser developer tools → Network → WS
```

### Log Files

Check logs for detailed error information:

- **Backend logs**: Console output from `python main.py`
- **Frontend logs**: Browser developer tools → Console
- **Network logs**: Browser developer tools → Network

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


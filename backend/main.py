import asyncio
import base64
import json
import os
import queue
import threading
from pathlib import Path
from typing import Optional

import pyaudio
import websockets
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(
    title="StorePal Conversational Agent",
    description="Real-time conversational AI using ElevenLabs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID")

if not ELEVENLABS_API_KEY or not AGENT_ID:
    print("\n⚠️  ERROR: Missing credentials!")
    print("Please create a .env file in the backend directory with:")
    print("ELEVENLABS_API_KEY=your_key")
    print("ELEVENLABS_AGENT_ID=your_agent_id\n")
    raise ValueError("ELEVENLABS_API_KEY and AGENT_ID must be set in .env file")


class ElevenLabsAgent:
    def __init__(self):
        self.elevenlabs_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.client_ws: Optional[WebSocket] = None
        
    async def connect_to_elevenlabs(self):
        uri = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={AGENT_ID}"
        headers = {"xi-api-key": ELEVENLABS_API_KEY}
        self.elevenlabs_ws = await websockets.connect(uri, extra_headers=headers)
        print("✅ Connected to ElevenLabs API")
        
    async def send_initiation_message(self, config_override: dict = None):
        initiation_message = {"type": "conversation_initiation_client_data"}
        if config_override:
            initiation_message["conversation_config_override"] = config_override
        await self.elevenlabs_ws.send(json.dumps(initiation_message))
        print("✅ Sent conversation initiation")
        
    async def handle_elevenlabs_messages(self):
        try:
            async for message in self.elevenlabs_ws:
                data = json.loads(message)
                message_type = data.get("type")
                
                # Forward all messages to client
                await self.client_ws.send_json(data)
                
                if message_type == "conversation_initiation_metadata":
                    conv_id = data.get('conversation_initiation_metadata_event', {}).get('conversation_id')
                    print(f"🎉 Conversation ID: {conv_id}")
                elif message_type == "agent_response":
                    agent_response = data.get("agent_response_event", {}).get("agent_response")
                    print(f"\n🤖 Agent: {agent_response}")
                elif message_type == "user_transcript":
                    # Handle both interim and final transcripts
                    transcript_event = data.get("user_transcription_event", {})
                    user_transcript = transcript_event.get("user_transcript")
                    is_final = transcript_event.get("is_final", True)
                    
                    if user_transcript:
                        if is_final:
                            print(f"\n👤 User: {user_transcript}")
                        else:
                            # Print interim transcripts in real-time with carriage return
                            print(f"\r👤 User (interim): {user_transcript}", end='', flush=True)
                elif message_type == "interruption":
                    # ElevenLabs VAD detected user interruption
                    event_id = data.get("interruption_event", {}).get("event_id")
                    print(f"\n🛑 Interruption detected by ElevenLabs VAD (event_id: {event_id})")
                elif message_type == "vad_score":
                    # Optional: log high VAD scores
                    vad_score = data.get("vad_score_event", {}).get("vad_score", 0)
                    if vad_score > 0.8:
                        print(f"\r🎙️ VAD: {vad_score:.2f}", end='', flush=True)
                elif message_type == "audio":
                    # Just forward audio chunks, don't log them
                    pass
                elif message_type == "ping":
                    event_id = data.get("ping_event", {}).get("event_id")
                    pong_message = {"type": "pong", "event_id": event_id}
                    await self.elevenlabs_ws.send(json.dumps(pong_message))
                    
        except websockets.exceptions.ConnectionClosed:
            print("\n❌ ElevenLabs connection closed")
            
    async def send_audio_to_elevenlabs(self, audio_base64: str):
        message = {"user_audio_chunk": audio_base64}
        await self.elevenlabs_ws.send(json.dumps(message))
        
    async def close(self):
        if self.elevenlabs_ws:
            await self.elevenlabs_ws.close()


@app.get("/")
async def root():
    return {
        "message": "StorePal Conversational Agent API",
        "status": "running",
        "agent_id": AGENT_ID[:8] + "..." if AGENT_ID else None,
        "websocket_endpoint": "/ws/conversation"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "api_configured": bool(ELEVENLABS_API_KEY and AGENT_ID)
    }


@app.websocket("/ws/conversation")
async def websocket_conversation(websocket: WebSocket):
    await websocket.accept()
    print("✅ Client connected")
    
    agent = ElevenLabsAgent()
    agent.client_ws = websocket
    
    try:
        await agent.connect_to_elevenlabs()
        
        config_override = {
            "agent": {
                "prompt": {
                    "prompt": "You are a helpful AI assistant for StorePal. You help users with shopping, product recommendations, and store navigation."
                },
                "first_message": "Hi! I'm your StorePal assistant. How can I help you today?",
                "language": "en"
            }
        }
        await agent.send_initiation_message(config_override)
        
        elevenlabs_task = asyncio.create_task(agent.handle_elevenlabs_messages())
        
        try:
            while True:
                message = await websocket.receive()
                
                if "text" in message:
                    data = json.loads(message["text"])
                    
                    if "user_audio_chunk" in data:
                        await agent.send_audio_to_elevenlabs(data["user_audio_chunk"])
                    elif data.get("type") in ["user_message", "user_activity", "pong"]:
                        # Forward client messages to ElevenLabs
                        await agent.elevenlabs_ws.send(json.dumps(data))
                        
                elif "bytes" in message:
                    audio_bytes = message["bytes"]
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    await agent.send_audio_to_elevenlabs(audio_base64)
                    
        except WebSocketDisconnect:
            print("❌ Client disconnected")
            elevenlabs_task.cancel()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        await websocket.send_json({"error": str(e)})
        
    finally:
        await agent.close()
        print("🔌 Connection closed")


def run_server():
    import uvicorn
    
    print("\n" + "="*60)
    print("  🚀 StorePal Conversational Agent API - SERVER MODE")
    print("="*60)
    print(f"\n  📡 Server: http://localhost:8000")
    print(f"  📚 Docs: http://localhost:8000/docs")
    print(f"  🔌 WebSocket: ws://localhost:8000/ws/conversation")
    print(f"\n  Agent ID: {AGENT_ID[:12]}...")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")


async def run_testing():
    print("\n" + "="*60)
    print("  🎙️  StorePal - TESTING MODE (Direct Connection)")
    print("="*60)
    print(f"\n  Agent ID: {AGENT_ID[:12]}...")
    print("  💬 Start speaking... (Press Ctrl+C to stop)")
    print("\n" + "="*60 + "\n")
    
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    
    audio = pyaudio.PyAudio()
    playback_queue = queue.Queue()
    running = True
    
    input_stream = audio.open(
        format=FORMAT, channels=CHANNELS, rate=RATE,
        input=True, frames_per_buffer=CHUNK
    )
    output_stream = audio.open(
        format=FORMAT, channels=CHANNELS, rate=RATE,
        output=True, frames_per_buffer=CHUNK
    )
    print("🎤 Microphone started")
    print("🔊 Speaker started\n")
    
    def audio_playback_thread():
        while running:
            try:
                audio_data = playback_queue.get(timeout=0.1)
                output_stream.write(audio_data)
            except queue.Empty:
                continue
    
    playback_thread = threading.Thread(target=audio_playback_thread, daemon=True)
    playback_thread.start()
    
    uri = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={AGENT_ID}"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    
    try:
        async with websockets.connect(uri, extra_headers=headers) as ws:
            print("✅ Connected to ElevenLabs\n")
            
            initiation_message = {
                "type": "conversation_initiation_client_data",
                "conversation_config_override": {
                    "agent": {
                        "prompt": {
                            "prompt": "You are a helpful AI assistant for StorePal. You help users with shopping, product recommendations, and store navigation."
                        },
                        "first_message": "Hi! I'm your StorePal assistant. How can I help you today?",
                        "language": "en"
                    }
                }
            }
            await ws.send(json.dumps(initiation_message))
            
            async def send_audio():
                while running:
                    audio_data = input_stream.read(CHUNK, exception_on_overflow=False)
                    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                    message = {"user_audio_chunk": audio_base64}
                    await ws.send(json.dumps(message))
                    await asyncio.sleep(0.01)
            
            async def receive_messages():
                async for message in ws:
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    if message_type == "audio":
                        audio_base64 = data.get("audio_event", {}).get("audio_base_64")
                        if audio_base64:
                            audio_bytes = base64.b64decode(audio_base64)
                            playback_queue.put(audio_bytes)
                    elif message_type == "agent_response":
                        agent_response = data.get("agent_response_event", {}).get("agent_response")
                        print(f"\n🤖 Agent: {agent_response}")
                    elif message_type == "user_transcript":
                        # Handle both interim and final transcripts
                        transcript_event = data.get("user_transcription_event", {})
                        user_transcript = transcript_event.get("user_transcript")
                        is_final = transcript_event.get("is_final", True)
                        
                        if user_transcript:
                            if is_final:
                                print(f"\n👤 You: {user_transcript}")
                            else:
                                # Print interim transcripts in real-time with carriage return
                                print(f"\r👤 You (interim): {user_transcript}", end='', flush=True)
                    elif message_type == "interruption":
                        # ElevenLabs VAD detected user interruption
                        event_id = data.get("interruption_event", {}).get("event_id")
                        print(f"\n🛑 Interruption detected by ElevenLabs VAD (event_id: {event_id})")
                    elif message_type == "vad_score":
                        # Optional: log high VAD scores
                        vad_score = data.get("vad_score_event", {}).get("vad_score", 0)
                        if vad_score > 0.8:
                            print(f"\r🎙️ VAD: {vad_score:.2f}", end='', flush=True)
                    elif message_type == "conversation_initiation_metadata":
                        conv_id = data.get("conversation_initiation_metadata_event", {}).get("conversation_id")
                        print(f"🎉 Conversation ID: {conv_id}\n")
                    elif message_type == "ping":
                        event_id = data.get("ping_event", {}).get("event_id")
                        pong_message = {"type": "pong", "event_id": event_id}
                        await ws.send(json.dumps(pong_message))
            
            await asyncio.gather(send_audio(), receive_messages())
            
    except KeyboardInterrupt:
        print("\n⏹️  Stopping...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        running = False
        input_stream.stop_stream()
        input_stream.close()
        output_stream.stop_stream()
        output_stream.close()
        audio.terminate()
        print("👋 Goodbye!")


if __name__ == "__main__":
    asyncio.run(run_server())


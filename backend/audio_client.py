import asyncio
import base64
import json
import queue
import threading

import pyaudio
import websockets


class AudioClient:
    def __init__(self, server_url="ws://localhost:8000/ws/conversation"):
        self.server_url = server_url
        self.websocket = None
        
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 16000
        
        self.audio = pyaudio.PyAudio()
        self.playback_queue = queue.Queue()
        self.input_stream = None
        self.output_stream = None
        self.running = False
        
    def start_audio_streams(self):
        try:
            self.input_stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )
            print("🎤 Microphone started")
            
            self.output_stream = self.audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                output=True,
                frames_per_buffer=self.CHUNK
            )
            print("🔊 Speaker started")
            
        except Exception as e:
            print(f"❌ Error starting audio streams: {e}")
            print("Make sure your microphone and speakers are properly configured.")
            raise
            
    def stop_audio_streams(self):
        if self.input_stream:
            self.input_stream.stop_stream()
            self.input_stream.close()
            
        if self.output_stream:
            self.output_stream.stop_stream()
            self.output_stream.close()
            
        self.audio.terminate()
        print("🔇 Audio streams closed")
        
    async def send_audio(self):
        try:
            while self.running:
                audio_data = self.input_stream.read(self.CHUNK, exception_on_overflow=False)
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                message = {"user_audio_chunk": audio_base64}
                await self.websocket.send(json.dumps(message))
                await asyncio.sleep(0.01)
        except Exception as e:
            print(f"❌ Error sending audio: {e}")
            
    async def receive_messages(self):
        try:
            async for message in self.websocket:
                data = json.loads(message)
                message_type = data.get("type")
                
                if message_type == "audio":
                    audio_base64 = data.get("audio_event", {}).get("audio_base_64")
                    if audio_base64:
                        audio_bytes = base64.b64decode(audio_base64)
                        self.playback_queue.put(audio_bytes)
                elif message_type == "agent_response":
                    agent_response = data.get("agent_response_event", {}).get("agent_response")
                    print(f"\n🤖 Agent: {agent_response}")
                elif message_type == "user_transcript":
                    user_transcript = data.get("user_transcription_event", {}).get("user_transcript")
                    print(f"\n👤 You: {user_transcript}")
                elif message_type == "conversation_initiation_metadata":
                    conv_id = data.get("conversation_initiation_metadata_event", {}).get("conversation_id")
                    print(f"\n🎉 Conversation started! ID: {conv_id}")
                    print("💬 Start speaking... (Press Ctrl+C to stop)\n")
                    
        except websockets.exceptions.ConnectionClosed:
            print("\n❌ Connection to server closed")
            self.running = False
            
    def audio_playback_thread(self):
        while self.running:
            try:
                audio_data = self.playback_queue.get(timeout=0.1)
                self.output_stream.write(audio_data)
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ Error playing audio: {e}")
                
    async def run(self):
        print("🚀 Starting StorePal Audio Client...")
        print(f"📡 Connecting to {self.server_url}...")
        
        try:
            async with websockets.connect(self.server_url) as websocket:
                self.websocket = websocket
                print("✅ Connected to server!")
                
                self.start_audio_streams()
                self.running = True
                
                playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
                playback_thread.start()
                
                send_task = asyncio.create_task(self.send_audio())
                receive_task = asyncio.create_task(self.receive_messages())
                
                await asyncio.gather(send_task, receive_task)
                
        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping...")
        except Exception as e:
            print(f"\n❌ Error: {e}")
        finally:
            self.running = False
            self.stop_audio_streams()
            print("👋 Goodbye!")


def main():
    print("\n" + "=" * 60)
    print("  🎙️  StorePal - Voice Conversation Client")
    print("=" * 60)
    print("\n  Make sure the API server is running first!")
    print("  Run: python main.py")
    print("\n" + "=" * 60 + "\n")
    
    client = AudioClient()
    
    try:
        asyncio.run(client.run())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("  1. The API server is running (python main.py)")
        print("  2. Your microphone and speakers are connected")
        print("  3. You have the correct .env credentials\n")


if __name__ == "__main__":
    main()


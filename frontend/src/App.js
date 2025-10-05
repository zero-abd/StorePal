import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StoreMap from './StoreMap';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showMap, setShowMap] = useState(false);
  const [mapControls, setMapControls] = useState(null);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioSourceRef = useRef(null);

  const WS_URL = 'ws://localhost:8000/ws/conversation';

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopRecording();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const connectWebSocket = () => {
    setConnectionStatus('connecting');
    
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setConnectionStatus('connected');
      addSystemMessage('Connected to StorePal AI');
      
      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        console.log('🔊 Pre-initialized audio context for low-latency playback');
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 Received:', data.type);
        handleServerMessage(data);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
      addSystemMessage('Connection error occurred');
    };
    
    ws.onclose = () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      addSystemMessage('Disconnected from server');
      stopRecording();
    };
    
    wsRef.current = ws;
  };

  const handleServerMessage = (data) => {
    const messageType = data.type;
    
    switch (messageType) {
      case 'conversation_initiation_metadata':
        const convId = data.conversation_initiation_metadata_event?.conversation_id;
        console.log('🎉 Conversation started:', convId);
        addSystemMessage(`Conversation started: ${convId?.substring(0, 8)}...`);
        break;
        
      case 'user_transcript':
        const transcriptEvent = data.user_transcription_event || {};
        const userText = transcriptEvent.user_transcript;
        const isFinal = transcriptEvent.is_final !== false;
        
        console.log(`👤 User ${isFinal ? '(final)' : '(interim)'}:`, userText);
        
        if (userText) {
          updateOrAddUserTranscript(userText, !isFinal);
        }
        break;
        
      case 'agent_response':
        const agentText = data.agent_response_event?.agent_response;
        console.log('🤖 Agent said:', agentText);
        if (agentText) {
          addTranscript('agent', agentText);
          // Check if agent mentioned an aisle and show map
          checkForAisleMention(agentText);
        }
        break;
        
      case 'audio':
        const audioBase64 = data.audio_event?.audio_base_64;
        if (audioBase64) {
          // Always queue audio - ElevenLabs won't send audio if user is speaking
          // The interruption event will clear the queue if needed
          queueAudio(audioBase64);
        }
        break;
        
      case 'interruption':
        // ElevenLabs detected user interruption with its VAD
        const interruptionEventId = data.interruption_event?.event_id;
        const isCurrentlyPlaying = isPlayingRef.current || audioQueueRef.current.length > 0;
        
        if (isCurrentlyPlaying) {
          console.log('🛑 ElevenLabs VAD detected interruption (event_id:', interruptionEventId, ') - Stopping playback');
          stopAudioPlayback();
        } else {
          console.log('⚠️ Interruption detected but no audio playing yet (event_id:', interruptionEventId, ') - Ignoring');
        }
        break;
        
      case 'vad_score':
        // Optional: log VAD scores to see how ElevenLabs is detecting speech
        const vadScore = data.vad_score_event?.vad_score;
        if (vadScore > 0.8) {
          console.log('🎙️ VAD Score:', vadScore.toFixed(2));
        }
        break;
        
      case 'ping':
        const eventId = data.ping_event?.event_id;
        if (eventId && wsRef.current) {
          wsRef.current.send(JSON.stringify({ type: 'pong', event_id: eventId }));
        }
        break;
        
      default:
        console.log('📨 Received message type:', messageType);
    }
  };

  const addTranscript = (speaker, text) => {
    setTranscripts(prev => [...prev, { speaker, text, timestamp: new Date() }]);
  };

  const updateOrAddUserTranscript = (text, isInterim) => {
    setTranscripts(prev => {
      const lastTranscript = prev[prev.length - 1];
      
      if (lastTranscript && lastTranscript.speaker === 'user' && lastTranscript.isInterim) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          speaker: 'user',
          text,
          timestamp: lastTranscript.timestamp,
          isInterim
        };
        return updated;
      }
      
      return [...prev, { speaker: 'user', text, timestamp: new Date(), isInterim }];
    });
  };

  const addSystemMessage = (text) => {
    setTranscripts(prev => [...prev, { speaker: 'system', text, timestamp: new Date() }]);
  };

  const checkForAisleMention = (text) => {
    // Regular expression to match aisle patterns like A5, K10, S3, etc.
    const aislePattern = /\b([A-Z]\d{1,2})\b/g;
    const matches = text.match(aislePattern);
    
    if (matches && matches.length > 0) {
      console.log('🗺️ Aisle mentioned:', matches);
      setShowMap(true);
      
      // Add pins for mentioned aisles
      if (mapControls) {
        matches.forEach(aisle => {
          mapControls.addPin(aisle, '#ef4444'); // Red pin for mentioned aisles
        });
      }
    }
  };

  const handleMapControls = (controls) => {
    setMapControls(controls);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const stopAudioPlayback = () => {
    console.log('🛑 Clearing audio queue and stopping playback');
    
    // Stop the currently playing audio source
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
        console.log('⏹️ Stopped current audio source');
      } catch (error) {
        // Source might already be stopped, that's okay
        console.log('⚠️ Audio source already stopped');
      }
      currentAudioSourceRef.current = null;
    }
    
    // Clear the queue and stop playback loop
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  const queueAudio = (audioBase64) => {
    audioQueueRef.current.push(audioBase64);
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      playNextAudio();
    }
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0 || !isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      console.log('✅ Audio playback finished');
      return;
    }
    
    const audioBase64 = audioQueueRef.current.shift();
    
    try {
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        console.log('🔊 Created new audio context');
      }
      
      if (playbackContextRef.current.state === 'suspended') {
        await playbackContextRef.current.resume();
        console.log('▶️ Resumed audio context');
      }
      
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      const audioBuffer = playbackContextRef.current.createBuffer(
        1,
        float32Array.length,
        16000
      );
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContextRef.current.destination);
      
      // Store reference to current source so we can stop it if interrupted
      currentAudioSourceRef.current = source;
      
      source.onended = () => {
        // Clear the reference when this source finishes naturally
        if (currentAudioSourceRef.current === source) {
          currentAudioSourceRef.current = null;
        }
        
        // Continue to next chunk if still playing
        if (isPlayingRef.current) {
          playNextAudio();
        }
      };
      
      setIsSpeaking(true);
      source.start(0);
      console.log('▶️ Playing audio chunk');
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      if (isPlayingRef.current) {
        playNextAudio();
      }
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Microphone access granted');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to PCM16 and send to backend
          const pcmData = new Int16Array(inputData.length);
          
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          const uint8Array = new Uint8Array(pcmData.buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Audio = btoa(binary);
          
          wsRef.current.send(JSON.stringify({ user_audio_chunk: base64Audio }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      mediaRecorderRef.current = { processor, source, stream };
      setIsRecording(true);
      addSystemMessage('🎤 Microphone active - Start speaking');
      console.log('🎙️ Recording started, sending audio chunks...');
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions and ensure you are using HTTPS or localhost.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.processor) {
          mediaRecorderRef.current.processor.disconnect();
          mediaRecorderRef.current.source.disconnect();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        console.log('⏹️ Recording stopped');
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const disconnect = () => {
    stopAudioPlayback(); // Stop audio first
    stopRecording();
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      addSystemMessage('Microphone stopped');
    } else {
      startRecording();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="app">
      {/* Background gradients */}
      <div className="gradient-bg-top-left"></div>
      <div className="gradient-bg-bottom-right"></div>
      <div className="gradient-bg-center"></div>
      <div className="grid-pattern"></div>

      <div className="container">
        {/* Chat Section - Left 2/3 */}
        <div className="chat-section">
          <header className="header">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2" fill="url(#gradient2)"/>
                  <defs>
                    <linearGradient id="gradient1" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3b82f6"/>
                      <stop offset="1" stopColor="#8b5cf6"/>
                    </linearGradient>
                    <linearGradient id="gradient2" x1="10" y1="7" x2="14" y2="11" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#60a5fa"/>
                      <stop offset="1" stopColor="#a78bfa"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="title">StorePal</h1>
            </div>
            <div className="status-bar">
              <div className={`status-indicator ${connectionStatus}`}>
                <div className="status-dot"></div>
                <span>{connectionStatus}</span>
              </div>
              {isRecording && (
                <div className="status-indicator" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#dc2626' }}>
                  <div className="pulse" style={{ background: '#ef4444' }}></div>
                  <span>Recording</span>
                </div>
              )}
            </div>
          </header>

          <div className="transcript-container">
            {transcripts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>Connect and start speaking to begin your conversation with StorePal AI</p>
              </div>
            ) : (
              <div className="transcript-list">
                {transcripts.map((item, index) => (
                  <div key={index} className={`transcript-item ${item.speaker} ${item.isInterim ? 'interim' : ''}`}>
                    <div className="transcript-header">
                      <span className="speaker-label">
                        {item.speaker === 'user' ? '👤 You' : 
                         item.speaker === 'agent' ? '🤖 AI' : 
                         '⚙️ System'}
                        {item.isInterim && <span className="interim-badge"> (speaking...)</span>}
                      </span>
                      <span className="timestamp">{formatTime(item.timestamp)}</span>
                    </div>
                    <div className="transcript-text">{item.text}</div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>

          <div className="controls">
            {!isConnected ? (
              <button 
                className="control-btn connect-btn" 
                onClick={connectWebSocket}
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <>
                <button 
                  className={`control-btn mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                >
                  <span className="btn-icon">{isRecording ? '🎤' : '🎙️'}</span>
                  <span>{isRecording ? 'Stop' : 'Start'}</span>
                </button>
                <button 
                  className={`control-btn map-btn ${showMap ? 'active' : ''}`}
                  onClick={toggleMap}
                >
                  <span className="btn-icon">🗺️</span>
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
                <button 
                  className="control-btn disconnect-btn" 
                  onClick={disconnect}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Animation Section - Right 1/3 */}
        <div className="animation-section">
          {showMap ? (
            <StoreMap 
              showMap={showMap} 
              onAislePin={handleMapControls}
            />
          ) : (
            <div className="voice-animation">
              <div className="voice-orb-container">
                <div className={`voice-orb ${isRecording ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
                  <div className="siri-waves">
                    {/* Generate 24 radial lines in all directions (every 15 degrees) */}
                    {Array.from({ length: 24 }).map((_, index) => (
                      <div key={index} className="siri-wave-line" style={{ '--angle': `${index * 15}deg`, '--index': index }}></div>
                    ))}
                  </div>
                  <div className="galaxy-ring ring-1"></div>
                  <div className="galaxy-ring ring-2"></div>
                  <div className="galaxy-ring ring-3"></div>
                </div>
              </div>
              {(isRecording || isSpeaking) && (
                <div className="animation-status">
                  {isRecording && !isSpeaking ? '🎤 Listening...' : ''}
                  {isSpeaking ? '🔊 Speaking...' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

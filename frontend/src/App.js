import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import StoreMap from './StoreMap';
import Dashboard from './Dashboard';
import KeyPanel from './KeyPanel';
import {
  loadCatalog,
  keywordSearch,
  semanticSearch,
  isCatalogIndexed,
  answerFor,
} from './search';
import { getSpeechRecognition, speak, stopSpeaking } from './voice';

const EXAMPLES = [
  'Where can I find almond milk?',
  'Where is the dog food?',
  'I need batteries',
  'peanut butter',
];

function App() {
  const [transcripts, setTranscripts] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakAnswers, setSpeakAnswers] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [highlights, setHighlights] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  // Keys are held in memory only, never written to storage.
  const [keys, setKeys] = useState({ openai: '', elevenlabs: '' });

  const recognitionRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const nextId = useRef(0);
  const SpeechRecognition = getSpeechRecognition();

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcripts]);

  useEffect(() => {
    loadCatalog().catch(() => {});
    return () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  const addTranscript = useCallback((speaker, text, extra = {}) => {
    nextId.current += 1;
    const item = { id: nextId.current, speaker, text, timestamp: new Date(), ...extra };
    setTranscripts((prev) => [...prev.filter((t) => !t.isInterim), item]);
  }, []);

  const setInterim = useCallback((text) => {
    setTranscripts((prev) => {
      const rest = prev.filter((t) => !t.isInterim);
      if (!text) return rest;
      return [...rest, { id: 'interim', speaker: 'user', text, timestamp: new Date(), isInterim: true }];
    });
  }, []);

  const handleQuery = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text) return;
      addTranscript('user', text);
      setBusy(true);
      try {
        const catalog = await loadCatalog();
        let results;
        if (keys.openai) {
          try {
            if (!isCatalogIndexed()) {
              addTranscript('system', 'Indexing the 1,000-product catalog with your OpenAI key (one time, about 15k tokens)...');
            }
            results = await semanticSearch(keys.openai, catalog, text);
            if (!results.length) results = keywordSearch(catalog, text);
          } catch (err) {
            addTranscript('system', `${err.message.replace(/\.$/, '')}. Falling back to keyword search.`);
            results = keywordSearch(catalog, text);
          }
        } else {
          results = keywordSearch(catalog, text);
        }
        const answer = answerFor(text, results);
        addTranscript('agent', answer.text, { products: results.map((r) => r.item) });
        if (answer.aisles.length) {
          setHighlights(answer.aisles);
          setShowMap(true);
        }
        setBusy(false);
        if (speakAnswers) {
          setIsSpeaking(true);
          const voiceError = await speak(answer.text, keys.elevenlabs);
          setIsSpeaking(false);
          if (voiceError) addTranscript('system', voiceError);
        }
      } catch (err) {
        addTranscript('system', err.message || 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    },
    [keys, speakAnswers, addTranscript]
  );

  const submit = (e) => {
    e.preventDefault();
    const text = input;
    setInput('');
    handleQuery(text);
  };

  const startListening = () => {
    if (!SpeechRecognition) return;
    stopSpeaking();
    setIsSpeaking(false);
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) {
        setInterim('');
        handleQuery(finalText);
      } else {
        setInterim(interimText);
      }
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        addTranscript('system', 'Microphone access was blocked. Allow it in your browser, or type your question.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        addTranscript('system', `Speech recognition error: ${event.error}. You can type your question instead.`);
      }
    };
    rec.onend = () => {
      setIsListening(false);
      setInterim('');
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else startListening();
  };

  const clearConversation = () => {
    recognitionRef.current?.abort();
    stopSpeaking();
    setIsSpeaking(false);
    setTranscripts([]);
    setHighlights([]);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const searchMode = keys.openai ? 'Semantic search (OpenAI)' : 'Keyword search';
  const voiceMode = keys.elevenlabs ? 'ElevenLabs voice' : 'Browser voice';

  return (
    <div className="app">
      <div className="gradient-bg-top-left"></div>
      <div className="gradient-bg-bottom-right"></div>
      <div className="gradient-bg-center"></div>
      <div className="grid-pattern"></div>

      <button
        className="global-settings-button"
        onClick={() => setShowDashboard(true)}
        title="Store dashboard"
        aria-label="Open store dashboard"
      >
        <div className="hamburger-menu">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className="container">
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
              <div className={`status-indicator ${keys.openai ? 'connected' : ''}`}>
                <div className="status-dot"></div>
                <span>{searchMode}</span>
              </div>
              <div className={`status-indicator ${keys.elevenlabs ? 'connected' : ''}`}>
                <div className="status-dot"></div>
                <span>{voiceMode}</span>
              </div>
              <button className="keys-button" onClick={() => setShowKeys(true)}>
                🔑 {keys.openai || keys.elevenlabs ? 'Keys added' : 'Add keys (optional)'}
              </button>
            </div>
          </header>

          <div className="transcript-container">
            {transcripts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <p>
                  Ask where something is in WinMart. Type below or tap the mic, and StorePal
                  answers and pins the aisle on the map.
                </p>
                <div className="example-chips">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="example-chip" onClick={() => handleQuery(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="transcript-list">
                {transcripts.map((item) => (
                  <div
                    key={item.id}
                    className={`transcript-item ${item.speaker} ${item.isInterim ? 'interim' : ''}`}
                  >
                    <div className="transcript-header">
                      <span className="speaker-label">
                        {item.speaker === 'user' ? '👤 You' : item.speaker === 'agent' ? '🤖 StorePal' : '⚙️ System'}
                        {item.isInterim && <span className="interim-badge"> (listening...)</span>}
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

          {showMap && (
            <div className="map-in-chat">
              <StoreMap highlights={highlights} onClear={() => setHighlights([])} />
            </div>
          )}

          <form className="ask-form" onSubmit={submit}>
            <input
              className="ask-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where can I find..."
              aria-label="Ask StorePal where a product is"
            />
            <button className="control-btn ask-btn" type="submit" disabled={busy || !input.trim()}>
              Ask
            </button>
          </form>

          <div className="controls">
            {SpeechRecognition ? (
              <button
                className={`control-btn mic-btn ${isListening ? 'recording' : ''}`}
                onClick={toggleListening}
              >
                <span className="btn-icon">🎙️</span>
                <span>{isListening ? 'Stop' : 'Speak'}</span>
              </button>
            ) : (
              <span className="no-mic-note">Voice input needs Chrome, Edge or Safari. Typing works everywhere.</span>
            )}
            <button
              className={`control-btn map-btn ${showMap ? 'active' : ''}`}
              onClick={() => setShowMap((v) => !v)}
            >
              <span className="btn-icon">🗺️</span>
              <span>{showMap ? 'Hide map' : 'Show map'}</span>
            </button>
            <button
              className={`control-btn voice-toggle ${speakAnswers ? 'on' : ''}`}
              onClick={() => {
                if (speakAnswers) {
                  stopSpeaking();
                  setIsSpeaking(false);
                }
                setSpeakAnswers((v) => !v);
              }}
              title="Read answers out loud"
            >
              <span className="btn-icon">{speakAnswers ? '🔊' : '🔇'}</span>
              <span>{speakAnswers ? 'Voice on' : 'Voice off'}</span>
            </button>
            {transcripts.length > 0 && (
              <button className="control-btn disconnect-btn" onClick={clearConversation}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="animation-section">
          <div className="voice-animation">
            <div className="voice-orb-container">
              <div className={`voice-orb ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
                <div className="siri-waves">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <div key={index} className="siri-wave-line" style={{ '--angle': `${index * 15}deg`, '--index': index }}></div>
                  ))}
                </div>
                <div className="galaxy-ring ring-1"></div>
                <div className="galaxy-ring ring-2"></div>
                <div className="galaxy-ring ring-3"></div>
              </div>
            </div>
            {(isListening || isSpeaking || busy) && (
              <div className="animation-status">
                {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : '🔎 Searching...'}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
      <KeyPanel isOpen={showKeys} onClose={() => setShowKeys(false)} keys={keys} onSave={setKeys} />
    </div>
  );
}

export default App;

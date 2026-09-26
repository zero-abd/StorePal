import React, { useState } from 'react';

const REPO_URL = 'https://github.com/zero-abd/StorePal';

// Optional bring-your-own-key panel. Keys live only in React state (memory):
// closing or reloading the tab forgets them.
const KeyPanel = ({ isOpen, onClose, keys, onSave }) => {
  const [openai, setOpenai] = useState(keys.openai);
  const [elevenlabs, setElevenlabs] = useState(keys.elevenlabs);

  if (!isOpen) return null;

  const save = (e) => {
    e.preventDefault();
    onSave({ openai: openai.trim(), elevenlabs: elevenlabs.trim() });
    onClose();
  };

  const clear = () => {
    setOpenai('');
    setElevenlabs('');
    onSave({ openai: '', elevenlabs: '' });
  };

  return (
    <div className="key-overlay" role="dialog" aria-modal="true" aria-labelledby="key-title">
      <form className="key-panel" onSubmit={save}>
        <div className="key-panel-header">
          <h2 id="key-title">Optional API keys</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="key-note">
          StorePal works without keys: keyword search, the store map, and your browser's own
          voice. Add a key to turn on the extras.
        </p>

        <label className="key-field">
          <span>
            OpenAI key <em>for semantic search (text-embedding-3-small)</em>
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck="false"
            placeholder="sk-..."
            value={openai}
            onChange={(e) => setOpenai(e.target.value)}
          />
        </label>

        <label className="key-field">
          <span>
            ElevenLabs key <em>for spoken answers in an ElevenLabs voice</em>
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck="false"
            placeholder="sk_..."
            value={elevenlabs}
            onChange={(e) => setElevenlabs(e.target.value)}
          />
        </label>

        <p className="key-privacy">
          Your key stays in your browser and is sent only with your own requests. Nothing is saved.
          This project is open source, so you can check the code:{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {REPO_URL.replace('https://', '')}
          </a>
        </p>

        <div className="key-actions">
          <button type="button" className="key-btn secondary" onClick={clear}>
            Clear keys
          </button>
          <button type="submit" className="key-btn primary">
            Use these keys
          </button>
        </div>
      </form>
    </div>
  );
};

export default KeyPanel;

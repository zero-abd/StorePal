// Voice in and out.
// Listening uses the browser's own speech recognition (Chrome, Edge, Safari).
// Speaking uses ElevenLabs when the visitor adds their own key, and the browser's
// built-in text-to-speech otherwise.

const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // "George", a premade voice
const ELEVENLABS_MODEL = 'eleven_flash_v2_5';

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

let currentAudio = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function speakWithBrowser(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithElevenLabs(apiKey, text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL }),
    }
  );
  if (!res.ok) {
    let msg = `ElevenLabs returned ${res.status}`;
    try {
      const body = await res.json();
      const detail = body?.detail;
      if (typeof detail === 'string') msg = `ElevenLabs: ${detail}`;
      else if (detail?.message) msg = `ElevenLabs: ${detail.message}`;
    } catch (_) {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  await new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onpause = resolve;
    audio.onerror = () => reject(new Error('Could not play the ElevenLabs audio'));
    audio.play().catch(reject);
  });
  URL.revokeObjectURL(url);
  if (currentAudio === audio) currentAudio = null;
}

// Speaks the text. Returns an error message if ElevenLabs failed and the
// browser voice was used instead, or null.
export async function speak(text, elevenLabsKey) {
  stopSpeaking();
  if (elevenLabsKey) {
    try {
      await speakWithElevenLabs(elevenLabsKey, text);
      return null;
    } catch (err) {
      await speakWithBrowser(text);
      return `${err.message.replace(/\.$/, '')}. Used the browser voice instead.`;
    }
  }
  await speakWithBrowser(text);
  return null;
}

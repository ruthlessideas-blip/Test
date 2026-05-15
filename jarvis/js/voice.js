// ── VOICE I/O ──

class VoiceManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResult = null;
    this.onStart = null;
    this.onEnd = null;
    this._init();
  }

  _init() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { this.available = false; return; }
    this.available = true;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart?.();
    };

    this.recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      const isFinal = e.results[e.results.length - 1].isFinal;
      this.onResult?.(transcript, isFinal);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };

    this.recognition.onerror = (e) => {
      if (e.error !== 'aborted') console.warn('Speech recognition error:', e.error);
      this.isListening = false;
      this.onEnd?.();
    };
  }

  startListening() {
    if (!this.available || this.isListening) return;
    try { this.recognition.start(); } catch {}
  }

  stopListening() {
    if (!this.available || !this.isListening) return;
    try { this.recognition.stop(); } catch {}
  }

  speak(text, opts = {}) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = opts.rate  || 0.95;
    utt.pitch = opts.pitch || 0.85;
    utt.volume = opts.volume || 0.9;

    // Pick a deeper voice if available
    const voices = this.synthesis.getVoices();
    const pref = voices.find(v =>
      v.name.toLowerCase().includes('daniel') ||
      v.name.toLowerCase().includes('alex') ||
      v.name.toLowerCase().includes('google uk') ||
      v.lang === 'en-GB'
    ) || voices.find(v => v.lang.startsWith('en'));
    if (pref) utt.voice = pref;

    this.synthesis.speak(utt);
  }

  stopSpeaking() {
    this.synthesis?.cancel();
  }
}

const voiceManager = new VoiceManager();

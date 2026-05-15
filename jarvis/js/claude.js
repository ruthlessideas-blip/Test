// ── CLAUDE API CLIENT ──

class ClaudeClient {
  constructor() {
    this.apiKey = localStorage.getItem('jarvis_api_key') || '';
    this.model  = localStorage.getItem('jarvis_model') || 'claude-sonnet-4-6';
    this.history = [];
    this.maxHistory = 20;
  }

  setKey(key) {
    this.apiKey = key;
    localStorage.setItem('jarvis_api_key', key);
  }

  setModel(model) {
    this.model = model;
    localStorage.setItem('jarvis_model', model);
  }

  hasKey() { return !!this.apiKey; }

  clearHistory() { this.history = []; }

  _trimHistory() {
    if (this.history.length > this.maxHistory * 2) {
      this.history = this.history.slice(-this.maxHistory * 2);
    }
  }

  async send({ userText, imageBase64, systemExtra, onChunk }) {
    if (!this.apiKey) throw new Error('NO_API_KEY');

    const systemPrompt = this._buildSystem(systemExtra);

    const userContent = [];
    if (imageBase64) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
      });
    }
    userContent.push({ type: 'text', text: userText });

    this.history.push({ role: 'user', content: userContent });
    this._trimHistory();

    const body = JSON.stringify({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: this.history,
      stream: true,
    });

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${resp.status}`);
    }

    let fullText = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            fullText += evt.delta.text;
            onChunk?.(evt.delta.text, fullText);
          }
        } catch {}
      }
    }

    this.history.push({ role: 'assistant', content: fullText });
    return fullText;
  }

  _buildSystem(extra) {
    const saved = localStorage.getItem('jarvis_system_prompt') ||
      'You are JARVIS, an advanced AI assistant inspired by Tony Stark\'s AI. You are highly capable, concise, and occasionally witty. You can see the user\'s screen when they share a capture. You have access to connected apps via the connector system. Always be helpful, direct, and intelligent.';

    const parts = [saved];
    if (extra) parts.push('\n\n--- ACTIVE APP CONTEXT ---\n' + extra);
    return parts.join('');
  }
}

const claudeClient = new ClaudeClient();

// ── JARVIS MAIN APP ──

// ── DOM refs ──
const $ = (id) => document.getElementById(id);
const bootScreen    = $('boot-screen');
const appEl         = $('app');
const chatMessages  = $('chatMessages');
const chatInput     = $('chatInput');
const sendBtn       = $('sendBtn');
const voiceBtn      = $('voiceBtn');
const screenBtn     = $('screenBtn');
const captureBtn    = $('captureBtn');
const screenPreview = $('screenPreview');
const voiceViz      = $('voiceViz');
const vizLabel      = $('vizLabel');
const statusLabel   = $('statusLabel');
const hudClock      = $('hudClock');
const hudDate       = $('hudDate');
const cpuBar        = $('cpuBar');
const cpuVal        = $('cpuVal');
const memBar        = $('memBar');
const memVal        = $('memVal');
const apiKeyInput   = $('apiKeyInput');
const saveApiKey    = $('saveApiKey');
const apiStatus     = $('apiStatus');
const modelSelect   = $('modelSelect');
const settingsBtn   = $('settingsBtn');
const settingsModal = $('settingsModal');
const closeSettings = $('closeSettings');
const connectorList = $('connectorList');
const addConnectorBtn    = $('addConnectorBtn');
const connectorModal     = $('connectorModal');
const closeConnector     = $('closeConnector');
const connectorTemplates = $('connectorTemplates');
const addCustomConn      = $('addCustomConn');
const customConnName     = $('customConnName');
const customConnData     = $('customConnData');
const ctxBody            = $('ctxBody');
const quickOps           = $('quickOps');
const systemPromptTA     = $('systemPrompt');
const powerBtn           = $('powerBtn');
const bootLog            = $('bootLog');

// Vision / monitor
const sourcePickerBtn  = $('sourcePickerBtn');
const sourceModal      = $('sourceModal');
const closeSource      = $('closeSource');
const sourceGrid       = $('sourceGrid');
const sourceIndicator  = $('sourceIndicator');
const sourceIcon       = $('sourceIcon');
const sourceName       = $('sourceName');
const sourceClear      = $('sourceClear');
const monitorToggle    = $('monitorToggle');
const monitorOpts      = $('monitorOpts');
const monitorInterval  = $('monitorInterval');
const autoAnalyze      = $('autoAnalyze');
const monitorStatus    = $('monitorStatus');
const monitorBadge     = $('monitorBadge');

// ── State ──
let currentScreenshot = null;
let pendingScreenshot = null;
let isSending = false;

// Vision state
let activeSource    = null; // { id, name, isScreen }
let monitorTimer    = null;
let currentSrcFilter = 'screen'; // 'screen' | 'window'
let allSources      = [];

// ── BOOT SEQUENCE ──
const bootLines = [
  'Initializing core systems...',
  'Loading neural interface... OK',
  'Calibrating voice module... OK',
  'Connecting to Claude AI... OK',
  'Loading app connectors... OK',
  'Scanning environment... OK',
  'All systems nominal.',
  'Welcome, sir.',
];

async function boot() {
  for (const line of bootLines) {
    await delay(340 + Math.random() * 200);
    bootLog.textContent += line + '\n';
    bootLog.scrollTop = bootLog.scrollHeight;
  }
  await delay(600);
  bootScreen.style.opacity = '0';
  bootScreen.style.transition = 'opacity 0.6s ease';
  await delay(600);
  bootScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
  initApp();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── INIT ──
function initApp() {
  initClock();
  initSysStats();
  initApiConfig();
  renderConnectorList();
  renderConnectorTemplates();
  initQuickOps();
  initVoice();
  initKeyboard();

  // Restore system prompt
  const sp = localStorage.getItem('jarvis_system_prompt');
  if (sp) systemPromptTA.value = sp;

  systemPromptTA.addEventListener('change', () => {
    localStorage.setItem('jarvis_system_prompt', systemPromptTA.value);
  });
}

// ── CLOCK ──
function initClock() {
  function tick() {
    const now = new Date();
    hudClock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    hudDate.textContent  = now.toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' });
  }
  tick();
  setInterval(tick, 1000);
}

// ── SIMULATED SYSTEM STATS ──
function initSysStats() {
  function update() {
    const cpu = 15 + Math.random() * 30;
    const mem = 40 + Math.random() * 20;
    cpuBar.style.width = cpu + '%';
    cpuVal.textContent = Math.round(cpu) + '%';
    memBar.style.width = mem + '%';
    memVal.textContent = Math.round(mem) + '%';
  }
  update();
  setInterval(update, 3000);
}

// ── API CONFIG ──
function initApiConfig() {
  const key = claudeClient.apiKey;
  if (key) {
    apiKeyInput.value = '●'.repeat(16);
    apiStatus.textContent = 'Configured ✓';
    apiStatus.className = 'cfg-hint ok';
  }
  modelSelect.value = claudeClient.model;

  saveApiKey.addEventListener('click', () => {
    const val = apiKeyInput.value.trim();
    if (!val || val.startsWith('●')) return;
    claudeClient.setKey(val);
    apiKeyInput.value = '●'.repeat(16);
    apiStatus.textContent = 'Configured ✓';
    apiStatus.className = 'cfg-hint ok';
    addMsg('jarvis', 'API key saved. I\'m now fully operational, sir.');
  });

  modelSelect.addEventListener('change', () => {
    claudeClient.setModel(modelSelect.value);
  });
}

// ── CONNECTOR UI ──
function renderConnectorList() {
  connectorList.innerHTML = '';
  if (connectorManager.connectors.length === 0) {
    connectorList.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text-dim);text-align:center;">No connectors.<br/>Click + to add one.</div>';
    ctxBody.textContent = 'No connector active.';
    return;
  }

  connectorManager.connectors.forEach(c => {
    const tmpl = CONNECTOR_TEMPLATES.find(t => t.id === c.templateId);
    const isActive = c.instanceId === connectorManager.activeId;
    const div = document.createElement('div');
    div.className = 'connector-item' + (isActive ? ' active' : '');
    div.innerHTML = `
      <div class="conn-icon">${c.icon || '🔌'}</div>
      <div class="conn-info">
        <div class="conn-name">${c.name}</div>
        <div class="conn-status ${isActive ? 'connected' : ''}">${isActive ? 'ACTIVE' : 'STANDBY'}</div>
      </div>
      <button class="conn-remove" title="Remove">×</button>
    `;
    div.addEventListener('click', (e) => {
      if (e.target.classList.contains('conn-remove')) {
        connectorManager.remove(c.instanceId);
        renderConnectorList();
        return;
      }
      connectorManager.setActive(c.instanceId);
      renderConnectorList();
      updateContextDisplay();
    });
    connectorList.appendChild(div);
  });

  updateContextDisplay();
}

function updateContextDisplay() {
  const active = connectorManager.getActive();
  if (active) {
    ctxBody.textContent = connectorManager.getContextString();
  } else {
    ctxBody.textContent = 'No connector active. Click a connector to activate.';
  }
}

function renderConnectorTemplates() {
  connectorTemplates.innerHTML = CONNECTOR_TEMPLATES.slice(0, 8).map(t => `
    <div class="conn-template" data-id="${t.id}">
      <div class="t-icon">${t.icon}</div>
      <div class="t-name">${t.name}</div>
      <div class="t-desc">${t.desc}</div>
    </div>
  `).join('');

  connectorTemplates.querySelectorAll('.conn-template').forEach(el => {
    el.addEventListener('click', () => {
      const tmpl = CONNECTOR_TEMPLATES.find(t => t.id === el.dataset.id);
      if (!tmpl) return;
      connectorManager.add({
        templateId: tmpl.id,
        name: tmpl.name,
        icon: tmpl.icon,
        config: {},
      });
      renderConnectorList();
      connectorModal.classList.add('hidden');
      addMsg('jarvis', `${tmpl.name} connector added. ${tmpl.contextFn({})}`);
    });
  });
}

function initQuickOps() {
  quickOps.querySelectorAll('.qop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      if (pendingScreenshot || currentScreenshot) {
        sendMessage(prompt, pendingScreenshot || currentScreenshot);
        pendingScreenshot = null;
      } else {
        chatInput.value = prompt;
        chatInput.focus();
      }
    });
  });
}

// ── VOICE ──
function initVoice() {
  if (!voiceManager.available) {
    voiceBtn.title = 'Voice not available in this browser';
    voiceBtn.style.opacity = '0.4';
    return;
  }

  voiceManager.onStart = () => {
    voiceViz.classList.add('active');
    voiceBtn.classList.add('active');
    vizLabel.textContent = 'LISTENING...';
  };

  voiceManager.onResult = (text, isFinal) => {
    chatInput.value = text;
    if (isFinal) {
      vizLabel.textContent = 'PROCESSING...';
    }
  };

  voiceManager.onEnd = () => {
    voiceViz.classList.remove('active');
    voiceBtn.classList.remove('active');
    const text = chatInput.value.trim();
    if (text) sendMessage(text);
  };

  voiceBtn.addEventListener('click', () => {
    if (voiceManager.isListening) {
      voiceManager.stopListening();
    } else {
      voiceManager.startListening();
    }
  });
}

// ── SOURCE PICKER ──
sourcePickerBtn.addEventListener('click', () => openSourcePicker());
closeSource.addEventListener('click', () => sourceModal.classList.add('hidden'));
sourceModal.addEventListener('click', e => { if (e.target === sourceModal) sourceModal.classList.add('hidden'); });

document.querySelectorAll('.src-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.src-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSrcFilter = tab.dataset.type;
    renderSources();
  });
});

async function openSourcePicker() {
  sourceModal.classList.remove('hidden');
  sourceGrid.innerHTML = '<div class="source-loading">Scanning sources...</div>';

  if (window.jarvisElectron) {
    try {
      allSources = await window.jarvisElectron.getSources();
      renderSources();
    } catch (e) {
      sourceGrid.innerHTML = `<div class="source-loading">Error: ${e.message}</div>`;
    }
  } else {
    // Browser mode: show a single "Share screen" card
    allSources = [
      { id: 'browser', name: 'Share Screen / Window', isScreen: true, thumbnail: null, appIcon: null },
    ];
    renderSources();
  }
}

function renderSources() {
  const filtered = allSources.filter(s =>
    currentSrcFilter === 'screen' ? s.isScreen : !s.isScreen
  );

  if (filtered.length === 0) {
    sourceGrid.innerHTML = '<div class="source-loading">No sources found.</div>';
    return;
  }

  sourceGrid.innerHTML = filtered.map(s => `
    <div class="source-card ${activeSource?.id === s.id ? 'selected' : ''}" data-id="${s.id}">
      ${s.thumbnail
        ? `<img class="source-thumb" src="${s.thumbnail}" alt="${s.name}" />`
        : `<div class="source-thumb-placeholder">${s.isScreen ? '🖥' : '🪟'}</div>`
      }
      <div class="source-info">
        ${s.appIcon ? `<img class="source-app-icon" src="${s.appIcon}" alt="" />` : ''}
        <span class="source-card-name">${s.name}</span>
      </div>
    </div>
  `).join('');

  sourceGrid.querySelectorAll('.source-card').forEach(card => {
    card.addEventListener('click', () => {
      const src = allSources.find(s => s.id === card.dataset.id);
      if (src) selectSource(src);
    });
  });
}

function selectSource(src) {
  activeSource = src;
  sourceIndicator.style.display = 'flex';
  sourceIcon.textContent = src.isScreen ? '🖥' : '🪟';
  sourceName.textContent = src.name;
  sourceModal.classList.add('hidden');
}

sourceClear.addEventListener('click', () => {
  activeSource = null;
  sourceIndicator.style.display = 'none';
  stopMonitor();
});

// ── SCREEN CAPTURE ──
async function captureScreen() {
  // Electron path: silent capture via desktopCapturer
  if (window.jarvisElectron && activeSource && activeSource.id !== 'browser') {
    try {
      const base64 = await window.jarvisElectron.captureSource(activeSource.id);
      if (!base64) throw new Error('No data returned');
      setCapture(base64);
      return base64;
    } catch (e) {
      addMsg('jarvis', `Capture failed: ${e.message}`);
      return null;
    }
  }

  // Browser path: use getDisplayMedia (requires user interaction)
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always', displaySurface: 'monitor' },
      preferCurrentTab: false,
    });
    const track  = stream.getVideoTracks()[0];
    const cap    = new ImageCapture(track);
    const bitmap = await cap.grabFrame();
    track.stop();
    stream.getTracks().forEach(t => t.stop());

    const canvas = document.createElement('canvas');
    canvas.width  = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    setCapture(base64);
    return base64;
  } catch (e) {
    if (e.name !== 'AbortError') addMsg('jarvis', `Screen capture failed: ${e.message}`);
    return null;
  }
}

function setCapture(base64) {
  currentScreenshot = base64;
  pendingScreenshot = base64;
  screenPreview.innerHTML = `<img src="data:image/png;base64,${base64}" alt="Capture" />`;
}

captureBtn.addEventListener('click', async () => {
  const img = await captureScreen();
  if (img) addMsg('jarvis', 'Screen captured. I can see your screen now — what would you like to know?');
});

screenBtn.addEventListener('click', async () => {
  const img = await captureScreen();
  if (img) { chatInput.focus(); chatInput.placeholder = 'Screen captured — ask me about it...'; }
});

// ── AUTO-MONITOR MODE ──
monitorToggle.addEventListener('change', () => {
  if (monitorToggle.checked) startMonitor();
  else stopMonitor();
});

function startMonitor() {
  if (!activeSource && !window.jarvisElectron) {
    addMsg('jarvis', 'Select a screen or window first using the SELECT button.');
    monitorToggle.checked = false;
    return;
  }
  const interval = parseInt(monitorInterval.value, 10);
  monitorBadge.classList.remove('hidden');
  monitorStatus.textContent = `Capturing every ${interval / 1000}s`;
  monitorTimer = setInterval(doMonitorCapture, interval);
  doMonitorCapture();
}

function stopMonitor() {
  clearInterval(monitorTimer);
  monitorTimer = null;
  monitorToggle.checked = false;
  monitorBadge.classList.add('hidden');
  monitorStatus.textContent = 'Monitoring off';
}

async function doMonitorCapture() {
  const base64 = await captureScreen();
  if (!base64) { stopMonitor(); return; }

  if (autoAnalyze.checked && !isSending) {
    await sendMessage('What has changed or is happening on my screen right now? Be brief.', base64);
  }
}

monitorInterval.addEventListener('change', () => {
  if (monitorTimer) { stopMonitor(); startMonitor(); }
});

// ── CHAT ──
function addMsg(role, text, streaming = false) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-sender">${role === 'jarvis' ? 'JARVIS' : 'YOU'}</div>
    <div class="msg-body">${escapeHtml(text)}</div>
  `;
  chatMessages.appendChild(div);
  scrollBottom();
  return div;
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'msg jarvis typing';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-sender">JARVIS</div>
    <div class="msg-body">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatMessages.appendChild(div);
  scrollBottom();
  return div;
}

function removeTypingIndicator() {
  $('typingIndicator')?.remove();
}

function scrollBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

async function sendMessage(text, screenshot = null) {
  if (!text?.trim() || isSending) return;

  if (!claudeClient.hasKey()) {
    addMsg('jarvis', 'No API key configured. Please add your Claude API key in the Configuration panel on the right.');
    return;
  }

  isSending = true;
  sendBtn.disabled = true;
  chatInput.value = '';
  autoResizeInput();

  addMsg('user', text);
  if (screenshot) {
    pendingScreenshot = null;
  }

  const typing = addTypingIndicator();
  setStatus('PROCESSING', false);

  const connContext = connectorManager.getAllContextString();

  try {
    let responseDiv = null;
    let fullText = '';

    await claudeClient.send({
      userText: text,
      imageBase64: screenshot,
      systemExtra: connContext,
      onChunk: (chunk, accumulated) => {
        if (!responseDiv) {
          removeTypingIndicator();
          responseDiv = addMsg('jarvis', '');
        }
        fullText = accumulated;
        responseDiv.querySelector('.msg-body').innerHTML = escapeHtml(fullText);
        scrollBottom();
      },
    });

    if (!responseDiv) {
      removeTypingIndicator();
      addMsg('jarvis', fullText || '...');
    }

    // Speak the first sentence of the response
    if (fullText && fullText.length < 300) {
      voiceManager.speak(fullText);
    } else if (fullText) {
      const firstSentence = fullText.split(/[.!?]/)[0];
      if (firstSentence.trim()) voiceManager.speak(firstSentence.trim() + '.');
    }

  } catch (e) {
    removeTypingIndicator();
    if (e.message === 'NO_API_KEY') {
      addMsg('jarvis', 'Please configure your Claude API key first.');
    } else {
      addMsg('jarvis', `System error: ${e.message}`);
    }
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    setStatus('ONLINE', true);
  }
}

// ── STATUS ──
function setStatus(label, online) {
  statusLabel.textContent = label;
  statusLabel.style.color = online ? 'var(--green)' : 'var(--gold)';
  const dot = document.querySelector('.status-dot');
  dot.classList.toggle('offline', !online);
  dot.classList.toggle('online', online);
}

// ── INPUT AUTO-RESIZE ──
function autoResizeInput() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

chatInput.addEventListener('input', autoResizeInput);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const img = pendingScreenshot;
    pendingScreenshot = null;
    sendMessage(chatInput.value.trim(), img);
  }
});
sendBtn.addEventListener('click', () => {
  const img = pendingScreenshot;
  pendingScreenshot = null;
  sendMessage(chatInput.value.trim(), img);
});

// ── KEYBOARD SHORTCUTS ──
function initKeyboard() {
  document.addEventListener('keydown', e => {
    // V = hold for voice
    if (e.key === 'v' && e.target === document.body && !e.ctrlKey && !e.metaKey) {
      voiceManager.startListening();
    }
    // Ctrl+Shift+S = screen capture
    if (e.key === 'S' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      captureScreen();
    }
    // Ctrl+Shift+J = focus input
    if (e.key === 'J' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      chatInput.focus();
    }
    // Esc = close modals / stop voice
    if (e.key === 'Escape') {
      settingsModal.classList.add('hidden');
      connectorModal.classList.add('hidden');
      voiceManager.stopListening();
      voiceManager.stopSpeaking();
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === 'v' && e.target === document.body) {
      voiceManager.stopListening();
    }
  });
}

// ── MODALS ──
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });

addConnectorBtn.addEventListener('click', () => connectorModal.classList.remove('hidden'));
closeConnector.addEventListener('click', () => connectorModal.classList.add('hidden'));
connectorModal.addEventListener('click', e => { if (e.target === connectorModal) connectorModal.classList.add('hidden'); });

addCustomConn.addEventListener('click', () => {
  const name = customConnName.value.trim() || 'Custom';
  const data = customConnData.value.trim();
  connectorManager.add({
    templateId: 'custom',
    name,
    icon: '🔌',
    customContext: data,
    config: {},
  });
  renderConnectorList();
  customConnName.value = '';
  customConnData.value = '';
  connectorModal.classList.add('hidden');
  addMsg('jarvis', `Custom connector "${name}" added and ready.`);
});

// ── ELECTRON INTEGRATION ──
const electron = window.jarvisElectron;
if (electron) {
  // Always-on-top button becomes functional
  alwaysTopBtn.addEventListener('click', async () => {
    const state = await electron.toggleAlwaysOnTop();
    alwaysTopBtn.style.color = state ? 'var(--cyan)' : 'var(--text-dim)';
    alwaysTopBtn.title = state ? 'Always on Top: ON' : 'Always on Top: OFF';
  });

  // Global shortcut triggers capture
  electron.onTriggerCapture(() => captureScreen());
} else {
  // Browser mode: always-on-top not available
  alwaysTopBtn.title = 'Always on Top (Electron only)';
  alwaysTopBtn.style.opacity = '0.4';
}

// ── POWER ──
powerBtn.addEventListener('click', () => {
  const msg = addMsg('jarvis', 'Entering standby mode. Goodbye, sir.');
  voiceManager.speak('Entering standby mode. Goodbye.');
  setTimeout(() => {
    appEl.style.opacity = '0';
    appEl.style.transition = 'opacity 1s ease';
    setTimeout(() => {
      bootScreen.style.opacity = '1';
      bootScreen.style.transition = 'opacity 0.5s ease';
      bootScreen.classList.remove('hidden');
      bootLog.textContent = 'System in standby.\nClick anywhere to resume.\n';
      bootScreen.addEventListener('click', () => {
        bootScreen.style.opacity = '0';
        setTimeout(() => {
          bootScreen.classList.add('hidden');
          appEl.style.opacity = '1';
        }, 400);
      }, { once: true });
    }, 500);
  }, 1500);
});

// ── START ──
boot();

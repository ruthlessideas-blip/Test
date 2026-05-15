// ── CONNECTOR SYSTEM ──
// Each connector provides context injected into Claude's system prompt.

const CONNECTOR_TEMPLATES = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    desc: 'Repos & PRs',
    fields: [{ key: 'token', label: 'Personal Access Token', type: 'password' },
             { key: 'repo',  label: 'Default Repo (owner/name)', type: 'text' }],
    contextFn: (cfg) => `GitHub connector active. Repo: ${cfg.repo || 'not set'}. User has GitHub access.`,
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    desc: 'Current page',
    fields: [],
    contextFn: () => `Browser connector active. User can paste page content or URLs for analysis.`,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: '💻',
    desc: 'Code editor',
    fields: [{ key: 'workspace', label: 'Workspace path', type: 'text' }],
    contextFn: (cfg) => `VS Code connector active. Workspace: ${cfg.workspace || 'not set'}. User is a developer.`,
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    desc: 'Notes & docs',
    fields: [{ key: 'token', label: 'Integration Token', type: 'password' }],
    contextFn: () => `Notion connector active. User may reference their notes and documents.`,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    desc: 'Messages',
    fields: [{ key: 'token', label: 'Bot Token', type: 'password' },
             { key: 'channel', label: 'Default Channel', type: 'text' }],
    contextFn: (cfg) => `Slack connector active. Default channel: ${cfg.channel || 'not set'}.`,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    desc: 'Schedule',
    fields: [],
    contextFn: () => `Calendar connector active. User may ask about scheduling and time management.`,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '⬛',
    desc: 'Shell output',
    fields: [{ key: 'shell', label: 'Shell (bash/zsh/ps)', type: 'text' }],
    contextFn: (cfg) => `Terminal connector active. Shell: ${cfg.shell || 'bash'}. User may paste command output.`,
  },
  {
    id: 'files',
    name: 'Files',
    icon: '📁',
    desc: 'Local files',
    fields: [{ key: 'path', label: 'Watch Path', type: 'text' }],
    contextFn: (cfg) => `File system connector active. Path: ${cfg.path || 'not set'}.`,
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '🔌',
    desc: 'Any context',
    fields: [],
    contextFn: () => `Custom connector active.`,
  },
];

class ConnectorManager {
  constructor() {
    this.connectors = this._load();
    this.activeId = null;
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem('jarvis_connectors') || '[]');
    } catch { return []; }
  }

  _save() {
    localStorage.setItem('jarvis_connectors', JSON.stringify(this.connectors));
  }

  add(connector) {
    connector.instanceId = Date.now().toString();
    this.connectors.push(connector);
    this._save();
    return connector;
  }

  remove(instanceId) {
    this.connectors = this.connectors.filter(c => c.instanceId !== instanceId);
    if (this.activeId === instanceId) this.activeId = null;
    this._save();
  }

  setActive(instanceId) {
    this.activeId = instanceId === this.activeId ? null : instanceId;
  }

  getActive() {
    return this.connectors.find(c => c.instanceId === this.activeId) || null;
  }

  getContextString() {
    const active = this.getActive();
    if (!active) return '';
    const tmpl = CONNECTOR_TEMPLATES.find(t => t.id === active.templateId);
    if (!tmpl) return active.customContext || '';
    return tmpl.contextFn(active.config || {});
  }

  getAllContextString() {
    if (this.connectors.length === 0) return '';
    return this.connectors.map(c => {
      const tmpl = CONNECTOR_TEMPLATES.find(t => t.id === c.templateId);
      if (!tmpl) return c.customContext || '';
      return tmpl.contextFn(c.config || {});
    }).join('\n');
  }
}

const connectorManager = new ConnectorManager();

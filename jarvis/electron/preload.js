const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvisElectron', {
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  setOpacity:  (v) => ipcRenderer.invoke('set-opacity', v),
  minimize:    ()  => ipcRenderer.invoke('minimize'),
  close:       ()  => ipcRenderer.invoke('close'),
  onTriggerCapture: (cb) => ipcRenderer.on('trigger-capture', cb),
  isElectron: true,
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvisElectron', {
  isElectron:        true,
  toggleAlwaysOnTop: ()  => ipcRenderer.invoke('toggle-always-on-top'),
  setOpacity:        (v) => ipcRenderer.invoke('set-opacity', v),
  minimize:          ()  => ipcRenderer.invoke('minimize'),
  close:             ()  => ipcRenderer.invoke('close'),

  // Screen vision
  getSources:    ()   => ipcRenderer.invoke('get-sources'),
  captureSource: (id) => ipcRenderer.invoke('capture-source', id),

  // Events from main process
  onTriggerCapture: (cb) => ipcRenderer.on('trigger-capture', cb),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('KabanchikAPI', {
  // Window
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Auth
  loginMicrosoft: () => ipcRenderer.invoke('auth:microsoft'),
  loginOffline: (username) => ipcRenderer.invoke('auth:offline', username),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getAccount: () => ipcRenderer.invoke('auth:getAccount'),
  saveAccount: (account) => ipcRenderer.invoke('auth:saveAccount', account),

  // Profiles
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  createProfile: (data) => ipcRenderer.invoke('profiles:create', data),
  deleteProfile: (id) => ipcRenderer.invoke('profiles:delete', id),
  updateProfile: (id, data) => ipcRenderer.invoke('profiles:update', id, data),
  getProfile: (id) => ipcRenderer.invoke('profiles:get', id),

  // Minecraft
  launchGame: (profileId) => ipcRenderer.invoke('minecraft:launch', profileId),
  getVersions: () => ipcRenderer.invoke('minecraft:versions'),
  installFabric: (version) => ipcRenderer.invoke('minecraft:installFabric', version),
  installForge: (version) => ipcRenderer.invoke('minecraft:installForge', version),

  // Modrinth
  searchMods: (query, opts) => ipcRenderer.invoke('modrinth:search', query, opts),
  getModVersions: (pid, gv, loader) => ipcRenderer.invoke('modrinth:getVersions', pid, gv, loader),
  downloadMod: (vid, pid) => ipcRenderer.invoke('modrinth:download', vid, pid),

  // Java
  detectJava: () => ipcRenderer.invoke('java:detect'),
  getOptimalArgs: (ram) => ipcRenderer.invoke('java:getOptimalArgs', ram),

  // FS
  openFolder: (profileId) => ipcRenderer.invoke('fs:openFolder', profileId),
  getProfileMods: (profileId) => ipcRenderer.invoke('fs:getProfileMods', profileId),
  deleteMod: (profileId, modFile) => ipcRenderer.invoke('fs:deleteMod', profileId, modFile),
  selectJava: () => ipcRenderer.invoke('dialog:selectJava'),

  // Store
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, val) => ipcRenderer.invoke('store:set', key, val),

  // System info (safe exposure)
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,

  // Events
  on: (channel, callback) => {
    const validChannels = ['minecraft:log', 'minecraft:progress', 'modrinth:downloadProgress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

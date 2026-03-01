const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
const isDev = process.argv.includes('--dev');

const auth = require('./auth');
const minecraft = require('./minecraft');
const modrinth = require('./modrinth');
const profiles = require('./profiles');
const java = require('./java');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 1000,
    minHeight: 650,
    frame: false,
    backgroundColor: '#1a0a12',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const htmlFile = isDev
    ? path.join(__dirname, '../../src/renderer/index.html')
    : path.join(__dirname, '../../dist/index.html');

  mainWindow.loadFile(htmlFile);
  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// Window controls
ipcMain.on('window:minimize', () => mainWindow.minimize());
ipcMain.on('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window:close', () => mainWindow.close());

// Auth
ipcMain.handle('auth:microsoft', async () => { try { return await auth.loginMicrosoft(mainWindow); } catch(e) { return {error: e.message}; } });
ipcMain.handle('auth:offline', async (_, username) => { try { return auth.loginOffline(username); } catch(e) { return {error: e.message}; } });
ipcMain.handle('auth:logout', () => { store.delete('account'); return {success:true}; });
ipcMain.handle('auth:getAccount', () => store.get('account', null));
ipcMain.handle('auth:saveAccount', (_, account) => { store.set('account', account); return {success:true}; });

// Profiles
ipcMain.handle('profiles:list', () => profiles.list());
ipcMain.handle('profiles:create', (_, data) => profiles.create(data));
ipcMain.handle('profiles:delete', (_, id) => profiles.delete(id));
ipcMain.handle('profiles:update', (_, id, data) => profiles.update(id, data));
ipcMain.handle('profiles:get', (_, id) => profiles.get(id));

// Minecraft launch
ipcMain.handle('minecraft:launch', async (_, profileId) => {
  try {
    const account = store.get('account');
    if (!account) throw new Error('Войдите в аккаунт перед запуском');
    const profile = profiles.get(profileId);
    if (!profile) throw new Error('Профиль не найден');
    await minecraft.launch(profile, account,
      (data) => mainWindow?.webContents.send('minecraft:log', data),
      (progress) => mainWindow?.webContents.send('minecraft:progress', progress)
    );
    return {success: true};
  } catch(e) { return {error: e.message}; }
});

ipcMain.handle('minecraft:versions', async () => { try { return await minecraft.getVersions(); } catch(e) { return {error:e.message}; } });
ipcMain.handle('minecraft:installFabric', async (_, version) => { try { await minecraft.installFabric(version, (p) => mainWindow?.webContents.send('minecraft:progress', p)); return {success:true}; } catch(e) { return {error:e.message}; } });
ipcMain.handle('minecraft:installForge', async (_, version) => { try { await minecraft.installForge(version, (p) => mainWindow?.webContents.send('minecraft:progress', p)); return {success:true}; } catch(e) { return {error:e.message}; } });

// Modrinth
ipcMain.handle('modrinth:search', async (_, query, opts) => { try { return await modrinth.search(query, opts); } catch(e) { return {error:e.message}; } });
ipcMain.handle('modrinth:getVersions', async (_, pid, gv, loader) => { try { return await modrinth.getVersions(pid, gv, loader); } catch(e) { return {error:e.message}; } });
ipcMain.handle('modrinth:download', async (_, vid, pid) => { try { await modrinth.download(vid, pid, (p) => mainWindow?.webContents.send('modrinth:downloadProgress', p)); return {success:true}; } catch(e) { return {error:e.message}; } });

// Java
ipcMain.handle('java:detect', async () => java.detect());
ipcMain.handle('java:getOptimalArgs', (_, ram) => java.getOptimalArgs(ram));

// FS
ipcMain.handle('fs:openFolder', (_, profileId) => shell.openPath(profiles.getPath(profileId)));
ipcMain.handle('fs:getProfileMods', (_, profileId) => profiles.getMods(profileId));
ipcMain.handle('fs:deleteMod', (_, profileId, modFile) => profiles.deleteMod(profileId, modFile));
ipcMain.handle('dialog:selectJava', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{name:'Java',extensions:['exe','']}] });
  return r.canceled ? null : r.filePaths[0];
});

// Store
ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, val) => { store.set(key, val); return true; });

import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { config } from 'dotenv'
import { libraryStore } from './lib/library-store'
import { folderStore } from './lib/folder-store'
import { settingsStore } from './lib/settings-store'
import { registerAllHandlers } from './ipc/index'
import { seedDemoIfNeeded } from './lib/demo-seeder'

// Load .env from project root (dev) or resources dir (packaged)
config({ path: app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../.env'),
})

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'music',
    privileges: {
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
    },
  },
])

// Single instance lock — prevent multiple app windows
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    return
  }
  createWindow()
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow

  const devIconPath = app.isPackaged ? null : path.join(__dirname, '../build/icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d1117',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    ...(devIconPath ? { icon: devIconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })

  return mainWindow
}

app.whenReady().then(() => {
  // music:// → local file proxy with streaming support
  protocol.handle('music', (request) => {
    const rawPath = request.url.replace('music://localhost/', '')
    const filePath = decodeURIComponent(rawPath)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  settingsStore.init(app.getPath('userData'))
  const savedKey = settingsStore.get().openaiApiKey
  if (savedKey) process.env.OPENAI_API_KEY = savedKey

  const libraryPath = path.join(app.getPath('userData'), 'library')

  const demoLibraryPath = app.isPackaged
    ? path.join(process.resourcesPath, 'demo-library')
    : path.join(__dirname, '..', 'resources', 'demo-library')
  seedDemoIfNeeded(libraryPath, demoLibraryPath)

  libraryStore.init(libraryPath)
  folderStore.init(libraryPath)

  registerAllHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Security: block all navigation and new window requests
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

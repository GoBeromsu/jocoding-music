import { registerLibraryHandlers } from './library'
import { registerPlayerHandlers } from './player'
import { registerUrlImportHandlers } from './url-import'
import { registerSettingsHandlers } from './settings'
import { registerDashboardHandlers } from './dashboard'
import { registerDevHandlers } from './dev'
import { registerFolderHandlers } from './folders'
import { registerObsidianHandlers } from './obsidian'

export function registerAllHandlers(): void {
  registerLibraryHandlers()
  registerPlayerHandlers()
  registerUrlImportHandlers()
  registerSettingsHandlers()
  registerDashboardHandlers()
  registerDevHandlers()
  registerFolderHandlers()
  registerObsidianHandlers()
}

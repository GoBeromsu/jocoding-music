import { registerLibraryHandlers } from './library'
import { registerPlayerHandlers } from './player'
import { registerObsidianHandlers } from './obsidian'
import { registerUrlImportHandlers } from './url-import'
import { registerSettingsHandlers } from './settings'

export function registerAllHandlers(): void {
  registerLibraryHandlers()
  registerPlayerHandlers()
  registerObsidianHandlers()
  registerUrlImportHandlers()
  registerSettingsHandlers()
}

import { registerLibraryHandlers } from './library'
import { registerPlayerHandlers } from './player'
import { registerObsidianHandlers } from './obsidian'
import { registerUrlImportHandlers } from './url-import'

export function registerAllHandlers(): void {
  registerLibraryHandlers()
  registerPlayerHandlers()
  registerObsidianHandlers()
  registerUrlImportHandlers()
}

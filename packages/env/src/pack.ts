/** The functions that the other packages import. The class behind them is Catalog. */
import { Catalog, type Plugin } from './catalog.ts'

export { Catalog, type PackManifest, type Plugin, readManifest } from './catalog.ts'

export const availablePacks = (): Map<string, Plugin> => new Map(Catalog.load().all().map(p => [p.manifest.name, p]))

export const pluginDir = (name: string): string => Catalog.load().dirOf(name)

import { Plugin } from "obsidian";
import type { ISettingsRepository } from "../../domain/repositories/ISettingsRepository";
import type { ReflexumSettings } from "../../domain/entities/Settings";
import { DEFAULT_SETTINGS } from "../../domain/entities/Settings";

export class ObsidianSettingsRepository implements ISettingsRepository {
  constructor(private plugin: Plugin) {}

  async load(): Promise<ReflexumSettings> {
    return Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
  }

  async save(settings: ReflexumSettings): Promise<void> {
    await this.plugin.saveData(settings);
  }
}

import type { ReflexumSettings } from '../entities/Settings';

export interface ISettingsRepository {
  load(): Promise<ReflexumSettings>;
  save(settings: ReflexumSettings): Promise<void>;
}

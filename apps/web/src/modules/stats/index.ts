// Solo lo que consumen `game-host` y `app/` (evita ciclos): ver la regla de dependencias entre módulos.
export { statsKeys } from './api/my-stats';
export type { MyStats, StatsHistoryEntry } from './api/my-stats';
export { useInvalidateStatsOnDayChange } from './api/use-invalidate-stats-on-day-change';

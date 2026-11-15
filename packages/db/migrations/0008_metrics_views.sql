-- Drizzle no genera vistas: métricas del admin calculadas al consultar y sin "hoy"; la api completa d1/d7 y la racha viva con su reloj (ADR-014, REQ-011).
CREATE VIEW metrics_daily_players AS
SELECT date, game_id, count(DISTINCT player_id)::int AS players
FROM plays
GROUP BY GROUPING SETS ((date, game_id), (date));
--> statement-breakpoint
CREATE VIEW metrics_retention AS
WITH completed AS (
  SELECT DISTINCT player_id, date FROM plays WHERE status IN ('won','lost','voided')
),
cohort AS (
  SELECT player_id, min(date) AS cohort_date FROM completed GROUP BY player_id
)
SELECT c.cohort_date,
       count(*)::int AS cohort_size,
       count(d1.player_id)::int AS d1_players,
       count(d7.player_id)::int AS d7_players
FROM cohort c
LEFT JOIN completed d1 ON d1.player_id = c.player_id AND d1.date = c.cohort_date + 1
LEFT JOIN completed d7 ON d7.player_id = c.player_id AND d7.date = c.cohort_date + 7
GROUP BY c.cohort_date;
--> statement-breakpoint
CREATE VIEW metrics_streak_distribution AS
SELECT CASE WHEN coalesce(s.global_streak, 0) = 0 THEN '0'
            WHEN s.global_streak = 1 THEN '1'
            WHEN s.global_streak <= 6 THEN '2-6'
            WHEN s.global_streak <= 29 THEN '7-29'
            ELSE '30+' END AS bucket,
       s.last_active_date,
       count(*)::int AS players
FROM players p
LEFT JOIN player_stats s ON s.player_id = p.id
GROUP BY 1, 2;
--> statement-breakpoint
-- Plays y reportes se preagregan por separado: un JOIN directo multiplicaría started por reports.
CREATE VIEW metrics_challenge_quality AS
SELECT c.id AS challenge_id,
       c.game_id,
       c.date,
       c.number,
       coalesce(p.started, 0) AS started,
       coalesce(p.finished, 0) AS finished,
       p.finished::float8 / NULLIF(p.started, 0) AS completion_rate,
       p.won::float8 / NULLIF(p.finished, 0) AS win_rate,
       coalesce(r.reports, 0) AS reports,
       c.status
FROM challenges c
LEFT JOIN (
  SELECT challenge_id,
         count(*)::int AS started,
         count(*) FILTER (WHERE status IN ('won','lost'))::int AS finished,
         count(*) FILTER (WHERE status = 'won')::int AS won
  FROM plays
  GROUP BY challenge_id
) p ON p.challenge_id = c.id
LEFT JOIN (
  SELECT challenge_id, count(*)::int AS reports
  FROM challenge_reports
  GROUP BY challenge_id
) r ON r.challenge_id = c.id
WHERE c.status IN ('published','voided');
--> statement-breakpoint
-- Drizzle no genera GRANT: la api solo lee las métricas; el generator no tiene acceso (ADR-004, ADR-014).
GRANT SELECT ON metrics_daily_players, metrics_retention, metrics_streak_distribution, metrics_challenge_quality TO nerdose_api;

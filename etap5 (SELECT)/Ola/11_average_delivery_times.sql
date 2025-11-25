-- Prepare once
PREPARE courier_stats(timestamp, timestamp, int, int, int) AS
WITH delivery_times AS (
    SELECT
        c.courier_id,
        u.name,
        u.surname,
        oid.id AS delivery_id,
        EXTRACT(EPOCH FROM (oid.delivered_at - oid.began_at)) / 60 AS delivery_minutes
    FROM courier AS c
    JOIN "user" AS u ON c.courier_id = u.user_id
    JOIN order_item_delivery AS oid ON c.courier_id = oid.courier_id
      AND oid.began_at IS NOT NULL
      AND oid.delivered_at IS NOT NULL
      AND oid.delivered_at >= $1
      AND oid.delivered_at <  $2
)
SELECT
    d.courier_id,
    d.name,
    d.surname,
    COUNT(d.delivery_id) AS total_deliveries,
    ROUND(AVG(d.delivery_minutes), 2) AS average_time,

    ROUND(100.0 * COUNT(*) FILTER (WHERE d.delivery_minutes <= $3) / COUNT(*), 1) AS percent_1,
    ROUND(100.0 * COUNT(*) FILTER (WHERE d.delivery_minutes > $3 AND d.delivery_minutes <= $4) / COUNT(*), 1) AS percent_2,
    ROUND(100.0 * COUNT(*) FILTER (WHERE d.delivery_minutes > $4 AND d.delivery_minutes <= $5) / COUNT(*), 1) AS percent_3,
    ROUND(100.0 * COUNT(*) FILTER (WHERE d.delivery_minutes > $5) / COUNT(*), 1) AS percent_over


FROM delivery_times d
WHERE $3 < $4 AND $4 < $5
GROUP BY d.courier_id, d.name, d.surname
ORDER BY average_time DESC;

EXPLAIN ANALYZE EXECUTE courier_stats('2025-10-01', '2025-11-01', 30, 60, 90);

DEALLOCATE courier_stats;
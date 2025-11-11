WITH delivery_times AS (
    SELECT
        c.courier_id,
        u.name,
		u.surname,
        oid.id AS delivery_id,
        EXTRACT(EPOCH FROM (oid.delivered_at - oid.began_at)) / 60 AS delivery_minutes
    FROM courier AS c
    JOIN "user" AS u ON c.courier_id=u.user_id
    JOIN order_item_delivery AS oid ON c.courier_id=oid.courier_id
    WHERE oid.delivered_at IS NOT NULL
      AND oid.began_at IS NOT NULL
)
SELECT
    courier_id,
    name,
	surname,
    COUNT(delivery_id) AS total_deliveries,
	ROUND((SUM(delivery_minutes) / COUNT(*)), 2) AS average_time,

    ROUND(100.0 * SUM(CASE WHEN delivery_minutes <= 30 THEN 1 ELSE 0 END) / COUNT(*), 1) AS percent_under_30min,
    ROUND(100.0 * SUM(CASE WHEN delivery_minutes BETWEEN 31 AND 60 THEN 1 ELSE 0 END) / COUNT(*), 1) AS percent_31_60min,
    ROUND(100.0 * SUM(CASE WHEN delivery_minutes BETWEEN 61 AND 90 THEN 1 ELSE 0 END) / COUNT(*), 1) AS percent_61_90min,
    ROUND(100.0 * SUM(CASE WHEN delivery_minutes > 90 THEN 1 ELSE 0 END) / COUNT(*), 1) AS percent_over_90min

FROM delivery_times
GROUP BY courier_id, name, surname
ORDER BY average_time DESC;

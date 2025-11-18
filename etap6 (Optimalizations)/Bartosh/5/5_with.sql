EXPLAIN ANALYZE WITH next_placements AS (
	SELECT 
		customer_id,
		placed_at,
		LEAD(placed_at) OVER (PARTITION BY customer_id ORDER BY placed_at, order_id) AS next_placed
	FROM "order"
)
SELECT 
	np.customer_id, 
	u.name,
	u.surname,
	AVG(np.next_placed - np.placed_at) AS avg_time_diff_raw,
	to_char(AVG(np.next_placed - np.placed_at), 'DD "days" HH24 "hours"') AS avg_time_diff
FROM next_placements AS np
JOIN customer AS c ON c.customer_id = np.customer_id
JOIN "user" AS u ON u.user_id = c.user_id
WHERE np.next_placed IS NOT NULL
GROUP BY np.customer_id, u.user_id
ORDER BY avg_time_diff_raw DESC;
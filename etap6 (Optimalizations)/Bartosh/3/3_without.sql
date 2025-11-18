EXPLAIN ANALYZE SELECT 
	to_char(placed_at, 'YYYY "Q"Q') AS quarter_label,
	COUNT(*) AS orders_count
FROM "order"
GROUP BY quarter_label
ORDER BY quarter_label DESC;
WITH order_prices AS (
	SELECT o.order_id, SUM(c.price) AS order_price
	FROM "order" AS o
	JOIN order_item AS oi ON o.order_id = oi.order_id
	JOIN course_in_order_item AS cioi ON oi.order_item_id = cioi.order_item_id
	JOIN course AS c ON c.course_id = cioi.course_id
	GROUP BY o.order_id
),
order_sizes AS (
	SELECT 
		CASE
			WHEN order_price > 3000 THEN 'large'
			WHEN order_price > 1800 THEN 'medium'
			ELSE 'small'
		END AS order_size
	FROM order_prices
)
SELECT order_size, COUNT(*)
FROM order_sizes
GROUP BY order_size
ORDER BY array_position(ARRAY['small','medium','large'], order_size);
SELECT 
	cu.customer_id, 
	u.name, 
	u.surname,
	MAX(ord.placed_at) AS last_order_date,
    CURRENT_DATE - MAX(ord.placed_at) AS days_since_last_order
FROM customer cu
JOIN "user" AS u ON cu.customer_id=u.user_id
LEFT JOIN "order" AS ord ON cu.customer_id=ord.customer_id
GROUP BY cu.customer_id, u.name, u.surname
ORDER BY days_since_last_order DESC NULLS FIRST;
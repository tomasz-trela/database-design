EXPLAIN ANALYZE SELECT 
	c.customer_id, 
	u.name || ' ' || u.surname AS customer, 
	COUNT(ca.address_id) AS addresses_count
FROM customer AS c
JOIN "user" AS u ON u.user_id = c.user_id
LEFT JOIN customer_address as ca ON ca.customer_id = c.customer_id
GROUP BY c.customer_id, u.user_id
ORDER BY addresses_count DESC;
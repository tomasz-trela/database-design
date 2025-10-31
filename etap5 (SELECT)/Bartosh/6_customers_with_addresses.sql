SELECT 
	c.customer_id, 
	u.name || ' ' || u.surname AS customer, 
	COUNT(a.address_id) AS addresses_count
FROM customer AS c
JOIN "user" AS u ON u.user_id = c.user_id
LEFT JOIN customer_address ON customer_address.customer_id = c.customer_id
LEFT JOIN address AS a ON (a.address_id = customer_address.address_id)
GROUP BY c.customer_id, u.user_id;
-- ORDER BY "addresses count" DESC;
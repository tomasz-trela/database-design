SELECT
    u.name AS customer_name,
    u.surname AS customer_surname,
    SUM(o.gross_total) AS gross_total
FROM "order" o
JOIN customer c ON c.customer_id = o.customer_id
JOIN "user" u ON u.user_id = c.user_id
WHERE o.placed_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY c.customer_id, u.name, u.surname
ORDER BY gross_total DESC;

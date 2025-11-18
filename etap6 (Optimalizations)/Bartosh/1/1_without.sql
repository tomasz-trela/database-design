
EXPLAIN ANALYZE SELECT c.name, COUNT(*) AS course_count 
FROM course_in_order_item AS cio
JOIN course AS c ON cio.course_id = c.course_id
GROUP BY c.course_id
ORDER BY course_count DESC, c.name ASC
LIMIT 20 
OFFSET 40;

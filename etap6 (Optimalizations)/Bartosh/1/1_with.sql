EXPLAIN ANALYZE
SELECT c.name, ci.course_count
FROM (
  SELECT course_id, COUNT(*) AS course_count
  FROM course_in_order_item
  GROUP BY course_id
) AS ci
JOIN course AS c ON ci.course_id = c.course_id
ORDER BY ci.course_count DESC, c.name ASC
LIMIT 20
OFFSET 40;
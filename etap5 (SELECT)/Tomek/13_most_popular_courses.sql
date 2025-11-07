SELECT
    c.name AS dish_name,
    COUNT(*) AS times_ordered
FROM course c
JOIN course_in_order_item cioi ON c.course_id = cioi.course_id
GROUP BY c.course_id, c.name
ORDER BY times_ordered DESC;
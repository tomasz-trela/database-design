SELECT
    c1.name AS course_1,
    c2.name AS course_2,
    COUNT(*) AS frequency
FROM course_in_order_item cioi1
JOIN course_in_order_item cioi2
    ON cioi1.order_item_id = cioi2.order_item_id
    AND cioi1.course_id < cioi2.course_id
JOIN course c1 ON cioi1.course_id = c1.course_id
JOIN course c2 ON cioi2.course_id = c2.course_id
GROUP BY
    c1.name,
    c2.name
ORDER BY
    frequency DESC
LIMIT 10;

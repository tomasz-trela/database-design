SELECT 
    c.course_id,
    c.name AS course_name, 
    COUNT(com.complaint_id) AS complaint_count,
    COUNT(com.complaint_id) FILTER (WHERE com.resolution_date IS NOT NULL) AS num_of_resolved,
    COUNT(com.complaint_id) FILTER (WHERE com.resolution_date IS NULL) AS num_of_unresolved,
	COALESCE(ROUND(AVG(com.refund_amount), 2), 0) AS average_refund
FROM course c
LEFT JOIN course_in_order_item AS cio ON c.course_id=cio.course_id
LEFT JOIN complaint AS com ON cio.id=com.course_in_order_id
GROUP BY c.course_id, c.name
ORDER BY complaint_count ASC, c.name ASC;


-- Efektywniejsze podejście
WITH complaint_agg AS (
    SELECT
        cio.course_id,
        COUNT(*) AS complaint_count,
        COUNT(*) FILTER (WHERE com.resolution_date IS NOT NULL) AS num_of_resolved,
        COUNT(*) FILTER (WHERE com.resolution_date IS NULL) AS num_of_unresolved,
        COALESCE(ROUND(AVG(com.refund_amount), 2), 0) AS average_refund
    FROM complaint com
    JOIN course_in_order_item cio ON com.course_in_order_id = cio.id
    GROUP BY cio.course_id
)
SELECT
    c.course_id,
    c.name AS course_name,
    COALESCE(ca.complaint_count, 0) AS complaint_count,
    COALESCE(ca.num_of_resolved, 0) AS num_of_resolved,
    COALESCE(ca.num_of_unresolved, 0) AS num_of_unresolved,
    COALESCE(ca.average_refund, 0) AS average_refund
FROM course c
LEFT JOIN complaint_agg ca ON c.course_id = ca.course_id
ORDER BY complaint_count ASC, c.name ASC;
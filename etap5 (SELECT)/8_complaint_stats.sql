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

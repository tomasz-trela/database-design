SELECT 
    EXTRACT(ISODOW FROM o.placed_at) AS day_number,
    TO_CHAR(o.placed_at, 'Dy') AS day_of_week, 
    CASE 
        WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 6 AND 11 THEN 'morning' 
        WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 12 AND 16 THEN 'afternoon' 
        WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 17 AND 21 THEN 'evening' 
        ELSE 'night' 
    END AS time_of_day, 
    COUNT(*) AS total_orders 
FROM "order" o 
GROUP BY 
    EXTRACT(ISODOW FROM o.placed_at), day_of_week, time_of_day 
ORDER BY 
    day_number, total_orders DESC;

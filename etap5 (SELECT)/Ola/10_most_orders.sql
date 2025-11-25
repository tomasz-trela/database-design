WITH base AS (
    SELECT
        EXTRACT(ISODOW FROM o.placed_at) AS day_number,
        TO_CHAR(o.placed_at, 'Dy') AS day_of_week,
        CASE 
            WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 6 AND 11 THEN 'morning'
            WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 12 AND 16 THEN 'afternoon'
            WHEN EXTRACT(HOUR FROM o.placed_at) BETWEEN 17 AND 21 THEN 'evening'
            ELSE 'night'
        END AS time_of_day,
        c.name AS dish_name,
        c.price
    FROM "order" o
    JOIN order_item oi ON oi.order_id = o.order_id
    JOIN course_in_order_item ciot ON ciot.order_item_id = oi.order_item_id
    JOIN course c ON c.course_id = ciot.course_id
),
stats AS (
    SELECT
        day_number,
        day_of_week,
        time_of_day,
        COUNT(*) AS total_orders,
        ROUND(AVG(price), 2) AS avg_price,
        MIN(price) AS min_price,
        MAX(price) AS max_price
    FROM base
    GROUP BY day_number, day_of_week, time_of_day
),
popular AS (
    SELECT DISTINCT ON (day_number, time_of_day)
        day_number,
        time_of_day,
        dish_name AS most_popular_dish,
        COUNT(*) AS times_ordered
    FROM base
    GROUP BY day_number, time_of_day, dish_name
    ORDER BY day_number, time_of_day, COUNT(*) DESC
)
SELECT
    s.day_number,
    s.day_of_week,
    s.time_of_day,
    s.total_orders,
    s.avg_price,
    s.min_price,
    s.max_price,
    p.most_popular_dish,
    p.times_ordered
FROM stats s
JOIN popular p 
    ON s.day_number = p.day_number AND s.time_of_day = p.time_of_day
ORDER BY s.day_number, s.time_of_day;

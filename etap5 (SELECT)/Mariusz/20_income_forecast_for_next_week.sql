WITH DateSeries AS (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 days',
        '1 day'::interval
    )::date AS forecast_date
)
SELECT
    ds.forecast_date,
    COALESCE(SUM(c.price), 0.00) AS projected_revenue
FROM DateSeries ds
LEFT JOIN order_item oi ON oi.expected_delivery_at::date = ds.forecast_date
LEFT JOIN "order" o ON oi.order_id = o.order_id
LEFT JOIN invoice i ON o.order_id = i.order_id AND i.status = 'paid'
LEFT JOIN course_in_order_item cioi ON oi.order_item_id = cioi.order_item_id
LEFT JOIN course c ON cioi.course_id = c.course_id
WHERE
    i.id IS NOT NULL OR (oi.order_item_id IS NULL)
GROUP BY
    ds.forecast_date
ORDER BY
    ds.forecast_date ASC;

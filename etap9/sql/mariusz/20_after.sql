WITH DateSeries AS (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 days',
        '1 day'::interval
    )::date AS forecast_date
)
SELECT
    ds.forecast_date,
    COALESCE(SUM(ioi.gross_total), 0.00) AS projected_revenue
FROM DateSeries ds
LEFT JOIN order_item oi ON oi.expected_delivery_at::date = ds.forecast_date
LEFT JOIN course_in_order_item cioi ON oi.order_item_id = cioi.order_item_id
LEFT JOIN invoice_order_item ioi ON cioi.id = ioi.course_in_order_item_id
LEFT JOIN invoice i
    ON ioi.invoice_id = i.id
    AND i.status = 'paid'
WHERE
    i.id IS NOT NULL OR ds.forecast_date IS NOT NULL
GROUP BY
    ds.forecast_date
ORDER BY
    ds.forecast_date ASC;

WITH daily_workload AS (
    SELECT
        completed_at::date AS completion_date,
        COUNT(order_item_id) AS items_completed
    FROM
        order_item_fulfillment
    WHERE
        completed_at IS NOT NULL
    GROUP BY
        completion_date
),
workload_median AS (
    SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY items_completed) AS median_items
    FROM
        daily_workload
)
SELECT
    dw.completion_date,
    dw.items_completed,
    ROUND(wm.median_items::numeric, 2) AS median_daily_items,
    (dw.items_completed - wm.median_items) AS deviation_from_median,
    CASE
        WHEN wm.median_items > 0 THEN
            ROUND((((dw.items_completed - wm.median_items) / wm.median_items) * 100)::numeric, 2)

    END AS deviation_percentage
FROM
    daily_workload dw,
    workload_median wm
ORDER BY
    deviation_from_median DESC;
WITH
speed AS (
    SELECT
        cook_id,
        AVG(EXTRACT(EPOCH FROM (completed_at - began_at))) AS avg_seconds
    FROM order_item_fulfillment
    WHERE completed_at IS NOT NULL
    GROUP BY cook_id
),
total_items AS (
    SELECT
        oif.cook_id,
        COUNT(DISTINCT oi.order_item_id) AS total_order_items
    FROM order_item oi
    JOIN order_item_fulfillment oif ON oi.order_item_id = oif.order_item_id
    GROUP BY oif.cook_id
),
complaint_count AS (
    SELECT
        cook.cook_id,
        u.name,
        u.surname,
        COUNT(*) AS complaints
    FROM complaint
    JOIN course_in_order_item coi ON complaint.course_in_order_id = coi.id
    JOIN order_item oi ON coi.order_item_id = oi.order_item_id
    JOIN order_item_fulfillment oif ON oi.order_item_id = oif.order_item_id
    JOIN cook ON oif.cook_id = cook.cook_id
    JOIN "user" u ON cook.cook_id = u.user_id
    GROUP BY cook.cook_id, u.name, u.surname
),
cook_scores AS (
    SELECT
        u.name,
        u.surname,
        s.avg_seconds,
        t.total_order_items,
        COALESCE(c.complaints, 0) AS complaints,
        ROUND(1 - COALESCE(c.complaints, 0)::numeric / t.total_order_items, 3) AS quality_score,
        ROUND((1 - (s.avg_seconds / (SELECT MAX(avg_seconds) FROM speed))) * 0.4
            + (1 - COALESCE(c.complaints, 0)::numeric / t.total_order_items) * 0.6, 3) AS performance_score
    FROM total_items t
    JOIN speed s ON t.cook_id = s.cook_id
    JOIN cook ck ON t.cook_id = ck.cook_id
    JOIN "user" u ON ck.cook_id = u.user_id
    LEFT JOIN complaint_count c ON t.cook_id = c.cook_id
)
SELECT
    name,
    surname,
    avg_seconds,
    total_order_items,
    complaints,
    quality_score,
    performance_score,
    ROUND((quality_score + performance_score) / 2, 3) AS overall_score
FROM cook_scores
ORDER BY overall_score DESC;
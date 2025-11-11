WITH ComplainedOrderItems AS (
    SELECT DISTINCT course_in_order_id
    FROM complaint
    WHERE status != 'negatively resolved'
),
IngredientCounts AS (
    SELECT
        ing.ingredient_id,
        ing.name,
        cioi.id AS course_in_order_item_id,
        (cioi.id IN (SELECT course_in_order_id FROM ComplainedOrderItems)) AS is_complained
    FROM ingredient ing
    JOIN course_ingredient ci ON ing.ingredient_id = ci.ingredient_id
    JOIN course c ON ci.course_id = c.course_id
    JOIN course_in_order_item cioi ON c.course_id = cioi.course_id
)
SELECT
    name AS ingredient_name,
    COUNT(*) AS total_sold_in_items,
    COUNT(*) FILTER (WHERE is_complained = TRUE) AS total_complained_items,
    ROUND(
        (COUNT(*) FILTER (WHERE is_complained = TRUE)::numeric / COUNT(*)::numeric) * 100,
        2
    ) AS complaint_rate_percent
FROM IngredientCounts
GROUP BY
    name
HAVING
    COUNT(*) > 50
ORDER BY
    complaint_rate_percent DESC,
    total_complained_items DESC
LIMIT 10;

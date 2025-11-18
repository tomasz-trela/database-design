EXPLAIN ANALYZE WITH addr_counts AS (
  SELECT
    c.customer_id,
    COUNT(a.address_id) AS addr_count
  FROM customer AS c
  LEFT JOIN customer_address AS ca ON ca.customer_id = c.customer_id
  LEFT JOIN address AS a ON a.address_id = ca.address_id
  GROUP BY c.customer_id
)

SELECT
  ROUND(AVG(addr_count), 2) AS average,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY addr_count) AS median,
  MAX(addr_count) as most
FROM addr_counts;

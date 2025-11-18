EXPLAIN ANALYZE WITH addr_counts AS (
	SELECT
	    c.customer_id,
	    COALESCE(ca.addr_count, 0) AS addr_count
	FROM customer AS c
	LEFT JOIN (
	    SELECT
	      customer_id,
	      COUNT(*) AS addr_count
	    FROM customer_address
	    GROUP BY customer_id
	) AS ca ON ca.customer_id = c.customer_id
)

SELECT
	ROUND(AVG(addr_count), 2) AS average,
	percentile_cont(0.5) WITHIN GROUP (ORDER BY addr_count) AS median,
	MAX(addr_count) as most
FROM addr_counts;

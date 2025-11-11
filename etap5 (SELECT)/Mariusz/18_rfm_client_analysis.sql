WITH CustomerData AS (
    SELECT
        c.customer_id,
        u.name,
        u.email,
        CURRENT_DATE - MAX(o.placed_at)::date AS recency,
        COUNT(DISTINCT o.order_id) AS frequency,
        COALESCE(SUM(o.gross_total), 0) AS monetary
    FROM customer c
    JOIN "user" u ON c.user_id = u.user_id
    LEFT JOIN "order" o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, u.name, u.email
),
RFM_Scores AS (
    SELECT
        customer_id,
        name,
        email,
        recency,
        frequency,
        monetary,
        NTILE(4) OVER (ORDER BY recency DESC) AS r_score,
        NTILE(4) OVER (ORDER BY frequency ASC) AS f_score,
        NTILE(4) OVER (ORDER BY monetary ASC) AS m_score
    FROM CustomerData
    WHERE frequency > 0
)
SELECT
    name,
    email,
    recency,
    frequency,
    monetary,
    r_score::text || f_score::text || m_score::text AS rfm_segment,
    CASE
        WHEN r_score = 1 AND f_score = 1 AND m_score = 1 THEN 'Mistrzowie'
        WHEN r_score = 4 AND f_score = 1 AND m_score = 1 THEN 'Lojalni, zagrożeni'
        WHEN r_score = 1 THEN 'Nowi/Niedawni'
        WHEN r_score = 4 THEN 'Utraceni'
        WHEN f_score = 4 THEN 'Jednorazowi'
        ELSE 'Pozostali'
    END AS segment_label
FROM RFM_Scores
ORDER BY
    r_score ASC, f_score ASC, m_score ASC;

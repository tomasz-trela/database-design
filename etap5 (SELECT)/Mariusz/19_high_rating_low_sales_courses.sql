WITH CourseSales AS (
    SELECT
        course_id,
        COUNT(*) AS total_sales_count
    FROM course_in_order_item
    GROUP BY course_id
),
CourseRatings AS (
    SELECT
        course_id,
        AVG(rating) AS avg_rating,
        COUNT(opinion_id) AS total_rating_count
    FROM opinion
    GROUP BY course_id
    HAVING COUNT(opinion_id) >= 5
),
RankedCourses AS (
    SELECT
        c.course_id,
        c.name,
        COALESCE(cs.total_sales_count, 0) AS total_sales,
        cr.avg_rating,
        cr.total_rating_count,
        NTILE(4) OVER (ORDER BY COALESCE(cs.total_sales_count, 0) DESC) AS sales_quartile,
        NTILE(4) OVER (ORDER BY cr.avg_rating DESC) AS rating_quartile
    FROM course c
    LEFT JOIN CourseSales cs ON c.course_id = cs.course_id
    JOIN CourseRatings cr ON c.course_id = cr.course_id
)
SELECT
    name,
    total_sales,
    ROUND(avg_rating, 2) AS average_rating,
    total_rating_count
FROM RankedCourses
WHERE
    rating_quartile = 1
    AND sales_quartile = 4
ORDER BY
    avg_rating DESC, total_sales ASC;

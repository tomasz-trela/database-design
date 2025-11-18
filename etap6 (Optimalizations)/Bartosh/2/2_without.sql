EXPLAIN ANALYZE SELECT UPPER(status) FROM (
	SELECT name AS status FROM order_item_fulfillment_status
	UNION ALL
	SELECT name FROM order_item_delivery_status
	UNION ALL
	SELECT unnest(enum_range(NULL::order_status))::text
	UNION ALL
	SELECT unnest(enum_range(NULL::complaint_status))::text
	UNION ALL
	SELECT unnest(enum_range(NULL::invoice_status))::text
) AS status;
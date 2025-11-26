    -- Tomek

    CREATE INDEX IF NOT EXISTS idx_order_customer_id
        ON "order"(customer_id);

    CREATE INDEX IF NOT EXISTS idx_customer_user_id
        ON customer(user_id);

    -- Mariusz

    CREATE INDEX IF NOT EXISTS idx_order_item_fulfillment_cook_id
        ON order_item_fulfillment(cook_id);

    CREATE INDEX IF NOT EXISTS idx_order_item_fulfillment_status_id
        ON order_item_fulfillment(status_id);

    CREATE INDEX IF NOT EXISTS idx_order_item_delivery_courier_id
        ON order_item_delivery(courier_id);

    CREATE INDEX IF NOT EXISTS idx_order_item_delivery_status_id
        ON order_item_delivery(status_id);

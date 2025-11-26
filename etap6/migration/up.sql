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

    -- Ola
    CREATE INDEX IF NOT EXISTS idx_complaint_customer_id
        ON complaint(customer_id);
        
    CREATE INDEX IF NOT EXISTS idx_complaint_course_in_order_id
        ON complaint(course_in_order_id);

    CREATE INDEX IF NOT EXISTS idx_complaint_status
        ON complaint(status);

    CREATE INDEX IF NOT EXISTS idx_meal_plan_dietician_id
        ON meal_plan(dietician_id);

    CREATE INDEX IF NOT EXISTS idx_meal_plan_day_meal_plan_id
        ON meal_plan_day(meal_plan_id);

    CREATE INDEX IF NOT EXISTS idx_meal_plan_item_meal_plan_day_id
        ON meal_plan_item(meal_plan_day_id);
    
    CREATE INDEX IF NOT EXISTS idx_meal_plan_item_course_id
        ON meal_plan_item(course_id);

    CREATE INDEX IF NOT EXISTS idx_daily_menu_dietician_id
        ON daily_menu(dietician_id);

    CREATE INDEX IF NOT EXISTS idx_daily_menu_item_menu_id
        ON daily_menu_item(menu_id);
    
    CREATE INDEX IF NOT EXISTS idx_daily_menu_item_course_id
        ON daily_menu_item(course_id);

    CREATE INDEX IF NOT EXISTS idx_course_category_course_id
        ON course_category(course_id);

    CREATE INDEX IF NOT EXISTS idx_course_category_category_id
        ON course_category(category_id);
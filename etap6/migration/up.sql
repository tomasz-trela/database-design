    CREATE INDEX IF NOT EXISTS idx_order_customer_id 
        ON "order"(customer_id);

    CREATE INDEX IF NOT EXISTS idx_customer_user_id 
        ON customer(user_id);
        

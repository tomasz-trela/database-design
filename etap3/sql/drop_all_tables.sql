DROP TABLE IF EXISTS
    complaint,
    customer,
    "order",
    order_item,
    address,
	customer_address,
    invoice,
    course,
    course_in_order_item,
    "user",
    invoice_item,
    allergen,
    preference,
    opinion,
    ingredient,
    course_ingredient,
    allergen_customer,
    allergen_ingredient,
    category,
    course_category,
    meal_plan,
    meal_plan_day,
    meal_plan_item,
    dietician,
    daily_menu,
    daily_menu_item,
    order_item_fulfillment,
    order_item_fulfillment_status,
    order_item_delivery,
    order_item_delivery_status,
    cook,
    courier,
    courier_types,
    cook_speciality,
    administrator,
    specialty,
    courier_type
CASCADE;

DROP TYPE IF EXISTS "unit_of_measurement" CASCADE;
DROP TYPE IF EXISTS "order_status" CASCADE;
DROP TYPE IF EXISTS "complaint_status" CASCADE;
DROP TYPE IF EXISTS "invoice_status" CASCADE;


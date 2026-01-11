const dbRef = db.getSiblingDB("catering_company");

dbRef.dropDatabase();

dbRef.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "login",
        "email",
        "password_hash",
        "name",
        "surname",
        "date_created",
      ],
      properties: {
        _id: { bsonType: "objectId" },

        login: { bsonType: "string", minLength: 1, maxLength: 50 },
        email: { bsonType: "string", minLength: 1, maxLength: 255 },
        password_hash: { bsonType: "string", minLength: 1, maxLength: 255 },

        name: { bsonType: "string", minLength: 1, maxLength: 50 },
        surname: { bsonType: "string", minLength: 1, maxLength: 50 },

        phone_number: {
          bsonType: ["string", "null"],
          minLength: 1,
          maxLength: 16,
        },

        date_created: { bsonType: "date" },
        date_removed: { bsonType: ["date", "null"] },
        last_login: { bsonType: ["date", "null"] },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: users");

dbRef.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["user_id", "addresses"],
      properties: {
        _id: { bsonType: "objectId" },

        user_id: { bsonType: "objectId" },

        default_address_id: { bsonType: ["objectId", "null"] },

        addresses: {
          bsonType: "array",
          minItems: 0,
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: [
              "country",
              "postal_code",
              "city",
              "street_name",
              "street_number",
              "created_at",
            ],
            properties: {
              _id: { bsonType: "objectId" },

              country: { bsonType: "string", minLength: 1 },
              region: { bsonType: ["string", "null"] },

              postal_code: { bsonType: "string", minLength: 1, maxLength: 16 },
              city: { bsonType: "string", minLength: 1 },

              street_name: { bsonType: "string", minLength: 1 },
              street_number: { bsonType: "string", minLength: 1, maxLength: 8 },
              apartment: {
                bsonType: ["string", "null"],
                minLength: 1,
                maxLength: 8,
              },

              created_at: { bsonType: "date" },
              deleted_at: { bsonType: ["date", "null"] },
            },
          },
        },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: customers (embedded addresses)");

dbRef.createCollection("courses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "name",
        "description",
        "price",
        "protein_100g",
        "calories_100g",
        "carbohydrates_100g",
        "fat_100g",
        "created_at",
        "updated_at",
      ],
      properties: {
        _id: { bsonType: "objectId" },

        name: { bsonType: "string", minLength: 1 },
        description: { bsonType: "string", minLength: 1 },

        price: { bsonType: "decimal" },

        protein_100g: { bsonType: "double" },
        calories_100g: { bsonType: "int" },
        carbohydrates_100g: { bsonType: "double" },
        fat_100g: { bsonType: "double" },

        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: courses");

dbRef.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "status",
        "vat_rate",
        "vat_total",
        "net_total",
        "gross_total",
        "placed_at",
        "customer_id",
        "order_items",
      ],
      properties: {
        _id: { bsonType: "objectId" },

        status: {
          bsonType: "string",
          enum: [
            "accepted",
            "in progress",
            "awaiting delivery",
            "in delivery",
            "delivered",
          ],
        },

        vat_rate: { bsonType: "decimal" },
        vat_total: { bsonType: "decimal" },
        net_total: { bsonType: "decimal" },
        gross_total: { bsonType: "decimal" },

        placed_at: { bsonType: "date" },

        customer_id: { bsonType: "objectId" },

        order_items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: ["expected_delivery_at", "delivery_address", "courses"],
            properties: {
              expected_delivery_at: { bsonType: "date" },
              delivery_address: {
                bsonType: "object",
                additionalProperties: false,
                required: [
                  "country",
                  "postal_code",
                  "city",
                  "street_name",
                  "street_number",
                ],
                properties: {
                  country: { bsonType: "string", minLength: 1 },
                  region: { bsonType: ["string", "null"] },
                  postal_code: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 16,
                  },
                  city: { bsonType: "string", minLength: 1 },
                  street_name: { bsonType: "string", minLength: 1 },
                  street_number: {
                    bsonType: "string",
                    minLength: 1,
                    maxLength: 8,
                  },
                  apartment: {
                    bsonType: ["string", "null"],
                    minLength: 1,
                    maxLength: 8,
                  },
                },
              },

              courses: {
                bsonType: "array",
                minItems: 1,
                items: {
                  bsonType: "object",
                  additionalProperties: false,
                  required: [
                    "_id",
                    "course_id",
                    "name",
                    "description",
                    "price",
                    "protein_100g",
                    "calories_100g",
                    "carbohydrates_100g",
                    "fat_100g",
                  ],
                  properties: {
                    _id: { bsonType: "objectId" },

                    course_id: { bsonType: "objectId" },

                    name: { bsonType: "string", minLength: 1 },
                    description: { bsonType: "string", minLength: 1 },

                    price: { bsonType: "decimal" },

                    protein_100g: { bsonType: "double" },
                    calories_100g: { bsonType: "int" },
                    carbohydrates_100g: { bsonType: "double" },
                    fat_100g: { bsonType: "double" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: orders (embedded order_items + course_in_order_item)");

dbRef.createCollection("invoices", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "invoice_number",
        "status",
        "seller_name",
        "seller_vat_id",
        "buyer_name",
        "currency",
        "payment_method",
        "sale_date",
        "payment_date",
        "issue_date",
        "vat_rate",
        "net_total",
        "vat_total",
        "gross_total",
        "order_id",
        "invoice_order_items",
      ],
      properties: {
        _id: { bsonType: "objectId" },

        invoice_number: { bsonType: "string", minLength: 1, maxLength: 255 },

        status: { bsonType: "string", minLength: 1, maxLength: 50 },

        seller_name: { bsonType: "string", minLength: 1, maxLength: 255 },
        seller_vat_id: { bsonType: "string", minLength: 1, maxLength: 20 },

        buyer_name: { bsonType: "string", minLength: 1, maxLength: 255 },
        buyer_vat_id: {
          bsonType: ["string", "null"],
          minLength: 1,
          maxLength: 20,
        },

        currency: { bsonType: "string", minLength: 3, maxLength: 3 },

        payment_method: { bsonType: "string", minLength: 1, maxLength: 25 },
        payment_terms: { bsonType: ["string", "null"], minLength: 1 },

        sale_date: { bsonType: "date" },
        payment_date: { bsonType: "date" },
        issue_date: { bsonType: "date" },

        vat_rate: { bsonType: "decimal" },
        net_total: { bsonType: "decimal" },
        vat_total: { bsonType: "decimal" },
        gross_total: { bsonType: "decimal" },

        order_id: { bsonType: "objectId" },

        invoice_order_items: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: [
              "course_in_order_item_id",
              "vat_rate",
              "net_total",
              "vat_total",
              "gross_total",
            ],
            properties: {
              course_in_order_item_id: { bsonType: "objectId" },

              vat_rate: { bsonType: "decimal" },
              net_total: { bsonType: "decimal" },
              vat_total: { bsonType: "decimal" },
              gross_total: { bsonType: "decimal" },

              course_id: { bsonType: ["objectId", "null"] },
              name: { bsonType: ["string", "null"], minLength: 1 },
              unit_price: { bsonType: ["decimal", "null"] },
              quantity: { bsonType: ["int", "null"], minimum: 1 },
            },
          },
        },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: invoices (embedded invoice_order_items)");

const dbRef = db.getSiblingDB("catering_company");

dbRef.dropDatabase();
print("Old database dropped.");

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
        allergens: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["allergen_id", "name"],
            properties: {
              allergen_id: { bsonType: "objectId" },
              name: { bsonType: "string", minLength: 1 }
            }
          }
        },

        preferences: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["ingredient_id", "name", "rating"],
            properties: {
              ingredient_id: { bsonType: "objectId" }, 
              name: { bsonType: "string", minLength: 1 },
              rating: { bsonType: "int", minimum: 1, maximum: 5 }
            }
          }
        },

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

dbRef.createCollection("dietitians", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["user_id"],
      properties: {
        _id: { bsonType: "objectId" },
        user_id: { bsonType: "objectId" },
        certification: { bsonType: ["string", "null"], maxLength: 100 }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: dietitians");

dbRef.createCollection("ingredients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "name",
        "unit_of_measure",
        "protein_100g",
        "fat_100g",
        "carbohydrates_100g",
        "calories_100g"
      ],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 1, maxLength: 100 },
        unit_of_measure: { enum: ["g", "ml", "kg", "l", "piece"] },
        protein_100g: { bsonType: ["double", "int"] },
        fat_100g: { bsonType: ["double", "int"] },
        carbohydrates_100g: { bsonType: ["double", "int"] },
        calories_100g: { bsonType: "int" },
        allergens: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["allergen_id", "name"],
            properties: {
              allergen_id: { bsonType: "objectId" },
              name: { bsonType: "string", minLength: 1 }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: ingredients");

dbRef.createCollection("meal_categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength:1, maxLength: 50 },
        description: { bsonType: ["string", "null"] }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: meal_categories");

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

        protein_100g: { bsonType: ["double", "int"] },
        calories_100g: { bsonType: "int" },
        carbohydrates_100g: { bsonType: ["double", "int"] },
        fat_100g: { bsonType: ["double", "int"] },

        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },

        ingredients: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["ingredient_id", "name", "quantity"],
            properties: {
              ingredient_id: { bsonType: "objectId" },
              name: { bsonType: "string", minLength: 1 },
              quantity: { bsonType: ["double", "int"], minimum: 0 },
              unit_of_measure: { enum: ["g", "ml", "kg", "l", "piece"] },
              allergens: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["allergen_id", "name"],
                  properties: {
                    allergen_id: { bsonType: "objectId" },
                    name: { bsonType: "string", minLength: 1 }
                  }
                }
              }
            }
          }
        },

        categories: {
          bsonType: "array",
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: ["category_id", "name"],
            properties: {
              category_id: { bsonType: "objectId" },
              name: { bsonType: "string" },
            }
          }
        },
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

dbRef.createCollection("daily_menus", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["dietician_id", "menu_date", "courses_snapshot"],
      properties: {
        _id: { bsonType: "objectId" },
        menu_date: { bsonType: "date" },
        dietician_id: { bsonType: "objectId" },

        courses_snapshot: {
          bsonType: "array",
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: ["course_id", "name", "price_at_time", "sequence"],
            properties: {
              course_id: { bsonType: "objectId" },
              name: { bsonType: "string", minLength: 1 },
              price_at_time: { bsonType: "decimal", minimum: NumberDecimal("0.0") },
              calories: { bsonType: "int" },
              protein: { bsonType: "double" },
              carbohydrates: { bsonType: "double" },
              fat: { bsonType: "double" },
              sequence: { bsonType: "int", minimum: 1 }
            },
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: daily_menu");


dbRef.createCollection("meal_plans", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["name", "days"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", maxLength: 100 },
        description: { bsonType: ["string", "null"] },

        dietician_id: { bsonType: "objectId" },

        start_date: { bsonType: ["date", "null"] },
        end_date: { bsonType: ["date", "null"] },

        days: {
          bsonType: "array",
          items: {
            bsonType: "object",
            additionalProperties: false,
            required: ["day_number", "courses_snapshot"],
            properties: {
              day_number: { bsonType: "int", minimum: 1 },
              courses_snapshot: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  additionalProperties: false,
                  required: ["course_id", "name", "price_at_time", "sequence"],
                  properties: {
                    course_id: { bsonType: "objectId" },
                    name: { bsonType: "string", minLength: 1 },
                    price_at_time: { bsonType: "decimal", minimum: NumberDecimal("0.0") },
                    calories: { bsonType: "int" },
                    protein: { bsonType: "double" },
                    carbohydrates: { bsonType: "double" },
                    fat: { bsonType: "double" },
                    sequence: { bsonType: "int", minimum: 1 }
                  },
                }
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error",
});

print("Init OK: meal_plans");


dbRef.createCollection("complaints", {
  validator : {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: [
        "customer_id",
        "order_id",
        "order_item_id",
        "course_in_order_item_id",
        "course_snapshot",
        "status",
        "description",
        "created_at"
      ],
      properties: {
        _id: { bsonType: "objectId" },
        customer_id: { bsonType: "objectId" },
        order_id: { bsonType: "objectId" },
        orde_item_id: { bsonType: "objectId" },
        course_in_order_item_id: { bsonType: "objectId" },

        course_snapshot: { 
          bsonType: "object",
          additionalProperties: false,
          required: [
            "course_id",
            "name",
            "price"
          ],
          properties: {
            course_id: { bsonType: "objectId" },
            name: { bsonType: "string" },
            price: { bsonType: "decimal" }
          },
        },

        status:  {
          bsonType: "string",
          enum: [
            "submitted",
            "under_review",
            "resolved_positive",
            "resolved_negative"
          ]
        },

        description: { bsonType: "string" },
        refund_amount: { bsonType: ["decimal", "null"], minimum: NumberDecimal("0.0") },

        created_at: { bsonType: "date" },
        resolved_at: { bsonType: ["date", "null"] }
      }
    },
    validationLevel: "strict",
    validationAction: "error",
  }
});

print("Init OK: complaints");

dbRef.createCollection("allergens", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: { bsonType: "string" },
        description: { bsonType: ["string","null"] }
      }
    }
  }
});

print("Init OK: allergens");


dbRef.createCollection("opinions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["course_id","customer_id","rating"],
      properties: {
        course_id: { bsonType: "objectId" },
        customer_id: { bsonType: "objectId" },
        rating: { bsonType: "int", minimum: 1, maximum: 5 },
        opinion: { bsonType: ["string","null"] },
        created_at: { bsonType: "date" }
      }
    }
  }
});

dbRef.opinions.createIndex(
  { course_id: 1, customer_id: 1 }, 
  { unique: true }
)

print("Init OK: opinions");

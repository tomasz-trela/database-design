const dbRef = db.getSiblingDB("catering_company");

// add extra indexes if they don't exist
dbRef.users.createIndex({ roles: 1 }); // significantly speeds up the query
dbRef.orders.createIndex({ customer_id: 1 });

printjson(
  dbRef.users.aggregate([
  { $match: { roles: "customer" } },
  {
    $lookup: {
      from: "orders",
      localField: "_id",
      foreignField: "customer_id",
      pipeline: [
        { $project: { _id: 0, placed_at: 1 } }
      ],
      as: "orders"
    }
  },
  {
    $addFields: {
      last_order_date: { $max: "$orders.placed_at" }
    }
  },
  {
    $project: {
      customer_id: "$_id",
      user: { $concat: ["$name", " ", "$surname"] },
      last_order_date: { $max: "$orders.placed_at" },
      days_since_last_order: {
        $dateDiff: {
        startDate: { $max: "$orders.placed_at" },
        endDate: "$$NOW",
        unit: "day"
        }
      }
    }
  },
  {
    $sort: { days_since_last_order: 1 }
  }
  ]).toArray()
);


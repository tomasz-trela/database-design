const dbRef = db.getSiblingDB("catering_company");

const defaultStats = {
  morning: null,
  afternoon: null,
  evening: null,
  night: null
};

printjson(
  dbRef.orders.aggregate([
    { $unwind: "$order_items" },
    { $unwind: "$order_items.courses" },

    {
      $addFields: {
        dish: "$order_items.courses.name",
        price: "$order_items.courses.price",
        day: { $isoDayOfWeek: "$placed_at" },
        hour: { $hour: "$placed_at" }
      }
    },

    {
      $addFields: {
        time: {
          $switch: {
            branches: [
              { case: { $lte: ["$hour", 11] }, then: "morning" },
              { case: { $lte: ["$hour", 16] }, then: "afternoon" },
              { case: { $lte: ["$hour", 20] }, then: "evening" }
            ],
            default: "night"
          }
        }
      }
    },

    {
      $group: {
        _id: { day: "$day", time: "$time", dish: "$dish" },
        count: { $sum: 1 },
        revenue: { $sum: "$price" },
        min: { $min: "$price" },
        max: { $max: "$price" }
      }
    },

    {
      $sort: {
        "_id.day": 1,
        "_id.time": 1,
        count: -1
      }
    },

    {
      $group: {
        _id: { day: "$_id.day", time: "$_id.time" },
        total_orders: { $sum: "$count" },
        total_rev: { $sum: "$revenue" },
        min_price: { $min: "$min" },
        max_price: { $max: "$max" },
        most_popular_dish: { $first: "$_id.dish" },
        times_ordered: { $first: "$count" }
      }
    },

    {
      $group: {
        _id: "$_id.day",
        data: {
          $push: {
            k: "$_id.time",
            v: {
              total_orders: "$total_orders",
              avg_price: {
                $round: [{ $divide: ["$total_rev", "$total_orders"] }, 2]
              },
              min_price: "$min_price",
              max_price: "$max_price",
              most_popular_dish: "$most_popular_dish",
              times_ordered: "$times_ordered"
            }
          }
        }
      }
    },

    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            {
              day: {
                $arrayElemAt: [
                  ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  "$_id"
                ]
              }
            },
            defaultStats,
            { $arrayToObject: "$data" }
          ]
        }
      }
    }
  ]).toArray()
);

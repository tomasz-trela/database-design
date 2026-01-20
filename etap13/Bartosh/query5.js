const dbRef = db.getSiblingDB("catering_company");

printjson(
  dbRef.orders
    .aggregate([
      { $sort: { customer_id: 1, placed_at: 1 } },

      {
        $group: {
          _id: "$customer_id",
          placed: { $push: "$placed_at" },
          count: { $sum: 1 },
        },
      },

      { $match: { count: { $gte: 2 } } },

      {
        $addFields: {
          diffsMs: {
            $map: {
              input: { $range: [0, { $subtract: ["$count", 1] }] },
              as: "i",
              in: {
                $subtract: [
                  { $arrayElemAt: ["$placed", { $add: ["$$i", 1] }] },
                  { $arrayElemAt: ["$placed", "$$i"] },
                ],
              },
            },
          },
        },
      },

      { $addFields: { avgDiffMs: { $avg: "$diffsMs" } } },

      {
        $facet: {
          perCustomer: [
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: 0,
                customer_id: "$_id",
                name: "$user.name",
                surname: "$user.surname",
                orders_count: "$count",
                avg_diff_hours: { $divide: ["$avgDiffMs", 1000 * 60 * 60] },
              },
            },
            { $sort: { avg_diff_hours: 1 } },
          ],

          overall: [
            {
              $group: {
                _id: null,
                overallAvgMs: { $avg: "$avgDiffMs" },
                customers: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                overall_avg_hours: {
                  $divide: ["$overallAvgMs", 1000 * 60 * 60],
                },
                customers: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          perCustomer: 1,
          overall: { $arrayElemAt: ["$overall", 0] },
        },
      },
    ])
    .toArray()
);
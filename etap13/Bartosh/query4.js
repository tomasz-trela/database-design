const dbRef = db.getSiblingDB("catering_company");

// Categories (chosen thresholds):
// small: price < 350
// medium: 350 <= price < 1000
// big: price >= 1000

printjson(
  dbRef.orders
    .aggregate([
      {
        $match: {
          placed_at: { $gte: new Date("2025-12-24T00:00:00Z") },
        },
      },

      {
        $addFields: {
          price: { $toDouble: { $ifNull: ["$gross_total", "$net_total"] } },
        },
      },

      {
        $group: {
          _id: null,
          small: {
            $sum: {
              $cond: [{ $lt: ["$price", 350] }, 1, 0],
            },
          },
          medium: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ["$price", 350] }, { $lt: ["$price", 1000] }],
                },
                1,
                0,
              ],
            },
          },
          big: {
            $sum: { $cond: [{ $gte: ["$price", 1000] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },

      {
        $project: { _id: 0, small: 1, medium: 1, big: 1, total: 1 },
      },
    ])
    .toArray()
);

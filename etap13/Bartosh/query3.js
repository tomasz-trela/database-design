const dbRef = db.getSiblingDB("catering_company");

// Distribution of address counts among customers
printjson(
  dbRef.users
    .aggregate([
      { $match: { roles: "customer" } },
      {
        $project: {
          addresses_count: {
            $size: { $ifNull: ["$customer_data.addresses", []] },
          },
        },
      },
      { $group: { _id: "$addresses_count", n: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray()
);

// Top 20 customers by address count
printjson(
  dbRef.users
    .aggregate([
      { $match: { roles: "customer" } },
      {
        $project: {
          _id: 1,
          name: 1,
          surname: 1,
          addresses_count: {
            $size: { $ifNull: ["$customer_data.addresses", []] },
          },
        },
      },
      { $sort: { addresses_count: -1 } },
      { $limit: 20 },
    ])
    .toArray()
);

// Orders count by quarter
const res = dbRef.orders
  .aggregate([
    {
      $project: {
        year: { $year: "$placed_at" },
        quarter: {
          $ceil: { $divide: [{ $month: "$placed_at" }, 3] },
        },
      },
    },
    {
      $group: {
        _id: { year: "$year", quarter: "$quarter" },
        orders_count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.quarter": 1 } },
    {
      $project: {
        _id: 0,
        period: {
          $concat: [
            { $toString: "$_id.year" },
            "-Q",
            { $toString: "$_id.quarter" },
          ],
        },
        orders_count: 1,
      },
    },
  ])
  .toArray();

printjson(res);
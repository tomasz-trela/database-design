const dbRef = db.getSiblingDB("catering_company");

// Distribution of address counts among customers
const t0 = Date.now();
const res1 = dbRef.users
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
  .toArray();
const t1 = Date.now();

printjson(res1);
printjson({ ms: t1 - t0, returned: res1.length });

// Top 20 customers by address count
const t2 = Date.now();
const res2 = dbRef.users
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
  .toArray();
const t3 = Date.now();

printjson(res2);
printjson({ ms: t3 - t2, returned: res2.length });

// Orders count by quarter
const t4 = Date.now();
const res3 = dbRef.orders
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
const t5 = Date.now();

printjson(res3);
printjson({ ms: t5 - t4, returned: res3.length });

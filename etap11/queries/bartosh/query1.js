const dbRef = db.getSiblingDB("catering_company");

const limit = 20;
const offset = 0;

const res = dbRef.orders
  .aggregate([
    { $unwind: "$order_items" },
    { $unwind: "$order_items.courses" },
    {
      $group: {
        _id: "$order_items.courses.course_id",
        name: { $first: "$order_items.courses.name" },
        description: { $first: "$order_items.courses.description" },
        price: { $first: "$order_items.courses.price" },
        times_ordered: { $sum: 1 },
        unique_customers: { $addToSet: "$customer_id" },
      },
    },
    { $addFields: { unique_customers_count: { $size: "$unique_customers" } } },
    { $sort: { times_ordered: -1, unique_customers_count: -1, name: 1 } },
    { $skip: offset },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        course_id: "$_id",
        name: 1,
        description: 1,
        price: 1,
        times_ordered: 1,
        unique_customers_count: 1,
      },
    },
  ])
  .toArray();

printjson(res);

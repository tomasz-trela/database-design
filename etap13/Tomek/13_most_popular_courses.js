const dbRef = db.getSiblingDB("catering_company");

const result = dbRef.orders.aggregate([
  {
    $unwind: "$order_items"
  },
  
  {
    $unwind: "$order_items.courses"
  },
  
  {
    $group: {
      _id: "$order_items.courses.course_id",
      dish_name: { $first: "$order_items.courses.name" },
      times_ordered: { $sum: 1 }
    }
  },
  
  {
    $project: {
      _id: 0,
      dish_name: 1,
      times_ordered: 1
    }
  },
  
  {
    $sort: { times_ordered: -1 }
  },
  
  {
    $limit: 10
  }
]);

result.forEach(doc => printjson(doc));

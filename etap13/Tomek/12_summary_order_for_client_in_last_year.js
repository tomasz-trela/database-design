const dbRef = db.getSiblingDB("catering_company");

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const result = dbRef.orders.aggregate([
  {
    $match: {
      placed_at: { $gte: oneYearAgo }
    }
  },
  {
    $group: {
      _id: "$customer_id",
      gross_total: { $sum: "$gross_total" }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $project: {
      _id: 0,
      customer_name: "$user.name",
      customer_surname: "$user.surname",
      gross_total: 1
    }
  },

  {
    $sort: { gross_total: -1 }
  }
]);

result.forEach(doc => printjson(doc));

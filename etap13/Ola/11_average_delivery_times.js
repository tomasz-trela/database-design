const dbRef = db.getSiblingDB("catering_company");
const startDate = ISODate('2025-12-12T00:00:00Z');
const endDate =  ISODate('2026-01-18T23:59:59Z');
const bucket_1_limit = 60;
const bucket_2_limit = 1440;
const bucket_3_limit = 2880;

printjson(
  dbRef.deliveries.aggregate(
  [
    {
      $match: {
      status: "delivered",
      began_at: { $ne: null },
      delivered_at: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $lookup: {
      from: "users",
      localField: "courier_id",
      foreignField: "_id",
      pipeline: [
          { $project: { _id: 0, name: 1, surname: 1 } }
      ],
      as: "courier_info"
      }
    },
    { $unwind: "$courier_info" },
    {
      $addFields: {
      delivery_minutes: {
          $dateDiff: {
          startDate: "$began_at",
          endDate: "$delivered_at",
          unit: "minute"
          }
        } 
      }
    },
      {
      $group: {
        _id: "$courier_id",
        name: { $first: "$courier_info.name" },
        surname: { $first: "$courier_info.surname" },
        total_deliveries: { $sum: 1 },
        avg_min: { $avg: "$delivery_minutes" },
        b1: { $sum: { $cond: [{ $lte: ["$delivery_minutes", bucket_1_limit] }, 1, 0] } },
        b2: { $sum: { $cond: [{ $and: [{ $gt: ["$delivery_minutes", bucket_1_limit] }, { $lte: ["$delivery_minutes", bucket_2_limit] }] }, 1, 0] } },
        b3: { $sum: { $cond: [{ $and: [{ $gt: ["$delivery_minutes", bucket_2_limit] }, { $lte: ["$delivery_minutes", bucket_3_limit] }] }, 1, 0] } },
        bo: { $sum: { $cond: [{ $gt: ["$delivery_minutes", bucket_3_limit] }, 1, 0] } }
      }
    },
    {
      $project: {
        courier_id: "$_id", 
        _id: 0,
        courier: { $concat: ["$name", " ", "$surname"] },
        total_deliveries: 1,
        average_time: { $round: ["$avg_min", 2] },
        performance: {
          fast_percent: { $round: [{ $multiply: [{ $divide: ["$b1", "$total_deliveries"] }, 100] }, 1] },
          standard_percent: { $round: [{ $multiply: [{ $divide: ["$b2", "$total_deliveries"] }, 100] }, 1] },
          late_percent: { $round: [{ $multiply: [{ $divide: ["$b3", "$total_deliveries"] }, 100] }, 1] },
          over_percent: { $round: [{ $multiply: [{ $divide: ["$bo", "$total_deliveries"] }, 100] }, 1] }
        }
      }
    },
    { $sort: { average_time: -1 } } 
  ]).toArray()
);

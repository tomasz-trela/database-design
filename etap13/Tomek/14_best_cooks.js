const dbRef = db.getSiblingDB("catering_company");

const result = dbRef.fulfillments.aggregate([
  {
    $match: {
      completed_at: { $ne: null }
    }
  },
  {
    $group: {
      _id: "$cook_id",
      avg_seconds: {
        $avg: {
          $divide: [
            { $subtract: ["$completed_at", "$began_at"] },
            1000
          ]
        }
      },
      total_order_items: { $sum: 1 }
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
    $lookup: {
      from: "complaints",
      let: { cook_id: "$_id" },
      pipeline: [
        {
          $lookup: {
            from: "fulfillments",
            localField: "order_item_id",
            foreignField: "order_item_id",
            as: "fulfillment"
          }
        },
        {
          $unwind: "$fulfillment"
        },
        {
          $match: {
            $expr: { $eq: ["$fulfillment.cook_id", "$$cook_id"] }
          }
        },
        {
          $count: "count"
        }
      ],
      as: "complaint_data"
    }
  },
  
  {
    $addFields: {
      complaints: {
        $ifNull: [
          { $arrayElemAt: ["$complaint_data.count", 0] },
          0
        ]
      }
    }
  },
  
  {
    $group: {
      _id: null,
      max_avg_seconds: { $max: "$avg_seconds" },
      cooks: {
        $push: {
          cook_id: "$_id",
          name: "$user.name",
          surname: "$user.surname",
          avg_seconds: "$avg_seconds",
          total_order_items: "$total_order_items",
          complaints: "$complaints"
        }
      }
    }
  },
  
  {
    $unwind: "$cooks"
  },
  {
    $project: {
      _id: 0,
      name: "$cooks.name",
      surname: "$cooks.surname",
      avg_seconds: { $round: ["$cooks.avg_seconds", 2] },
      total_order_items: "$cooks.total_order_items",
      complaints: "$cooks.complaints",
      quality_score: {
        $round: [
          {
            $subtract: [
              1,
              {
                $divide: [
                  "$cooks.complaints",
                  "$cooks.total_order_items"
                ]
              }
            ]
          },
          3
        ]
      },
      performance_score: {
        $round: [
          {
            $add: [
              {
                $multiply: [
                  {
                    $subtract: [
                      1,
                      {
                        $divide: [
                          "$cooks.avg_seconds",
                          "$max_avg_seconds"
                        ]
                      }
                    ]
                  },
                  0.4
                ]
              },
              {
                $multiply: [
                  {
                    $subtract: [
                      1,
                      {
                        $divide: [
                          "$cooks.complaints",
                          "$cooks.total_order_items"
                        ]
                      }
                    ]
                  },
                  0.6
                ]
              }
            ]
          },
          3
        ]
      }
    }
  },
  
  {
    $addFields: {
      overall_score: {
        $round: [
          {
            $divide: [
              { $add: ["$quality_score", "$performance_score"] },
              2
            ]
          },
          3
        ]
      }
    }
  },
  
  {
    $sort: { overall_score: -1 }
  },
  
  {
    $limit: 10
  }
]);

result.forEach(doc => printjson(doc));

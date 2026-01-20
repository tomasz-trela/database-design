const dbRef = db.getSiblingDB("catering_company");

const result = dbRef.fulfillments.aggregate([
  {
    $match: {
      completed_at: { $ne: null }
    }
  },
  
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$completed_at"
        }
      },
      items_completed: { $sum: 1 }
    }
  },
  
  {
    $sort: { items_completed: 1 }
  },
  
  {
    $group: {
      _id: null,
      daily_data: {
        $push: {
          completion_date: "$_id",
          items_completed: "$items_completed"
        }
      },
      all_items: { $push: "$items_completed" }
    }
  },
  
  {
    $project: {
      daily_data: 1,
      median_items: {
        $let: {
          vars: {
            sorted: "$all_items",
            count: { $size: "$all_items" },
            mid: { $floor: { $divide: [{ $size: "$all_items" }, 2] } }
          },
          in: {
            $cond: [
              { $eq: [{ $mod: ["$$count", 2] }, 0] },
              {
                $divide: [
                  {
                    $add: [
                      { $arrayElemAt: ["$$sorted", "$$mid"] },
                      { $arrayElemAt: ["$$sorted", { $subtract: ["$$mid", 1] }] }
                    ]
                  },
                  2
                ]
              },
              { $arrayElemAt: ["$$sorted", "$$mid"] }
            ]
          }
        }
      }
    }
  },
  
  {
    $unwind: "$daily_data"
  },
  
  {
    $project: {
      _id: 0,
      completion_date: "$daily_data.completion_date",
      items_completed: "$daily_data.items_completed",
      median_daily_items: { $round: ["$median_items", 2] },
      deviation_from_median: {
        $subtract: ["$daily_data.items_completed", "$median_items"]
      },
      deviation_percentage: {
        $cond: [
          { $gt: ["$median_items", 0] },
          {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: ["$daily_data.items_completed", "$median_items"]
                      },
                      "$median_items"
                    ]
                  },
                  100
                ]
              },
              2
            ]
          },
          null
        ]
      }
    }
  },
  
  {
    $sort: { deviation_from_median: -1 }
  },
  
  {
    $limit: 10
  }
]);

result.forEach(doc => printjson(doc));

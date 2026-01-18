const dbRef = db.getSiblingDB("catering_company");

printjson(
  dbRef.courses.aggregate([
    {
      $lookup: {
        from: "complaints",
        localField: "_id",
        foreignField: "course_snapshot.course_id",
        pipeline: [{ $project: { resolved_at: 1, refund_amount: 1 } }],
        as: "complaints_data"
      }
    },
    {
      $project: {
      course_id: "$_id",
      course_name: "$name",
      complaint_count: { $size: "$complaints_data" },
      num_of_resolved: {
        $size: {
            $filter: {
                input: "$complaints_data",
                as: "comp",
                cond: { $ne: ["$$comp.resolved_at", null] }
            }
        }
      },
      num_of_unresolved: {
        $size: {
            $filter: {
                input: "$complaints_data",
                as: "comp",
                cond: { $eq: ["$$comp.resolved_at", null] }
            }
        }
      },
      average_refund: {
        $ifNull: [
          { $round: [{ $avg: "$complaints_data.refund_amount" }, 2] },
          0
        ]
        }
      }
    },
    {
      $sort: {
          complaint_count: -1,
          course_name: 1
      }
    }
  ]).toArray()
);




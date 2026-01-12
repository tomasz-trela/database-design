const dbRef = db.getSiblingDB("catering_company");

printjson(
  dbRef.customers
    .aggregate([
      {
        $addFields: {
          addresses_count: { $size: { $ifNull: ["$addresses", []] } },
        },
      },

      {
        $group: {
          _id: null,
          counts: { $push: "$addresses_count" },
          avgAddresses: { $avg: "$addresses_count" },
          maxAddresses: { $max: "$addresses_count" },
        },
      },

      {
        $project: {
          _id: 0,
          avg: "$avgAddresses",
          max: "$maxAddresses",
          countsSorted: { $sortArray: { input: "$counts", sortBy: 1 } },
          len: { $size: "$counts" },
        },
      },

      {
        $project: {
          avg: 1,
          max: 1,
          median: {
            $let: {
              vars: { sorted: "$countsSorted", len: "$len" },
              in: {
                $cond: [
                  { $eq: [{ $mod: ["$$len", 2] }, 1] },
                  {
                    $arrayElemAt: [
                      "$$sorted",
                      { $floor: { $divide: ["$$len", 2] } },
                    ],
                  },
                  {
                    $avg: [
                      {
                        $arrayElemAt: [
                          "$$sorted",
                          {
                            $subtract: [
                              { $floor: { $divide: ["$$len", 2] } },
                              1,
                            ],
                          },
                        ],
                      },
                      {
                        $arrayElemAt: [
                          "$$sorted",
                          { $floor: { $divide: ["$$len", 2] } },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ])
    .toArray()
);

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
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$user.name",
          surname: "$user.surname",
          addresses_count: 1,
        },
      },

      //   { $sort: { addresses_count: -1, surname: 1, name: 1 } },
    ])
    .toArray()
);

const dbRef = db.getSiblingDB("catering_company");

printjson(
  dbRef.users
    .aggregate([
      {
        $match: {
          roles: "customer",
        },
      },

      {
        $addFields: {
          addresses_count: {
            $size: { $ifNull: ["$customer_data.addresses", []] },
          },
        },
      },

      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          surname: 1,
          addresses_count: 1,
        },
      },

      //   { $sort: { addresses_count: -1, surname: 1, name: 1 } },
    ])
    .toArray()
);

db.courses.aggregate([
    {
        $lookup: {
            from: "opinions",
            localField: "_id",
            foreignField: "course_id",
            as: "ratings"
        }
    },
    {
        $addFields: {
            avg_rating: { $avg: "$ratings.rating" },
            total_rating_count: { $size: "$ratings" }
        }
    },
    {
        $match: {
            total_rating_count: { $gte: 5 }
        }
    },
    {
        $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "order_items.courses.course_id",
            as: "orders"
        }
    },
    {
        $addFields: {
            total_sales: {
                $reduce: {
                    input: "$orders",
                    initialValue: 0,
                    in: {
                        $add: [
                            "$$value",
                            {
                                $size: {
                                    $filter: {
                                        input: {
                                            $reduce: {
                                                input: "$$this.order_items",
                                                initialValue: [],
                                                in: { $concatArrays: [ "$$value", "$$this.courses" ] }
                                            }
                                        },
                                        as: "c",
                                        cond: { $eq: [ "$$c.course_id", "$_id" ] }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    },
    { $sort: { total_sales: -1 } },
    {
        $group: {
            _id: null,
            docs: { $push: "$$ROOT" }
        }
    },
    {
        $addFields: {
            total_docs: { $size: "$docs" }
        }
    },
    {
        $unwind: {
            path: "$docs",
            includeArrayIndex: "sales_rank"
        }
    },
    {
        $replaceRoot: {
            newRoot: { $mergeObjects: [ "$docs", { total_docs: "$total_docs", sales_rank: "$sales_rank" } ] }
        }
    },
    {
        $addFields: {
            sales_quartile: {
                $ceil: {
                    $divide: [ { $add: ["$sales_rank", 1] }, { $divide: ["$total_docs", 4] } ]
                }
            }
        }
    },

    { $sort: { avg_rating: -1 } },
    {
        $group: {
            _id: null,
            docs: { $push: "$$ROOT" }
        }
    },
    {
        $unwind: {
            path: "$docs",
            includeArrayIndex: "rating_rank"
        }
    },
    {
        $replaceRoot: {
            newRoot: { $mergeObjects: [ "$docs", { rating_rank: "$rating_rank" } ] }
        }
    },
    {
        $addFields: {
            rating_quartile: {
                $ceil: {
                    $divide: [ { $add: ["$rating_rank", 1] }, { $divide: ["$total_docs", 4] } ]
                }
            }
        }
    },
    {
        $match: {
            rating_quartile: 1,
            sales_quartile: 4
        }
    },
    {
        $sort: {
            avg_rating: -1,
            total_sales: 1
        }
    },
    {
        $project: {
            _id: 0,
            name: 1,
            total_sales: 1,
            average_rating: { $round: ["$avg_rating", 2] },
            total_rating_count: 1
        }
    }
])

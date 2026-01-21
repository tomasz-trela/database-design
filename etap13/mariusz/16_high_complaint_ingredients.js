db.courses.aggregate([
    {
        $unwind: "$ingredients"
    },
    {
        $group: {
            _id: "$ingredients.ingredient_id",
            name: { $first: "$ingredients.name" },
            course_ids: { $addToSet: "$_id" }
        }
    },
    {
        $lookup: {
            from: "orders",
            let: { course_ids: "$course_ids" },
            pipeline: [
                { $unwind: "$order_items" },
                { $unwind: "$order_items.courses" },
                {
                    $match: {
                        $expr: {
                            $in: ["$order_items.courses.course_id", "$$course_ids"]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$order_items.courses.course_id",
                        course_in_order_item_ids: { $addToSet: "$order_items.courses._id" }
                    }
                }
            ],
            as: "ordered_courses"
        }
    },
    {
        $unwind: "$ordered_courses"
    },
    {
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            total_sold_in_items_set: { $addToSet: "$ordered_courses.course_in_order_item_ids" }
        }
    },
    {
        $addFields: {
            total_sold_in_items_flat: {
                $reduce: {
                    input: "$total_sold_in_items_set",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] }
                }
            }
        }
    },
    {
        $addFields: {
           total_sold_in_items: { $size: "$total_sold_in_items_flat" }
        }
    },
    {
        $lookup: {
            from: "complaints",
            let: { sold_items: "$total_sold_in_items_flat" },
            pipeline: [
                {
                    $match: {
                        status: { $ne: 'negatively resolved' },
                        $expr: {
                            $in: ["$course_in_order_item_id", "$$sold_items"]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        complained_items: { $addToSet: "$course_in_order_item_id" }
                    }
                }
            ],
            as: "complaints_info"
        }
    },
    {
        $unwind: { path: "$complaints_info", preserveNullAndEmptyArrays: true }
    },
    {
        $addFields: {
            total_complained_items: { $size: { $ifNull: ["$complaints_info.complained_items", []] } }
        }
    },
    {
        $match: {
            total_sold_in_items: { $gt: 50 }
        }
    },
    {
        $addFields: {
            complaint_rate_percent: {
                $cond: {
                    if: { $gt: ["$total_sold_in_items", 0] },
                    then: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$total_complained_items", "$total_sold_in_items"] },
                                    100
                                ]
                            },
                            2
                        ]
                    },
                    else: 0
                }
            }
        }
    },
    {
        $sort: {
            complaint_rate_percent: -1,
            total_complained_items: -1
        }
    },
    {
        $limit: 10
    },
    {
        $project: {
            _id: 0,
            ingredient_name: "$name",
            total_sold_in_items: 1,
            total_complained_items: 1,
            complaint_rate_percent: 1
        }
    }
])

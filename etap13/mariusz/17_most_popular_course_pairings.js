db.orders.aggregate([
    {
        $unwind: "$order_items"
    },
    {
        $project: {
            courses: "$order_items.courses"
        }
    },
    {
        $match: {
            "courses.1": { $exists: true }
        }
    },
    {
        $project: {
            course_pairs: {
                $reduce: {
                    input: "$courses",
                    initialValue: [],
                    in: {
                        $concatArrays: [
                            "$$value",
                            {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$courses",
                                            as: "course",
                                            cond: { $lt: ["$$this.course_id", "$$course.course_id"] }
                                        }
                                    },
                                    as: "c",
                                    in: {
                                        course_1: "$$this.course_id",
                                        course_2: "$$c.course_id"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    },
    {
        $unwind: "$course_pairs"
    },
    {
        $group: {
            _id: {
                course_1: "$course_pairs.course_1",
                course_2: "$course_pairs.course_2"
            },
            frequency: { $sum: 1 }
        }
    },
    {
        $sort: {
            frequency: -1
        }
    },
    {
        $limit: 10
    },
    {
        $lookup: {
            from: "courses",
            localField: "_id.course_1",
            foreignField: "_id",
            as: "course_1_details"
        }
    },
    {
        $unwind: "$course_1_details"
    },
    {
        $lookup: {
            from: "courses",
            localField: "_id.course_2",
            foreignField: "_id",
            as: "course_2_details"
        }
    },
    {
        $unwind: "$course_2_details"
    },
    {
        $project: {
            _id: 0,
            course_1: "$course_1_details.name",
            course_2: "$course_2_details.name",
            frequency: 1
        }
    }
])

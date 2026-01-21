db.orders.aggregate([
{
    $limit: 1
},
{
    $project: {
        _id: 0,
        dates: {
            $map: {
                input: { $range: [0, 7] },
                as: 'd',
                in: {
                    $let: {
                        vars: {
                            forecast_date: {
                                $add: [
                                    new Date(new Date().setHours(0, 0, 0, 0)),
                                    { $multiply: ['$$d', 24 * 60 * 60 * 1000] }
                                ]
                            }
                        },
                        in: '$$forecast_date'
                    }
                }
            }
        }
    }
},
{
    $unwind: '$dates'
},
{
    $lookup: {
        from: 'orders',
        let: { forecast_date: '$dates' },
        pipeline: [
            { $unwind: "$order_items" },
            {
                $match: {
                    $expr: {
                        $and: [
                            { $gte: ["$order_items.expected_delivery_at", "$$forecast_date"] },
                            { $lt: ["$order_items.expected_delivery_at", { $add: ["$$forecast_date", 24 * 60 * 60 * 1000] }] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "invoices",
                    localField: "_id",
                    foreignField: "order_id",
                    as: "invoice"
                }
            },
            {
                $unwind: "$invoice"
            },
            {
                $match: {
                    "invoice.status": "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$gross_total" }
                }
            }
        ],
        as: 'revenue'
    }
},
{
    $project: {
        _id: 0,
        forecast_date: { $dateToString: { format: "%Y-%m-%d", date: "$dates" } },
        projected_revenue: { $ifNull: [ { $sum: "$revenue.total" }, 0 ] }
    }
},
{
    $sort: { forecast_date: 1 }
}
])
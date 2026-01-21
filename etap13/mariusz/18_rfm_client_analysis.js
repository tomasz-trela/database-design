db.users.aggregate([
  { $match: { roles: 'customer' } },
  {
    $lookup: {
      from: "orders",
      localField: "_id",
      foreignField: "customer_id",
      as: "order_docs"
    }
  },
  {
    $project: {
      name: 1,
      email: 1,
      frequency: { $size: "$order_docs" },
      monetary: { $sum: "$order_docs.gross_total" },
      last_order_date: { $max: "$order_docs.placed_at" }
    }
  },
  { $match: { frequency: { $gt: 0 } } },
  {
    $addFields: {
      recency: {
        $divide: [
          { $subtract: [new Date(), "$last_order_date"] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  },
  {
    $setWindowFields: {
      sortBy: { recency: 1 },
      output: {
        recency_percentile: { $denseRank: {} }
      }
    }
  },
  {
    $setWindowFields: {
      sortBy: { frequency: -1 },
      output: {
        frequency_percentile: { $denseRank: {} }
      }
    }
  },
  {
    $setWindowFields: {
      sortBy: { monetary: -1 },
      output: {
        monetary_percentile: { $denseRank: {} }
      }
    }
  },
  {
    $addFields: {
      r_score: { $add: [{ $mod: ["$recency_percentile", 4] }, 1] },
      f_score: { $add: [{ $mod: ["$frequency_percentile", 4] }, 1] },
      m_score: { $add: [{ $mod: ["$monetary_percentile", 4] }, 1] }
    }
  },
  {
    $addFields: {
      rfm_segment: { $concat: [{ $toString: "$r_score" }, { $toString: "$f_score" }, { $toString: "$m_score" }] },
      segment_label: {
        $switch: {
          branches: [
            { case: { $and: [{ $eq: ["$r_score", 1] }, { $eq: ["$f_score", 1] }, { $eq: ["$m_score", 1] }] }, then: 'Mistrzowie' },
            { case: { $and: [{ $eq: ["$r_score", 4] }, { $eq: ["$f_score", 1] }, { $eq: ["$m_score", 1] }] }, then: 'Lojalni, zagrożeni' },
            { case: { $eq: ["$r_score", 1] }, then: 'Nowi/Niedawni' },
            { case: { $eq: ["$r_score", 4] }, then: 'Utraceni' },
            { case: { $eq: ["$f_score", 4] }, then: 'Jednorazowi' }
          ],
          default: 'Pozostali'
        }
      }
    }
  }
])

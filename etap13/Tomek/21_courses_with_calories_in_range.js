const dbRef = db.getSiblingDB("catering_company");

const result = dbRef.courses.find(
  {
    calories_100g: { $gte: 330, $lte: 350 }
  },
  {
    _id: 0,
    name: 1,
    calories_100g: 1
  }
)

result.forEach(doc => printjson(doc));

/// ===== Constants =====

const dbRef = db.getSiblingDB("catering_company");

const USERS_COUNT = 5000;
const CUSTOMERS_COUNT = 4800;
const ALLERGENS_COUNT = 20;
const INGREDIENTS_COUNT = 100;
const MEAL_CATEGORIES_COUNT = 15;
const COURSES_COUNT = 300;
const ORDERS_COUNT = 10000;
const INVOICES_COUNT = 5000;
const COMPLAINTS_COUNT = 200;
const OPINIONS_COUNT = 2000;

/// ===== Helper Functions =====

function nowMinusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function dec(n) {
  return NumberDecimal(String(n));
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function randomPriceDecimal(min, max) {
  const v = round2(min + Math.random() * (max - min));
  return dec(v.toFixed(2));
}

function asDouble(x) {
  return EJSON.deserialize({ $numberDouble: String(x) });
}

function randomMacroDouble(min, max) {
  const v = (min + Math.random() * (max - min)).toFixed(1);
  return asDouble(v);
}

function randomQuantityDouble(min, max) {
  const v = (min + Math.random() * (max - min)).toFixed(1);
  return asDouble(v);
}

// ===== Script =====

dbRef.runCommand({
  collMod: "orders",
  validationAction: "warn",
});

print();

dbRef.users.deleteMany({});
print("Users collection cleared.");

dbRef.customers.deleteMany({});
print("Customers collection cleared.");

dbRef.allergens.deleteMany({});
print("Allergens collection cleared.");

dbRef.ingredients.deleteMany({});
print("Ingredients collection cleared.");

dbRef.meal_categories.deleteMany({});
print("Meal categories collection cleared.");

dbRef.courses.deleteMany({});
print("Courses collection cleared.");

dbRef.orders.deleteMany({});
print("Orders collection cleared.");

dbRef.invoices.deleteMany({});
print("Invoices collection cleared.");

dbRef.opinions.deleteMany({});
print("Opinions collection cleared.");

dbRef.meal_categories.deleteMany({});
print("Meal Categories added")

print();

// ===== Users seeding =====

function createUserObject({
  login,
  email,
  name,
  surname,
  phone = null,
  createdDaysAgo = 0,
}) {
  return {
    login,
    email,
    password_hash: `hash_${login}_${Math.random().toString(16).slice(2)}`,
    name,
    surname,
    phone_number: phone,
    date_created: nowMinusDays(createdDaysAgo),
    date_removed: null,
    last_login: null,
  };
}

const users = [];

for (let i = 1; i <= USERS_COUNT; i++) {
  const login = `user${String(i).padStart(2, "0")}`;
  const u = createUserObject({
    login,
    email: `${login}@mail.com`,
    name: `Name${i}`,
    surname: `Surname${i}`,
    phone:
      i % 3 === 0
        ? null
        : `48${(100000000 + i).toString().slice(0, 9)}`.slice(0, 16),
    createdDaysAgo: i,
  });

  dbRef.users.updateOne(
    { login: u.login },
    { $setOnInsert: u },
    { upsert: true }
  );
}

const count = dbRef.users.countDocuments();
print(`Users inserted: ${count}`);

// ===== Allergens seeding =====

const allergenNames = [
  "Gluten", "Crustaceans", "Eggs", "Fish", "Peanuts",
  "Soybeans", "Milk", "Nuts", "Celery", "Mustard",
  "Sesame", "Sulphites", "Lupin", "Molluscs", "Corn",
  "Tomatoes", "Citrus", "Strawberries", "Kiwi", "Shellfish"
];

const allergenIds = [];

for (let i = 0; i < ALLERGENS_COUNT && i < allergenNames.length; i++) {
  const allergen = {
    _id: new ObjectId(),
    name: allergenNames[i],
    description: `Allergen: ${allergenNames[i]}`
  };
  
  dbRef.allergens.updateOne(
    { name: allergen.name },
    { $setOnInsert: allergen },
    { upsert: true }
  );
  
  // Zapisujemy jako obiekt z allergen_id i name dla embeddingu
  allergenIds.push({ allergen_id: allergen._id, name: allergen.name });
}

print(`Allergens inserted: ${dbRef.allergens.countDocuments()}`);

// ===== Ingredients seeding =====

const ingredientNames = [
  "Chicken breast", "Beef sirloin", "Salmon fillet", "Tuna", "Shrimp",
  "Eggs", "Milk", "Butter", "Olive oil", "Rice",
  "Pasta", "Potatoes", "Sweet potatoes", "Quinoa", "Oats",
  "Broccoli", "Spinach", "Tomatoes", "Carrots", "Onions",
  "Garlic", "Bell peppers", "Mushrooms", "Zucchini", "Cauliflower",
  "Avocado", "Banana", "Apple", "Orange", "Strawberries",
  "Blueberries", "Almonds", "Walnuts", "Peanuts", "Cashews",
  "Chickpeas", "Lentils", "Black beans", "Tofu", "Tempeh",
  "Greek yogurt", "Cottage cheese", "Cheddar cheese", "Mozzarella", "Parmesan",
  "Whole wheat bread", "White bread", "Tortillas", "Pita bread", "Bagels",
  "Honey", "Maple syrup", "Brown sugar", "White sugar", "Salt",
  "Black pepper", "Cumin", "Paprika", "Oregano", "Basil",
  "Cilantro", "Parsley", "Thyme", "Rosemary", "Ginger",
  "Soy sauce", "Vinegar", "Lemon juice", "Lime juice", "Hot sauce",
  "Ketchup", "Mustard", "Mayonnaise", "Pesto", "Hummus",
  "Coconut milk", "Almond milk", "Heavy cream", "Sour cream", "Cream cheese",
  "Dark chocolate", "Cocoa powder", "Vanilla extract", "Cinnamon", "Nutmeg",
  "Flour", "Cornstarch", "Baking powder", "Baking soda", "Yeast",
  "Green tea", "Coffee", "Red wine", "White wine", "Beer",
  "Chicken stock", "Beef stock", "Vegetable stock", "Coconut oil", "Sesame oil"
];

const ingredientDocs = [];

for (let i = 0; i < INGREDIENTS_COUNT && i < ingredientNames.length; i++) {
  const ingredientAllergens = [];
  
  // Niektóre składniki mają alergeny
  if (allergenIds.length > 0 && randInt(0, 3) === 0) {
    const allergenCount = randInt(1, 2);
    for (let a = 0; a < allergenCount && a < allergenIds.length; a++) {
      const allergen = pickOne(allergenIds);
      if (!ingredientAllergens.find(al => al.allergen_id.equals(allergen.allergen_id))) {
        ingredientAllergens.push(allergen);
      }
    }
  }
  
  const ingredient = {
    _id: new ObjectId(),
    name: ingredientNames[i],
    unit_of_measure: pickOne(["g", "ml", "kg", "l", "piece"]),
    protein_100g: randomMacroDouble(0.0, 30.0),
    fat_100g: randomMacroDouble(0.0, 40.0),
    carbohydrates_100g: randomMacroDouble(0.0, 80.0),
    calories_100g: randInt(10, 600),
    allergens: ingredientAllergens
  };
  
  dbRef.ingredients.insertOne(ingredient);
  ingredientDocs.push(ingredient);
}

print(`Ingredients inserted: ${dbRef.ingredients.countDocuments()}`);

// ===== Meal Categories seeding =====

const categoryNames = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Dessert",
  "Vegan", "Vegetarian", "Keto", "Low-carb", "High-protein",
  "Gluten-free", "Dairy-free", "Mediterranean", "Asian", "Italian"
];

const categoryIds = [];

dbRef.meal_categories.deleteMany({});

for (let i = 0; i < categoryNames.length; i++) {
  const category = {
    _id: new ObjectId(),
    name: categoryNames[i],
    description: `Category: ${categoryNames[i]}`
  };
  
  dbRef.meal_categories.insertOne(category);
  categoryIds.push({ category_id: category._id, name: category.name });
}

print(`Meal categories inserted: ${dbRef.meal_categories.countDocuments()}`);

// ===== Customers seeding =====

function createAddressObject({
  country,
  city,
  postal_code,
  street_name,
  street_number,
  apartment = null,
  createdDaysAgo = 0,
}) {
  return {
    _id: new ObjectId(),
    country,
    region: null,
    postal_code,
    city,
    street_name,
    street_number,
    apartment,
    created_at: nowMinusDays(createdDaysAgo),
    deleted_at: null,
  };
}

function createCustomerObject({ user_id, addresses }) {
  return {
    user_id,
    default_address_id: addresses.length > 0 ? addresses[0]._id : null,
    addresses,
  };
}

const userDocs = dbRef.users.find().sort({ date_created: 1 }).toArray();

const customersToSeed = Math.min(CUSTOMERS_COUNT, userDocs.length);

for (let i = 0; i < customersToSeed; i++) {
  const u = userDocs[i];

  const addrCount = randInt(0, 5);
  const addresses = [];

  for (let a = 0; a < addrCount; a++) {
    addresses.push(
      createAddressObject({
        country: "Poland",
        city: `City${i + 1}`,
        postal_code: `00-${String((i + 1) % 100).padStart(2, "0")}${a}`,
        street_name: `Street${i + 1}`,
        street_number: `${i + 1}`,
        apartment:
          a % 2 === 0 ? null : `${i + 1}${String.fromCharCode(65 + a)}`,
        createdDaysAgo: i + 1 + a,
      })
    );
  }

  const customerAllergens = [];
  if (allergenIds.length > 0 && randInt(0, 2) === 0) {
    const allergenCount = randInt(1, 3);
    for (let a = 0; a < allergenCount && a < allergenIds.length; a++) {
      const allergen = pickOne(allergenIds);
      if (!customerAllergens.find(al => al.allergen_id.equals(allergen.allergen_id))) {
        customerAllergens.push(allergen);
      }
    }
  }

  const preferences = [];
  if (ingredientDocs.length > 0 && randInt(0, 1) === 0) {
    const prefCount = randInt(1, 5);
    for (let p = 0; p < prefCount; p++) {
      const ingredient = pickOne(ingredientDocs);
      if (!preferences.find(pr => pr.ingredient_id.equals(ingredient._id))) {
        preferences.push({
          ingredient_id: ingredient._id,
          name: ingredient.name,
          rating: randInt(1, 5)
        });
      }
    }
  }

  const customer = createCustomerObject({ user_id: u._id, addresses });
  customer.allergens = customerAllergens;
  customer.preferences = preferences;

  dbRef.customers.updateOne(
    { user_id: u._id },
    { $setOnInsert: customer },
    { upsert: true }
  );
}

const customersCount = dbRef.customers.countDocuments();
print(`Customers inserted: ${customersCount}`);

// ===== Courses seeding =====

function createCourseObject({ nameSeed, createdDaysAgo = 0 }) {
  const createdAt = nowMinusDays(createdDaysAgo);
  
  const ingredients = [];
  if (ingredientDocs.length > 0) {
    const ingredientCount = randInt(3, 8);
    for (let ing = 0; ing < ingredientCount && ing < ingredientDocs.length; ing++) {
      const ingredient = pickOne(ingredientDocs);
      
      if (!ingredients.find(i => i.ingredient_id.equals(ingredient._id))) {
        ingredients.push({
          ingredient_id: ingredient._id,
          name: ingredient.name,
          quantity: randomQuantityDouble(10.0, 500.0),
          unit_of_measure: ingredient.unit_of_measure,
          allergens: ingredient.allergens || []
        });
      }
    }
  }
  
  const courseCategories = [];
  if (categoryIds.length > 0) {
    const catCount = randInt(1, 3);
    for (let c = 0; c < catCount && c < categoryIds.length; c++) {
      const cat = pickOne(categoryIds);
      if (!courseCategories.find(cc => cc.category_id.equals(cat.category_id))) {
        courseCategories.push(cat);
      }
    }
  }
  
  return {
    _id: new ObjectId(),
    name: `Course ${nameSeed}`,
    description: `Tasty course ${nameSeed} - seeded`,
    price: randomPriceDecimal(12, 65),
    protein_100g: randomMacroDouble(0.0, 35.0),
    calories_100g: randInt(40, 700),
    carbohydrates_100g: randomMacroDouble(0.0, 90.0),
    fat_100g: randomMacroDouble(0.0, 40.0),
    created_at: createdAt,
    updated_at: createdAt,
    ingredients,
    categories: courseCategories
  };
}

for (let i = 1; i <= COURSES_COUNT; i++) {
  const c = createCourseObject({
    nameSeed: String(i).padStart(2, "0"),
    createdDaysAgo: i,
  });

  dbRef.courses.updateOne(
    { name: c.name },
    { $setOnInsert: c },
    { upsert: true }
  );
}

print(`Courses inserted: ${dbRef.courses.countDocuments()}`);

// ===== Orders seeding =====

const ORDER_STATUSES = [
  "accepted",
  "in progress",
  "awaiting delivery",
  "in delivery",
  "delivered",
];

const VAT_RATES = ["0.05", "0.08", "0.23"];

function createDeliveryAddressObject(seedIdx) {
  return {
    country: "Poland",
    region: null,
    postal_code: `50-${String(randInt(100, 999))}`,
    city: `Wroclaw`,
    street_name: `DeliveryStreet${seedIdx}`,
    street_number: `${randInt(1, 200)}`,
    apartment:
      randInt(0, 1) === 0
        ? null
        : `${randInt(1, 50)}${String.fromCharCode(65 + randInt(0, 3))}`,
  };
}

function createCourseInOrderItemObject({ courseId, nameSeed }) {
  return {
    _id: new ObjectId(),
    course_id: courseId,

    name: `Course ${nameSeed}`,
    description: `Tasty course ${nameSeed} - seeded`,

    price: randomPriceDecimal(12, 65),

    protein_100g: randomMacroDouble(0.0, 35.0),
    calories_100g: randInt(40, 700),
    carbohydrates_100g: randomMacroDouble(0.0, 90.0),
    fat_100g: randomMacroDouble(0.0, 40.0),
  };
}

function createOrderItemObject({ placedAt, itemIdx }) {
  const expectedDays = randInt(1, 7);

  const coursesCount = randInt(1, 5);
  const courses = [];

  for (let c = 0; c < coursesCount; c++) {
    courses.push(
      createCourseInOrderItemObject({
        courseId: new ObjectId(),
        nameSeed: `${itemIdx}-${c + 1}`,
      })
    );
  }

  return {
    expected_delivery_at: addDays(placedAt, expectedDays),
    delivery_address: createDeliveryAddressObject(itemIdx),
    courses,
  };
}

function computeOrderTotals({ vatRateStr, orderItems }) {
  const vatRate = parseFloat(vatRateStr);

  let net = 0.0;

  for (const item of orderItems) {
    for (const c of item.courses) {
      net += parseFloat(c.price.toString());
    }
  }

  net = round2(net);
  const vatTotal = round2(net * vatRate);
  const gross = round2(net + vatTotal);

  return {
    vat_rate: dec(vatRateStr),
    net_total: dec(net.toFixed(2)),
    vat_total: dec(vatTotal.toFixed(2)),
    gross_total: dec(gross.toFixed(2)),
  };
}

function createOrderObject({ status, placedAt, customerId, seedIdx }) {
  const orderItemsCount = randInt(1, 10);
  const orderItems = [];

  for (let i = 0; i < orderItemsCount; i++) {
    orderItems.push(
      createOrderItemObject({ placedAt, itemIdx: seedIdx * 100 + i + 1 })
    );
  }

  const vatRateStr = pickOne(VAT_RATES);
  const totals = computeOrderTotals({ vatRateStr, orderItems });

  return {
    status,

    vat_rate: totals.vat_rate,
    vat_total: totals.vat_total,
    net_total: totals.net_total,
    gross_total: totals.gross_total,

    placed_at: placedAt,
    customer_id: customerId,

    order_items: orderItems,
  };
}

const customerDocs = dbRef.customers.find().toArray();

if (customerDocs.length === 0) {
  throw new Error("No customers found. Seed users/customers first.");
}

for (let i = 1; i <= ORDERS_COUNT; i++) {
  const customer = pickOne(customerDocs);

  const placedAt = nowMinusDays(randInt(0, 60));
  const status = pickOne(ORDER_STATUSES);

  const order = createOrderObject({
    status,
    placedAt,
    customerId: customer.user_id,
    seedIdx: i,
  });

  dbRef.orders.updateOne(
    {
      customer_id: order.customer_id,
      placed_at: order.placed_at,
      gross_total: order.gross_total,
    },
    { $setOnInsert: order },
    { upsert: true }
  );
}

const ordersCount = dbRef.orders.countDocuments();
print(`Orders inserted: ${ordersCount}`);

// ===== Invoices seeding =====

const INVOICE_STATUSES = ["issued", "paid", "overdue", "cancelled"];
const CURRENCIES = ["PLN", "EUR"];
const PAYMENT_METHODS = ["bank_transfer", "card", "cash"];

function pad4(n) {
  return String(n).padStart(4, "0");
}

function createInvoiceNumber(seq, dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `FV/${y}/${m}/${pad4(seq)}`;
}

function computeInvoiceTotals({ vatRateStr, invoiceItems }) {
  const vatRate = parseFloat(vatRateStr);

  let net = 0.0;
  for (const it of invoiceItems) {
    net += parseFloat(it.net_total.toString());
  }

  net = round2(net);
  const vatTotal = round2(net * vatRate);
  const gross = round2(net + vatTotal);

  return {
    vat_rate: dec(vatRateStr),
    net_total: dec(net.toFixed(2)),
    vat_total: dec(vatTotal.toFixed(2)),
    gross_total: dec(gross.toFixed(2)),
  };
}

function createInvoiceOrderItemsFromOrder(order) {
  const items = [];

  for (const oi of order.order_items) {
    for (const c of oi.courses) {
      const quantity = randInt(1, 4);
      const unit = parseFloat(c.price.toString());
      const net = round2(unit * quantity);

      const vatRateStr = order.vat_rate.toString();
      const vatRate = parseFloat(vatRateStr);
      const vatTotal = round2(net * vatRate);
      const gross = round2(net + vatTotal);

      items.push({
        course_in_order_item_id: c._id,

        vat_rate: dec(vatRateStr),
        net_total: dec(net.toFixed(2)),
        vat_total: dec(vatTotal.toFixed(2)),
        gross_total: dec(gross.toFixed(2)),

        course_id: c.course_id,
        name: c.name,
        unit_price: c.price,
        quantity,
      });
    }
  }

  return items;
}

const ordersForInvoices = dbRef.orders.find().sort({ placed_at: 1 }).toArray();

if (ordersForInvoices.length === 0) {
  throw new Error("No orders found. Seed orders first.");
}

let invoiceSeq = 1;

for (const order of ordersForInvoices) {
  const issueDate = addDays(order.placed_at, randInt(0, 3));
  const saleDate = issueDate;
  const paymentDate = addDays(issueDate, randInt(3, 14));

  const invoiceItems = createInvoiceOrderItemsFromOrder(order);

  if (invoiceItems.length === 0) {
    continue;
  }

  const vatRateStr = order.vat_rate.toString();
  const totals = computeInvoiceTotals({ vatRateStr, invoiceItems });

  const invoice = {
    invoice_number: createInvoiceNumber(invoiceSeq, issueDate),
    status: pickOne(INVOICE_STATUSES),

    seller_name: "Catering Company Sp. z o.o.",
    seller_vat_id: "PL1234567890",

    buyer_name: `Customer ${order.customer_id.toString().slice(-6)}`,
    buyer_vat_id: null,

    currency: pickOne(CURRENCIES),
    payment_method: pickOne(PAYMENT_METHODS),
    payment_terms: null,

    sale_date: saleDate,
    payment_date: paymentDate,
    issue_date: issueDate,

    vat_rate: totals.vat_rate,
    net_total: totals.net_total,
    vat_total: totals.vat_total,
    gross_total: totals.gross_total,

    order_id: order._id,
    invoice_order_items: invoiceItems,
  };

  dbRef.invoices.updateOne(
    { order_id: invoice.order_id },
    { $setOnInsert: invoice },
    { upsert: true }
  );

  invoiceSeq++;
}

print(`Invoices inserted: ${dbRef.invoices.countDocuments()}`);
print();


// ===== Opinions seeding =====

const ordersForOpinions = dbRef.orders.find().toArray();
let opinionsInserted = 0;

for (const order of ordersForOpinions) {
  if (opinionsInserted >= OPINIONS_COUNT) break;
  
  for (const orderItem of order.order_items) {
    if (opinionsInserted >= OPINIONS_COUNT) break;
    
    for (const course of orderItem.courses) {
      if (opinionsInserted >= OPINIONS_COUNT) break;
      
      if (randInt(0, 9) > 7) {
        const opinion = {
          course_id: course.course_id,
          customer_id: order.customer_id,
          rating: randInt(1, 5),
          opinion: randInt(0, 1) === 0 ? null : `Opinion about ${course.name}`,
          created_at: addDays(order.placed_at, randInt(1, 10))
        };
        
        dbRef.opinions.insertOne(opinion);
        opinionsInserted++;
      }
    }
  }
}

print(`Opinions inserted: ${dbRef.opinions.countDocuments()}`);
print();

// end of script
print();

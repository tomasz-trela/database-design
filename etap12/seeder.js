/// ===== Constants =====

const dbRef = db.getSiblingDB("catering_company");

const USERS_COUNT = 5000;
const ALLERGENS_COUNT = 20;
const INGREDIENTS_COUNT = 100;
const COURSES_COUNT = 300;
const ORDERS_COUNT = 10000;
const DAILY_MENUS_COUNT = 60;
const MEAL_PLANS_COUNT = 50;
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

function pickN(arr, n) {
  const shuffled = arr.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
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

dbRef.allergens.deleteMany({});
print("Allergens collection cleared.");

dbRef.course_categories.deleteMany({});
print("Course categories collection cleared.");

dbRef.ingredients.deleteMany({});
print("Ingredients collection cleared.");

dbRef.courses.deleteMany({});
print("Courses collection cleared.");

dbRef.orders.deleteMany({});
print("Orders collection cleared.");

dbRef.invoices.deleteMany({});
print("Invoices collection cleared.");

dbRef.opinions.deleteMany({});
print("Opinions collection cleared.");

dbRef.daily_menus.deleteMany({});
print("Daily menus collection cleared.");

dbRef.meal_plans.deleteMany({});
print("Meal plans collection cleared.");

dbRef.complaints.deleteMany({});
print("Complaints collection cleared.");

dbRef.fulfillments.deleteMany({});
print("Fulfillments collection cleared.");

dbRef.deliveries.deleteMany({});
print("Deliveries collection cleared.");

print();

// ===== Allergens seeding =====

const allergenNames = [
  "Gluten", "Crustaceans", "Eggs", "Fish", "Peanuts",
  "Soybeans", "Milk", "Nuts", "Celery", "Mustard",
  "Sesame", "Sulphites", "Lupin", "Molluscs", "Corn",
  "Tomatoes", "Citrus", "Strawberries", "Kiwi", "Shellfish"
];

const allergenDocs = [];

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
  
  allergenDocs.push({ allergen_id: allergen._id, name: allergen.name });
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
  
  if (allergenDocs.length > 0 && randInt(0, 3) === 0) {
    const allergenCount = randInt(1, 2);
    for (let a = 0; a < allergenCount && a < allergenDocs.length; a++) {
      const allergen = pickOne(allergenDocs);
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

// ===== Course Categories seeding =====

const categoryNames = ["Vegan", "Pescatarian", "Vegetarian", "Breakfast", "Lunch", "Dinner"];
const categoryDocs = [];

for (let i = 0; i < categoryNames.length; i++) {
  const category = {
    _id: new ObjectId(),
    name: categoryNames[i],
    description: `Category: ${categoryNames[i]}`
  };
  
  dbRef.course_categories.updateOne(
    { name: category.name },
    { $setOnInsert: category },
    { upsert: true }
  );
  
  categoryDocs.push(category);
}

print(`Course categories inserted: ${dbRef.course_categories.countDocuments()}`);

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
  
  // Categories referencing the course_categories collection
  const courseCategories = [];
  const catCount = randInt(1, 3);
  for (let c = 0; c < catCount; c++) {
    const cat = pickOne(categoryDocs);
    if (!courseCategories.find(cc => cc.category_id.equals(cat._id))) {
      courseCategories.push({
        category_id: cat._id,
        name: cat.name
      });
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

const courseDocs = [];

for (let i = 1; i <= COURSES_COUNT; i++) {
  const c = createCourseObject({
    nameSeed: String(i).padStart(2, "0"),
    createdDaysAgo: i,
  });

  dbRef.courses.insertOne(c);
  courseDocs.push(c);
}

print(`Courses inserted: ${dbRef.courses.countDocuments()}`);

// ===== Users seeding (with embedded customer_data and staff_data) =====

const ROLES = ["customer", "cook", "courier", "dietician", "admin"];
const COURIER_TYPES = ["PysznePL", "Glovo", "Internal"];

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

function createUserObject({
  login,
  email,
  name,
  surname,
  phone = null,
  roles,
  createdDaysAgo = 0,
  customerData = null,
  staffData = null,
}) {
  const user = {
    login,
    email,
    password_hash: `hash_${login}_${Math.random().toString(16).slice(2)}`,
    roles,
    name,
    surname,
    phone_number: phone,
    date_created: nowMinusDays(createdDaysAgo),
    date_removed: null,
    last_login: null,
  };
  
  if (customerData) {
    user.customer_data = customerData;
  }
  
  if (staffData) {
    user.staff_data = staffData;
  }
  
  return user;
}

const userDocs = [];
const customerUserDocs = [];
const cookUserDocs = [];
const courierUserDocs = [];
const dieticianUserDocs = [];

for (let i = 1; i <= USERS_COUNT; i++) {
  const login = `user${String(i).padStart(4, "0")}`;
  
  // Determine user type:
  // - First 80% are customers only
  // - Next 15% are staff only (cook, courier, dietician, admin)
  // - Last 5% are staff who are also customers
  let roles = [];
  let customerData = null;
  let staffData = null;
  
  const isCustomerOnly = i <= USERS_COUNT * 0.80;
  const isStaffOnly = i > USERS_COUNT * 0.80 && i <= USERS_COUNT * 0.95;
  const isStaffAndCustomer = i > USERS_COUNT * 0.95;
  
  // Assign staff role if applicable
  if (isStaffOnly || isStaffAndCustomer) {
    const staffRole = pickOne(["cook", "courier", "dietician", "admin"]);
    roles.push(staffRole);
    
    staffData = {};
    
    if (staffRole === "cook") {
      staffData.specialties = pickN(["Italian", "Asian", "French", "Mexican", "Mediterranean"], randInt(1, 3));
    } else if (staffRole === "courier") {
      staffData.courier_type = pickOne(COURIER_TYPES);
    } else if (staffRole === "dietician") {
      staffData.certification = `CERT-${randInt(1000, 9999)}`;
    }
    // admin has no specific staff_data fields
  }
  
  // Assign customer role and customer_data if applicable
  if (isCustomerOnly || isStaffAndCustomer) {
    roles.push("customer");
    
    // Create customer_data
    const addrCount = randInt(1, 5);
    const addresses = [];
    for (let a = 0; a < addrCount; a++) {
      addresses.push(createAddressObject({
        country: "Poland",
        city: `City${i}`,
        postal_code: `00-${String((i) % 100).padStart(2, "0")}${a}`,
        street_name: `Street${i}`,
        street_number: `${i}`,
        apartment: a % 2 === 0 ? null : `${i}${String.fromCharCode(65 + a)}`,
        createdDaysAgo: i + a,
      }));
    }
    
    const customerAllergens = [];
    if (allergenDocs.length > 0 && randInt(0, 2) === 0) {
      const allergenCount = randInt(1, 3);
      for (let a = 0; a < allergenCount; a++) {
        const allergen = pickOne(allergenDocs);
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
    
    customerData = {
      preferences,
      addresses,
      default_address_id: addresses.length > 0 ? addresses[0]._id : null,
      allergens: customerAllergens
    };
  }
  
  const u = createUserObject({
    login,
    email: `${login}@mail.com`,
    name: `Name${i}`,
    surname: `Surname${i}`,
    phone: i % 3 === 0 ? null : `48${(100000000 + i).toString().slice(0, 9)}`.slice(0, 16),
    roles,
    createdDaysAgo: i,
    customerData,
    staffData,
  });

  dbRef.users.insertOne(u);
  u._id = dbRef.users.findOne({ login: u.login })._id;
  userDocs.push(u);
  
  if (roles.includes("customer")) {
    customerUserDocs.push(u);
  }
  if (roles.includes("cook")) {
    cookUserDocs.push(u);
  }
  if (roles.includes("courier")) {
    courierUserDocs.push(u);
  }
  if (roles.includes("dietician")) {
    dieticianUserDocs.push(u);
  }
}

print(`Users inserted: ${dbRef.users.countDocuments()}`);
print(`  - Customers: ${customerUserDocs.length}`);
print(`  - Cooks: ${cookUserDocs.length}`);
print(`  - Couriers: ${courierUserDocs.length}`);
print(`  - Dieticians: ${dieticianUserDocs.length}`);

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

function createCourseInOrderItemObject(course) {
  return {
    _id: new ObjectId(),
    course_id: course._id,
    name: course.name,
    price: course.price,
  };
}

function createOrderItemObject({ placedAt, itemIdx }) {
  const expectedDays = randInt(1, 7);

  const coursesCount = randInt(1, 5);
  const courses = [];

  for (let c = 0; c < coursesCount; c++) {
    const course = pickOne(courseDocs);
    courses.push(createCourseInOrderItemObject(course));
  }

  return {
    _id: new ObjectId(),
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
    _id: new ObjectId(),
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

if (customerUserDocs.length === 0) {
  throw new Error("No customers found. Check user seeding.");
}

const orderDocs = [];

for (let i = 1; i <= ORDERS_COUNT; i++) {
  const customer = pickOne(customerUserDocs);

  const placedAt = nowMinusDays(randInt(0, 60));
  const status = pickOne(ORDER_STATUSES);

  const order = createOrderObject({
    status,
    placedAt,
    customerId: customer._id,
    seedIdx: i,
  });

  dbRef.orders.insertOne(order);
  orderDocs.push(order);
}

print(`Orders inserted: ${dbRef.orders.countDocuments()}`);

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

let invoiceSeq = 1;

for (const order of orderDocs) {
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

  dbRef.invoices.insertOne(invoice);
  invoiceSeq++;
}

print(`Invoices inserted: ${dbRef.invoices.countDocuments()}`);

// ===== Daily Menus seeding =====

function createMenuCoursesSnapshots(courseCount, courseDocs) {
  const coursesSnapshot = [];
  const selectedCourses = pickN(courseDocs, courseCount);
  
  for (let seq = 0; seq < selectedCourses.length; seq++) {
    const course = selectedCourses[seq];
    coursesSnapshot.push({
      course_id: course._id,
      name: course.name,
      price_at_time: course.price,
      calories: course.calories_100g,
      protein: course.protein_100g,
      carbohydrates: course.carbohydrates_100g,
      fat: course.fat_100g,
      sequence: seq + 1
    });
  }
  return coursesSnapshot;
}

if (dieticianUserDocs.length === 0) {
  print("Warning: No dieticians found. Skipping daily menus seeding.");
} else {
  for (let i = 0; i < DAILY_MENUS_COUNT; i++) {
    const menuDate = nowMinusDays(i);
    const dietician = pickOne(dieticianUserDocs);
    
    const courseCount = randInt(3, 8);
    const coursesSnapshot = createMenuCoursesSnapshots(courseCount, courseDocs);
     
    const dailyMenu = {
      _id: new ObjectId(),
      menu_date: menuDate,
      dietician_id: dietician._id,
      courses_snapshot: coursesSnapshot
    };
    
    dbRef.daily_menus.updateOne(
      { menu_date: dailyMenu.menu_date },
      { $setOnInsert: dailyMenu },
      { upsert: true }
    );
  }
  
  print(`Daily menus inserted: ${dbRef.daily_menus.countDocuments()}`);
}

// ===== Meal Plans seeding =====

if (dieticianUserDocs.length === 0) {
  print("Warning: No dieticians found. Skipping meal plans seeding.");
} else {
  for (let i = 0; i < MEAL_PLANS_COUNT; i++) {
    const dietician = pickOne(dieticianUserDocs);
    const startDate = nowMinusDays(randInt(0, 90));
    const daysCount = randInt(3, 14);
    const endDate = addDays(startDate, daysCount);
    
    const days = [];
    for (let d = 1; d <= daysCount; d++) {
      const courseCount = randInt(3, 6);
      const coursesSnapshot = createMenuCoursesSnapshots(courseCount, courseDocs);
          
      days.push({
        day_number: d,
        courses_snapshot: coursesSnapshot
      });
    }
    
    const mealPlan = {
      _id: new ObjectId(),
      name: `Meal Plan ${i + 1}`,
      description: randInt(0, 1) === 0 ? null : `Description for meal plan ${i + 1}`,
      dietician_id: dietician._id,
      start_date: randInt(0, 1) === 0 ? null : startDate,
      end_date: randInt(0, 1) === 0 ? null : endDate,
      days
    };
    
    dbRef.meal_plans.insertOne(mealPlan);
  }
  
  print(`Meal plans inserted: ${dbRef.meal_plans.countDocuments()}`);
}

// ===== Complaints seeding =====

const COMPLAINT_STATUSES = ["submitted", "under_review", "resolved_positive", "resolved_negative"];

let complaintsInserted = 0;

for (const order of orderDocs) {
  if (complaintsInserted >= COMPLAINTS_COUNT) break;
  
  // Only some orders have complaints (about 2% chance)
  if (randInt(0, 49) !== 0) continue;
  
  for (const orderItem of order.order_items) {
    if (complaintsInserted >= COMPLAINTS_COUNT) break;
    
    for (const course of orderItem.courses) {
      if (complaintsInserted >= COMPLAINTS_COUNT) break;
      
      const status = pickOne(COMPLAINT_STATUSES);
      const createdAt = addDays(order.placed_at, randInt(1, 7));
      
      const complaint = {
        _id: new ObjectId(),
        customer_id: order.customer_id,
        order_id: order._id,
        order_item_id: orderItem._id,
        course_in_order_item_id: course._id,
        course_snapshot: {
          course_id: course.course_id,
          name: course.name,
          price: course.price
        },
        status,
        description: `Complaint about ${course.name}: ${pickOne(["quality issue", "wrong order", "late delivery", "missing items", "taste issue"])}`,
        refund_amount: status.startsWith("resolved_positive") ? randomPriceDecimal(5, 50) : null,
        created_at: createdAt,
        resolved_at: status.startsWith("resolved") ? addDays(createdAt, randInt(1, 14)) : null
      };
      
      dbRef.complaints.insertOne(complaint);
      complaintsInserted++;
      break; // One complaint per order item at most
    }
  }
}

print(`Complaints inserted: ${dbRef.complaints.countDocuments()}`);

// ===== Fulfillments seeding =====

const FULFILLMENT_STATUSES = ["pending", "in_preparation", "completed", "cancelled"];

if (cookUserDocs.length === 0) {
  print("Warning: No cooks found. Skipping fulfillments seeding.");
} else {
  let fulfillmentsInserted = 0;
  
  for (const order of orderDocs) {
    for (const orderItem of order.order_items) {
      const status = pickOne(FULFILLMENT_STATUSES);
      const now = new Date();
      
      const fulfillment = {
        _id: new ObjectId(),
        order_id: order._id,
        order_item_id: orderItem._id,
        cook_id: pickOne(cookUserDocs)._id,
        status,
        began_at: status === "pending" ? null : addDays(order.placed_at, randInt(0, 1)),
        completed_at: status === "completed" ? addDays(order.placed_at, randInt(1, 2)) : null,
        last_updated_at: now,
        notes: randInt(0, 4) === 0 ? `Note for order item ${orderItem._id}` : null
      };
      
      dbRef.fulfillments.updateOne(
        { order_item_id: fulfillment.order_item_id },
        { $setOnInsert: fulfillment },
        { upsert: true }
      );
      
      fulfillmentsInserted++;
    }
  }
  
  print(`Fulfillments inserted: ${dbRef.fulfillments.countDocuments()}`);
}

// ===== Deliveries seeding =====

const DELIVERY_STATUSES = ["awaiting_pickup", "in_transit", "delivered", "failed"];

if (courierUserDocs.length === 0) {
  print("Warning: No couriers found. Skipping deliveries seeding.");
} else {
  for (const order of orderDocs) {
    for (const orderItem of order.order_items) {
      const status = pickOne(DELIVERY_STATUSES);
      const now = new Date();
      
      const delivery = {
        _id: new ObjectId(),
        order_id: order._id,
        order_item_id: orderItem._id,
        courier_id: status === "awaiting_pickup" ? null : pickOne(courierUserDocs)._id,
        address: orderItem.delivery_address,
        status,
        began_at: status === "awaiting_pickup" ? null : addDays(order.placed_at, randInt(0, 2)),
        delivered_at: status === "delivered" ? addDays(order.placed_at, randInt(1, 3)) : null,
        last_updated_at: now,
        notes: randInt(0, 4) === 0 ? `Delivery note for order item ${orderItem._id}` : null
      };
      
      dbRef.deliveries.updateOne(
        { order_item_id: delivery.order_item_id },
        { $setOnInsert: delivery },
        { upsert: true }
      );
    }
  }
  
  print(`Deliveries inserted: ${dbRef.deliveries.countDocuments()}`);
}

// ===== Opinions seeding =====

let opinionsInserted = 0;

for (const order of orderDocs) {
  if (opinionsInserted >= OPINIONS_COUNT) break;
  
  for (const orderItem of order.order_items) {
    if (opinionsInserted >= OPINIONS_COUNT) break;
    
    for (const course of orderItem.courses) {
      if (opinionsInserted >= OPINIONS_COUNT) break;
      
      // About 20% chance of leaving an opinion
      if (randInt(0, 4) !== 0) continue;
      
      const opinion = {
        course_id: course.course_id,
        customer_id: order.customer_id,
        rating: randInt(1, 5),
        opinion: randInt(0, 1) === 0 ? null : `Opinion about ${course.name}`,
        created_at: addDays(order.placed_at, randInt(1, 10))
      };
      
      // Use upsert to respect unique constraint on (course_id, customer_id)
      dbRef.opinions.updateOne(
        { course_id: opinion.course_id, customer_id: opinion.customer_id },
        { $setOnInsert: opinion },
        { upsert: true }
      );
      
      opinionsInserted++;
    }
  }
}

print(`Opinions inserted: ${dbRef.opinions.countDocuments()}`);

print();
print("===== Seeding completed =====");
print();
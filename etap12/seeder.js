/// ===== Constants =====

const dbRef = db.getSiblingDB("catering_company");

const USERS_COUNT = 10;
const CUSTOMERS_COUNT = 7;

/// ===== Helper unctions =====

function nowMinusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/// ===== Create objects functions =====

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

/// ===== Script =====

print();

dbRef.users.deleteMany({});
print("Users collection cleared.");

dbRef.customers.deleteMany({});
print("Customers collection cleared.");

print();

// ===== Users seeding =====

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

// ===== Customers seeding =====

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

  const customer = createCustomerObject({ user_id: u._id, addresses });

  dbRef.customers.updateOne(
    { user_id: u._id },
    { $setOnInsert: customer },
    { upsert: true }
  );
}

const customersCount = dbRef.customers.countDocuments();
print(`Customers inserted: ${customersCount}`);

// end of script
print();

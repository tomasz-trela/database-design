/// ===== Constants =====

const dbRef = db.getSiblingDB("catering_company");

const RESET_USERS_COLLECTION = true;

const USERS_COUNT = 5;

/// ===== Functions =====

function nowMinusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

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

/// ===== Script =====

if (RESET_USERS_COLLECTION) {
  dbRef.users.deleteMany({});
  print("Users collection cleared.");

  // other collections
}

const users = [];

for (let i = 1; i <= USERS_COUNT; i++) {
  const login = `user${String(i).padStart(2, "0")}`;
  users.push(
    createUserObject({
      login,
      email: `${login}@mail.com`,
      name: `Name${i}`,
      surname: `Surname${i}`,
      phone:
        i % 3 === 0
          ? null
          : `48${(100000000 + i).toString().slice(0, 9)}`.slice(0, 16),
      createdDaysAgo: i,
    })
  );
}

for (const u of users) {
  dbRef.users.updateOne(
    { login: u.login },
    { $setOnInsert: u },
    { upsert: true }
  );
}

const count = dbRef.users.countDocuments();
print(`Users inserted: ${count}`);

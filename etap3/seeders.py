import logging
from datetime import datetime
import random
from typing import List, Optional, Sequence, Tuple

from faker import Faker
import psycopg2
import psycopg2.extras

from db import get_db_connection

fake = Faker('pl_PL')

logging.basicConfig(
    level=logging.INFO,         
    format='   %(levelname)s | %(message)s', 
    datefmt='%Y-%m-%d %H:%M:%S'        
)


class Seeder:
    def __init__(self, conn: psycopg2.extensions.connection):
        self.conn = conn

    def truncate(self, tables: Sequence[str]) -> None:
        if not self.conn:
            return
        with self.conn.cursor() as cur:
            for t in tables:
                cur.execute(f'TRUNCATE TABLE "{t}" RESTART IDENTITY CASCADE;')
        self.conn.commit()

    def truncate_all(self):
        with self.conn.cursor() as cur:
            logging.info("Truncating ALL tables with CASCADE (full reset)...")
            cur.execute("""
                DO $$
                DECLARE
                    t text;
                BEGIN
                    -- Loop through all user tables
                    FOR t IN
                        SELECT tablename
                        FROM pg_tables
                        WHERE schemaname = 'public'
                    LOOP
                        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE;', t);
                    END LOOP;
                END $$;
            """)
            self.conn.commit()
        logging.info("All tables truncated successfully (CASCADE mode)")


    def _ids_from_result_or_select(self, cur: psycopg2.extensions.cursor, result, table: str, expected_count: Optional[int] = None) -> List[int]:
        if result:
            return [row[0] for row in result]
        if expected_count:
            cur.execute(f'SELECT id FROM "{table}" ORDER BY id DESC LIMIT %s;', (expected_count,))
            rows = cur.fetchall()
            return [row[0] for row in reversed(rows)]
        cur.execute(f'SELECT id FROM "{table}";')
        rows = cur.fetchall()
        return [row[0] for row in rows]

    # ==== TOMEK ====

    def seed_courses(self, num: int = 100) -> List[int]:
        if not self.conn:
            return []

        courses_data: List[Tuple] = []
        now = datetime.now()
        for _ in range(num):
            courses_data.append((
                f"{fake.word().capitalize()} z {fake.word()}ami",
                fake.paragraph(nb_sentences=4),
                round(random.uniform(20.0, 85.0), 2),
                round(random.uniform(5, 50), 2),
                random.randint(200, 1200),
                round(random.uniform(10, 150), 2),
                round(random.uniform(5, 70), 2),
                now,
                now
            ))

        sql = """
            INSERT INTO "course"
                (name, description, price, protein_100g, calories_100g,
                 carbohydrates_100g, fat_100g, created_at, updated_at)
            VALUES %s
            RETURNING course_id;
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "course" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, courses_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, "course", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {str(num)} courses")
                return ids
        except Exception:
            self.conn.rollback()
            logging.error("Failed to add courses")
            raise

    def seed_ingredients(self, num: int = 150) -> List[int]:
        if not self.conn:
            return []

        possible_units = ['g', 'ml', 'kg', 'l', 'piece']
        ingredients_data: List[Tuple] = []
        for _ in range(num):
            ingredients_data.append((
                fake.word(),
                fake.sentence(nb_words=6),
                random.randint(10, 500),
                random.choice(possible_units),
                round(random.uniform(0, 30), 2),
                round(random.uniform(0, 60), 2),
                round(random.uniform(0, 100), 2)
            ))

        sql = """
            INSERT INTO "ingredient"
                (name, description, calories_100g, unit_of_measure, protein_100g, fat_100g, carbohydrates_100g)
            VALUES %s
            RETURNING ingredient_id;
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "ingredient" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, ingredients_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, "ingredient", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {str(num)} ingredients")
                return ids
        except Exception:
            self.conn.rollback()
            logging.error("Failed to add ingredients")
            raise

    def seed_course_ingredient_relations(self, course_ids: Sequence[int], ingredient_ids: Sequence[int],
                                         min_per_course: int = 3, max_per_course: int = 8) -> int:
        if not self.conn or not course_ids or not ingredient_ids:
            return 0

        relations = set()
        for course_id in course_ids:
            k = random.randint(min_per_course, max_per_course)
            chosen = random.sample(ingredient_ids, k=min(k, len(ingredient_ids)))
            for ing_id in chosen:
                relations.add((course_id, ing_id))

        sql = 'INSERT INTO "course_ingredient" (course_id, ingredient_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                inserted = 0
                if relations:
                    psycopg2.extras.execute_values(cur, sql, list(relations))
                    inserted = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {str(len(relations))} coures ingredient relations")
                return inserted
        except Exception:
            self.conn.rollback()
            logging.error("Failed to add course ingredient relations")
            raise

    def seed_allergens(self, allergen_names: Optional[Sequence[str]] = None) -> List[int]:
        if not self.conn:
            return []

        if allergen_names is None:
            allergen_names = [
                'Gluten', 'Skorupiaki', 'Jaja', 'Ryby', 'Orzechy arachidowe',
                'Soja', 'Mleko (lakxtoza)', 'Orzechy', 'Seler', 'Gorczyca',
                'Nasiona sezamu', 'Dwutlenek siarki i siarczyny', 'Łubin', 'Mięczaki'
            ]

        data = [(name, fake.sentence(nb_words=8)) for name in allergen_names]
        sql = 'INSERT INTO "allergen" (name, description) VALUES %s RETURNING allergen_id;'

        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "allergen" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, "allergen", expected_count=len(allergen_names))
                self.conn.commit()
                logging.info(f"Added {str(len(data))} allergens")
                return ids
                
        except Exception:
            self.conn.rollback()
            logging.error("Failed to add allergens")
            raise

    def seed_allergen_ingredient_relations(self, ingredient_ids: Sequence[int],
                                           allergen_ids: Sequence[int], probability: float = 0.20) -> int:
        if not self.conn or not ingredient_ids or not allergen_ids:
            return 0

        relations = set()
        for ing_id in ingredient_ids:
            if random.random() < probability:
                relations.add((random.choice(allergen_ids), ing_id))

        sql = 'INSERT INTO "allergen_ingredient" (allergen_id, ingredient_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                inserted = 0
                if relations:
                    psycopg2.extras.execute_values(cur, sql, list(relations))
                    inserted = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {str(len(relations))} allergen ingredient relations")
                return inserted
        except Exception:
            self.conn.rollback()
            logging.error("Failed to add allergen ingredient relations")
            raise

    # ===== BARTOSH =====
    def _seed_addresses(self, num = 1000):
        if not self.conn:
            return []
        
        addresses_data: List[Tuple] = []

        for _ in range(num):
            addresses_data.append((
                fake.country(),                                                             # country
                fake.region() if random.random() > 0.3 else None,                           # region
                fake.postcode(),                                                            # postal_code
                fake.city(),                                                                # city
                fake.street_name(),                                                         # street name
                str(random.randint(1, 200)),                                                # street number
                str(random.randint(1, 100)) if random.random() > 0.5 else None,             # apartment
            ))
        
        sql_query = """
            INSERT INTO "address"
                (country, region, postal_code, city, street_name, street_number, apartment)
            VALUES %s
            RETURNING address_id;
        """

        try:
            with self.conn.cursor() as cursor:
                # cursor.execute('TRUNCATE TABLE "address" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cursor, sql_query, addresses_data, fetch=True)
                ids = self._ids_from_result_or_select(cursor, inserted, "address", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {num} addresses")
                return ids

        except Exception as e:
            logging.error(f"Failed to add addresses due to: {e}")
            self.conn.rollback()
            raise

    def _seed_users(self, num = 1000):
        if not self.conn:
            return []
        
        users_data: List[Tuple] = []
        logins = set()
        emails = set()

        while len(users_data) < num:
            login = fake.user_name()
            email = fake.email()
            if login in logins or email in emails:
                continue

            logins.add(login)
            emails.add(email)

            date_created = fake.date_between(start_date='-5y', end_date='today')
            
            users_data.append((
                login,                                                       # login (unique username)
                email,                                                           # email (unique)
                fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True),  # password_hash (just fake string)
                fake.first_name(),                                                      # name
                fake.last_name(),                                                       # lastname
                fake.phone_number() if random.random() > 0.2 else None,                 # phone_number (optional)
                date_created,                                                           # date_created
                fake.date_between(start_date=date_created, end_date='today') if random.random() < 0.2 else None,
                    # date_removed (optional)
                fake.date_time_between(start_date=date_created, end_date='now') if random.random() < 0.8 else None
                    # last login
            ))

        sql_query = """
            INSERT INTO "user"
                (login, email, password_hash, name, surname, phone_number, date_created, date_removed, last_login)
            VALUES %s
            RETURNING user_id;
        """

        try:
            with self.conn.cursor() as cursor:
                # cursor.execute('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cursor, sql_query, users_data, fetch=True)
                ids = self._ids_from_result_or_select(cursor, inserted, "user", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {num} users")
                return ids

        except Exception as e:
            logging.error(f"Failed to add users due to: {e}")
            self.conn.rollback()
            raise

    def _seed_customers(self, users_ids):
        if not self.conn:
            return []
        
        sql_query = """
            INSERT INTO "customer"
                (user_id)
            VALUES %s
            RETURNING customer_id;
        """
        
        customers_data: List[Tuple] = []

        for user_id in users_ids:
            customers_data.append((user_id,))

        try:
            with self.conn.cursor() as cursor:
                # cursor.execute('TRUNCATE TABLE "customer" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cursor, sql_query, customers_data, fetch=True)
                ids = self._ids_from_result_or_select(cursor, inserted, "customer")
                self.conn.commit()
                logging.info(f"Added {len(ids)} customers")
                return ids

        except Exception as e:
            logging.error(f"Failed to add customers due to: {e}")
            self.conn.rollback()
            raise

    def _seed_customer_addresses(self, customer_addresses_data):
        if not self.conn or not customer_addresses_data:
            return 0

        sql_query = 'INSERT INTO "customer_address" (customer_id, address_id) VALUES %s'

        try:
            with self.conn.cursor() as cursor:
                psycopg2.extras.execute_values(cursor, sql_query, customer_addresses_data)
                self.conn.commit()
                logging.info(f"Added {len(customer_addresses_data)} customer addresses")

        except Exception as e:
            logging.error(f"Failed to add customer addresses due to: {e}")
            self.conn.rollback()
            raise

    def _assing_default_address_to_customer(self, customer_id, default_address_id, should_log = False):
        if not self.conn:
            return
        
        sql_query = """
            UPDATE "customer" c
            SET default_address_id = %s
            WHERE c.customer_id = %s
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute(sql_query, (default_address_id, customer_id))
            self.conn.commit()
            if should_log: 
                logging.info(f"Set default address {default_address_id} for customer {customer_id}")
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to set default address for customer {customer_id}: {e}")
            raise

    def seed_customers_with_addresses(self, num = 1000):
        if not self.conn:
            return []
        
        users_ids = self._seed_users(num)
        addresses_ids = self._seed_addresses(int(num * 3))
        customers_ids = self._seed_customers(users_ids)
        
        customer_addresses_data = []
        for customer_id in customers_ids:
            if random.random() > 0.2:
                addresses_count = random.randint(0, 5) 
                unique_addresses_ids = random.sample(addresses_ids, addresses_count)

                for address_id in unique_addresses_ids:
                    customer_addresses_data.append((
                        customer_id,
                        address_id
                    ))

                if len(unique_addresses_ids) > 0 and random.random() > 0.2:
                    default_address_id = random.choice(unique_addresses_ids)
                    self._assing_default_address_to_customer(customer_id=customer_id, default_address_id=default_address_id)

        self._seed_customer_addresses(customer_addresses_data)

        return customers_ids
    
    def _seed_orders_without_items(self, num, customers_ids):
        if not self.conn or not customers_ids:
            return []

        order_statuses = ['accepted', 'in progress', 'awaiting delivery', 'in delivery', 'delivered']
        orders_data: List[Tuple] = []

        for _ in range(num):
            vat_rate = round(random.choice([0.05, 0.08, 0.23]), 2)
            net_total = round(random.uniform(50, 500), 2)
            vat_total = round(net_total * vat_rate, 2)
            gross_total = round(net_total + vat_total, 2)

            orders_data.append((
                random.choice(order_statuses),                               # status
                vat_rate,                                                    # vat_rate
                vat_total,                                                   # vat_total
                net_total,                                                   # net_total
                gross_total,                                                 # gross_total
                fake.date_time_between(start_date='-2y', end_date='now'),    # placed_at
                random.choice(customers_ids)                                 # customer_id
            ))

        sql_query = """
            INSERT INTO "order"
                (status, vat_rate, vat_total, net_total, gross_total, placed_at, customer_id)
            VALUES %s
            RETURNING order_id;
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "order" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql_query, orders_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, "order", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {len(ids)} orders (without items)")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add orders: {e}")
            raise


    def seed_orders(self, customers_ids, how_much_with_order = 0.8):
        num = int(how_much_with_order * len(customers_ids))
        customers_with_orders_ids = random.sample(customers_ids, num)
        orders_ids = self._seed_orders_without_items(num, customers_with_orders_ids)

def main():
    conn = get_db_connection()
    if not conn:
        print("Brak połączenia z bazą danych.")
        return

    seeder = Seeder(conn)

    seeder.truncate_all()

    try:
        # Tomek
        course_ids = seeder.seed_courses(100)
        ingredient_ids = seeder.seed_ingredients(200)

        seeder.seed_course_ingredient_relations(course_ids, ingredient_ids)
        allergen_ids = seeder.seed_allergens()
        seeder.seed_allergen_ingredient_relations(ingredient_ids, allergen_ids)

        # Bartosh
        customers_ids = seeder.seed_customers_with_addresses(1000)
        seeder.seed_orders(customers_ids=customers_ids)

    finally:
        conn.close()


if __name__ == "__main__":
    main()

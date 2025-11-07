import logging
from datetime import datetime, timedelta
import random
import re
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

    def seed_preferences(self, customer_ids: Sequence[int], ingredient_ids: Sequence[int]) -> int:
        if not self.conn or not customer_ids or not ingredient_ids:
            return 0

        preferences_data = []
        for customer_id in customer_ids:
            num_prefs = random.randint(0, 100)
            k = min(num_prefs, len(ingredient_ids))
            chosen_ingredient_ids = random.sample(ingredient_ids, k=k)
            
            for ingredient_id in chosen_ingredient_ids:
                rating = random.randint(1, 5)
                preferences_data.append((customer_id, ingredient_id, rating))

        sql = 'INSERT INTO "preference" (customer_id, ingredient_id, rating) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                psycopg2.extras.execute_values(cur, sql, preferences_data)
                inserted_count = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {inserted_count} preferences")
                return inserted_count
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add preferences: {e}")
            raise

    def seed_opinions(self, customer_ids: Sequence[int], course_ids: Sequence[int], num: int = 1500) -> int:
        if not self.conn or not customer_ids or not course_ids:
            return 0

        opinions_data = []
        used_combinations = set()
        
        max_possible_opinions = len(customer_ids) * len(course_ids)
        num_to_generate = min(num, max_possible_opinions)

        while len(opinions_data) < num_to_generate:
            customer_id = random.choice(customer_ids)
            course_id = random.choice(course_ids)

            if (customer_id, course_id) in used_combinations:
                continue

            used_combinations.add((customer_id, course_id))
            
            rating = random.randint(1, 5) 
            opinion_text = fake.sentence(nb_words=10) if random.random() < 0.75 else None
            
            opinions_data.append((course_id, customer_id, rating, opinion_text))

        sql = 'INSERT INTO "opinion" (course_id, customer_id, rating, opinion) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                psycopg2.extras.execute_values(cur, sql, opinions_data)
                inserted_count = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {inserted_count} opinions")
                return inserted_count
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add opinions: {e}")
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
                inserted = psycopg2.extras.execute_values(cursor, sql_query, addresses_data, fetch=True)
                ids = self._ids_from_result_or_select(cursor, inserted, "address", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {num} addresses")
                return ids

        except Exception as e:
            logging.error(f"Failed to add addresses due to: {e}")
            self.conn.rollback()
            raise

    def _normalize_phone(self, raw: str) -> Optional[str]:
        if not raw:
            return None
        digits = re.sub(r'\D', '', raw)   # wywal wszystko poza cyframi
        if not digits:
            return None
        # Jeżeli zaczyna się od 48, potraktuj to jako PL z plusikiem
        if digits.startswith('48'):
            e164 = '+' + digits
        else:
            # jak chcesz mieć bardziej „smart”, dorzuć logikę krajów;
            # na szybko: dodaj plusa i jedziemy
            e164 = '+' + digits
        # minimalnie 7 cyfr sensownie
        return e164 if 7 <= len(digits) <= 15 else None

    def _seed_users(self, num = 1000):
        if not self.conn:
            return []
        
        users_data: List[Tuple] = []
        logins = set()
        emails = set()

        while len(users_data) < num:
            login = fake.unique.user_name()
            email = fake.unique.email()
            if login in logins or email in emails:
                continue

            logins.add(login)
            emails.add(email)
            phone_raw = fake.phone_number() if random.random() > 0.2 else None
            phone = self._normalize_phone(phone_raw) if phone_raw else None

            date_created = fake.date_between(start_date='-5y', end_date='today')
            
            users_data.append((
                login,                                                       # login (unique username)
                email,                                                           # email (unique)
                fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True),  # password_hash (just fake string)
                fake.first_name(),                                                      # name
                fake.last_name(),                                                       # lastname
                phone,                                                                  # phone_number (optional)
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
        customers_with_addresses_ids = []
        for customer_id in customers_ids:
            if random.random() > 0.2:
                customers_with_addresses_ids.append(customer_id)

                addresses_count = random.randint(1, 5) 
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

        return customers_with_addresses_ids
    
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
            RETURNING order_id, customer_id;
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "order" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql_query, orders_data, fetch=True)
                orders_ids = [row[0] for row in inserted]
                customers_ids = [row[1] for row in inserted]
                self.conn.commit()
                logging.info(f"Added {len(orders_ids)} orders")
                return orders_ids, customers_ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add orders: {e}")
            raise

    def _get_customer_addresses(self, customer_id):
        if not self.conn:
            return []

        sql_query = """
            SELECT address_id
            FROM "customer_address"
            WHERE customer_id = %s;
        """

        try:
            with self.conn.cursor() as cur:
                cur.execute(sql_query, (customer_id,))
                rows = cur.fetchall()
                return [row[0] for row in rows]
        except Exception as e:
            logging.error(f"Failed to fetch addresses for customer {customer_id}: {e}")
            self.conn.rollback()
            return []

    def __seed_order_items(self, order_id, items_count, user_addresses, should_log = False):
        if not self.conn or not order_id or not user_addresses or len(user_addresses) <= 0 or items_count <= 0:
            return []

        sql_query = """
            INSERT INTO order_item 
                (expected_delivery_at, order_id, delivery_address)
            VALUES %s
            RETURNING order_item_id;
        """

        order_items_data = []
        for _ in range(items_count):
            order_items_data.append((
                fake.date_between(start_date="+1d", end_date="+30d"),
                order_id,
                random.choice(user_addresses),
            ))
      
        try:
            with self.conn.cursor() as cursor:
                inserted = psycopg2.extras.execute_values(cursor, sql_query, order_items_data, fetch = True)
                order_items_ids =  [row[0] for row in inserted]
                self.conn.commit()
                if should_log:
                    logging.info(f"Added {len(order_items_data)} order items")
                return order_items_ids

        except Exception as e:
            logging.error(f"Failed to add  order items due to: {e}")
            self.conn.rollback()
            raise

    def seed_orders(self, customers_with_addresses_ids, how_much_with_order = 0.8, min_items = 1, max_items = 15):
        num = int(how_much_with_order * len(customers_with_addresses_ids))
        customers_with_orders_ids = random.sample(customers_with_addresses_ids, num)
        orders_ids, customers_ids = self._seed_orders_without_items(num, customers_with_orders_ids)

        order_items_ids = []
        for order_id, customer_id in zip(orders_ids, customers_ids):
            items_count = random.randint(min_items, max_items)

            user_addresses = self._get_customer_addresses(customer_id)

            order_items_ids.extend(self.__seed_order_items(order_id, items_count, user_addresses))

        return orders_ids, order_items_ids
 
    def _generate_pl_nip(self, with_prefix: bool = False) -> str:
        weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
        while True:
            digits = [random.randint(0, 9) for _ in range(9)]
            checksum = sum(w * d for w, d in zip(weights, digits)) % 11
            if checksum == 10:
                continue 
            nip_digits = digits + [checksum]
            nip_str = ''.join(str(d) for d in nip_digits)
            return f"PL{nip_str}" if with_prefix else nip_str

    def seed_invoices(self, orders_ids, invoice_rate = 0.5):
        if not self.conn or not orders_ids or len(orders_ids) <= 0:
            return []
        
        invoices_count = int(len(orders_ids) * invoice_rate)
        orders_with_invoices_ids = random.sample(orders_ids, invoices_count)

        sql_query = """
        INSERT INTO invoice 
            (invoice_number, status, seller_name, seller_vat_id, buyer_name, buyer_vat_id, currency, payment_method, payment_terms,
            sale_date, payment_date, issue_date, vat_rate, net_total, vat_total, gross_total, order_id)
        VALUES %s
        """

        invoices_data = []
        for order_id in orders_with_invoices_ids:
            net_total = round(random.uniform(50, 1000), 2)
            vat_rate = round(random.choice([0.05, 0.08, 0.23]), 4)
            vat_total = round(net_total * vat_rate, 2)
            gross_total = round(net_total + vat_total, 2)
            
            sale_date = fake.date_between(start_date='-30d', end_date='today')
            issue_date = fake.date_between(start_date=sale_date, end_date='today')

            status = random.choice(['issued', 'pending payment', 'paid', 'cancelled'])

            if status == 'paid':
                payment_date = fake.date_between(start_date=issue_date, end_date='today')
            else:
                payment_date = fake.date_between(start_date=issue_date, end_date=issue_date + timedelta(days=30))
            
            invoices_data.append((
                fake.unique.bothify(text='INV-#####'),          # invoice_number
                status,                                         # status
                fake.company(),                                 # seller_name
                self._generate_pl_nip(),                        # seller_vat_id (NIP)
                fake.name(),                                    # buyer_name
                self._generate_pl_nip(),                        # buyer_vat_id
                random.choice(['USD', 'EUR', 'PLN']),           # currency
                random.choice(['cash', 'card', 'transfer']),    # payment_method
                f"{random.randint(7, 30)} days",                # payment_terms
                sale_date,                                      # sale_date
                payment_date,                                   # payment_date
                issue_date,                                     # issue_date
                vat_rate,                                       # vat_rate
                net_total,                                      # net_total
                vat_total,                                      # vat_total
                gross_total,                                    # gross_total
                order_id                                        # order_id (assuming existing orders)
            ))

        try:
            with self.conn.cursor() as cursor:
                psycopg2.extras.execute_values(cursor, sql_query, invoices_data)
                self.conn.commit()
                logging.info(f"Added {len(invoices_data)} invoices")

        except Exception as e:
            logging.error(f"Failed to add invoices due to: {e}")
            self.conn.rollback()
            raise


    # ===== OLA =====
    def seed_category(self, category_names: Optional[Sequence[str]] = None) -> List[int]:
        if not self.conn:
            return []

        if category_names is None:
            category_names = [
                'Śniadanie', 'Drugie Śniadanie', 'Lunch', 'Obiad', 'Podwieczorek', 'Kolacja',
                'Deser', 'Na słodko', 'Na słono', 'Wegetariańskie', 'Wegańskie', 'Wysokoproteinowe',
                'Bez laktozy', 'Bez glutenu', 'Insulinooporność', 'FIT', 'Włoskie', 'Azjatyckie', 
                'Tajskie', 'Tradycyjne'
            ]

        category_data = [(name, fake.sentence(nb_words=8)) for name in category_names]
        
        sql = 'INSERT INTO "category" (name, description) VALUES %s RETURNING id;'
        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "category" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, category_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'category', expected_count=len(category_names))
                self.conn.commit()
                logging.info(f"Added {str(len(category_data))} categories")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add categories: {e}")
            raise

    def seed_course_category_relations(self, course_ids: Sequence[int], category_ids: Sequence[int], min_per_course: int = 0, max_per_course: int = 8) -> int:
        if not self.conn or not course_ids or not category_ids:
            return 0
        
        relations = set()
        for course in course_ids:
            k = random.randint(min_per_course, max_per_course)
            chosen = random.sample(category_ids, k=min(k, len(category_ids)))
            for category in chosen:
                relations.add((course, category))
        sql = 'INSERT INTO "course_category" (course_id, category_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                inserted = 0
                if relations:
                    psycopg2.extras.execute_values(cur, sql, list(relations))
                    inserted = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {str(len(relations))} course-category relations")
                return inserted
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add course_category relations: {e}")
            raise

    def seed_dieticians(self, num: int = 20, certification_names: Optional[Sequence[str]] = None) -> List[int]:
        if not self.conn:
            return []

        user_ids = self._seed_users(num)
        if not user_ids:
            return []
        
        if not certification_names:
            certification_names = [
                'Certyfikat', 'Studia wyższe', 'Ukonczony kurs', 'Praktyka własna', 'Certyfikacja kliniczna', 
                'Holistyczny coach', 'Zarejstrowany dietetyk', 'Dietetyk dzieci'
            ]
        
        try:
            with self.conn.cursor() as cur:
                data = [
                    (uid,  f"{random.choice(certification_names)} w {fake.city()}") 
                    for uid in user_ids
                ]
                
                sql = 'INSERT INTO "dietician" (id, certification) VALUES %s RETURNING id;'
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'dietician', expected_count=len(user_ids))
                self.conn.commit()
                logging.info(f"Added {len(ids)} dieticians")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add dieticians: {e}")
            raise

    def seed_meal_plans(self, num: int = 50, dietician_ids: Optional[Sequence[int]] = None, probability: float = 0.2) -> List[int]:
        if not self.conn:
            return []
        
        meal_plan_data = []
        for _ in range(num):
            start = fake.date_between(start_date='-90d', end_date='+30d')
            end = fake.date_between(start_date=start, end_date=start + timedelta(days=30))
            diet_id = random.choice(dietician_ids) if dietician_ids and random.random() > probability else None
            meal_plan_data.append((fake.word().capitalize() + ' plan', start, end, fake.sentence(nb_words=8), diet_id))

        sql = 'INSERT INTO "meal_plan" (name, start_date, end_date, description, dietician_id) VALUES %s RETURNING id;'
        try:
            with self.conn.cursor() as cur:
                inserted = psycopg2.extras.execute_values(cur, sql, meal_plan_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'meal_plan', expected_count=num)
                self.conn.commit()
                logging.info(f"Added {len(ids)} meal plans")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add meal plans: {e}")
            raise

    def seed_meal_plan_days_and_items(self, meal_plan_ids: Sequence[int], course_ids: Sequence[int], min_days: int = 3, max_days: int = 31,
                                      min_items: int = 1, max_items: int = 6) -> int:
        if not self.conn or not meal_plan_ids or not course_ids:
            return 0
        try:
            total_days = 0
            total_items = 0
            with self.conn.cursor() as cur:
                for mp_id in meal_plan_ids:
                    days = random.randint(min_days, max_days)
                    days_data = [(i + 1, mp_id) for i in range(days)]
                    if days_data:
                        sql_days = 'INSERT INTO "meal_plan_day" (day_number, meal_plan_id) VALUES %s RETURNING meal_plan_day_id;'
                        inserted_days = psycopg2.extras.execute_values(cur, sql_days, days_data, fetch=True)
                        day_ids = self._ids_from_result_or_select(cur, inserted_days, 'meal_plan_day', expected_count=days)
                        total_days += len(day_ids)

                        items_data = []
                        for day_id in day_ids:
                            k = random.randint(min_items, max_items)
                            chosen = random.sample(course_ids, k=min(k, len(course_ids)))
                            for seq, course_id in enumerate(chosen, start=1):
                                items_data.append((course_id, day_id, seq))

                        if items_data:
                            sql_items = 'INSERT INTO "meal_plan_item" (course_id, meal_plan_day_id, sequence) VALUES %s'
                            psycopg2.extras.execute_values(cur, sql_items, items_data)
                            total_items += len(items_data)

                self.conn.commit()
            logging.info(f"Added {total_days} meal plan days and {total_items} items")
            return total_items
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add meal plan days/items: {e}")
            raise


    def seed_daily_menus_and_items(self,  course_ids: Sequence[int], dietician_ids: Sequence[int], min_items: int = 3, max_items: int = 6, num_menus: int = 1000) -> List[int]:
        if not self.conn or not course_ids or not dietician_ids:
            return []
        try:
            with self.conn.cursor() as cur:
                start_date = datetime.now() - timedelta(days=num_menus/1.2)
                end_date = datetime.now() + timedelta(days=num_menus/1.4)
                menu_dates = [fake.unique.date_between(start_date=start_date, end_date=end_date) for _ in range(num_menus)]
                
                menus_data = []
                for d in menu_dates:
                    diet_id = random.choice(dietician_ids)
                    menus_data.append((diet_id, d))
                sql = 'INSERT INTO "daily_menu" (dietician_id, menu_date) VALUES %s RETURNING daily_menu_id;'
                inserted = psycopg2.extras.execute_values(cur, sql, menus_data, fetch=True)
                menu_ids = self._ids_from_result_or_select(cur, inserted, 'daily_menu', expected_count=num_menus)

                items_data = []
                for m_id in menu_ids:
                    k = random.randint(min_items, max_items)
                    chosen = random.sample(course_ids, k=min(k, len(course_ids)))
                    for seq, course_id in enumerate(chosen, start=1):
                        items_data.append((m_id, course_id, seq))

                if items_data:
                    sql_items = 'INSERT INTO "daily_menu_item" (menu_id, course_id, sequence) VALUES %s'
                    psycopg2.extras.execute_values(cur, sql_items, items_data)

                self.conn.commit()
                logging.info(f"Added {len(menu_ids)} daily menus and {len(items_data)} items")
                return menu_ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add daily menus/items: {e}")
            raise

    def seed_course_in_order_item(self, order_item_ids: Sequence[int], course_item_ids: Sequence[int], min_per_item: int = 1, max_per_item: int = 8) -> List[int]:
        if not self.conn or not order_item_ids or not course_item_ids:
            return []
        
        relations = set()
        for order in order_item_ids:
            k = random.randint(min_per_item, max_per_item)
            chosen = random.sample(course_item_ids, k=min(k, len(course_item_ids)))
            for dish in chosen:
                relations.add((dish, order))
        sql = 'INSERT INTO "course_in_order_item" (course_id, order_item_id) VALUES %s RETURNING id'
        try:
            with self.conn.cursor() as cur:
                course_in_order_ids = []
                if relations:
                    inserted = psycopg2.extras.execute_values(cur, sql, list(relations), fetch=True)
                    course_in_order_ids = self._ids_from_result_or_select(cur, inserted, 'course_in_order_item')
                self.conn.commit()
                logging.info(f"Added {str(len(course_in_order_ids))} course in order relations")
                return course_in_order_ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add course in order relations: {e}")
            raise


    def seed_complaints(self, course_in_order_items_ids: Sequence[int], probability: float = 0.01) -> int:
        if not self.conn or not course_in_order_items_ids:
            return 0
        try:
            complaints_inserted = 0
            with self.conn.cursor() as cur:
                complaints = []
                
                # POPRAWIONA LINIA: zmieniono '>' na '<', aby generować skargi z małym prawdopodobieństwem
                selected_ids = [cid for cid in course_in_order_items_ids if random.random() < probability]
                if not selected_ids:
                    logging.info("No complaints were generated based on the probability.")
                    return 0

                # Zapytanie SQL może zwracać mniej wierszy niż jest w `selected_ids`, jeśli dane są niespójne
                sql = '''
                    SELECT cioi.id, C.customer_id, o.placed_at
                    FROM "course_in_order_item" AS cioi
                    JOIN "order_item" oi ON cioi.order_item_id = oi.order_item_id
                    JOIN "order" o ON oi.order_id = o.order_id
                    JOIN "customer" c ON o.customer_id = c.customer_id
                    WHERE cioi.id = ANY(%s);
                '''
                cur.execute(sql, (selected_ids,))
                mapping = {row[0]: (row[1], row[2]) for row in cur.fetchall()}              
                
                for cio_id in selected_ids:
                    if cio_id not in mapping:
                        continue # Pomiń, jeśli nie znaleziono dopasowania w bazie danych
                    
                    cust_id, order_date = mapping[cio_id]
                    
                    date = fake.date_time_between(
                        start_date=order_date,
                        end_date=order_date + timedelta(days=random.randint(1, 14))
                    )
                    status = random.choice([
                        'submitted',
                        'under review',
                        'positively resolved',
                        'negatively resolved'
                    ])
                    desc = fake.sentence(nb_words=12)
                    refund = None
                    
                    resolution_date = None
                    if status in ('positively resolved', 'negatively resolved'):
                        resolution_date = fake.date_time_between(
                            start_date=date + timedelta(seconds=1), 
                            end_date=date + timedelta(days=random.randint(1, 64))
                        )
                        if status == 'positively resolved':
                            refund = round(random.uniform(0, 1000), 2)

                    complaints.append((
                        cust_id,
                        cio_id,
                        date, 
                        status,
                        desc,
                        refund,
                        resolution_date
                    ))

                if complaints:
                    sql_complaint = '''
                        INSERT INTO "complaint" (customer_id, course_in_order_id, date, status, description, refund_amount, resolution_date)
                        VALUES %s;
                    '''
                    psycopg2.extras.execute_values(cur, sql_complaint, complaints)
                    complaints_inserted = len(complaints)

                self.conn.commit()
                logging.info(f"Added {complaints_inserted} complaints")
                return complaints_inserted

        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add complaints: {e}")
            raise
  
    # ===== MARIUSZ =====
    def seed_cooks(self, num: int = 50) -> List[int]:
        if not self.conn:
            return []
        
        user_ids = self._seed_users(num)
        if not user_ids:
            return []
        cook_data = [(uid,) for uid in user_ids]
        sql = 'INSERT INTO "cook" (cook_id) VALUES %s RETURNING cook_id;'
        
        try:
            with self.conn.cursor() as cur:
                inserted = psycopg2.extras.execute_values(cur, sql, cook_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'cook', expected_count=len(user_ids))
                self.conn.commit()
                logging.info(f"Added {len(ids)} cooks")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add cooks: {e}")
            raise

    def seed_couriers(self, num: int = 50) -> List[int]:
        if not self.conn:
            return []
        user_ids = self._seed_users(num)
        if not user_ids:
            return []
        courier_data = [(uid,) for uid in user_ids]
        sql = 'INSERT INTO "courier" (courier_id) VALUES %s RETURNING courier_id;'
        try:
            with self.conn.cursor() as cur:
                inserted = psycopg2.extras.execute_values(cur, sql, courier_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'courier', expected_count=len(user_ids))
                self.conn.commit()
                logging.info(f"Added {len(ids)} couriers")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add couriers: {e}")
            raise

    def seed_courier_types(self, type_names: Optional[Sequence[str]] = None) -> List[int]:
        if not self.conn:
            return []
        
        if type_names is None:
            type_names = ['Rower', 'Hulajnoga', 'Motor', 'Samochód', 'Pieszo']

        data = [(name,) for name in type_names]
        sql = 'INSERT INTO "courier_type" (name) VALUES %s RETURNING courier_type_id;'
        
        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "courier_type" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'courier_type', expected_count=len(type_names))
                self.conn.commit()
                logging.info(f"Added {len(ids)} courier types")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add courier types: {e}")
            raise

    def seed_specialties(self, specialty_names: Optional[Sequence[str]] = None) -> List[int]:
        if not self.conn:
            return []

        if specialty_names is None:
            specialty_names = ['Włoska', 'Azjatycka', 'Meksykańska', 'Polska', 'Wege', 'Desery']
        
        data = [(name,) for name in specialty_names]
        sql = 'INSERT INTO "specialty" (name) VALUES %s RETURNING id;'
        
        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "specialty" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'specialty', expected_count=len(specialty_names))
                self.conn.commit()
                logging.info(f"Added {len(ids)} specialties")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add specialties: {e}")
            raise

    def seed_courier_types_relations(self, courier_ids: Sequence[int], type_ids: Sequence[int], min_types: int = 1, max_types: int = 3) -> int:
        if not self.conn or not courier_ids or not type_ids:
            return 0

        relations = set()
        for courier_id in courier_ids:
            k = random.randint(min_types, max_types)
            chosen_types = random.sample(type_ids, k=min(k, len(type_ids)))
            for type_id in chosen_types:
                relations.add((courier_id, type_id))

        sql = 'INSERT INTO "courier_types" (courier_id, courier_type_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                inserted_count = 0
                if relations:
                    psycopg2.extras.execute_values(cur, sql, list(relations))
                    inserted_count = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {inserted_count} courier-type relations")
                return inserted_count
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add courier-type relations: {e}")
            raise

    def seed_cook_specialty_relations(self, cook_ids: Sequence[int], specialty_ids: Sequence[int], min_specialties: int = 1, max_specialties: int = 4) -> int:
        if not self.conn or not cook_ids or not specialty_ids:
            return 0

        relations = set()
        for cook_id in cook_ids:
            k = random.randint(min_specialties, max_specialties)
            chosen_specialties = random.sample(specialty_ids, k=min(k, len(specialty_ids)))
            for specialty_id in chosen_specialties:
                relations.add((specialty_id, cook_id))

        sql = 'INSERT INTO "cook_speciality" (specialty_id, cook_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                inserted_count = 0
                if relations:
                    psycopg2.extras.execute_values(cur, sql, list(relations))
                    inserted_count = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {inserted_count} cook-specialty relations")
                return inserted_count
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add cook-specialty relations: {e}")
            raise

    def seed_administrators(self, num: int = 5) -> List[int]:
        if not self.conn:
            return []
        user_ids = self._seed_users(num)
        if not user_ids:
            return []
        admin_data = []
        for uid in user_ids:
            date_granted = fake.date_between(start_date='-5y', end_date='-30d')
            date_revoked = fake.date_between(start_date=date_granted, end_date='today') if random.random() < 0.1 else None
            admin_data.append((uid, date_granted, date_revoked))
        sql = 'INSERT INTO "administrator" (user_id, date_granted, date_revoked) VALUES %s RETURNING user_id;'
        try:
            with self.conn.cursor() as cur:
                inserted = psycopg2.extras.execute_values(cur, sql, admin_data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'administrator', expected_count=len(user_ids))
                self.conn.commit()
                logging.info(f"Added {len(ids)} administrators")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add administrators: {e}")
            raise

    def seed_fulfillment_statuses(self) -> List[int]:
        if not self.conn:
            return []
        status_names = ['Pending', 'In Preparation', 'Ready for Delivery', 'Cancelled']
        data = [(name,) for name in status_names]
        sql = 'INSERT INTO "order_item_fulfillment_status" (name) VALUES %s RETURNING id;'
        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "order_item_fulfillment_status" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'order_item_fulfillment_status', expected_count=len(status_names))
                self.conn.commit()
                logging.info(f"Added {len(ids)} fulfillment statuses")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add fulfillment statuses: {e}")
            raise

    def seed_delivery_statuses(self) -> List[int]:
        if not self.conn:
            return []
        status_names = ['Pending Pickup', 'Picked Up', 'En Route', 'Delivered', 'Failed Delivery']
        data = [(name,) for name in status_names]
        sql = 'INSERT INTO "order_item_delivery_status" (name) VALUES %s RETURNING id;'
        try:
            with self.conn.cursor() as cur:
                cur.execute('TRUNCATE TABLE "order_item_delivery_status" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cur, sql, data, fetch=True)
                ids = self._ids_from_result_or_select(cur, inserted, 'order_item_delivery_status', expected_count=len(status_names))
                self.conn.commit()
                logging.info(f"Added {len(ids)} delivery statuses")
                return ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add delivery statuses: {e}")
            raise

    def seed_order_item_fulfillment_and_delivery(self, order_item_ids: Sequence[int], cook_ids: Sequence[int], courier_ids: Sequence[int], fulfillment_status_ids: Sequence[int], delivery_status_ids: Sequence[int]) -> Tuple[int, int]:
        if not self.conn or not order_item_ids:
            return 0, 0
        fulfillment_data = []
        delivery_data = []
        status_map_fulfillment = {
            'Pending': 1, 'In Preparation': 2, 'Ready for Delivery': 3, 'Cancelled': 4
        }
        status_map_delivery = {
            'Pending Pickup': 1, 'Picked Up': 2, 'En Route': 3, 'Delivered': 4, 'Failed Delivery': 5
        }
        for item_id in order_item_ids:
            cook_id = random.choice(cook_ids) if cook_ids else None
            current_fulfillment_status = random.choice(list(status_map_fulfillment.keys()))
            f_status_id = status_map_fulfillment[current_fulfillment_status]
            began_at = fake.date_time_between(start_date='-7d', end_date='now')
            completed_at = None
            if current_fulfillment_status in ['Ready for Delivery', 'Cancelled']:
                completed_at = fake.date_time_between(start_date=began_at, end_date='now')

            last_updated_at = completed_at if completed_at else began_at
            fulfillment_data.append((
                cook_id, item_id, f_status_id, began_at, completed_at, last_updated_at, fake.word() if random.random() < 0.1 else None
            ))
            if current_fulfillment_status == 'Ready for Delivery':
                courier_id = random.choice(courier_ids) if courier_ids else None
                current_delivery_status = random.choice(list(status_map_delivery.keys()))
                d_status_id = status_map_delivery[current_delivery_status]

                began_at = fake.date_time_between(start_date='-7d', end_date='now')
                completed_at = None
                if current_fulfillment_status in ['Ready for Delivery', 'Cancelled']:
                    # Ensure completed_at is after began_at, if it's generated
                    completed_at = fake.date_time_between(start_date=began_at + timedelta(seconds=1), end_date='now')

                last_updated_at = completed_at if completed_at else began_at


                delivery_data.append((
                    courier_id, item_id, d_status_id, began_at, completed_at, last_updated_at, fake.word() if random.random() < 0.1 else None
                ))
        sql_fulfillment = """
            INSERT INTO "order_item_fulfillment" (cook_id, order_item_id, status_id, began_at, completed_at, last_updated_at, notes)
            VALUES %s
        """
        sql_delivery = """
            INSERT INTO "order_item_delivery" (courier_id, order_item_id, status_id, began_at, delivered_at, last_updated, notes)
            VALUES %s
        """
        try:
            with self.conn.cursor() as cur:
                f_count = 0
                if fulfillment_data:
                    psycopg2.extras.execute_values(cur, sql_fulfillment, fulfillment_data)
                    f_count = cur.rowcount
                d_count = 0
                if delivery_data:
                    psycopg2.extras.execute_values(cur, sql_delivery, delivery_data)
                    d_count = cur.rowcount
                self.conn.commit()
                logging.info(f"Added {f_count} fulfillment records and {d_count} delivery records")
                return f_count, d_count
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to seed fulfillment/delivery: {e}")
            raise
            
    def get_order_item_ids(self) -> List[int]:
        if not self.conn:
            return []
        sql = 'SELECT order_item_id FROM "order_item";'
        try:
            with self.conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
                ids = [row[0] for row in rows]
                logging.info(f"Fetched {len(ids)} order item IDs")
                return ids
        except Exception as e:
            logging.error(f"Failed to fetch order item IDs: {e}")
            self.conn.rollback()
            return []



def main():
    conn = get_db_connection()
    if not conn:
        print("Brak połączenia z bazą danych.")
        return

    seeder = Seeder(conn)

    #coment it if script doesn't work
    seeder.truncate_all() # it doesn't work for me

    try:
        # Tomek
        course_ids = seeder.seed_courses(150)
        ingredient_ids = seeder.seed_ingredients(1000)

        seeder.seed_course_ingredient_relations(course_ids, ingredient_ids)
        allergen_ids = seeder.seed_allergens()
        seeder.seed_allergen_ingredient_relations(ingredient_ids, allergen_ids)

        # Bartosh
        customers_with_addresses_ids = seeder.seed_customers_with_addresses(5000)
        orders_ids, order_items_ids = seeder.seed_orders(customers_with_addresses_ids=customers_with_addresses_ids)
        seeder.seed_invoices(orders_ids=orders_ids)

        if customers_with_addresses_ids and ingredient_ids:
            seeder.seed_preferences(customers_with_addresses_ids, ingredient_ids)
        if customers_with_addresses_ids and course_ids:
            seeder.seed_opinions(customers_with_addresses_ids, course_ids, num=10000)

        # Ola
        course_in_order_item_ids = seeder.seed_course_in_order_item(order_items_ids, course_ids)
        category_ids = seeder.seed_category()
        seeder.seed_course_category_relations(course_ids, category_ids)
        
        dietician_ids = seeder.seed_dieticians()
        
        meal_plan_ids = seeder.seed_meal_plans(dietician_ids=dietician_ids)
        seeder.seed_meal_plan_days_and_items(meal_plan_ids, course_ids)
        
        seeder.seed_daily_menus_and_items(course_ids, dietician_ids)
        
        seeder.seed_complaints(course_in_order_item_ids) 
        
        # Mariusz
        cook_ids = seeder.seed_cooks(25)
        courier_ids = seeder.seed_couriers(30)
        seeder.seed_administrators(5)
        
        fulfillment_status_ids = seeder.seed_fulfillment_statuses()
        delivery_status_ids = seeder.seed_delivery_statuses()

        courier_type_ids = seeder.seed_courier_types()
        specialty_ids = seeder.seed_specialties()

        seeder.seed_courier_types_relations(courier_ids, courier_type_ids)
        seeder.seed_cook_specialty_relations(cook_ids, specialty_ids)
        
        seeder.seed_order_item_fulfillment_and_delivery(
            seeder.get_order_item_ids(), 
            cook_ids, 
            courier_ids, 
            fulfillment_status_ids, 
            delivery_status_ids
        )
    
    finally:
        conn.close()


if __name__ == "__main__":
    main()
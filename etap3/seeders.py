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
                psycopg2.extras.execute_values(cursor, sql_query, order_items_data)
                self.conn.commit()
                if should_log:
                    logging.info(f"Added {len(order_items_data)} addresses")

        except Exception as e:
            logging.error(f"Failed to add addresses due to: {e}")
            self.conn.rollback()
            raise

    def seed_orders(self, customers_with_addresses_ids, how_much_with_order = 0.8, min_items = 1, max_items = 15):
        num = int(how_much_with_order * len(customers_with_addresses_ids))
        customers_with_orders_ids = random.sample(customers_with_addresses_ids, num)
        orders_ids, customers_ids = self._seed_orders_without_items(num, customers_with_orders_ids)

        for order_id, customer_id in zip(orders_ids, customers_ids):
            items_count = random.randint(min_items, max_items)

            user_addresses = self._get_customer_addresses(customer_id)

            self.__seed_order_items(order_id, items_count, user_addresses)

        return orders_ids
 
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
        sql = 'INSERT INTO "course_in_order_item" (course_id, order_item_id) VALUES %s'
        try:
            with self.conn.cursor() as cur:
                if relations:
                    inserted = psycopg2.extras.execute_values(cur, sql, list(relations))
                    course_in_order_ids = self._ids_from_result_or_select(cur, inserted, 'course_in_order_item')
                self.conn.commit()
                logging.info(f"Added {str(len(course_in_order_ids))} course in order relations")
                return course_in_order_ids
        except Exception as e:
            self.conn.rollback()
            logging.error(f"Failed to add course in order relations: {e}")
            raise


    def seed_complaints(self, course_in_order_items_ids: Sequence[int], probability: float = 0.5) -> int:
        if not self.conn or not course_in_order_items_ids:
            return 0
        try:
            complaints_inserted = 0
            with self.conn.cursor() as cur:
                complaints = []
                
                selected_ids = [cid for cid in course_in_order_items_ids if random.random() > probability]
                if not selected_ids:
                    return 0

                sql = '''
                    SELECT C.customer_id, o.placed_at
                    FROM "customer" AS c
                    JOIN "order" o ON o.customer_id = c.customer_id
                    JOIN "order_item" oi ON oi.order_id = o.order_id
                    JOIN "course_in_order_item" cioi ON cioi.order_item_id = oi.order_item_id
                    WHERE cioi.id = ANY(%s);
                '''
                cur.execute(sql, (selected_ids,))
                mapping = cur.fetchall()                   
                
                for cio_id, (cust_id, order_date) in zip(selected_ids, mapping):
                    
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
                            start_date=date,
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
        course_ids = seeder.seed_courses(100)
        ingredient_ids = seeder.seed_ingredients(200)

        seeder.seed_course_ingredient_relations(course_ids, ingredient_ids)
        allergen_ids = seeder.seed_allergens()
        seeder.seed_allergen_ingredient_relations(ingredient_ids, allergen_ids)

        # Bartosh
        customers_with_addresses_ids = seeder.seed_customers_with_addresses(1000)
        orders_ids = seeder.seed_orders(customers_with_addresses_ids=customers_with_addresses_ids)
        seeder.seed_invoices(orders_ids=orders_ids)

        # Ola
        course_in_order_item_ids = seeder.seed_course_in_order_item(orders_ids, course_ids)
        category_ids = seeder.seed_category()
        seeder.seed_course_category_relations(course_ids, category_ids)
        
        dietician_ids = seeder.seed_dieticians()
        
        meal_plan_ids = seeder.seed_meal_plans(dietician_ids=dietician_ids)
        seeder.seed_meal_plan_days_and_items(meal_plan_ids, course_ids)
        
        seeder.seed_daily_menus_and_items(course_ids, dietician_ids)
        
        seeder.seed_complaints(course_in_order_item_ids) 
    
    finally:
        conn.close()


if __name__ == "__main__":
    main()

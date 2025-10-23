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
            RETURNING id;
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
            RETURNING id;
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
        sql = 'INSERT INTO "allergen" (name, description) VALUES %s RETURNING id;'

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
    def seed_addresses(self, num = 100000000):
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
            RETURNING id;
        """

        try:
            with self.conn.cursor() as cursor:
                cursor.execute('TRUNCATE TABLE "address" RESTART IDENTITY CASCADE;')
                inserted = psycopg2.extras.execute_values(cursor, sql_query, addresses_data, fetch=True)
                ids = self._ids_from_result_or_select(cursor, inserted, "course", expected_count=num)
                self.conn.commit()
                logging.info(f"Added {num} addresses")
                return ids

        except Exception as e:
            logging.error(f"Failed to add addresses due to: {e}")
            self.conn.rollback()
            raise

    


def main():
    conn = get_db_connection()
    if not conn:
        print("Brak połączenia z bazą danych.")
        return

    seeder = Seeder(conn)

    seeder.truncate(["course_ingredient", "allergen_ingredient", "course", "ingredient", "allergen"])

    try:
        # Tomek
        course_ids = seeder.seed_courses(100)
        ingredient_ids = seeder.seed_ingredients(200)

        seeder.seed_course_ingredient_relations(course_ids, ingredient_ids)
        allergen_ids = seeder.seed_allergens()
        seeder.seed_allergen_ingredient_relations(ingredient_ids, allergen_ids)

        # Bartosh
        seeder.seed_addresses(num = 1000)

    finally:
        conn.close()


if __name__ == "__main__":
    main()

Najważniejszym etapem projektowania bazy danych było zrozumienie logiki biznesowej, określenie procesów, obszarów, które należy uwzględnić, oraz tych, które można pominąć. Wszystkie decyzje podjęte w tym momencie miały wpływ na dalszą implementację bazy.


**Mocne strony (Strengths):**

- Baza przygotowana pod różne poziomy dostępu użytkowników.
- Umożliwia wykonywanie wielu zapytań zgodnych z logiką biznesową (klienci, zamówienia, płatności, dostawy, dania i ich składniki, alergie, preferencje, historia zamówień, płatności, opinie i reklamacje), które mogłyby wspomóc efektywną pracę firmy.
- Zastosowanie constraintów i typów ENUM zwiększa spójność danych.
    

**Słabe strony (Weaknesses):**

- Zbyt duże walidacja danych w bazie. Gdy dodajemy ograniczenia na poziomie aplikacji mamy większą swobodę, bo możemy łatwo dodawać nowe reguły, zmieniać je albo stosować różne walidacje w zależności od kontekstu biznesowego, bez ryzyka naruszenia istniejących danych w bazie.
- Brak kolumn `created`, `updated`, `deleted` utrudnia bezpieczne śledzenie zmian i przywracanie rekordów, danych których nie chcelibyśmy stracić np: klienci, zamówienia, płatności czy faktury.
- Brak UUID dla danych, które mogłyby być bezpiecznie udostępniane w API.
- Brak widoków i zmaterializowanych widoków dla kwerend, co mogłoby skrócić ich czas wykonania i złożoność.
    

**Szanse (Opportunities):**

- Możliwość rozbudowy o moduły magazynowe i logistyczne tj. zapasy składników, terminy przydatności czy planowanie tras dostaw. 
- Możliwość rozbudowy o szczegółowe dane pracowników oraz zaawansowane raportowanie finansowe.
- Wprowadzenie analityki sprzedaży i popularności dań na podstawie danych zgromadzonych w bazie.
- Automatyczne sugestie menu i planów żywieniowych na podstawie historii zamówień i preferencji klientów.
    

**Zagrożenia (Threats):**

- Brak UUID może prowadzić do narażenia danych klientów przy ewentualnym API.
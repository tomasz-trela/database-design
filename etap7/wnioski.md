# Etapy

Najważniejszym etapem projektowania bazy danych było dokładne ustalenie logiki biznesowej, co okazało się kluczowe dla sukcesu całego projektu. Określenie procesów, które należy uwzględnić w systemie, oraz wyodrębnienie obszarów, które można pominąć, okazało się nietrywalnym zadaniem. Na początku napotkaliśmy trudności w ustaleniu wspólnej, jednolitej wizji, co wynikało z różnorodności pomysłów i różnych interpretacji wybranej domeny. Wspólna wizja była fundamentem, na którym oparto dalszą implementację bazy danych. Wszystkie decyzje podjęte na tym etapie miały bezpośredni wpływ na strukturę bazy, jej wydajność oraz elastyczność w przyszłej rozbudowie.

Kolejnymi kluczowymi etapami były:

1. Projektowanie schematu bazy danych, które obejmowało ustalenie tabel, relacji między nimi oraz zależności logicznych, zapewniających integralność danych. Najtrudniesze na etapie okazało się precyzyjne ustalenie szczegółów implementacyjnych, np. czy używamy wielokrotnych kluczy głównych

2. Implementacja bazy danych, w której zrealizowano zaplanowaną strukturę, a także wprowadzono mechanizmy zapewniające poprawność danych (walidacje). Był to etap wymagający szczególnej dbałości o detale, ponieważ każda zmiana w strukturze miała potencjalny wpływ na dalsze działanie systemu. Trzeba było precyzjnie jakie sytuacje są możliwe i niemożliwe w naszej bazie danyc w zgodzie z ustalonymi wcześniej wymaganiami i ograniczeniami.

3. Stworzenie seederów, które zapełniają bazę danych określoną ilością nieprawdziwych, ale poprawnych danych. W tym celu zdecydowaliśmy skorzystać z biblitek języka Python - psycopg2 i Faker. Był to etap czasochłonny, musieliśmy pokryć ponad 30 tabel i spełnić wszystkie constrainty ustalone we wcześniejszym etapie.

4. Stworzenie przykładowych nietrywialnych kwerend - ten etap był dość prosty.

5. Analiza przebiegu i optymalizacja zapytań, stosując funkcję EXPLAIN i indeksów. Ten etap wymagał zrozumienia schmatów pozwalających przyspieszać skomplikowane kwerendy, kluczową umiejętność przy tworzeniu i rozwijaniu baz danych.

Każdy z tych etapów był uzależniony od wcześniejszych ustaleń i wymagał precyzyjnego dostosowania rozwiązań do specyfiki branży.

# Analiza SWOT

**Mocne strony (Strengths):**

- Spójny model dziedziny, dobrze odzwierciedlający złożoność procesów w firmie cateringowej, wspierając jej efektywną pracę.
- Moliwe wykonywanie wielu asynchronicznych zapytań przy duym obciążeniu zgodnych z logiką biznesową.
- Indeksowanie i inne zabiegi, zmiejszające czas najpopularniejszych zapytań
- Rozbudowane więzy intergralności, gwarantujące spójność i poprawność danych poprzez walidację
- Jasny podział użytkowników systemu (ról)
- Łatwość dalszego skalowania systemu, tj. dodawanie nowych funkcjonalności

**Słabe strony (Weaknesses):**

- Brak kolumn `created`, `updated`, `deleted` utrudnia bezpieczne śledzenie zmian i przywracanie rekordów, danych których nie chcelibyśmy stracić np: klienci, zamówienia, płatności czy faktury.
- Brak UUID dla danych, które nie są bezpiecznie udostępniane przez API.
- Brak widoków i zmaterializowanych widoków dla kwerend, co mogłoby skrócić ich czas wykonania i złożoność.
- Brak testów integracyjnych weryfikujących poprawność kwerend.
- Silnie związanie z technologią PostgreSQL tj. używanie typów ENUM, wyrażenia regularne w CHECK, co moe utrudnić ewentualną migrację do innych silników.

**Szanse (Opportunities):**

- Moliwość rozszerzenia projektu w kierunku hurtowni danych (np. prognoza przychodów, statystyki reklamacji czy zamówień).
- Możliwość rozbudowy systemu o moduły magazynowe i logistyczne tj. zapasy składników, terminy przydatności, rejestracja zakupów produktów czy planowanie tras dostaw.
- Automatyzacja planowania pracy kuchni i dostaw.
- Wprowadzenie automatycznych sugestii menu i planów żywieniowych na podstawie historii zamówień i preferencji klientów.

**Zagrożenia (Threats):**

- Brak UUID może prowadzić do narażenia bezpieczeństwa danych klientów podczas wymiany za pomocą API z wartstwą aplikacji.
- Duża ilość constraintów może utrudniać szybkie reagowanie na zmiany logiki biznesowej (dodając ograniczenia na poziomie aplikacji mamy większą swobodę, bo możemy łatwo dodawać nowe reguły, zmieniać je albo stosować różne walidacje w zależności od kontekstu biznesowego, bez ryzyka naruszenia istniejących danych w bazie).
- Seedery mogą nie odzwierciedać prawidłowo realistycznych scenariuszy, przez co wnioski dotyczące wydajności mogłyby być mylące i nieprawidłowe.

# Podsumowanie

Projekt bazy danych rozpoczął się od ustalenia logiki biznesowej, co miało kluczowy wpływ na całą implementację. Początkowe trudności w uzgodnieniu jednolitej wizji zostały przezwyciężone, a dalsze etapy, takie jak projektowanie schematu, implementacja walidacji, stworzenie seederów i optymalizacja zapytań, były ściśle powiązane z wymaganiami i specyfiką branży.

Analiza SWOT wskazała na mocne strony systemu, jak spójny model danych i solidne mechanizmy walidacyjne, ale także na obszary do poprawy, np. brak UUID czy zmaterializowanych widoków. Istnieje wiele możliwości rozwoju, np. w kierunku hurtowni danych czy automatyzacji procesów, jednak należy także uwzględnić zagrożenia związane z wydajnością i zależnością od PostgreSQL.

Projekt stanowi solidną bazę do dalszego rozwoju systemu.

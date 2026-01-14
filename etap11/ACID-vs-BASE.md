# ACID (relacyjne bazy danych + transakcje)

1. A - Atomicity (atomowość / niepodzielność) - albo transakcja zostanie wykonana w całości albo w ogóle
2. C - Consistency (spójność) - po transakcji baza spełnia wszystkie reguły bez naruszenia żadnych zasad integralności
3. I - Isolation (izolacja) - równoległe transakcje zachowują się jakby działały jedna po drugiej
4. D - Durability (trwałość) - system potrafi uruchomić i udostępnić spójne i aktualne dane zapisane w ramach zatwierdzonych transakcji nawet po nagłej awarii zasilania

ACID ma sens, gdy mały błąd to realny problem
(bank, magazyn, systemy z rezerwacją miejsc)

W systemach rozproszonych drogie i problematyczne (koordynacja, blokady, większe opóźnienia, trudne skalowanie)

# BASE (NoSQL + systemy rozporszone)

1. B - Bassically Available - system zawsze dostępny, odpowiada, nawet jeśli odpowiedź nie jest zawsze aktualna
2. S - Soft state - stan systemu może się zmieniać w czasie bez operacji użytkownika (np. asynchroniczna replikacja, synchronizacja, itp..)
3. E - Eventual consistency - docelowo dane się synchronizują, ale mogą wystąpić nispójności ze względu na konieczność dostępności danych natychmiast

BASE ma sens w systemach, gdzie gdy przez 2 sekundy widzimy starą wartość, to nic się nie stanie


# Sposoby definiowania związków pomiędzy przechowywanymi danymi
1. Denormalizacja danych i zagnieżdzanie - powiązane dane przechowywane są w jednym dokumencie, świetne dla szybkiego odczytu danych (nie trzeba wykonywać dodatkowych wyszukwiań), ale istnieje ryzyko nadmiernego powielania danych lub dłuższych operacji zapisu (dodatkowa logika dotycząca tego gdzie powielone dane się znajdują i które chcemy nadpisać, a które pozostawić np. w celach archiwizacyjnych).
2. Referencje - przechowywanie identyfikatora innego dokumentu, sprawdza się dla danych często zmieniających się, dość dużych lub gdy są to relacje wiele-wiele. (Mongo nie wymusza takiego powiązania, więc należy je kontrolować po stronie aplikacji)

# Mechanizmy zapewniania spójności
1. Mongo jest schemaless, ale mozna wymusić strukturę danych za pomocą JSON Schema (wymagane pola, typy danych, zakresy wartości).
2. Operacje na dokumencie są atomowe
3. Podstawą jednak jest walidacja na poziomie aplikacyjnym, gdyż bazy nierelacyjne nie zapewniają aż takiej spójności danych jak bazy relacynje (Mongo nie kontroluje poprawności istnienia powiązanych dokumentów przez referencje, trzeba dbać o synchronizacje zmian)
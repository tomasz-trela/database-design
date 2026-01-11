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

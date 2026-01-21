# Różnice w projektach

# Baza relacyjna 
1. Dane są znormalizowane i powiązane relacjami. Częste operacje JOIN, mogą wpływać na wydajność (porównując do embeddingu w NoSQL), ale zapewniają wysoką spójność danych. Dzięki temu duża część walidacji oraz kontroli integralności jest realizowana na poziomie bazy danych, a nie aplikacji.

2. Sztywny schemat danych ułatwia kontrolę poprawności, ale utrudnia szybkie zmiany struktury. Każda modyfikacja schematu wymaga migracji oraz uwzględnienia zależności między tabelami.

# Baza nierelacyjna
1. Dane zdenormalizowane i zduplikowane, zgodnie z potrzebami aplikacji. Pozwala to znacząco uprościć i przyspieszyć operacje odczytu, ponieważ wszystkie potrzebne informacje znajdują się w jednym dokumencie, ale sprawia, że operacje zapisu i akutalizacji mogą być bardziej złożone.

2. Większa odpowiedzialność na aplikacji związana z walidacją i spójność danych
 
3. Duża swoboda w strukturze. Zmiany w sposobie przechowywania danych można wprowadzać szybciej niż w bazach relacyjnych, bez kosztownych migracji i ryzyka naruszenia integralności referencyjnej.


Główna różnica w projektach wynikała z różnicy w mechanizmach tworzenia relacji między danymi w MongoDB a SQL'u. Możliwość embedowania i duplikowania danych na poczet pewnych dokumentów doskonale modelował wymagania, jakie stawiają te dokumenty (np. duplikowanie pozycji na faktury w ramach archiwizacji). MongoDB oferuje również o wiele bardziej elastyczne podejście do projektowania struktury danych, mogliśmy z łatwością zjednoczyć wszystkich użytkowników systemu do jednej kolekcji, uwzględniając ich unikatowe atrybuty jako opcjonalne pola w dokumencie. SQL zaś wymagał rozbicia takiej kolekcji na szereg tabel. Krótko mówiąc, NOSQL pozwolił nam modelować bazę z myślą o warstwie logiki aplikacji, co stanowiło pewnego rodzaju ułatwienie, aczkolwiek okazało się, że definicja zapytań czysto statystycznych stało się bardziej wymagające ze względu na:
- Bardziej złożoną i mniej oczywistą składnię (przynajmniej w perspektywie tego, w czym się dotychczas poruszaliśmy w ramach SQL'a)
- Limity, jakie narzuca MongoDB, mianowicie limit 16MB na dokument, który stawał się problematyczny przy zapytaniach agregujących spore kolekcje.
- Obniżona wydajność zapytań angażujących wiele kolekcji, m. in. ze względu na to, że MongoDB nie jest strukturalnie do tego dostosowane, w SQL'u zaś JOIN jest "natywną" i zoptymalizowaną operacją. Operacje $unwind, czy $lookup są w MongoDB z natury kosztowne.

NoSQL wymaga wiedzy na temat tego, jak poruszać się w obliczu powyższych problemów i z naszej perspektywy baza relacyjna wydaje się być bardziej "uniwersalna" w kwestii zapytań kosztem elastyczności w strukturze.


# Czy ich zastosowania są tożsame i można je traktować wymiennie? W jakich zastosowaniach lepiej sprawdzają się bazy relacyjne, a w jakich wybrana technologia nierelacyjna? 
Nie we wszystkich zastosowaniach technologie sa tożsame, np. w aplikacjach płatniczych pod uwagę wchodzi tylko baza relacyjna, bo występuje silna potrzeba spójności. Jezeli mozemy pozwolic na chwilowa niespojnosc albo przewidujemy skalowanie horyzontalne to trzeba rozważyć czy nieskorzytać z baz nierelacyjnych. Błędem jest tworzenie bazy MongoDB tożsamej do bazy relacyjnej (przechowywanie ID obiektów wszędzie jako relacje).
W naszym przypadku implementacje można wykonać w obu technologiach. Wybór zależy od tego, czy preferujemy sztywny schemat i spójność zapewnianą przez bazę, czy większą elastyczność kosztem logiki po stronie aplikacji.

## NoSQL
- Systemy z elastyczną strukturą danych (np. katalogi produktów z różnymi atrybutami)
- Tam, gdzie jest potrzeba skalowania horyzontalnego - sharding
- IoT i logowanie o wysokiej częstotliwości

## SQL
- Tam, gdzie często zapytania angażują wiele różnych rodzajów danych
- Tam, gdzie integralność danych jest priorytetem
- Normalizacja danych - brak potencjalnej konieczności przeszukiwanie wielu kolekcji w celu zaktualizowania jednej, wielokrotnie zduplikowanej wartości (choć może być to kwestia kiepskiego projektu)

# W jaki sposób MongoDB różni się od PostgreSQL pod względem definiowania zapytań?

## Filozofia zapytań:
**SQL (PostgreSQL)** - deklaratywny: "Powiedz CO chcesz otrzymać, baza zdecyduje JAK to zrobić"
- Optymalizator wybiera plan wykonania (index scan, hash join, merge join)
- Możliwość analizy przez EXPLAIN ANALYZE

**MongoDB** - imperatywny pipeline: "Powiedz KROK PO KROKU co zrobić z danymi"
- Agregacje wykonywane sekwencyjnie: etap 1 → etap 2 → etap 3
- Mniejsza elastyczność optymalizatora

## Kluczowe różnice składniowe:

**1. Rozpłaszczanie zagnieżdżonych struktur**
- SQL: JOIN automatycznie "płaszczy" relacje między tabelami
- MongoDB: każdy poziom zagnieżdżenia wymaga osobnego `$unwind` (np. zamówienia zawierające pozycje zawierające kursy = 2x `$unwind`)

**2. Łączenie z innymi kolekcjami/tabelami**
- SQL: naturalny JOIN w jednej linii
- MongoDB: `$lookup` zwraca tablicę, którą trzeba "rozpakować" przez `$unwind`

**3. Agregacje złożone**
- SQL: możliwość użycia CTE (WITH) dla nazwanych podkwerend - czytelny podział na etapy
- MongoDB: wszystko w jednym pipeline, brak mechanizmu nazwanych podkwerend

**4. Window functions**
- SQL: natywne `ROW_NUMBER()`, `LAG()`, `LEAD()`, `PERCENTILE_CONT()`
- MongoDB: brak odpowiednika - wymaga ręcznej implementacji przez sortowanie i indeksowanie

**5. Złożoność składni**
- Proste zapytanie (popularne dania): SQL ~6 linii, MongoDB ~25 linii z pipeline
- Złożona agregacja (najlepsi kucharze): SQL używa 4 CTE, MongoDB wymaga zagnieżdżonych `$lookup` i wielokrotnych transformacji

MongoDB jest prostszy dla operacji na pojedynczych dokumentach zagnieżdżonych, ale SQL jest prostszy dla agregacji wielotabelowych.

# Róznice w wydajności

**Dlaczego MongoDB szybszy przy prostych odczytach:**
1. Embedowanie eliminuje JOINy - wszystko w jednym miejscu
2. Mniej operacji I/O - jeden seek zamiast wielu
3. Brak konieczności łączenia rekordów z różnych tabel

**Dlaczego PostgreSQL szybszy przy agregacjach:**
1. Optymalizator - automatycznie wybiera najlepszą strategię (hash/merge/nested loop join)
2. Indeksy B-tree bardzo efektywne dla JOINów
3. Window functions zaimplementowane natywnie w silniku
4. `$lookup` w MongoDB nie zawsze wykorzystuje indeksy efektywnie, szczególnie w zagnieżdżonych pipeline'ach
5. `$unwind` tworzy wiele dokumentów tymczasowych w pamięci

## Czynniki wpływające na wydajność w obu bazach:

**Indeksy:**
- MongoDB: wymaga indeksu na każde pole w `$match`, `$lookup`, `$sort`
- PostgreSQL: dodatkowo partial indexes i expression indexes
- Oba: indeksy spowalniają INSERT/UPDATE

**Normalizacja vs denormalizacja:**
- MongoDB: denormalizacja = szybszy odczyt, wolniejszy update duplikatów
- PostgreSQL: normalizacja = wolniejszy odczyt (JOINy), szybsze update, brak duplikatów

**Rozmiar danych:**
- MongoDB: większe dokumenty = mniej I/O ale wolniejszy transfer
- PostgreSQL: projekcja tylko potrzebnych kolumn

## Wnioski o wydajności:

Wybór technologii powinien opierać się na dominującym workloadzie:
- **Document-centric** (90%+ operacji "pobierz/zapisz dokument") → MongoDB
- **Analytics-heavy** (częste agregacje, raporty wielodomenowe) → PostgreSQL

W systemie kateringowym PostgreSQL był szybszy w ~70% zapytań (głównie agregacje i statystyki), ale MongoDB był szybszy w podstawowych operacjach CRUD. Ponieważ raporty generowane są rzadziej niż składane zamówienia, MongoDB byłby konkurencyjny gdyby agregacje nie były tak kluczowe dla biznesu.


# Co byśmy wybrali do firmy kateringowej?
Wobec powyższych różnic, lepszym wyborem dla nas byłoby pozostanie przy bazie relacyjnej. Jak wspomniano, mniej zgrabnie modeluje się logikę warstyw aplikacji w takiej bazie danych, aczkolwiek to, co zyskujemy w dziedzine zapytań jest nieporównywalne do tej przewagi MongoDB. Należy też zaznaczyć, że implementacja logiki aplikacji nawet w bazie relacyjnej nie byłaby znacznie bardziej złożona dla naszego systemu - nie jest to nienaturalne. Dobry system e-commerce to taki, który łatwo daje się analizować i to daje nam SQL. Kolejnym argumentem przemawiającym za bazą relacyjną jest ACID - który jest cechą wybranej przez nas technologii relacyjnej (Postgres). W systemie, gdzie mamy  do czynienia z dokumentami handlowymi, atomowość i integralność danych jest kluczowa. Rzecz jasna MongoDB również jest ACID, ale w ramach pojedynczej kolekcji.


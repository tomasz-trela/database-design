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


# Czy pojawiła się konieczność zmiany założeń lub wybrane wymagania były  niemożliwe do zrealizowania? W jaki sposób wybrana baza NoSQL różni się od bazy relacyjnej pod względem definiowania zapytań? Jakie są główne różnice w wydajności i jakie są ich przyczyny
W bazach nierelacyjnych wiele zapytań jest szybszych, ponieważ nie wymagają operacji JOIN, a wszystkie potrzebne dane znajdują się w jednym dokumencie. Z drugiej strony, zapytania analityczne i raportowe, np. statystyki dotyczące dań w zamówieniach, są trudniejsze do napisania i często mniej wydajne niż w bazach relacyjnych.

W kontekście tej bazy, której głównym celem jest szybki odczyt danych przez klientów i sprawne składanie zamówień, wolniejsze generowanie statystyk jest akceptowalne. Operacje odczytu są wykonywane bardzo często, natomiast raporty znacznie rzadziej. 

Jednakże na korzyść baz relacyjnych to, zapewnią nam spójność przy zamówieniach, fakturach.


# Co byśmy wybrali do firmy kateringowej?
Wobec powyższych różnic, lepszym wyborem dla nas byłoby pozostanie przy bazie relacyjnej. Jak wspomniano, mniej zgrabnie modeluje się logikę warstyw aplikacji w takiej bazie danych, aczkolwiek to, co zyskujemy w dziedzine zapytań jest nieporównywalne do tej przewagi MongoDB. Należy też zaznaczyć, że implementacja logiki aplikacji nawet w bazie relacyjnej nie byłaby znacznie bardziej złożona dla naszego systemu - nie jest to nienaturalne. Dobry system e-commerce to taki, który łatwo daje się analizować i to daje nam SQL. Kolejnym argumentem przemawiającym za bazą relacyjną jest ACID - który jest cechą wybranej przez nas technologii relacyjnej (Postgres). W systemie, gdzie mamy  do czynienia z dokumentami handlowymi, atomowość i integralność danych jest kluczowa. Rzecz jasna MongoDB również jest ACID, ale w ramach pojedynczej kolekcji.


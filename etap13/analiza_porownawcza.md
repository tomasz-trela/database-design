# Różnice w projektach
Główna różnica w projektach wynikała z różnicy w mechanizmach tworzenia relacji między danymi w MongoDB a SQL'u. Możliwość embedowania i duplikowania danych na poczet pewnych dokumentów doskonale modelował wymagania, jakie stawiają te dokumenty (np. duplikowanie pozycji na faktury w ramach archiwizacji). MongoDB oferuje również o wiele bardziej elastyczne podejście do projektowania struktury danych, mogliśmy z łatwością zjednoczyć wszystkich użytkowników systemu do jednej kolekcji, uwzględniając ich unikatowe atrybuty jako opcjonalne pola w dokumencie. SQL zaś wymagał rozbicia takiej kolekcji na szereg tabel. Krótko mówiąc, NOSQL pozwolił nam modelować bazę z myślą o warstwie logiki aplikacji, co stanowiło pewnego rodzaju ułatwienie, aczkolwiek okazało się, że definicja zapytań czysto statystycznych stało się bardziej wymagające ze względu na:
- Bardziej złożoną i mniej oczywistą składnię (przynajmniej w perspektywie tego, w czym się dotychczas poruszaliśmy w ramach SQL'a)
- Limity, jakie narzuca MongoDB, mianowicie limit 16MB na dokument, który stawał się problematyczny przy zapytaniach agregujących spore kolekcje.
- Obniżona wydajność zapytań angażujących wiele kolekcji, m. in. ze względu na to, że MongoDB nie jest strukturalnie do tego dostosowane, w SQL'u zaś JOIN jest "natywną" i optymalizowaną od dekad operacją. Operacje $unwind, czy $lookup są w MongoDB z natury kosztowne.

NoSQL wymaga wiedzy na temat tego, jak poruszać się w obliczu powyższych problemów i z naszej perspektywy baza relacyjna wydaje się być bardziej "uniwersalna" w kwestii zapytań kosztem elastyczności w strukturze.

# Co byśmy wybrali do firmy kateringowej?
Wobec powyższych różnic, lepszym wyborem dla nas byłoby pozostanie przy bazie relacyjnej. Jak wspomniano, mniej zgrabnie modeluje się logikę warstyw aplikacji w takiej bazie danych, aczkolwiek to, co zyskujemy w dziedzine zapytań jest nieporównywalne do tej przewagi MongoDB. Należy też zaznaczyć, że implementacja logiki aplikacji nawet w bazie relacyjnej nie byłaby znacznie bardziej złożona dla naszego systemu - nie jest to nienaturalne. Dobry system e-commerce to taki, który łatwo daje się analizować i to daje nam SQL. Kolejnym argumentem przemawiającym za bazą relacyjną jest ACID - który jest cechą wybranej przez nas technologii relacyjnej (Postgres). W systemie, gdzie mamy doczynienia z dokumentami handlowymi, atomowość i integralność danych jest kluczowa. Rzecz jasna MongoDB również jest ACID, ale w ramach pojedynczej kolekcji.

# Kiedy mają sens bazy relacyjne/nierelacyjne?

## NoSQL
- Systemy z elastyczną strukturą danych (np. katalogi produktów z różnymi atrybutami)
- Tam, gdzie jest potrzeba skalowania horyzontalnego - sharding
- Prototypowanie w developmencie AGILE
- IoT i logowanie o wysokiej częstotliwości

## SQL
- Tam, gdzie często zapytania angażują wiele różnych rodzajów danych
- Tam, gdzie integralność danych jest priorytetem
- Integracja ze standardowymi narzędziami (Tableau, PowerBI)
- Normalizacja danych - brak potencjalnej konieczności przeszukiwanie wielu kolekcji w celu zaktualizowania jednej, wielokrotnie zduplikowanej wartości (choć może być to kwestia kiepskiego projektu)

Nie należy tych technologii traktować tożsamo. Choć mogą w wielu przypadkach obsłużyć te same systemy i osiągnąć podobne rezultaty, obie mają swoje zastosowania, w których przewyższają przeciwnika i należy świadomie operować w okół specyfiki projektowanego systemu i wykorzystywanej technologii - błędem jest tworzenie bazy MongoDB tożsamej do bazy relacyjnej (przechowywanie ID objektów wszędzie jako relacje).

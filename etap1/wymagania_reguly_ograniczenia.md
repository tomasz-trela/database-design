# Wymagania użytkowników

### Wymagania klienta

- Klient w ramach zamówienia chce zamówić usługi kateringowe na wybrane dni miesiąc do przodu.  
- Klient chce mieć dostarczone usługi kateringowe konkretnego dnia na wybrany adres o konkretnej godzinie.  
- Klient chce, aby system pamiętał jego adresy, aby nie musiał za każdym razem wpisywać ich ponownie.  
- Klient chce samodzielnie wybierać dania na konkretne dni.  
- Klient chce, aby system proponował dania zgodne z określoną ilością kalorii i dietą bez wybranych alergenów.  
- Klient chce zapisywać dania do ulubionych.  
- Klient chce wystawiać oceny daniom.  
- Klient chce, aby system zapamiętywał jego alergeny.  
- Klient chce mieć dostęp do informacji o alergenach wybranych dań.  
- Klient chce mieć możliwość otrzymania faktury do płatności.  
- Klient chce móc anulować zamówienie.  
- Klient chce móc składać reklamacje dotyczące jakości dostarczonego jedzenia lub problemów z dostawą.  
- Klient chce mieć możliwość śledzenia statusu swojej reklamacji.  
- Klient chce otrzymywać odpowiedzi na złożone reklamacje.

---

### Wymagania dietetyka

- Dostęp do składników oraz ich wartości odżywczych.  
- Dodawanie oraz edytowanie składników.  
- Sprawdzanie informacji o alergenach.  
- Dodawanie oraz edytowanie informacji o alergenach.  
- Przeglądanie wszystkich dań.  
- Dodawanie i edytowanie dań.  
- Proponowanie zmian w daniach innych dietetyków.  
- Dostęp do listy dań do przygotowania w danych dniach.  
- Możliwość porównywania dań lub planów pod względem kaloryczności oraz makroskładników.  
- Automatyczne sprawdzanie zgodności planu z wykluczonymi alergenami.  
- Układanie oraz edytowanie planów żywieniowych.  
- Przeglądanie, dodawanie i edytowanie dań dnia.  
- Przeglądanie, dodawanie i edytowanie kategorii dań.  
- Archiwizacja nieaktualnych planów żywieniowych.  
- Generowanie raportów statystycznych dotyczących sprzedawanych dań i planów.  

---

### Wymagania kucharza

- Dostęp do listy dań do przygotowania w danym dniu.  
- Zestawienie alergii wśród klientów na dany dzień.  
- Dostęp do dań i ich składników.  
- Sprawdzanie składników potrzebnych do przygotowania dania.  
- Dostęp do informacji o alergenach w składnikach.  
- Edycja statusu realizacji pozycji zamówienia.  
- Przeglądanie dania dnia.  
- Przeglądanie planów żywieniowych.  
- Wyszukiwanie dań za pomocą kategorii.  
- Dostęp do raportów dotyczących historii zamówień w celu analizy pracy.  

---

### Wymagania administratora

- Przeglądanie dziennych i tygodniowych potrzeb na składniki 
- Ustalanie ról i poziomów dostępu.  
- Zarządzanie kontami użytkowników (tworzenie, edycja, usuwanie, blokowanie).  
- Przeglądanie historii zamówień, płatności i faktur.  
- Dostęp do opinii użytkowników i możliwość ich usuwania.  
- Przeglądanie historii zmian w daniach i składnikach.
- Prezglądanie historii realizacji zamówień przez kucharzy i historii dostaw.
- Zarządzanie wersjami dań oraz zatwierdzanie zmian.  
- Usuwanie składników, alergenów oraz dań.  
- Przeglądanie logów systemowych oraz aktywności użytkowników.  
- Dostęp do statystyk działania systemu.
- Dostęp do wygenerowanych raportów finansowych spółki
- Tworzenie kopii zapasowych bazy danych.
- Obsługa reklamacji.

---

### Wymagania dostawcy

- Dostęp do listy zamówień na dany dzień, wraz z adresami i danymi klienta (imię, nazwisko, telefon).  
- Przegląd dań przypisanych do realizowanej dostawy.  

# Reguły biznesowe

### Techniczne

- Płatności realizowane są przez zewnętrznego operatora (np. PayU, Stripe) – system nie przechowuje danych kart.  
- Adres dostawy musi być możliwy do zlokalizowania przez API (np. Google Maps).  
- Co 3 dni system wykonuje kopię zapasową bazy danych.  
- System nie pozwala na usunięcie danych operacyjnych.  
- System przechowuje dane zgodnie z RODO i umożliwia ich trwałe usunięcie (prawo do bycia zapomnianym).

---

### Administrator

- Zarządza kontami użytkowników (tworzenie, edycja, blokowanie, usuwanie).  
- Zatwierdza przepisy i modyfikacje składników oraz alergenów dodanych przez dietetyków.  
- Może usuwać składniki, alergeny, przepisy i opinie, jeśli nie są powiązane z aktywnymi danymi operacyjnymi.  
- Ma dostęp do historii zamówień, płatności i faktur.  
- Ma dostęp do logów systemowych oraz statystyk działania systemu.  
- Może tworzyć kopie zapasowe bazy danych. 
- Ma dostęp do złożonych reklamacji 
- Ma dostęp do listy zamówień z podziałem na dni i tygodnie wraz wymaganymi składnikami.  
- Może przeglądać zapotrzebowanie na składniki generowane przez system.  
- Ma dostęp do historii realizacji zamówień przez kucharzy i historii dostaw.  
- Może generować raporty finansowe oraz zestawienia sprzedaży.  

---

### Klient

- Aby założyć konto, musi podać imię, nazwisko, adres e-mail, telefon oraz hasło.  
- Każde zamówienie musi zawierać co najmniej jedną pozycję (na przynajmniej jeden dzień).  
- Każda pozycja zamówienia musi mieć określony adres dostawy.  
- Może zdefiniować kilka adresów dostaw i ustawić domyślny.  
- Może zapisywać dania do ulubionych.  
- Musi zapłacić za zamówienie przed jego realizacją.  
- Ma dostęp do informacji o alergenach danego dania.  
- Może przeglądać wszystkie dania w ofercie.  
- Może wystawić ocenę wybranym daniom.  
- Faktura wystawiana jest po zaksięgowaniu płatności.  
- Może anulować zamówienie najpóźniej do godziny 18:00 dnia poprzedzającego dostawę.  
- Może złożyć reklamację dotyczącej jednej lub więcej pozycji zamówienia.

---

### Dietetyk

- Może dodawać i edytować składniki, alergeny i dania.  
- Wszystkie zmiany wymagają zatwierdzenia przez administratora.  
- Może tworzyć i edytować plany żywieniowe oraz menu dnia.  
- Nie może usuwać danych powiązanych z aktywnymi zamówieniami.  

---

### Kucharz

- Może aktualizować status realizacji pozycji zamówienia (np. w przygotowaniu, zrealizowane).  
- Ma dostęp tylko do dań przypisanych do jego zadań.  
- Może przeglądać przepisy i składniki, ale nie może ich edytować.  

---

### Dania

- Kategorie dań: wegańskie, wegetariańskie, bezglutenowe, bez laktozy, wysokobiałkowe, śniadanie, przekąska, obiad, podwieczorek, kolacja.  
- Propozycje dań są generowane wyłącznie na podstawie dań zatwierdzonych przez administratora.  
- Każde danie ma przypisane wymagane składniki.  
- Każdy składnik ma określone alergeny.  

---

### System

- System przechowuje dane użytkowników zgodnie z RODO.  
- Automatycznie generuje dobowe i tygodniowe zapotrzebowanie na składniki.  
- Aktualizuje zapotrzebowanie przy każdej zmianie w zamówieniach.  

---

### Zamówienia i dostawy

- Każde zamówienie przypisane jest do kucharza odpowiedzialnego za realizację.  
- Każde zamówienie przypisane jest do dostawcy odpowiedzialnego za dostarczenie.  
- Status realizacji i dostawy aktualizowane są niezależnie.  
- System nie może zaplanować dwóch dostaw dla tego samego klienta na ten sam dzień.  

# Ograniczenia

### Klient

- Może złożyć zamówienie tylko po zalogowaniu.  
- Może zamówić najwcześniej na następny dzień i najpóźniej na miesiąc do przodu.  
- Może usunąć adres tylko, jeśli nie jest powiązany z żadnym zamówieniem.  
- Może zapisać konkretne danie do ulubionych tylko raz.  
- Może wystawić tylko jedną ocenę dla dania.  
- Może wystawić ocenę, opinię lub reklamację tylko po dostawie. 

---

### Dostawy

- Godzina oczekiwanej dostawy może być tylko o następujących godiznach: 7:00–15:00.  
- Dostawy oznaczane są statusem: `oczekuje`, `w drodze`, `dostarczone`, `opóźnione`.  

---

### Dietetyk

- Edycja dań musi być zatwierdzona prze administratora

---

### Kucharz

- Może edytować jedynie realizacje pozycji zamówienia, do k†órych jest przypisany

---

### Zamówienia

- Muszą być oznaczone statusem: `przyjęte`, `w realizacji`, `oczekujące na dostawę`, `w dostawie`.  
- Zamówienia na kolejny dzień przyjmowane są do godziny 18:00.

## Reklamacja
- Muszą być oznaczone statusem: `złożona`, `rozpatrywana`, `rozpatrzona pozytywnie`, `rozpatrzona negatywnie`.  

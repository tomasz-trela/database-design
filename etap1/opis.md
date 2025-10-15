### **Streszczenie – zarys wymagań projektu**

System ma na celu wsparcie kluczowych procesów w firmie cateringowej, koncentrując się na zarządzaniu klientami, zamówieniami, ofertą posiłków oraz realizacją dostaw. Baza danych została zaprojektowana do gromadzenia i przetwarzania informacji w tych obszarach.

#### **Potrzeby informacyjne**

Projektowana baza danych umożliwia przechowywanie i zarządzanie następującymi informacjami:

*   **Dane Klientów:** Gromadzenie informacji o klientach, ich adresach oraz powiązanych z nimi zamówieniami, płatnościami, fakturami, opiniami i ulubionymi daniami.
*   **Zamówienia i Płatności:** Rejestrowanie każdego zamówienia z przypisaniem do klienta wraz z daniami na wybrany dzień, adresami dostaw i planami żywieniowymi. System śledzi również płatności i faktury powiązane z zamówieniami.
*   **Oferta Produktowa:** Szczegółowe informacje o daniach, w tym o składnikach, alergenach, kategoriach i dietetykach odpowiedzialnych za ich opracowanie. Baza przechowuje także gotowe plany żywieniowe oraz menu dnia.
*   **Realizacja i Dostawa:** Zarządzanie procesem realizacji zamówienia poprzez przypisanie go do konkretnego kucharza oraz planowanie dostawy z dedykowanym dostawcą.
*   **Preferencje i Alergie:** Możliwość śledzenia alergii klientów oraz powiązań między alergenami a składnikami w potrawach, co pozwala na personalizację oferty.
*   **Opinie:** Zbieranie i przechowywanie opinii wystawianych przez klientów na temat konkretnych dań.

#### **Czynności wyszukiwania (pytania)**

Struktura bazy danych została zaprojektowana, aby umożliwić uzyskanie odpowiedzi na następujące pytania:

*   Jakie dania są w ofercie kateringu?
*   Jacy klienci zamawiali konkretne dania lub plany żywieniowe?
*   Jakie są wszystkie zamówienia złożone przez danego klienta?
*   Jakie dania zostały opracowane przez konkretnego dietetyka?
*   Jakie dania zawierają określony składnik lub alergen?
*   Którzy klienci zgłosili alergię na dany alergen?
*   Kto jest odpowiedzialny za realizację (kucharz) i dostawę (dostawca) konkretnego zamówienia?
*   Jaka jest historia płatności dla danego zamówienia?
*   Jakie są opinie na temat konkretnego dania?
*   Jakie dania należą do najczęściej wybieranych jako "ulubione" przez klientów?
*   Jakie dania znajdują się w menu dnia?
*   Do jakich kategorii przypisane jest dane danie?

### **Zakres projektu**

#### **Co należy uwzględnić:**

Projekt bazy danych obejmuje implementację kluczowych modułów niezbędnych do zarządzania podstawową działalnością firmy cateringowej. W zakres projektu wchodzą:

*   **Zarządzanie Użytkownikami i Dostępem:** System będzie wyposażony w mechanizm logowania i autoryzacji. Zdefiniowane zostaną role użytkowników z różnymi poziomami uprawnień:
    *   **Administrator:** Pełen dostęp do zarządzania wszystkimi modułami systemu, w tym danymi klientów, zamówieniami, ofertą oraz kontami innych użytkowników.
    *   **Klient:** Możliwość rejestracji, logowania, zarządzania własnym profilem i danymi adresowymi, składania zamówień, przeglądania historii zamówień, zapisywania dań do ulubionych, dokonywania płatności oraz wystawiania opinii.
    *   **Dietetyk:** Dostęp do modułu zarządzania ofertą, gdzie może dodawać i edytować dania, składniki, alergeny oraz tworzyć plany żywieniowe i menu dnia.
    *   **Kucharz:** Dostęp do panelu z przypisanymi zamówieniami w celu zarządzania procesem ich realizacji.
    *   **Dostawca:** Dostęp do informacji o zamówieniach przypisanych do dostawy, wraz z adresami i danymi kontaktowymi klientów.
*   **Zarządzanie Klientami:** Tworzenie i zarządzanie profilami klientów, przechowywanie ich danych adresowych oraz historii zamówień.
*   **Obsługa Zamówień:** Rejestrowanie zamówień, powiązanie ich z klientami, adresami oraz wybranymi daniami lub planami żywieniowymi.
*   **Zarządzanie Ofertą:** Baza dań wraz ze składnikami, alergenami, kategoriami oraz dietetykami odpowiedzialnymi za ich tworzenie. Obejmuje również możliwość tworzenia gotowych planów żywieniowych i menu dnia.
*   **Obsługa Płatności:** Ewidencja płatności i faktur powiązanych z zamówieniami.
*   **Proces Realizacji i Dostawy:** Śledzenie procesu realizacji zamówienia poprzez przypisanie go do kucharza oraz koordynacja dostawy z dostawcą.
*   **Personalizacja i Opinie:** Przechowywanie informacji o alergiach klientów, ich ulubionych daniach oraz zbieranie opinii na temat posiłków.
* **Składanie i obsługa reklamacji** Możliwość składania reklamacji przez klientów, które są rozpatrywane przez odpowiednich pracowników.

#### **Czego nie należy uwzględniać:**

Diagram ERD nie obejmuje funkcjonalności, które wykraczają poza podstawowe zarządzanie zamówieniami i ofertą. Z zakresu projektu wyłączone są następujące moduły:

*   **Zaawansowane Zarządzanie Pracownikami:** System nie uwzględnia szczegółowych danych o pracownikach (poza rolami Kucharz, Dietetyk, Dostawca), ich uprawnień wykraczających poza opisane powyżej, grafików pracy czy danych kadrowych.
*   **Zarządzanie Magazynem:** Brak modułu do śledzenia stanów magazynowych, zarządzania listami zakupów, datami przydatności składników czy numerami partii.
*   **Zarządzanie Dostawcami Produktów:** Baza nie przechowuje informacji o dostawcach składników i produktów spożywczych.
*   **Logistyka i Flota Pojazdów:** Projekt nie obejmuje zarządzania pojazdami, planowania optymalnych tras dostaw ani przypisywania kierowców do konkretnych pojazdów.
*   **Zaawansowane Raportowanie i Analizy:** Diagram nie przewiduje struktur do generowania zaawansowanych raportów finansowych (np. analizy kosztów i przychodów), popularności diet czy szczegółowych statystyk sprzedaży.
*   **Szczegółowe Przepisy:** System nie przewiduje przechowywania szczegółowych instrukcji przygotowania potraw (przepisów).

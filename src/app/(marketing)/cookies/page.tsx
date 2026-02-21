import type { Metadata } from 'next';
import { PageStructuredData } from '@/components/seo/StructuredData';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Polityka Cookies | StrayLight',
  description:
    'Polityka Cookies określa zasady wykorzystywania plików cookies w serwisie StrayLightCenter.com zgodnie z RODO.',
};

export default function CookiesPage() {
  return (
    <>
      <PageStructuredData
        pageType="legal"
        title="Polityka Cookies StrayLightCenter.com"
        description="Polityka Cookies określa zasady wykorzystywania plików cookies w serwisie StrayLightCenter.com zgodnie z RODO."
        path="/cookies"
      />

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Polityka Cookies StrayLightCenter.com
            </h1>
            <div className="text-neutral-400 text-lg space-y-1">
              <p>Data wejścia w życie: 17.09.2025</p>
              <p>Ostatnia aktualizacja: 17.09.2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                1. Informacje ogólne
              </h2>
              <p className="text-neutral-300 leading-7">
                Niniejsza Polityka Cookies określa zasady wykorzystywania plików
                cookies (ciasteczka) w serwisie StrayLightCenter.com, zgodnie z
                Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679
                (RODO) oraz ustawą o świadczeniu usług drogą elektroniczną.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                2. Czym są pliki cookies
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Pliki cookies to małe pliki tekstowe przechowywane na Twoim
                urządzeniu (komputerze, tablecie, smartfonie) podczas
                przeglądania naszej strony internetowej. Umożliwiają one
                rozpoznanie użytkownika i zapamiętanie jego preferencji oraz
                działań.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                3. Rodzaje plików cookies, które wykorzystujemy
              </h2>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies niezbędne (techniczne)
              </h3>
              <ul className="space-y-3 text-neutral-300 leading-7 ml-4 mb-6">
                <li>
                  <strong>Cel:</strong> Utrzymanie sesji logowania,
                  uwierzytelnianie, bezpieczeństwo
                </li>
                <li>
                  <strong>Podstawa prawna:</strong> Uzasadniony interes (art. 6
                  ust. 1 lit. f RODO)
                </li>
                <li>
                  <strong>Okres przechowywania:</strong> Do wylogowania lub
                  maksymalnie 30 dni
                </li>
                <li>
                  <strong>Możliwość wyłączenia:</strong> Nie, są niezbędne do
                  działania serwisu
                </li>
              </ul>

              <p className="text-neutral-300 leading-7 mb-6">
                Te pliki cookies są niezbędne do prawidłowego funkcjonowania
                naszej strony internetowej. Umożliwiają podstawowe funkcje takie
                jak logowanie, nawigacja po stronie oraz zapewnienie
                bezpieczeństwa sesji użytkownika.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies analityczne (jeśli używane)
              </h3>
              <ul className="space-y-3 text-neutral-300 leading-7 ml-4 mb-6">
                <li>
                  <strong>Cel:</strong> Analiza ruchu na stronie, optymalizacja
                  funkcjonalności
                </li>
                <li>
                  <strong>Podstawa prawna:</strong> Zgoda (art. 6 ust. 1 lit. a
                  RODO)
                </li>
                <li>
                  <strong>Okres przechowywania:</strong> Do 24 miesięcy
                </li>
                <li>
                  <strong>Możliwość wyłączenia:</strong> Tak, możesz odmówić
                  zgody
                </li>
              </ul>

              <p className="text-neutral-300 leading-7">
                Te pliki cookies pomagają nam zrozumieć, jak użytkownicy
                korzystają z naszej strony, co pozwala nam na jej ulepszanie.
                Zbierają informacje w sposób anonimowy i agregowany.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                4. Zarządzanie cookies
              </h2>

              <p className="text-neutral-300 leading-7 mb-4">
                Możesz kontrolować pliki cookies na następujące sposoby:
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Ustawienia przeglądarki
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Większość przeglądarek internetowych automatycznie akceptuje
                pliki cookies, ale możesz zmienić ustawienia swojej
                przeglądarki, aby:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>• Blokować wszystkie pliki cookies</li>
                <li>• Akceptować tylko pliki cookies pierwszej strony</li>
                <li>
                  • Otrzymywać powiadomienie przed zapisaniem pliku cookie
                </li>
                <li>• Usunąć już zapisane pliki cookies</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Banner zgody na cookies
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Na naszej stronie wyświetla się banner zgody na cookies, gdzie
                możesz:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>• Zaakceptować wszystkie pliki cookies</li>
                <li>• Odrzucić cookies nieobowiązkowe (analityczne)</li>
                <li>• Zarządzać swoimi preferencjami</li>
              </ul>

              <div className="bg-neutral-800/50 p-4 rounded-lg mb-6">
                <p className="text-neutral-300 leading-7">
                  <strong>Ważne:</strong> Wyłączenie cookies technicznych może
                  uniemożliwić prawidłowe korzystanie z niektórych funkcji
                  naszego serwisu, w tym z logowania się do konta.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                5. Szczegółowe informacje o plikach cookies
              </h2>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies sesji
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>
                  <strong>Nazwa:</strong> Sesja użytkownika
                </li>
                <li>
                  <strong>Cel:</strong> Utrzymanie stanu logowania
                </li>
                <li>
                  <strong>Czas życia:</strong> Do zamknięcia przeglądarki lub
                  wylogowania
                </li>
                <li>
                  <strong>Dostawca:</strong> Supabase (hosting w UE)
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies preferencji
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>
                  <strong>Nazwa:</strong> Preferencje użytkownika
                </li>
                <li>
                  <strong>Cel:</strong> Zapamiętanie ustawień interfejsu (motyw,
                  język)
                </li>
                <li>
                  <strong>Czas życia:</strong> Do 1 roku
                </li>
                <li>
                  <strong>Dostawca:</strong> StrayLight (local storage)
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies zgody
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Nazwa:</strong> Zgoda na cookies
                </li>
                <li>
                  <strong>Cel:</strong> Zapamiętanie Twoich preferencji
                  dotyczących cookies
                </li>
                <li>
                  <strong>Czas życia:</strong> Do 1 roku
                </li>
                <li>
                  <strong>Dostawca:</strong> StrayLight (local storage)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                6. Cookies stron trzecich
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Obecnie nie używamy cookies pochodzących od dostawców
                zewnętrznych. Jeśli w przyszłości będziemy integrować usługi
                stron trzecich (np. Google Analytics), poinformujemy o tym w
                aktualizacji tej polityki i poprosimy o odpowiednią zgodę.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                7. Twoje prawa
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                W związku z wykorzystywaniem plików cookies masz prawo do:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>• Otrzymania informacji o używanych plikach cookies</li>
                <li>
                  • Wyrażenia lub cofnięcia zgody na cookies nieobowiązkowe
                </li>
                <li>
                  • Skonfigurowania ustawień przeglądarki zgodnie z
                  preferencjami
                </li>
                <li>• Usunięcia zapisanych plików cookies</li>
              </ul>

              <p className="text-neutral-300 leading-7">
                Więcej informacji o Twoich prawach znajdziesz w naszej{' '}
                <Link
                  href="/privacy"
                  className="text-white hover:text-neutral-300 underline"
                >
                  Polityce Prywatności
                </Link>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                8. Zmiany w Polityce Cookies
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej
                Polityce Cookies. O wszelkich zmianach poinformujemy poprzez:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4 mb-6">
                <li>• Aktualizację daty na górze tej strony</li>
                <li>
                  • Powiadomienie na stronie głównej (w przypadku istotnych
                  zmian)
                </li>
                <li>
                  • E-mail do zarejestrowanych użytkowników (w przypadku
                  istotnych zmian)
                </li>
              </ul>
              <p className="text-neutral-300 leading-7">
                Zachęcamy do regularnego sprawdzania tej strony w celu
                zapoznania się z aktualnymi informacjami o naszej Polityce
                Cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">9. Kontakt</h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Jeśli masz pytania dotyczące naszej Polityki Cookies lub chcesz
                skorzystać ze swoich praw, skontaktuj się z nami:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>E-mail:</strong>{' '}
                  <a
                    href="mailto:straylightcenter@gmail.com"
                    className="text-white hover:text-neutral-300 underline"
                  >
                    straylightcenter@gmail.com
                  </a>
                </li>
                <li>
                  <strong>Czas odpowiedzi:</strong> Do 30 dni
                </li>
              </ul>
            </section>
          </div>

          {/* Contact info */}
          <div className="mt-12 p-6 bg-neutral-800/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Potrzebujesz pomocy?
            </h3>
            <p className="text-neutral-300">
              W sprawach dotyczących plików cookies lub przetwarzania danych
              osobowych skontaktuj się z nami:
            </p>
            <p className="text-neutral-300 mt-2">
              E-mail:{' '}
              <a
                href="mailto:straylightcenter@gmail.com"
                className="text-white hover:text-neutral-300 underline"
              >
                straylightcenter@gmail.com
              </a>
            </p>
            <p className="text-neutral-300 mt-1">Czas odpowiedzi: do 30 dni</p>

            <p className="text-neutral-300 mt-4">
              Zobacz także:{' '}
              <Link
                href="/privacy"
                className="text-white hover:text-neutral-300 underline"
              >
                Polityka Prywatności
              </Link>{' '}
              |{' '}
              <Link
                href="/terms"
                className="text-white hover:text-neutral-300 underline"
              >
                Regulamin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

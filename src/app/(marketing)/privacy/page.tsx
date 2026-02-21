import type { Metadata } from 'next';
import { PageStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Polityka Prywatności | StrayLight',
  description:
    'Polityka Prywatności określa zasady przetwarzania danych osobowych w serwisie StrayLightCenter.com zgodnie z RODO.',
};

export default function PrivacyPage() {
  return (
    <>
      <PageStructuredData
        pageType="legal"
        title="Polityka Prywatności StrayLightCenter.com"
        description="Polityka Prywatności określa zasady przetwarzania danych osobowych w serwisie StrayLightCenter.com zgodnie z RODO."
        path="/privacy"
      />

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Polityka Prywatności StrayLightCenter.com
            </h1>
            <div className="text-neutral-400 text-lg space-y-1">
              <p>Data wejścia w życie: 02.09.2025</p>
              <p>Ostatnia aktualizacja: 02.09.2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                1. Informacje ogólne
              </h2>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Administrator danych
              </h3>
              <div className="text-neutral-300 leading-7 space-y-2">
                <p>
                  <strong>StrayLight</strong>
                </p>
                <p>Strona internetowa: straylightcenter.com</p>
                <p>
                  E-mail kontaktowy:{' '}
                  <a
                    href="mailto:straylightcenter@gmail.com"
                    className="text-white hover:text-neutral-300 underline"
                  >
                    straylightcenter@gmail.com
                  </a>
                </p>
              </div>

              <p className="text-neutral-300 leading-7 mt-4">
                Niniejsza Polityka Prywatności określa zasady przetwarzania
                danych osobowych w serwisie StrayLightCenter.com zgodnie z
                Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679
                (RODO).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                2. Jakie dane zbieramy i w jakim celu
              </h2>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Dane rejestracyjne
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Rodzaj danych:</strong> Adres e-mail
                </li>
                <li>
                  <strong>Cel przetwarzania:</strong> Utworzenie i utrzymanie
                  konta użytkownika, umożliwienie logowania
                </li>
                <li>
                  <strong>Podstawa prawna:</strong> Wykonanie umowy (art. 6 ust.
                  1 lit. b RODO)
                </li>
                <li>
                  <strong>Okres przechowywania:</strong> Do momentu usunięcia
                  konta przez użytkownika
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-white">
                Dane uwierzytelniania
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Rodzaj danych:</strong> Hasło (w formie zaszyfrowanej)
                </li>
                <li>
                  <strong>Cel przetwarzania:</strong> Bezpieczne
                  uwierzytelnianie użytkownika
                </li>
                <li>
                  <strong>Podstawa prawna:</strong> Wykonanie umowy (art. 6 ust.
                  1 lit. b RODO)
                </li>
                <li>
                  <strong>Uwaga:</strong> Hasła są przetwarzane przez system
                  Supabase i nie są dostępne dla administratorów w formie
                  niezaszyfrowanej
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-white">
                Dane techniczne (automatycznie zbierane)
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Rodzaj danych:</strong> Adres IP, informacje o
                  przeglądarce, czasowa aktywności
                </li>
                <li>
                  <strong>Cel przetwarzania:</strong> Zapewnienie bezpieczeństwa
                  i stabilności serwisu
                </li>
                <li>
                  <strong>Podstawa prawna:</strong> Uzasadniony interes
                  administratora (art. 6 ust. 1 lit. f RODO)
                </li>
                <li>
                  <strong>Okres przechowywania:</strong> Do 12 miesięcy
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                3. Komu przekazujemy dane
              </h2>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Dostawcy usług technicznych
              </h3>

              <h4 className="text-lg font-medium mb-2 text-white">
                Supabase Inc.
              </h4>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Rodzaj przekazywanych danych:</strong> Adres e-mail,
                  zaszyfrowane hasło, dane techniczne
                </li>
                <li>
                  <strong>Cel:</strong> Świadczenie usług backend&apos;owych,
                  uwierzytelniania i przechowywania danych
                </li>
                <li>
                  <strong>Lokalizacja:</strong> Serwery w Unii Europejskiej
                </li>
                <li>
                  <strong>Zabezpieczenia:</strong> Supabase jest certyfikowany
                  zgodnie z SOC 2 Type II
                </li>
              </ul>

              <p className="text-neutral-300 leading-7 mt-4">
                Nie sprzedajemy, nie wynajmujemy ani nie przekazujemy danych
                osobowych podmiotom trzecim w celach marketingowych.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                4. Międzynarodowe przekazywanie danych
              </h2>
              <p className="text-neutral-300 leading-7">
                Wszystkie dane są przechowywane na serwerach Supabase
                zlokalizowanych w Unii Europejskiej. Nie przekazujemy danych
                osobowych poza obszar UE/EOG.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                5. Bezpieczeństwo danych
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Stosujemy następujące środki bezpieczeństwa:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>• Szyfrowanie danych w tranzycie (HTTPS/TLS)</li>
                <li>• Szyfrowanie danych w spoczynku</li>
                <li>• Kontrola dostępu oparta na rolach (RLS)</li>
                <li>• Regularne monitorowanie bezpieczeństwa</li>
                <li>• Bezpieczne procedury uwierzytelniania</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                6. Twoje prawa
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Zgodnie z RODO masz prawo do:
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Dostępu do danych
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz żądać informacji o tym, jakie dane o Tobie przetwarzamy
                oraz otrzymać ich kopię.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Sprostowania danych
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz żądać poprawienia nieprawidłowych lub niekompletnych
                danych.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Usunięcia danych (&ldquo;prawo do bycia zapomnianym&rdquo;)
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz żądać usunięcia swoich danych osobowych. Twoje konto i
                wszystkie powiązane dane zostaną trwale usunięte.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Ograniczenia przetwarzania
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz żądać ograniczenia przetwarzania danych w określonych
                sytuacjach.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Przenoszenia danych
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz otrzymać swoje dane w ustrukturyzowanym formacie lub
                żądać ich przekazania innemu administratorowi.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Sprzeciwu
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Możesz wnieść sprzeciw wobec przetwarzania danych na podstawie
                uzasadnionego interesu.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cofnięcia zgody
              </h3>
              <p className="text-neutral-300 leading-7 mb-4">
                Jeśli przetwarzanie opiera się na zgodzie, możesz ją cofnąć w
                dowolnym momencie.
              </p>

              <p className="text-neutral-300 leading-7 mt-6">
                <strong>Aby skorzystać z swoich praw, napisz na:</strong>{' '}
                <a
                  href="mailto:straylightcenter@gmail.com"
                  className="text-white hover:text-neutral-300 underline"
                >
                  straylightcenter@gmail.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                7. Pliki cookies
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Nasza strona wykorzystuje pliki cookies (ciasteczka) - małe
                pliki tekstowe przechowywane na Twoim urządzeniu.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white">
                Cookies niezbędne (techniczne)
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
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

              <h3 className="text-xl font-semibold mb-3 mt-6 text-white">
                Cookies analityczne (jeśli używane)
              </h3>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
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

              <h3 className="text-xl font-semibold mb-3 mt-6 text-white">
                Zarządzanie cookies
              </h3>
              <p className="text-neutral-300 leading-7 mb-2">
                Możesz kontrolować cookies poprzez:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>• Ustawienia przeglądarki (wyłączenie, usunięcie)</li>
                <li>
                  • Banner zgody na cookies (dla cookies nieobowiązkowych)
                </li>
              </ul>
              <p className="text-neutral-300 leading-7 mt-4">
                <strong>Uwaga:</strong> Wyłączenie cookies technicznych może
                uniemożliwić korzystanie z serwisu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                8. Okres przechowywania danych
              </h2>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Dane konta:</strong> Do momentu usunięcia konta przez
                  użytkownika
                </li>
                <li>
                  <strong>Artykuły użytkowników:</strong> Do momentu ich
                  usunięcia lub usunięcia konta
                </li>
                <li>
                  <strong>Logi techniczne:</strong> Do 12 miesięcy
                </li>
              </ul>
              <p className="text-neutral-300 leading-7 mt-4">
                Po usunięciu konta wszystkie dane osobowe są trwale usuwane w
                ciągu 30 dni.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                9. Naruszenie ochrony danych
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                W przypadku naruszenia ochrony danych osobowych:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  • Powiadomimy Urząd Ochrony Danych Osobowych w ciągu 72 godzin
                </li>
                <li>
                  • Poinformujemy dotkniętych użytkowników, jeśli naruszenie
                  wiąże się z wysokim ryzykiem dla ich praw
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                10. Kontakt w sprawach ochrony danych
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                W sprawach związanych z ochroną danych osobowych możesz
                skontaktować się z nami:
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

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                11. Prawo do skargi
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                Masz prawo złożyć skargę do Urzędu Ochrony Danych Osobowych:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>
                  <strong>Adres:</strong> ul. Stawki 2, 00-193 Warszawa
                </li>
                <li>
                  <strong>Strona:</strong>{' '}
                  <a
                    href="https://uodo.gov.pl"
                    className="text-white hover:text-neutral-300 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    uodo.gov.pl
                  </a>
                </li>
                <li>
                  <strong>E-mail:</strong>{' '}
                  <a
                    href="mailto:kancelaria@uodo.gov.pl"
                    className="text-white hover:text-neutral-300 underline"
                  >
                    kancelaria@uodo.gov.pl
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                12. Zmiany Polityki Prywatności
              </h2>
              <p className="text-neutral-300 leading-7 mb-4">
                O wszelkich zmianach w Polityce Prywatności poinformujemy
                użytkowników poprzez:
              </p>
              <ul className="space-y-2 text-neutral-300 leading-7 ml-4">
                <li>• Powiadomienie na stronie głównej serwisu</li>
                <li>
                  • E-mail do zarejestrowanych użytkowników (w przypadku
                  istotnych zmian)
                </li>
              </ul>
              <p className="text-neutral-300 leading-7 mt-4">
                Zmiany wchodzą w życie po 7 dniach od opublikowania, chyba że
                wymagają natychmiastowego wdrożenia ze względów bezpieczeństwa.
              </p>

              <p className="text-neutral-300 leading-7 mt-6">
                <strong>Ostatnia aktualizacja:</strong> 02.09.2025
              </p>
            </section>
          </div>

          {/* Contact info */}
          <div className="mt-12 p-6 bg-neutral-800/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Kontakt</h3>
            <p className="text-neutral-300">
              W sprawach dotyczących przetwarzania danych osobowych skontaktuj
              się z nami:
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
          </div>
        </div>
      </div>
    </>
  );
}

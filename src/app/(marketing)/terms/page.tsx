import type { Metadata } from 'next';
import { PageStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Regulamin | StrayLight',
  description:
    'Regulamin określa zasady korzystania ze strony internetowej StrayLightCenter.com oraz prawa i obowiązki użytkowników.',
};

export default function TermsPage() {
  return (
    <>
      <PageStructuredData
        pageType="legal"
        title="Regulamin korzystania ze strony StrayLightCenter.com"
        description="Regulamin określa zasady korzystania ze strony internetowej StrayLightCenter.com oraz prawa i obowiązki użytkowników."
        path="/terms"
      />

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Regulamin korzystania ze strony StrayLightCenter.com
            </h1>
            <p className="text-neutral-400 text-lg">
              Obowiązuje od momentu publikacji w serwisie
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §1 Postanowienia ogólne
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Niniejszy regulamin (&ldquo;Regulamin&rdquo;) określa
                  zasady korzystania ze strony internetowej StrayLightCenter.com
                  (&ldquo;Serwis&rdquo;).
                </li>
                <li>
                  2. Właścicielem i administratorem Serwisu jest StrayLight
                  (&ldquo;Administrator&rdquo;).
                </li>
                <li>
                  3. Korzystając z Serwisu, każdy użytkownik
                  (&ldquo;Użytkownik&rdquo;) akceptuje postanowienia Regulaminu
                  oraz zobowiązuje się do ich przestrzegania.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §2 Definicje
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. <strong>Użytkownik</strong> – osoba fizyczna korzystająca z
                  Serwisu, która założyła konto i/lub korzysta z funkcjonalności
                  Serwisu.
                </li>
                <li>
                  2. <strong>Administrator</strong> – właściciel i podmiot
                  zarządzający Serwisem.
                </li>
                <li>
                  3. <strong>Treści</strong> – wszelkie materiały, dane,
                  informacje i artykuły udostępniane lub publikowane w ramach
                  Serwisu.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §3 Rejestracja i logowanie
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Dostęp do pełnej funkcjonalności Serwisu wymaga rejestracji
                  konta oraz logowania przy użyciu systemu uwierzytelniania
                  obsługiwanego przez Supabase.
                </li>
                <li>
                  2. Użytkownik zobowiązany jest do podania prawdziwych danych
                  podczas rejestracji.
                </li>
                <li>
                  3. Użytkownik ponosi pełną odpowiedzialność za bezpieczeństwo
                  swojego konta, w szczególności za zachowanie poufności hasła.
                </li>
                <li>
                  4. Użytkownik odpowiada za wszelkie działania podjęte w ramach
                  swojego konta w Serwisie.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §4 Dostęp do treści
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Artykuły i inne materiały publikowane w Serwisie są
                  dostępne wyłącznie dla zalogowanych Użytkowników.
                </li>
                <li>
                  2. Administrator może ograniczyć lub zawiesić dostęp do konta
                  w przypadku naruszenia Regulaminu lub przepisów prawa.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §5 Tworzenie i publikacja artykułów
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Zalogowani Użytkownicy mają możliwość tworzenia i
                  publikowania artykułów w Serwisie.
                </li>
                <li>
                  2. Publikując artykuł, Użytkownik oświadcza, że posiada
                  wszelkie prawa do zamieszczanych treści oraz że nie naruszają
                  one praw osób trzecich ani przepisów prawa.
                </li>
                <li>
                  3. Użytkownik ponosi wyłączną odpowiedzialność za zamieszczane
                  przez siebie treści.
                </li>
                <li>
                  4. Zabronione jest publikowanie treści:
                  <ul className="mt-2 ml-4 space-y-1">
                    <li>
                      - obraźliwych, wulgarnych, nawołujących do nienawiści,
                    </li>
                    <li>
                      - naruszających prawa autorskie lub inne prawa własności
                      intelektualnej,
                    </li>
                    <li>- wprowadzających w błąd lub stanowiących spam,</li>
                    <li>
                      - sprzecznych z obowiązującym prawem lub dobrymi
                      obyczajami.
                    </li>
                  </ul>
                </li>
                <li>
                  5. Użytkownik udziela Administratorowi niewyłącznej,
                  nieodpłatnej licencji na korzystanie z publikowanych artykułów
                  w zakresie niezbędnym do ich prezentacji w Serwisie.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §6 Moderacja treści
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Administrator zastrzega sobie prawo do usuwania lub
                  blokowania treści naruszających Regulamin lub przepisy prawa.
                </li>
                <li>
                  2. Administrator może zablokować konto Użytkownika, który
                  uporczywie narusza postanowienia Regulaminu.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §7 Prawa i obowiązki Administratora
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Administrator dokłada należytej staranności, aby Serwis
                  działał w sposób ciągły i bez zakłóceń.
                </li>
                <li>
                  2. Administrator nie ponosi odpowiedzialności za treści
                  publikowane przez Użytkowników.
                </li>
                <li>
                  3. Administrator zastrzega sobie prawo do:
                  <ul className="mt-2 ml-4 space-y-1">
                    <li>
                      - czasowego zawieszenia działania Serwisu z przyczyn
                      technicznych lub organizacyjnych,
                    </li>
                    <li>- wprowadzania zmian w funkcjonalności Serwisu,</li>
                    <li>
                      - usunięcia treści naruszających przepisy prawa lub
                      postanowienia Regulaminu.
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §8 Własność intelektualna
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Wszystkie materiały i treści publikowane w Serwisie, z
                  wyjątkiem treści dodanych przez Użytkowników, podlegają
                  ochronie prawnej zgodnie z obowiązującymi przepisami prawa
                  autorskiego.
                </li>
                <li>
                  2. Zabrania się kopiowania, rozpowszechniania, modyfikowania
                  oraz wykorzystywania treści Serwisu w celach komercyjnych bez
                  uprzedniej pisemnej zgody Administratora.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §9 Ochrona danych osobowych
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Dane osobowe Użytkowników są przetwarzane zgodnie z
                  przepisami prawa, w szczególności Rozporządzeniem Parlamentu
                  Europejskiego i Rady (UE) 2016/679 (&ldquo;RODO&rdquo;).
                </li>
                <li>
                  2. Administrator zapewnia odpowiednie środki techniczne i
                  organizacyjne chroniące dane osobowe przed nieuprawnionym
                  dostępem.
                </li>
                <li>
                  3. Szczegółowe informacje dotyczące przetwarzania danych
                  osobowych znajdują się w{' '}
                  <a
                    href="/privacy"
                    className="text-white hover:text-neutral-300 underline"
                  >
                    Polityce Prywatności
                  </a>{' '}
                  dostępnej w Serwisie.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §10 Postępowanie reklamacyjne
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Użytkownik ma prawo zgłaszać reklamacje dotyczące
                  funkcjonowania Serwisu.
                </li>
                <li>
                  2. Reklamacje należy kierować na adres e-mail Administratora -{' '}
                  <a
                    href="mailto:straylightcenter@gmail.com"
                    className="text-white hover:text-neutral-300 underline"
                  >
                    straylightcenter@gmail.com
                  </a>
                </li>
                <li>
                  3. Administrator rozpatruje reklamację w terminie do 14 dni
                  roboczych od dnia ich otrzymania.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §11 Zmiany Regulaminu
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. Administrator zastrzega sobie prawo do zmiany Regulaminu w
                  dowolnym czasie.
                </li>
                <li>
                  2. Zmiany Regulaminu wchodzą w życie z chwilą ich
                  opublikowania w Serwisie.
                </li>
                <li>
                  3. Dalsze korzystanie z Serwisu po zmianie Regulaminu oznacza
                  jego akceptację przez Użytkownika.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                §12 Postanowienia końcowe
              </h2>
              <ol className="space-y-2 text-neutral-300 leading-7">
                <li>
                  1. W sprawach nieuregulowanych w Regulaminie zastosowanie mają
                  przepisy prawa polskiego.
                </li>
                <li>
                  2. Regulamin wchodzi w życie z dniem jego publikacji w
                  Serwisie.
                </li>
              </ol>
            </section>
          </div>

          {/* Contact info */}
          <div className="mt-12 p-6 bg-neutral-800/50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Kontakt</h3>
            <p className="text-neutral-300">
              W sprawach dotyczących Regulaminu skontaktuj się z nami:
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
          </div>
        </div>
      </div>
    </>
  );
}

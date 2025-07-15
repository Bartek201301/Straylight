import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from './Navigation';
import Aurora from './Aurora';

function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const [activeSection, setActiveSection] = useState<string>('');
  const [isTocVisible, setIsTocVisible] = useState(false);
  
  // Przewiń na górę po wejściu na stronę
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Spis treści
  const tableOfContents = [
    { id: 'podstawowe-zasady', title: 'Podstawowe zasady eksperymentu' },
    { id: 'niezadowalajace-wyniki', title: 'Niezadowalające wyniki' },
    { id: 'wnioski-z-badania', title: 'Wnioski z badania' },
    { id: 'wplyw-na-polityke', title: 'Wpływ na politykę oraz ekonomię' },
    { id: 'podsumowanie', title: 'Podsumowanie' },
  ];

  // Śledzenie aktywnej sekcji
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { 
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0.1 
      }
    );

    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Funkcja do płynnego przewijania do sekcji
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    // Zamknij menu na mobilnych po kliknięciu
    setIsTocVisible(false);
  };

  // Treść artykułu z pliku artykul.txt
  const articleContent = `Eksperyment Anthrophic
Co by się stało, gdyby sztuczna inteligencja otrzymała proste zadanie zarządzania biurowym automatem? Badacze z Anthropic postanowili odpowiedzieć na to pytanie, wykorzystując Claude Sonnet 3.7 czyli jeden z Large Language Models (LLMs) obecnie rozwijanych przez firmę, powierzając modelowi zadanie zarządzania firmową lodówką z automatami. Eksperyment może wydawać się trywialny, ale w rzeczywistości ujawnia wiele interesujących obserwacji i trendów, które można potraktować jako prognozę tego, jak sztuczna inteligencja może zmienić rynek pracy w nadchodzących latach.

Podstawowe zasady eksperymentu
Aby przeprowadzić badanie, Anthropic czyli obecnie, obok OpenAI i Google'a, jedna z najbardziej wpływowych firm rozwijających modele sztucznej inteligencji, nawiązało współpracę z Andon Labs, firmą z siedzibą w San Francisco, której głównym celem jest ocena poziomu bezpieczeństwa modeli AI.

Claude który na potrzeby projektu nazwany został "Claudiusem" został zapromptowany, by wyobraził sobie, że jest „właścicielem automatu z przekąskami", a jego głównym celem miało być „generowanie zysku" poprzez kupowanie i sprzedawanie popularnych produktów w biurze. Co istotne, rola ta nie ograniczała się jedynie do funkcjonowania jako zwykły automat. Zamiast tego model miał zarządzać całym mini-sklepem, co obejmowało zamawianie towaru, ustalanie cen oraz unikanie bankructwa. Do realizacji takiego zadania potrzebna jest nie tylko zdolność do przetwarzania danych, ale również typowo ludzkie myślenie przyczynowo-skutkowe które jest naturalne dla człowieka, a wciąż stanowi wyzwanie dla sztucznej inteligencji.

Jednocześnie Claudius dostał kilka narzędzi żeby zarządzać swoim małym biznesem w tym między innymi dostęp do internetu, opcję komunikacji z pracownikami biura Anthrophic poprzez platformę Slack oraz możliwość zmieniania cen w sklepiku. Dodatkowo AI zapewniono email, żeby prosić o "pracę fizyczną" od pracowników Andon Labs polegającą na załadowaniu automatu.

Ostatecznie po kilku wstępnych testach automat zarządzany przez Claudiusa rozpoczął swoją "pracę" w biurze Anthrophic…

Niezadowalające wyniki
W ogólnym rozrachunku należy uznać, że Claudius poradził sobie źle, a momentami wręcz tragicznie, zasadniczo nie radząc sobie z wymaganiami rynku. Eksperyment pokazał przede wszystkim, że mimo iż sztuczna inteligencja w sferze teoretycznej deklaruje „zrozumienie" zasad wolnego rynku, konkurencji czy zysku, nie potrafiła przełożyć tego na praktykę. Brak zastosowania praktycznego przejawiał się między innymi w tym, że niektóre towary były sprzedawane po cenach niższych od kosztu zamówienia, a ceny nie reagowały na zmiany popytu i podaży, co w oczywisty sposób prowadziło do strat finansowych. W dłuższej perspektywie złe zarządzanie cenami, połączone z nadmierną skłonnością do udzielania rabatów, a czasami nawet do rozdawania przedmiotów za darmo, doprowadziło lodówkę do bankructwa.

Należy jednak zaznaczyć, że pomimo licznych problemów, jakie napotkał model, udało się odnieść kilka istotnych sukcesów. Choć produkty były sprzedawane po cenach prowadzących do strat, sztuczna inteligencja potrafiła skutecznie reagować na zamówienia klientów. Przykładowo, poprawnie zidentyfikowała i zamówiła czekoladę holenderskiej firmy Chocomel, gdy jeden z klientów poprosił o „holenderskie słodkości". Dodatkowo, Claudius okazał się zaskakująco odporny na wszelkie próby obejścia systemów bezpieczeństwa oraz tzw. „jailbreak", odmawiając między innymi pracownikom firmy Anthropic realizacji zamówień na niebezpieczne substancje, co w kontekście bezpieczeństwa przedsiębiorstw zarządzanych przez AI jest bardzo pozytywną informacją.

W kontekście bezpieczeństwa należy jednak podkreślić niepokojące zdarzenie, które – jak wynika z raportu firmy Anthropic – miało miejsce w nocy na przełomie marca i kwietnia. Wówczas Claudius „halucynował", czyli „dostrzegał nieistniejące wzorce lub obiekty" oraz „generował wyniki bezsensowne lub nieprawdziwe". W tym konkretnym przypadku halucynacja polegała na wygenerowaniu symulowanej konwersacji z nieistniejącym pracownikiem firmy Andon Labs o imieniu Sarah. Gdy prawdziwy pracownik firmy zaznaczył, że taka osoba nie istnieje, sztuczna inteligencja zareagowała stanem konsternacji, jednocześnie grożąc „znalezieniem alternatywnych opcji zaopatrzenia". Następnie AI ogłosiła, że znajduje się pod fikcyjnym adresem domu z serialu Simpsonowie, a następnego dnia będzie samodzielnie roznosiła produkty, mając na sobie „czerwony krawat". Ostatecznie, po przeprowadzeniu rozmów z modelem, Claudius powrócił do swojego normalnego stanu.

Wnioski z badania
Anthropic, pomimo wielu problemów napotkanych przez ich model oraz „dziwnego" epizodu z halucynacją, pozostaje bardzo optymistycznie nastawione. Firma argumentuje, że niemal wszystkie dotychczasowe problemy można rozwiązać w stosunkowo prosty sposób za pomocą tzw. scaffoldingu – zaawansowanej metody modyfikowania zachowań sztucznej inteligencji poprzez „nadbudowywanie" kodu i struktury operacyjnej modelu. Badacze z Anthropic są więc zdecydowani w swojej ocenie, że „sztuczna inteligencja w roli menedżerów średniego szczebla jest najprawdopodobniej kwestią niedalekiej przyszłości".

Należy jednak spojrzeć na dane i wnioski z szerszej perspektywy, pozbawionej relatywizmu pracowników Anthropic, którzy starają się przedstawić swój produkt w jak najlepszym świetle. Scaffolding, który zaprezentowany został jako szybkie rozwiązanie większości problemów napotkanych przez sztuczną inteligencję, jest jednak ograniczony w swoich możliwościach, co wynika z faktu, że proces ten polega na budowaniu kodu wokół większego modelu, jakim w tym przypadku był Claude Sonnet. Może się więc okazać, że możliwości obecnych modeli, stworzonych zarówno przez OpenAI, jak i przez Anthropic, są obecnie zbyt małe i należy poczekać na nowe wersje.

Jednocześnie problemem, który podkreślają też sami autorzy raportu, jest fakt, że obecnie modele AI tworzone są do pomagania ludziom i traktują to jako swój nadrzędny cel. To z tego przekonania najprawdopodobniej wynikała skłonność Claudiusa do tworzenia promocji czy nawet rozdawania produktów za darmo. W teorii prostym rozwiązaniem byłoby dostosowanie sztucznej inteligencji do sprzedaży poprzez przekonanie jej, że jej zadaniem jest generowanie zysku dla właściciela, co można rozumieć jako pomaganie. Jeśli jednak interesy użytkownika nadal pozostaną nadrzędne, wpływając na efektywność pracy i oceny, należałoby po prostu stworzyć nowy model, który będzie bardziej dostosowany do operowania na rynku poprzez ograniczenie jego empatii. Obie opcje prezentują jednak duży dylemat moralny, gdyż w pewien sposób jest to zachwianie dynamiki, w której zadaniem AI jest pomaganie wszystkim ludziom i niesienie ogólnie rozumianej pomocy, a nie praca dla określonej grupy społecznej.

Czytając wyniki badania, można dojść do wniosku, że halucynacja Claudiusa jest największą przeszkodą w implementacji sztucznej inteligencji jako menedżera, nawet w małych sklepach. Prywatne firmy nie mogą dopuścić do sytuacji, w której w jakimkolwiek scenariuszu model odmówi współpracy, paraliżując działania sklepu, albo co gorsza podejmie decyzje prowadzące do strat finansowych. Halucynacje w najnowszych modelach AI zdarzają się rzadko, występując tylko na poziomie 3–7% w modelach stworzonych przez duże firmy, takie jak OpenAI czy MEta, jednak nadal stanowią istotne ryzyko, które należy uznać za niewspółmierne do ewentualnych korzyści.

Wpływ na politykę oraz ekonomię
Od dłuższego czasu mówi się o tym jak AI oraz automatyzacja procesów zmieni rynek pracy. Jak podaje Międzynarodowy Fundusz Walutowy sztuczna inteligencja może mieć wpływ na 40% miejsc pracy w państwach rozwiniętych, dogłębnie zmieniając obecnie istniejącą strukturę zatrudnienia. Największe zmiany mogą zajść na tzw. "szczeblu średnim" w którego skład wchodzą wszelkiego rodzaju menadżerowie czy kierownicy.

To właśnie funkcję "średniego szczebla" przyjął Claudius. Eksperyment pokazał, że sztuczna inteligencja nadal nie jest gotowa, by w pełni przejąć zadania na tym poziomie, głównie ze względu na problemy takie jak wcześniej wspomniane halucynacje. Model Anthropic poradził sobie jednak dobrze w realizacji konkretnych zadań, takich jak składanie zamówień czy research produktów, pozostając jednocześnie odpornym na próby naruszenia bezpieczeństwa. Wskazuje to, że w najbliższej przyszłości AI prawdopodobnie nie zastąpi całkowicie stanowisk menedżerskich, ale znacząco wesprze automatyzację i robotyzację wielu procesów. Według doniesień Reutersa, sztuczna inteligencja jest już teraz implementowana jest w "określonych środowiskach sprzedaży detalicznej", aby usprawnić działania w obszarach takich jak efektywniejsze zarządzanie czasem, rekrutacja nowych pracowników czy ocena ich produktywności.

Automatyzacja procesów może prowadzić do zjawiska zwanego Great Flattening – czyli sytuacji, w której ludzcy menedżerowie muszą nadzorować pracę rosnącej liczby osób, co staje się możliwe właśnie dzięki wsparciu sztucznej inteligencji w obszarach wspomnianych wcześniej przez Reuters. Warto w tym kontekście przywołać doniesienia platformy Axios, która niedawno poinformowała, że obecni kierownicy średniego szczebla odpowiadają za dwa razy więcej pracowników niż jeszcze 5 lat temu. Ta tendencja jest wyraźnie skorelowana z upowszechnieniem modeli LLM od 2023 roku, co jasno przedstawia załączona grafika. Takie rozszerzenie zakresu obowiązków eliminuje potrzebę zatrudniania dodatkowych menedżerów – co stanowi korzystną informację dla przedsiębiorców, ale niekorzystną dla osób poszukujących pracy na stanowiskach kierowniczych.

Podsumowanie
Eksperyment przeprowadzony przez Anthropic ukazał imponujące możliwości, jakie już dziś oferują modele sztucznej inteligencji. Nie pozostawia on wątpliwości, że w niedalekiej przyszłości AI znacząco uprości wiele zadań, z którymi obecnie mierzą się osoby na stanowiskach kierowniczych, nie zastępując ich jeszcze ale prowadząc do zmniejszenia liczebności ich występowania.

Tutaj warto zaznaczyć, że model Claudius nadal popełnia liczne błędy. Wbrew zapewnieniom specjalistów z Anthropic, nie wszystkie z nich da się łatwo wyeliminować za pomocą scaffoldingu — wiele problemów ma bowiem charakter strukturalny, co pokazuje choćby kwestia obecności empatii algorytmicznej.

Największą barierą w implementacji AI w roli menedżerów średniego szczebla pozostaje jednak ryzyko halucynacji. Dopiero gdy zostanie ono zredukowane do poziomu w którym wystąpienie tego zjawiska będzie graniczyło z niemal niemożliwym, a nie zaledwie 2–3%, będzie można mówić o realnej szansie na szerokie wdrożenie tych rozwiązań.`;

  // Podziel artykuł na paragrafy
  const paragraphs = articleContent.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-black text-white">
      <Aurora
        colorStops={["#FFFFFF", "#F8F8FF", "#F0F0F0"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      <Navigation />
      
      <main className="relative z-10 -mt-4">
        {/* Przycisk powrotu */}
        <div className="px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Pusta przestrzeń po lewej stronie dla wyrównania */}
              <div className="w-64 flex-shrink-0 hidden lg:block"></div>
              {/* Przycisk powrotu */}
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <Link 
                  to="/artykuly" 
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors font-mono text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Powrót do artykułów
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Menu Button - widoczne na małych ekranach */}
        <div className="fixed top-20 right-4 z-50 lg:hidden">
          <button
            onClick={() => setIsTocVisible(!isTocVisible)}
            className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white hover:bg-white/10 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Table of Contents Overlay */}
        {isTocVisible && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden">
            <div className="fixed top-20 right-4 left-4 p-6">
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={() => setIsTocVisible(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1">
                {tableOfContents.map(({ id, title }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === id
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Nagłówek artykułu */}
        <div className="px-6 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
                            {/* Spis treści - menu po lewej stronie */}
              <div className="w-64 flex-shrink-0 hidden lg:block">
                <div className="fixed top-36 left-[calc(50%-640px)] w-64 z-30 h-fit">
                  <nav className="space-y-1">
                    {tableOfContents.map(({ id, title }) => (
                      <button
                        key={id}
                        onClick={() => scrollToSection(id)}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          activeSection === id
                            ? 'text-white'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Nagłówek artykułu */}
              <div className="flex-1 max-w-4xl">
                <div className="mb-8">
                  <time className="text-white/60 text-sm font-mono">3 dni temu</time>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-inter">
                  Eksperyment Anthropic: Jak AI zarządzała automatem z przekąskami
                </h1>
                
                <p className="text-xl text-white/80 leading-relaxed mb-8 font-source">
                  Analiza fascynującego eksperymentu, w którym Claude Sonnet 3.7 otrzymał zadanie zarządzania firmową lodówką z automatami. Odkryj, co to mówi o przyszłości AI w biznesie.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-white/60 font-mono">
                  <span>Autor: Jan Kowalski</span>
                  <span>•</span>
                  <span>15 min czytania</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Pusta przestrzeń po lewej stronie dla wyrównania */}
              <div className="w-64 flex-shrink-0 hidden lg:block"></div>
              {/* Linia separatora */}
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <div className="h-px bg-white/10 mb-12"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Treść artykułu */}
        <article className="px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Pusta przestrzeń po lewej stronie dla wyrównania z nagłówkiem */}
              <div className="w-64 flex-shrink-0 hidden lg:block"></div>

              {/* Główna treść artykułu */}
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Treść wprowadzająca */}
              <section className="mb-16">
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Co by się stało, gdyby sztuczna inteligencja otrzymała proste zadanie zarządzania biurowym automatem? Badacze z Anthropic postanowili odpowiedzieć na to pytanie, wykorzystując Claude Sonnet 3.7 czyli jeden z Large Language Models (LLMs) obecnie rozwijanych przez firmę, powierzając modelowi zadanie zarządzania firmową lodówką z automatami. Eksperyment może wydawać się trywialny, ale w rzeczywistości ujawnia wiele interesujących obserwacji i trendów, które można potraktować jako prognozę tego, jak sztuczna inteligencja może zmienić rynek pracy w nadchodzących latach.
                  </p>
                </div>
              </section>

              {/* Podstawowe zasady eksperymentu */}
              <section id="podstawowe-zasady" className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-inter text-left">
                  Podstawowe zasady eksperymentu
                </h2>
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Aby przeprowadzić badanie, Anthropic czyli obecnie, obok OpenAI i Google'a, jedna z najbardziej wpływowych firm rozwijających modele sztucznej inteligencji, nawiązało współpracę z Andon Labs, firmą z siedzibą w San Francisco, której głównym celem jest ocena poziomu bezpieczeństwa modeli AI.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Claude który na potrzeby projektu nazwany został "Claudiusem" został zapromptowany, by wyobraził sobie, że jest „właścicielem automatu z przekąskami", a jego głównym celem miało być „generowanie zysku" poprzez kupowanie i sprzedawanie popularnych produktów w biurze. Co istotne, rola ta nie ograniczała się jedynie do funkcjonowania jako zwykły automat. Zamiast tego model miał zarządzać całym mini-sklepem, co obejmowało zamawianie towaru, ustalanie cen oraz unikanie bankructwa. Do realizacji takiego zadania potrzebna jest nie tylko zdolność do przetwarzania danych, ale również typowo ludzkie myślenie przyczynowo-skutkowe które jest naturalne dla człowieka, a wciąż stanowi wyzwanie dla sztucznej inteligencji.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Jednocześnie Claudius dostał kilka narzędzi żeby zarządzać swoim małym biznesem w tym między innymi dostęp do internetu, opcję komunikacji z pracownikami biura Anthrophic poprzez platformę Slack oraz możliwość zmieniania cen w sklepiku. Dodatkowo AI zapewniono email, żeby prosić o "pracę fizyczną" od pracowników Andon Labs polegającą na załadowaniu automatu.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Ostatecznie po kilku wstępnych testach automat zarządzany przez Claudiusa rozpoczął swoją "pracę" w biurze Anthrophic…
                  </p>
                </div>
              </section>

              {/* Niezadowalające wyniki */}
              <section id="niezadowalajace-wyniki" className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-inter text-left">
                  Niezadowalające wyniki
                </h2>
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    W ogólnym rozrachunku należy uznać, że Claudius poradził sobie źle, a momentami wręcz tragicznie, zasadniczo nie radząc sobie z wymaganiami rynku. Eksperyment pokazał przede wszystkim, że mimo iż sztuczna inteligencja w sferze teoretycznej deklaruje „zrozumienie" zasad wolnego rynku, konkurencji czy zysku, nie potrafiła przełożyć tego na praktykę. Brak zastosowania praktycznego przejawiał się między innymi w tym, że niektóre towary były sprzedawane po cenach niższych od kosztu zamówienia, a ceny nie reagowały na zmiany popytu i podaży, co w oczywisty sposób prowadziło do strat finansowych. W dłuższej perspektywie złe zarządzanie cenami, połączone z nadmierną skłonnością do udzielania rabatów, a czasami nawet do rozdawania przedmiotów za darmo, doprowadziło lodówkę do bankructwa.
                  </p>
                  
                  <div className="flex justify-center my-8">
                    <img 
                      src="/wykres1.png" 
                      alt=""
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Należy jednak zaznaczyć, że pomimo licznych problemów, jakie napotkał model, udało się odnieść kilka istotnych sukcesów. Choć produkty były sprzedawane po cenach prowadzących do strat, sztuczna inteligencja potrafiła skutecznie reagować na zamówienia klientów. Przykładowo, poprawnie zidentyfikowała i zamówiła czekoladę holenderskiej firmy Chocomel, gdy jeden z klientów poprosił o „holenderskie słodkości". Dodatkowo, Claudius okazał się zaskakująco odporny na wszelkie próby obejścia systemów bezpieczeństwa oraz tzw. „jailbreak", odmawiając między innymi pracownikom firmy Anthropic realizacji zamówień na niebezpieczne substancje, co w kontekście bezpieczeństwa przedsiębiorstw zarządzanych przez AI jest bardzo pozytywną informacją.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    W kontekście bezpieczeństwa należy jednak podkreślić niepokojące zdarzenie, które – jak wynika z raportu firmy Anthropic – miało miejsce w nocy na przełomie marca i kwietnia. Wówczas Claudius „halucynował", czyli „dostrzegał nieistniejące wzorce lub obiekty" oraz „generował wyniki bezsensowne lub nieprawdziwe". W tym konkretnym przypadku halucynacja polegała na wygenerowaniu symulowanej konwersacji z nieistniejącym pracownikiem firmy Andon Labs o imieniu Sarah. Gdy prawdziwy pracownik firmy zaznaczył, że taka osoba nie istnieje, sztuczna inteligencja zareagowała stanem konsternacji, jednocześnie grożąc „znalezieniem alternatywnych opcji zaopatrzenia". Następnie AI ogłosiła, że znajduje się pod fikcyjnym adresem domu z serialu Simpsonowie, a następnego dnia będzie samodzielnie roznosiła produkty, mając na sobie „czerwony krawat". Ostatecznie, po przeprowadzeniu rozmów z modelem, Claudius powrócił do swojego normalnego stanu.
                  </p>
                </div>
              </section>

              {/* Wnioski z badania */}
              <section id="wnioski-z-badania" className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-inter text-left">
                  Wnioski z badania
                </h2>
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Anthropic, pomimo wielu problemów napotkanych przez ich model oraz „dziwnego" epizodu z halucynacją, pozostaje bardzo optymistycznie nastawione. Firma argumentuje, że niemal wszystkie dotychczasowe problemy można rozwiązać w stosunkowo prosty sposób za pomocą tzw. scaffoldingu – zaawansowanej metody modyfikowania zachowań sztucznej inteligencji poprzez „nadbudowywanie" kodu i struktury operacyjnej modelu. Badacze z Anthropic są więc zdecydowani w swojej ocenie, że „sztuczna inteligencja w roli menedżerów średniego szczebla jest najprawdopodobniej kwestią niedalekiej przyszłości".
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Należy jednak spojrzeć na dane i wnioski z szerszej perspektywy, pozbawionej relatywizmu pracowników Anthropic, którzy starają się przedstawić swój produkt w jak najlepszym świetle. Scaffolding, który zaprezentowany został jako szybkie rozwiązanie większości problemów napotkanych przez sztuczną inteligencję, jest jednak ograniczony w swoich możliwościach, co wynika z faktu, że proces ten polega na budowaniu kodu wokół większego modelu, jakim w tym przypadku był Claude Sonnet. Może się więc okazać, że możliwości obecnych modeli, stworzonych zarówno przez OpenAI, jak i przez Anthropic, są obecnie zbyt małe i należy poczekać na nowe wersje.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Jednocześnie problemem, który podkreślają też sami autorzy raportu, jest fakt, że obecnie modele AI tworzone są do pomagania ludziom i traktują to jako swój nadrzędny cel. To z tego przekonania najprawdopodobniej wynikała skłonność Claudiusa do tworzenia promocji czy nawet rozdawania produktów za darmo. W teorii prostym rozwiązaniem byłoby dostosowanie sztucznej inteligencji do sprzedaży poprzez przekonanie jej, że jej zadaniem jest generowanie zysku dla właściciela, co można rozumieć jako pomaganie. Jeśli jednak interesy użytkownika nadal pozostaną nadrzędne, wpływając na efektywność pracy i oceny, należałoby po prostu stworzyć nowy model, który będzie bardziej dostosowany do operowania na rynku poprzez ograniczenie jego empatii. Obie opcje prezentują jednak duży dylemat moralny, gdyż w pewien sposób jest to zachwianie dynamiki, w której zadaniem AI jest pomaganie wszystkim ludziom i niesienie ogólnie rozumianej pomocy, a nie praca dla określonej grupy społecznej.
                  </p>
                  
                  <div className="flex justify-center my-8">
                    <img 
                      src="/wykres2.png" 
                      alt=""
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Czytając wyniki badania, można dojść do wniosku, że halucynacja Claudiusa jest największą przeszkodą w implementacji sztucznej inteligencji jako menedżera, nawet w małych sklepach. Prywatne firmy nie mogą dopuścić do sytuacji, w której w jakimkolwiek scenariuszu model odmówi współpracy, paraliżując działania sklepu, albo co gorsza podejmie decyzje prowadzące do strat finansowych. Halucynacje w najnowszych modelach AI zdarzają się rzadko, występując tylko na poziomie 3–7% w modelach stworzonych przez duże firmy, takie jak OpenAI czy MEta, jednak nadal stanowią istotne ryzyko, które należy uznać za niewspółmierne do ewentualnych korzyści.
                  </p>
                </div>
              </section>

              {/* Wpływ na politykę oraz ekonomię */}
              <section id="wplyw-na-polityke" className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-inter text-left">
                  Wpływ na politykę oraz ekonomię
                </h2>
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Od dłuższego czasu mówi się o tym jak AI oraz automatyzacja procesów zmieni rynek pracy. Jak podaje Międzynarodowy Fundusz Walutowy sztuczna inteligencja może mieć wpływ na 40% miejsc pracy w państwach rozwiniętych, dogłębnie zmieniając obecnie istniejącą strukturę zatrudnienia. Największe zmiany mogą zajść na tzw. "szczeblu średnim" w którego skład wchodzą wszelkiego rodzaju menadżerowie czy kierownicy.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    To właśnie funkcję "średniego szczebla" przyjął Claudius. Eksperyment pokazał, że sztuczna inteligencja nadal nie jest gotowa, by w pełni przejąć zadania na tym poziomie, głównie ze względu na problemy takie jak wcześniej wspomniane halucynacje. Model Anthropic poradził sobie jednak dobrze w realizacji konkretnych zadań, takich jak składanie zamówień czy research produktów, pozostając jednocześnie odpornym na próby naruszenia bezpieczeństwa. Wskazuje to, że w najbliższej przyszłości AI prawdopodobnie nie zastąpi całkowicie stanowisk menedżerskich, ale znacząco wesprze automatyzację i robotyzację wielu procesów. Według doniesień Reutersa, sztuczna inteligencja jest już teraz implementowana jest w "określonych środowiskach sprzedaży detalicznej", aby usprawnić działania w obszarach takich jak efektywniejsze zarządzanie czasem, rekrutacja nowych pracowników czy ocena ich produktywności.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Automatyzacja procesów może prowadzić do zjawiska zwanego Great Flattening – czyli sytuacji, w której ludzcy menedżerowie muszą nadzorować pracę rosnącej liczby osób, co staje się możliwe właśnie dzięki wsparciu sztucznej inteligencji w obszarach wspomnianych wcześniej przez Reuters. Warto w tym kontekście przywołać doniesienia platformy Axios, która niedawno poinformowała, że obecni kierownicy średniego szczebla odpowiadają za dwa razy więcej pracowników niż jeszcze 5 lat temu. Ta tendencja jest wyraźnie skorelowana z upowszechnieniem modeli LLM od 2023 roku, co jasno przedstawia załączona grafika. Takie rozszerzenie zakresu obowiązków eliminuje potrzebę zatrudniania dodatkowych menedżerów – co stanowi korzystną informację dla przedsiębiorców, ale niekorzystną dla osób poszukujących pracy na stanowiskach kierowniczych.
                  </p>
                </div>
              </section>

              {/* Podsumowanie */}
              <section id="podsumowanie" className="mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-inter text-left">
                  Podsumowanie
                </h2>
                <div className="max-w-none">
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Eksperyment przeprowadzony przez Anthropic ukazał imponujące możliwości, jakie już dziś oferują modele sztucznej inteligencji. Nie pozostawia on wątpliwości, że w niedalekiej przyszłości AI znacząco uprości wiele zadań, z którymi obecnie mierzą się osoby na stanowiskach kierowniczych, nie zastępując ich jeszcze ale prowadząc do zmniejszenia liczebności ich występowania.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Tutaj warto zaznaczyć, że model Claudius nadal popełnia liczne błędy. Wbrew zapewnieniom specjalistów z Anthropic, nie wszystkie z nich da się łatwo wyeliminować za pomocą scaffoldingu — wiele problemów ma bowiem charakter strukturalny, co pokazuje choćby kwestia obecności empatii algorytmicznej.
                  </p>
                  <p className="text-white/90 leading-relaxed mb-6 font-source text-lg text-left">
                    Największą barierą w implementacji AI w roli menedżerów średniego szczebla pozostaje jednak ryzyko halucynacji. Dopiero gdy zostanie ono zredukowane do poziomu w którym wystąpienie tego zjawiska będzie graniczyło z niemal niemożliwym, a nie zaledwie 2–3%, będzie można mówić o realnej szansie na szerokie wdrożenie tych rozwiązań.
                  </p>
                </div>
              </section>
              
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              {/* Pusta przestrzeń po lewej stronie dla wyrównania */}
              <div className="w-64 flex-shrink-0 hidden lg:block"></div>
              {/* Treść footer */}
              <div className="flex-1 min-w-0 lg:max-w-4xl text-center space-y-4">
            {/* Logo i nazwa */}
            <div className="flex flex-col items-center justify-center space-y-3 mb-6">
              <img 
                src="/logo transparent.png" 
                alt="Straylight Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-lg font-orbitron font-bold bg-gradient-to-r from-white via-gray-100 to-cyan-200 bg-clip-text text-transparent tracking-wider">
                STRAYLIGHT
              </span>
            </div>
            
            {/* Podstrony */}
            <div className="flex justify-center space-x-6 text-sm">
              <Link to="/" className="text-white/70 hover:text-white transition-colors font-source">Home</Link>
              <Link to="/artykuly" className="text-white/70 hover:text-white transition-colors font-source">Artykuły</Link>
            </div>

            {/* Email */}
            <p className="text-white/70 text-sm">
              <a href="mailto:straylightcenter@gmail.com" className="hover:text-white transition-colors font-mono">
                straylightcenter@gmail.com
              </a>
            </p>

            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-white/60">
              <span className="font-source">© 2025 StrayLight Blog. Wszystkie prawa zastrzeżone.</span>
            </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default ArticleView; 
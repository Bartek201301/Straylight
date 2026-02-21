'use client';

import { useState } from 'react';

interface FormData {
  // Resource Information
  resourceName: string;
  resourceType: string;
  url: string;
  author: string;
  description: string;

  // Categorization
  categories: string[];
  targetAudience: string;

  // Submitter Information
  submitterName: string;
  submitterEmail: string;
  recommendation: string;
  relationship: string[];

  // Additional Details
  pricing: string;
  timeInvestment: string;
  prerequisites: string;
  additionalNotes: string;
}

export default function ResourceSuggestionForm() {
  const [formData, setFormData] = useState<FormData>({
    resourceName: '',
    resourceType: '',
    url: '',
    author: '',
    description: '',
    categories: [],
    targetAudience: '',
    submitterName: '',
    submitterEmail: '',
    recommendation: '',
    relationship: [],
    pricing: '',
    timeInvestment: '',
    prerequisites: '',
    additionalNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const resourceTypes = [
    { value: 'book', label: 'Book' },
    { value: 'tool', label: 'AI Tool/Software' },
    { value: 'course', label: 'Online Course' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'dataset', label: 'Dataset' },
    { value: 'website', label: 'Website/Blog' },
    { value: 'paper', label: 'Research Paper' },
    { value: 'other', label: 'Other' },
  ];

  const categoryOptions = [
    'Machine Learning',
    'Data Science',
    'Career Development',
    'Programming',
    'AI Ethics',
    'Industry Insights',
    'Productivity',
    'Other',
  ];

  const relationshipOptions = [
    'Jestem autorem/twórcą',
    'Używałem tego osobiście',
    'Zostało mi polecone',
    'Znalazłem to poprzez badania',
  ];

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const handleRelationshipChange = (relationship: string) => {
    setFormData((prev) => ({
      ...prev,
      relationship: prev.relationship.includes(relationship)
        ? prev.relationship.filter((item) => item !== relationship)
        : [...prev.relationship, relationship],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/resources/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceName: formData.resourceName,
          resourceType: formData.resourceType,
          url: formData.url,
          author: formData.author,
          description: formData.description,
          categories: formData.categories,
          targetAudience: formData.targetAudience,
          submitterName: formData.submitterName,
          submitterEmail: formData.submitterEmail,
          recommendation: formData.recommendation,
          relationship: formData.relationship,
          pricing: formData.pricing,
          timeInvestment: formData.timeInvestment,
          prerequisites: formData.prerequisites,
          additionalNotes: formData.additionalNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.userMessage || result.error || 'Submission failed'
        );
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Resource suggestion error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div
          className={`backdrop-blur-sm border rounded-2xl p-8 ${'bg-white/5 border-white/10'}`}
        >
          <h2 className={`text-2xl font-bold mb-4 ${'text-white'}`}>
            Narzędzie Przesłane Pomyślnie!
          </h2>
          <p className={`${'text-white/70'} mb-6`}>
            Otrzymaliśmy Twoją propozycję dla{' '}
            <strong className={`${'text-white'}`}>
              &ldquo;{formData.resourceName}&rdquo;
            </strong>
            . Nasz zespół przeanalizuje ją w ciągu 2-3 dni roboczych i
            skontaktuje się z Tobą pod adresem {formData.submitterEmail}.
          </p>
          <div className={`space-y-3 text-sm ${'text-white/60'} mb-6`}>
            <p>✓ Proces recenzji: 2-3 dni robocze</p>
            <p>✓ Otrzymasz aktualizacje emailowe o statusie</p>
            <p>
              ✓ Jeśli zostanie zaaprobowane, otrzymasz uznanie jako autor
              propozycji
            </p>
          </div>
          <a
            href="/library"
            className={`px-6 py-3 rounded-xl transition-colors inline-block border ${'bg-white text-black hover:bg-white/90 border-white/20'}`}
          >
            Przeglądaj Aktualną Bibliotekę
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Resource Submission Form */}
      <div
        className={`backdrop-blur-sm border rounded-2xl p-8 ${'bg-white/5 border-white/10'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <h2 className={`text-2xl font-bold text-center mb-2 ${'text-white'}`}>
            Zaproponuj Narzędzie
          </h2>
          <p
            className={`text-center text-base mb-8 max-w-2xl mx-auto ${'text-white/70'}`}
          >
            Pomóż nam wyselekcjonować najlepsze zasoby kariery AI dla naszej
            społeczności
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Resource Information */}
          <section>
            <h3 className={`text-lg font-semibold mb-4 ${'text-white'}`}>
              Informacje o Narzędziu
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="resourceName"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Nazwa Narzędzia *
                </label>
                <input
                  type="text"
                  id="resourceName"
                  required
                  value={formData.resourceName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resourceName: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                  placeholder="np. Książka Machine Learning na 100 stronach"
                />
              </div>

              <div>
                <label
                  htmlFor="resourceType"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Typ Narzędzia *
                </label>
                <select
                  id="resourceType"
                  required
                  value={formData.resourceType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resourceType: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20'}`}
                  style={{
                    colorScheme: 'dark',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <option
                    value=""
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Wybierz typ narzędzia
                  </option>
                  {resourceTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="url"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    URL/Link
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, url: e.target.value }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                    placeholder="https://przyklad.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="author"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    Autor/Twórca
                  </label>
                  <input
                    type="text"
                    id="author"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        author: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                    placeholder="np. Andriy Burkov"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Krótki Opis *
                </label>
                <textarea
                  id="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                  placeholder="2-3 zdania wyjaśniające, dlaczego ten zasób jest wartościowy dla rozwoju kariery AI..."
                />
              </div>
            </div>
          </section>

          {/* Categorization */}
          <section>
            <h3 className={`text-lg font-semibold mb-4 ${'text-white'}`}>
              Kategoryzacja
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${'text-white/80'}`}
                >
                  Główne Kategorie (zaznacz wszystkie pasujące)
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {categoryOptions.map((category) => (
                    <label
                      key={category}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="rounded border-white/20 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-0"
                      />
                      <span className={`text-sm ${'text-white/80'}`}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="targetAudience"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Grupa Docelowa
                </label>
                <select
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetAudience: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20'}`}
                  style={{
                    colorScheme: 'dark',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <option
                    value=""
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Wybierz grupę docelową
                  </option>
                  <option
                    value="beginner"
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Początkujący
                  </option>
                  <option
                    value="intermediate"
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Średnio zaawansowany
                  </option>
                  <option
                    value="advanced"
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Zaawansowany
                  </option>
                  <option
                    value="all"
                    style={{
                      backgroundColor: '#666666',
                      color: '#fff',
                    }}
                  >
                    Wszystkie poziomy
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Submitter Information */}
          <section>
            <h3 className={`text-lg font-semibold mb-4 ${'text-white'}`}>
              Twoje Informacje
            </h3>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="submitterName"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    Twoje Imię
                  </label>
                  <input
                    type="text"
                    id="submitterName"
                    value={formData.submitterName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        submitterName: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                    placeholder="Do uznania gdy narzędzie zostanie wyróżnione (opcjonalne)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="submitterEmail"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    Adres Email *
                  </label>
                  <input
                    type="email"
                    id="submitterEmail"
                    required
                    value={formData.submitterEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        submitterEmail: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                    placeholder="Do kontaktu i aktualizacji statusu"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="recommendation"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Dlaczego to polecasz?
                </label>
                <textarea
                  id="recommendation"
                  rows={2}
                  value={formData.recommendation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      recommendation: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                  placeholder="Podziel się swoim osobistym doświadczeniem lub dlaczego uważasz, że to będzie wartościowe..."
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${'text-white/80'}`}
                >
                  Twój związek z tym narzędziem
                </label>
                <div className="space-y-2">
                  {relationshipOptions.map((relationship) => (
                    <label
                      key={relationship}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.relationship.includes(relationship)}
                        onChange={() => handleRelationshipChange(relationship)}
                        className="rounded border-white/20 bg-white/5 text-white focus:ring-white/20 focus:ring-offset-0"
                      />
                      <span className={`text-sm ${'text-white/80'}`}>
                        {relationship}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Additional Details */}
          <section>
            <h3 className={`text-lg font-semibold mb-4 ${'text-white'}`}>
              Dodatkowe Szczegóły
            </h3>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pricing"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    Cena
                  </label>
                  <select
                    id="pricing"
                    value={formData.pricing}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20'}`}
                    style={{
                      colorScheme: 'dark',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <option
                      value=""
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      Wybierz cenę
                    </option>
                    <option
                      value="free"
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      Free
                    </option>
                    <option
                      value="freemium"
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      Freemium
                    </option>
                    <option
                      value="paid"
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      Paid
                    </option>
                    <option
                      value="subscription"
                      style={{
                        backgroundColor: '#666666',
                        color: '#fff',
                      }}
                    >
                      Subscription
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="timeInvestment"
                    className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                  >
                    Inwestycja Czasowa
                  </label>
                  <input
                    type="text"
                    id="timeInvestment"
                    value={formData.timeInvestment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeInvestment: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                    placeholder="np. 10 godzin, 2 tygodnie, 3 miesiące"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prerequisites"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Wymagania Wstępne
                </label>
                <input
                  type="text"
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prerequisites: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                  placeholder="np. Podstawowa znajomość Pythona, Algebra liniowa"
                />
              </div>

              <div>
                <label
                  htmlFor="additionalNotes"
                  className={`block text-sm font-medium mb-2 ${'text-white/80'}`}
                >
                  Dodatkowe Notatki
                </label>
                <textarea
                  id="additionalNotes"
                  rows={3}
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalNotes: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
                  placeholder="Wszelkie inne istotne informacje o tym narzędziu..."
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-3 rounded-xl transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${'bg-white text-black hover:bg-white/90 border-white/20'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  <span>Przesyłanie Narzędzia...</span>
                </div>
              ) : (
                'Prześlij Propozycję Narzędzia'
              )}
            </button>
          </div>

          <p
            className={`text-sm text-center max-w-3xl mx-auto leading-relaxed ${'text-white/60'}`}
          >
            Przesyłając, potwierdzasz, że masz prawo zaproponować to narzędzie i
            że wszystkie podane informacje są dokładne. Przeanalizujemy Twoją
            propozycję w ciągu 2-3 dni roboczych.
          </p>
        </form>
      </div>

      {/* Review Process */}
      <div className="mt-16">
        <h3
          className={`text-xl font-semibold text-center mb-8 ${'text-white'}`}
        >
          Proces Recenzji
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div
            className={`backdrop-blur-sm border rounded-2xl p-6 text-center ${'bg-white/5 border-white/10'}`}
          >
            <h4 className={`font-semibold mb-2 ${'text-white'}`}>
              1. Przesyłanie
            </h4>
            <p className={`text-sm ${'text-white/70'}`}>
              Przesyłasz narzędzie ze szczegółowymi informacjami i osobistą
              rekomendacją.
            </p>
          </div>
          <div
            className={`backdrop-blur-sm border rounded-2xl p-6 text-center ${'bg-white/5 border-white/10'}`}
          >
            <h4 className={`font-semibold mb-2 ${'text-white'}`}>
              2. Recenzja
            </h4>
            <p className={`text-sm ${'text-white/70'}`}>
              Nasz zespół ocenia jakość, trafność i wartość dla społeczności w
              ciągu 2-3 dni roboczych.
            </p>
          </div>
          <div
            className={`backdrop-blur-sm border rounded-2xl p-6 text-center ${'bg-white/5 border-white/10'}`}
          >
            <h4 className={`font-semibold mb-2 ${'text-white'}`}>
              3. Publikacja
            </h4>
            <p className={`text-sm ${'text-white/70'}`}>
              Jeśli zostanie zaaprobowane, dodajemy je do naszej biblioteki i
              przyznajemy Ci uznanie jako autorowi propozycji.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

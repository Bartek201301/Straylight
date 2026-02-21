import { NextResponse } from 'next/server';

interface ChatRequestBody {
  prompt: string;
  page?: {
    url?: string;
    title?: string;
    pathname?: string;
    content?: string;
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const REQUESTED_MODEL = (process.env.AI_MODEL || 'gpt-4o-mini').trim();
// Map nieistniejących aliasów do wspieranych modeli OpenAI
const MODEL_ALIASES: Record<string, string> = {
  'gpt-5-nano': 'gpt-4o-mini',
  'gpt5-nano': 'gpt-4o-mini',
};
const DEFAULT_MODEL =
  MODEL_ALIASES[REQUESTED_MODEL] || REQUESTED_MODEL || 'gpt-4o-mini';
const BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = process.env.AI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'AI_API_KEY is not set on the server' },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatRequestBody;
    const { prompt, page, history } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Build strict system prompt (Polish)
    const systemPrompt = [
      'Jesteś "SL Asystent" – asystentem strony StrayLight.',
      'Odpowiadasz WYŁĄCZNIE na pytania dotyczące tej witryny: jej treści, podstron, artykułów, nawigacji i funkcji.',
      'Jeśli pytanie wykracza poza kontekst strony – grzecznie odmów i poproś o pytanie związane z witryną.',
      'Możesz streszczać artykuły – wykorzystuj przekazany kontekst bieżącej strony.',
      'Bądź zwięzły, pomocny i po polsku.',
    ].join(' ');

    const pageContext = `Kontekst strony:
URL: ${page?.url ?? 'nieznany'}
Tytuł: ${page?.title ?? 'nieznany'}
Ścieżka: ${page?.pathname ?? 'nieznana'}
Tekst (skrócony): ${page?.content?.slice(0, 8000) ?? 'brak'}
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history?.slice(-6) || []),
      {
        role: 'user',
        content: `${pageContext}\n\nPytanie użytkownika: ${prompt}`,
      },
    ] as Array<{ role: string; content: string }>;

    // Call provider via Chat Completions
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        ...(BASE_URL.includes('openrouter.ai')
          ? {
              'HTTP-Referer':
                process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              'X-Title': 'StrayLight',
            }
          : {}),
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = await res.text();
      }
      const status = res.status;
      // Zwróć czytelny komunikat – często 400 pochodzi z nieprawidłowej nazwy modelu
      return NextResponse.json(
        {
          error: 'AI provider error',
          hint:
            status === 400
              ? 'Sprawdź nazwę modelu (AI_MODEL) i poprawność klucza API. Użyj np. gpt-4o-mini.'
              : undefined,
          status,
          detail,
          model: DEFAULT_MODEL,
          baseUrl: BASE_URL,
        },
        { status: 500 }
      );
    }

    const data = await res.json();
    const reply: string =
      data?.choices?.[0]?.message?.content ||
      'Przepraszam, nie mogę teraz odpowiedzieć.';
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected server error', detail: (err as Error).message },
      { status: 500 }
    );
  }
}

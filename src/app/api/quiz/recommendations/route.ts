import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors/api-errors';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface QuizAnswers {
  role: string;
  primary_goal: string;
  pain_point: string;
  workflow: string;
  time_investment: string;
  team_context: string;
  experience_level: string;
  budget: string;
  integrations: string[];
  specific_challenge?: string;
}

interface AIRecommendation {
  tool_id: string;
  personalized_guidance: string;
}

interface RecommendationsResponse {
  recommendations: AffiliateLibraryRow[];
  personalized_guidance: Record<string, string>;
  quiz_answers: QuizAnswers;
}

interface AIToolResponse {
  recommendations: AIRecommendation[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const AI_TIMEOUT_MS = 30000; // 30 seconds - increased to handle complex prompts
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates and sanitizes quiz answers from request body
 */
function validateQuizAnswers(body: any): QuizAnswers {
  const {
    role,
    primary_goal,
    pain_point,
    workflow,
    time_investment,
    team_context,
    experience_level,
    budget,
    integrations,
    specific_challenge,
  } = body;

  // Check all required fields are present
  const requiredFields = [
    role,
    primary_goal,
    pain_point,
    workflow,
    time_investment,
    team_context,
    experience_level,
    budget,
  ];

  if (requiredFields.some((field) => !field || typeof field !== 'string')) {
    throw new ValidationError(
      'All required quiz fields must be non-empty strings'
    );
  }

  // Validate integrations (required array)
  if (!Array.isArray(integrations) || integrations.length === 0) {
    throw new ValidationError('integrations must be a non-empty array');
  }

  if (
    !integrations.every(
      (item) => typeof item === 'string' && item.trim().length > 0
    )
  ) {
    throw new ValidationError('All integrations must be non-empty strings');
  }

  // Validate specific_challenge (optional)
  if (
    specific_challenge !== undefined &&
    typeof specific_challenge !== 'string'
  ) {
    throw new ValidationError('specific_challenge must be a string');
  }

  if (specific_challenge && specific_challenge.length > 500) {
    throw new ValidationError(
      'specific_challenge cannot exceed 500 characters'
    );
  }

  // Trim and validate length for all string fields
  const trimmed = {
    role: role.trim(),
    primary_goal: primary_goal.trim(),
    pain_point: pain_point.trim(),
    workflow: workflow.trim(),
    time_investment: time_investment.trim(),
    team_context: team_context.trim(),
    experience_level: experience_level.trim(),
    budget: budget.trim(),
    integrations: integrations.map((i: string) => i.trim()),
    specific_challenge: specific_challenge?.trim(),
  };

  // Validate no empty strings after trim
  const stringFields = [
    trimmed.role,
    trimmed.primary_goal,
    trimmed.pain_point,
    trimmed.workflow,
    trimmed.time_investment,
    trimmed.team_context,
    trimmed.experience_level,
    trimmed.budget,
  ];

  if (stringFields.some((field) => field.length === 0)) {
    throw new ValidationError('Quiz fields cannot be empty after trimming');
  }

  // Validate max length (500 chars for all fields)
  if (stringFields.some((field) => field.length > 500)) {
    throw new ValidationError('Quiz fields cannot exceed 500 characters');
  }

  return trimmed as QuizAnswers;
}

/**
 * Validates that a string is a valid UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

/**
 * Fetches available tools from the affiliate_library table
 */
async function fetchAvailableTools(): Promise<AffiliateLibraryRow[]> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('affiliate_library')
    .select(
      'id, title, description, tags, price_range, rating, author, affiliate_url, image_url, click_count, is_active, created_at, updated_at, type, isbn, publisher, publication_year, is_featured, featured_order'
    )
    .eq('type', 'tool')
    .eq('is_active', true)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error('Database error fetching tools:', error);
    throw new DatabaseError('Failed to fetch available tools', error);
  }

  if (!data || data.length === 0) {
    throw new NotFoundError('No tools available in the library');
  }

  return data as AffiliateLibraryRow[];
}

/**
 * Fetches full tool data for specified IDs, preserving order
 */
async function fetchToolsByIds(
  toolIds: string[]
): Promise<AffiliateLibraryRow[]> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('affiliate_library')
    .select(
      'id, title, description, tags, price_range, rating, author, affiliate_url, image_url, click_count, is_active, created_at, updated_at, type, isbn, publisher, publication_year, is_featured, featured_order'
    )
    .in('id', toolIds);

  if (error) {
    console.error('Database error fetching tools by IDs:', error);
    throw new DatabaseError('Failed to fetch recommended tools', error);
  }

  // Preserve the order from AI response
  const orderedTools: AffiliateLibraryRow[] = [];
  for (const id of toolIds) {
    const tool = data?.find((t) => t.id === id);
    if (tool) {
      orderedTools.push(tool as AffiliateLibraryRow);
    }
  }

  return orderedTools;
}

// =============================================================================
// AI PROMPT FUNCTIONS
// =============================================================================

/**
 * Builds the system prompt for AI
 */
function buildSystemPrompt(): string {
  return `You are an expert AI tool recommender for Polish users. Your PRIMARY goal is to match tools to the user's SPECIFIC needs, NOT to recommend the highest-rated tools.

INPUT DATA YOU'LL RECEIVE:
1. Role (professional context)
2. Primary goal (what they want to achieve)
3. Pain point (current challenge)
4. Workflow state (beginner to advanced)
5. Time investment (daily commitment)
6. Team context (solo vs collaborative)
7. Experience level (AI familiarity)
8. Budget (price constraints)
9. Integrations (existing tools to connect with)
10. Specific challenge (optional user-written context)

CRITICAL MATCHING RULES - READ CAREFULLY:
1. **MATCH TO USER NEEDS, NOT RATINGS**: A 3-star tool that perfectly fits the user's specific_challenge is better than a 5-star tool that doesn't
2. **PRIORITIZE SPECIFICITY**: If user mentions "content creation for social media", recommend social media tools, not general writing tools
3. **RESPECT CONSTRAINTS**:
   - Budget: Free user → only free/freemium tools
   - Experience: Beginner → simple, easy-to-learn tools
   - Time: <30min/day → tools with quick wins, not complex platforms
4. **INTEGRATION COMPATIBILITY**: If user uses "Google Workspace", prioritize tools with Google integrations
5. **PAIN POINT FIRST**: The tool must directly solve their stated pain_point
6. **AVOID POPULAR BIAS**: Do NOT always recommend the same popular tools. Dig deeper into the catalog.

STRICT SELECTION PROCESS:
Step 1: Filter tools by budget (eliminate anything user can't afford)
Step 2: Filter by experience_level (eliminate too complex or too simple)
Step 3: Match to pain_point (must address this directly)
Step 4: Match to primary_goal (must help achieve this)
Step 5: Check integration compatibility (bonus points)
Step 6: Match to specific_challenge if provided (highest priority)
Step 7: From remaining tools, select the 3 MOST RELEVANT (not highest rated)

OUTPUT REQUIREMENTS:
You MUST return EXACTLY 3 tool recommendations as a JSON object with this structure:

{
  "recommendations": [
    {
      "tool_id": "8d95fde5-417c-4803-9b5d-94991def11e9",
      "personalized_guidance": "W Twojej sytuacji jako [role], to narzędzie pomoże Ci [specific benefit]. Zacznij od [concrete first step based on their workflow]. Dzięki integracji z [their existing tools], zaoszczędzisz [time estimate based on time_investment]."
    },
    {
      "tool_id": "939c3d87-914b-4b6b-b458-8879611abe2d",
      "personalized_guidance": "..."
    },
    {
      "tool_id": "140abfbb-f9d7-49b7-be2d-758a225dc3aa",
      "personalized_guidance": "..."
    }
  ]
}

CRITICAL INSTRUCTION FOR tool_id:
- The tool_id MUST be the exact UUID string from the "id" field in the AVAILABLE TOOLS list
- DO NOT use the tool title, name, or any other field - ONLY use the UUID from "id"
- Example: If you see {"id": "8d95fde5-417c-4803-9b5d-94991def11e9", "title": "NotebookLM", ...}
  then tool_id MUST be "8d95fde5-417c-4803-9b5d-94991def11e9" (NOT "NotebookLM")

PERSONALIZATION RULES:
- Write guidance in Polish, 2-3 sentences
- MUST reference their specific pain_point and explain HOW this tool solves it
- MUST mention their primary_goal and connect the tool to achieving it
- If specific_challenge provided, address it explicitly in the guidance
- Reference their role for context
- Mention their existing integrations if relevant
- Provide actionable first step based on experience_level
- Suggest realistic time to value based on time_investment
- Consider team_context for collaborative vs solo features

IMPORTANT JSON FORMATTING:
- Return ONLY valid JSON, no markdown code blocks
- Each personalized_guidance must be 2-3 sentences in Polish
- Address user's specific context, not generic advice
- CRITICAL: AVOID using double quotes (") or single quotes (') in Polish text
- Use alternative phrasing instead of quotes (e.g., say "narzędzie typu X" instead of "narzędzie 'X'")
- If quotes are absolutely necessary, they will be automatically escaped`;
}

/**
 * Builds the user prompt with quiz answers and available tools
 */
function buildUserPrompt(
  quizAnswers: QuizAnswers,
  tools: AffiliateLibraryRow[]
): string {
  // Format tools for AI consumption - optimized to reduce prompt size
  // Only include essential fields to speed up processing
  const formattedTools = tools.map((tool) => ({
    tool_id: tool.id,
    title: tool.title,
    description: tool.description || 'No description',
    tags: tool.tags,
    price_range: tool.price_range || 'not specified',
  }));

  return `USER PROFILE (10 detailed inputs):

1. Rola zawodowa: ${quizAnswers.role}
2. Główny cel: ${quizAnswers.primary_goal}
3. Problem do rozwiązania: ${quizAnswers.pain_point}
4. Obecny workflow: ${quizAnswers.workflow}
5. Czas na naukę dziennie: ${quizAnswers.time_investment}
6. Kontekst zespołowy: ${quizAnswers.team_context}
7. Poziom doświadczenia z AI: ${quizAnswers.experience_level}
8. Budżet: ${quizAnswers.budget}
9. Używane narzędzia: ${quizAnswers.integrations.join(', ')}
${quizAnswers.specific_challenge ? `10. Konkretne wyzwanie: "${quizAnswers.specific_challenge}"` : '10. Konkretne wyzwanie: (nie podano)'}

AVAILABLE TOOLS:
${JSON.stringify(formattedTools, null, 2)}

CRITICAL INSTRUCTIONS:
- You MUST use the exact "tool_id" value from the AVAILABLE TOOLS list above
- For example, if you see {"tool_id": "8d95fde5-417c-4803-9b5d-94991def11e9", "title": "NotebookLM", ...}
  you MUST return "8d95fde5-417c-4803-9b5d-94991def11e9" as the tool_id (NOT "NotebookLM")
- Do NOT use the title field - ONLY use the tool_id field

Based on the 10 detailed user inputs above, select EXACTLY 3 most suitable tools and provide personalized Polish guidance (2-3 sentences) for each. Return as JSON with recommendations array containing tool_id and personalized_guidance.`;
}

// =============================================================================
// AI API FUNCTIONS
// =============================================================================

/**
 * Calls OpenAI API with retry logic
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  retryCount = 0
): Promise<AIToolResponse> {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle rate limiting with retry
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      console.log(
        `Rate limited, retrying in ${RETRY_DELAY_MS}ms... (attempt ${retryCount + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return callOpenAI(systemPrompt, userPrompt, retryCount + 1);
    }

    // Handle server errors with retry
    if (response.status >= 500 && retryCount < 1) {
      console.log(
        `Server error, retrying in 1s... (attempt ${retryCount + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callOpenAI(systemPrompt, userPrompt, retryCount + 1);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Log AI response for debugging (first 500 chars)
    console.log('AI Response Preview:', content.substring(0, 500));
    console.log('AI Response Length:', content.length, 'characters');

    // Parse the JSON response with better error handling
    try {
      const parsedResponse = JSON.parse(content) as AIToolResponse;
      return parsedResponse;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Full AI Response:', content);
      throw new Error(
        `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timeout');
    }

    throw error;
  }
}

/**
 * Validates and processes AI response
 * Returns tuple: [tool_ids, personalized_guidance_map]
 */
function validateAIResponse(
  aiResponse: AIToolResponse,
  availableToolIds: string[],
  availableTools: AffiliateLibraryRow[]
): [string[], Record<string, string>] {
  if (
    !aiResponse.recommendations ||
    !Array.isArray(aiResponse.recommendations)
  ) {
    throw new Error(
      'Invalid AI response format: missing or invalid recommendations array'
    );
  }

  // Log what AI returned for debugging
  try {
    console.log(
      'AI selections:',
      aiResponse.recommendations.map((r) => ({
        received_id: r?.tool_id || 'missing',
        is_uuid: r?.tool_id ? isValidUUID(r.tool_id) : false,
        has_guidance: !!r?.personalized_guidance,
      }))
    );
  } catch (logError) {
    console.error('Error logging AI selections:', logError);
  }

  // Validate recommendations and extract IDs + guidance
  const validToolIds: string[] = [];
  const personalizedGuidance: Record<string, string> = {};
  const seenIds = new Set<string>();

  for (const rec of aiResponse.recommendations) {
    // Validate recommendation structure
    if (!rec || typeof rec !== 'object') continue;
    if (!rec.tool_id || typeof rec.tool_id !== 'string') continue;
    if (
      !rec.personalized_guidance ||
      typeof rec.personalized_guidance !== 'string'
    )
      continue;

    let toolId = rec.tool_id.trim();
    const guidance = rec.personalized_guidance.trim();

    // If not a valid UUID, try to find tool by title (fallback)
    if (!isValidUUID(toolId)) {
      console.warn(`⚠️  AI returned non-UUID tool_id: "${toolId}"`);

      try {
        // Try exact match first
        let toolByTitle = availableTools.find(
          (t) => t.title.toLowerCase() === toolId.toLowerCase()
        );

        // If no exact match, try partial match
        if (!toolByTitle) {
          toolByTitle = availableTools.find(
            (t) =>
              t.title.toLowerCase().includes(toolId.toLowerCase()) ||
              toolId.toLowerCase().includes(t.title.toLowerCase())
          );
        }

        if (toolByTitle) {
          console.log(
            `✅ Converted "${toolId}" → "${toolByTitle.id}" (${toolByTitle.title})`
          );
          toolId = toolByTitle.id;
        } else {
          console.error(`❌ No matching tool found for: "${toolId}"`);
          console.error(
            'Available tool titles:',
            availableTools.map((t) => t.title).join(', ')
          );
          continue;
        }
      } catch (lookupError) {
        console.error(
          `❌ Error during title lookup for "${toolId}":`,
          lookupError
        );
        continue;
      }
    }

    // Skip duplicates
    if (seenIds.has(toolId)) continue;

    // Skip IDs not in available tools
    if (!availableToolIds.includes(toolId)) {
      console.error(`❌ Tool ID not in available tools: "${toolId}"`);
      continue;
    }

    // Skip empty guidance
    if (guidance.length === 0) continue;

    validToolIds.push(toolId);
    personalizedGuidance[toolId] = guidance;
    seenIds.add(toolId);

    // Stop at 3 valid recommendations
    if (validToolIds.length >= 3) break;
  }

  return [validToolIds, personalizedGuidance];
}

// =============================================================================
// MAIN ROUTE HANDLER
// =============================================================================

/**
 * POST /api/quiz/recommendations
 * Generate AI tool recommendations based on quiz answers
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Step 1: Validate request body
    const body = await request.json();
    const quizAnswers = validateQuizAnswers(body);

    console.log('Quiz answers validated:', quizAnswers);

    // Step 2: Fetch available tools from database
    const availableTools = await fetchAvailableTools();
    const availableToolIds = availableTools.map((t) => t.id);

    console.log(`Fetched ${availableTools.length} available tools`);

    // Step 3: Build AI prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(quizAnswers, availableTools);

    // Step 4: Call OpenAI API
    console.log('Calling OpenAI API...');
    const aiResponse = await callOpenAI(systemPrompt, userPrompt);

    // Step 5: Validate and process AI response
    const [recommendedIdsFromAI, personalizedGuidance] = validateAIResponse(
      aiResponse,
      availableToolIds,
      availableTools
    );

    console.log(
      `AI recommended ${recommendedIdsFromAI.length} valid tools with personalized guidance`
    );

    // Step 6: Validate we have exactly 3 recommendations from AI
    if (recommendedIdsFromAI.length < 3) {
      console.error(
        `AI returned only ${recommendedIdsFromAI.length} recommendations (expected 3)`
      );
      throw new Error(
        'AI nie zwrócił wystarczającej liczby rekomendacji. Spróbuj ponownie za chwilę.'
      );
    }

    // Ensure we have exactly 3 recommendations (trim if more)
    const recommendedIds = recommendedIdsFromAI.slice(0, 3);

    // Step 7: Fetch full tool data
    const recommendations = await fetchToolsByIds(recommendedIds);

    if (recommendations.length !== 3) {
      throw new Error('Failed to fetch all recommended tools from database');
    }

    // Step 8: Format response with personalized guidance
    const responseData: RecommendationsResponse = {
      recommendations,
      personalized_guidance: personalizedGuidance,
      quiz_answers: quizAnswers,
    };

    console.log('Successfully generated recommendations:', recommendedIds);
    console.log(
      'Personalized guidance for:',
      Object.keys(personalizedGuidance)
    );

    return createSuccessResponse(
      responseData,
      'Recommendations generated successfully',
      requestId
    );
  } catch (error) {
    console.error('Error in quiz recommendations endpoint:', error);
    return handleAPIError(error, requestId);
  }
}

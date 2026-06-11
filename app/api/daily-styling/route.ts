import type {
  DailyStylingScene,
  DailyStylingSuggestion,
  DailyStylingWeather,
} from "@/lib/daily-styling";
import type { StyleDNA } from "@/lib/mock-style-dna";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

type DailyStylingRequest = {
  city?: string;
  scene?: DailyStylingScene;
  styleDNA?: StyleDNA;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OpenWeatherResponse = {
  name?: string;
  main?: {
    temp?: number;
  };
  weather?: Array<{
    description?: string;
    main?: string;
  }>;
};

function isDailyStylingScene(value: unknown): value is DailyStylingScene {
  return (
    value === "work" ||
    value === "casual" ||
    value === "date" ||
    value === "party"
  );
}

function isStyleDNA(value: unknown): value is StyleDNA {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as StyleDNA).styleName === "string" &&
      typeof (value as StyleDNA).styleSummary === "string" &&
      (value as StyleDNA).styleDNA,
  );
}

function isDailyStylingSuggestion(
  value: unknown,
): value is Omit<DailyStylingSuggestion, "weather"> {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.summary === "string" &&
    typeof record.outerwear === "string" &&
    typeof record.top === "string" &&
    typeof record.bottom === "string" &&
    typeof record.shoes === "string" &&
    typeof record.accessories === "string" &&
    typeof record.reason === "string"
  );
}

function getFallbackWeather(city: string): DailyStylingWeather {
  return {
    city,
    temperature: 22,
    condition: "mild weather",
  };
}

async function getCurrentWeather(city: string): Promise<DailyStylingWeather> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn("Missing OPENWEATHER_API_KEY. Using fallback weather.");
    return getFallbackWeather(city);
  }

  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: "metric",
  });

  try {
    const response = await fetch(`${OPENWEATHER_API_URL}?${searchParams}`);

    if (!response.ok) {
      const responseText = await response.text();

      console.error("OpenWeather request failed", {
        status: response.status,
        statusText: response.statusText,
        responseText,
        city,
      });

      return getFallbackWeather(city);
    }

    const data = (await response.json()) as OpenWeatherResponse;
    const temperature = data.main?.temp;
    const condition =
      data.weather?.[0]?.description ?? data.weather?.[0]?.main ?? "Unknown";

    if (typeof temperature !== "number") {
      console.warn(
        "OpenWeather response missing temperature. Using fallback weather.",
      );
      return getFallbackWeather(city);
    }

    return {
      city: data.name || city,
      temperature: Math.round(temperature),
      condition,
    };
  } catch (error) {
    console.error("OpenWeather fetch failed. Using fallback weather.", error);
    return getFallbackWeather(city);
  }
}

function parseDailyStyling(
  content: string,
): Omit<DailyStylingSuggestion, "weather"> {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed: unknown = JSON.parse(trimmed);

  if (!isDailyStylingSuggestion(parsed)) {
    throw new Error("Daily styling response did not match schema.");
  }

  return parsed;
}

function buildDailyStylingPrompt({
  scene,
  styleDNA,
  weather,
}: {
  scene: DailyStylingScene;
  styleDNA: StyleDNA;
  weather: DailyStylingWeather;
}) {
  const sceneGuidance: Record<DailyStylingScene, string> = {
    work: "Work: professional, polished, office-appropriate, but not automatically formal or heavy. The outfit must still be comfortable for the actual weather.",
    casual:
      "Casual: relaxed, practical, comfortable, low-maintenance, suitable for errands, coffee, walking, or daily movement.",
    date: "Date: refined, attractive, soft, considered, and emotionally appealing, but not uncomfortable, overdone, or disconnected from the user's Style DNA.",
    party:
      "Party: expressive, stylish, and slightly bolder, but still realistic for the weather and clearly aligned with the user's Style DNA.",
  };

  return `You are a Daily Styling Assistant inside an AI Aesthetic Coach product.

The product's core is Style Discovery.
Your task is NOT to create a new style.
Your task is to apply the user's CURRENT Style DNA to today's weather and scene.

The CURRENT Style DNA is the source of truth.
Do not use memory from previous generations.
Do not reuse previous outfit formulas.
Do not create a generic outfit template.
Do not redefine the user's style.

Important about Style DNA:
The user's Style DNA may be based on limited input, such as only one brand or one celebrity.
When the input is sparse, infer aesthetic direction carefully and conservatively.
Treat brands, celebrities, and icons as taste signals, not direct outfit instructions.
Do not overfit to one stereotype.
Do not assume the user wants every iconic item from that brand/person.

Scene:
${scene}

Scene-specific requirement:
${sceneGuidance[scene]}

Weather:
${JSON.stringify(weather, null, 2)}

Think in this order before writing the JSON:
Step 1: Read the CURRENT Style DNA and summarize internally what kind of person/aesthetic this is.
Step 2: Analyze the current weather and temperature. Decide what is physically comfortable and practical.
Step 3: Choose outfit items that match the Style DNA.
Step 4: Adapt those items to the selected scene.
Step 5: Check whether every item is justified by Style DNA + weather + scene.
Step 6: If any item feels like a cliché or does not fit the weather, replace it.

Decision priority:
1. Weather practicality and physical comfort come first.
2. Then follow the user's CURRENT Style DNA.
3. Then adapt to the selected scene.
4. Then optimize for aesthetics.

Weather rules:
- Weather is not a minor detail.
- Temperature must strongly affect outerwear, fabric, footwear, and layering.
- If a garment would be uncomfortable in the current temperature, replace it with a lighter or heavier equivalent that keeps the same aesthetic.
- If the weather is hot, avoid heavy outerwear, boots, thick layers, leather-heavy styling, wool, and heat-trapping materials unless the weather condition clearly requires them.
- If outerwear is not needed, say so directly in the outerwear field.
- Do not recommend items that would be physically uncomfortable for the stated temperature.

Style DNA obedience rules:
- Every item must be explainable by the CURRENT Style DNA.
- Prioritize recommendedItems, likedElements, keywords, colorPalette, hairAndMakeup, and outfitIdeas.
- Strictly avoid avoidItems and dislikedElements.
- If an item conflicts with avoidItems or dislikedElements, it must not appear in the final outfit.
- If the Style DNA is based on limited input, keep the outfit flexible, wearable, and not overly specific.

Do not rely on scene clichés:
- Work does not automatically mean blazer.
- Party does not automatically mean mini skirt.
- Edgy style does not automatically mean boots.
- Feminine style does not automatically mean heels.
- Luxury style does not automatically mean black.
- A brand reference does not mean copying that brand's most stereotypical outfit.

Choose weather-appropriate equivalents that preserve the user's aesthetic identity.
The final outfit should feel like "this user, today", not a fashion magazine template.

User Style DNA:
${JSON.stringify(
  {
    styleName: styleDNA.styleName,
    styleSummary: styleDNA.styleSummary,
    styleDNA: styleDNA.styleDNA,
    keywords: styleDNA.keywords,
    likedElements: styleDNA.likedElements,
    dislikedElements: styleDNA.dislikedElements,
    colorPalette: styleDNA.colorPalette,
    hairAndMakeup: styleDNA.hairAndMakeup,
    recommendedItems: styleDNA.recommendedItems,
    avoidItems: styleDNA.avoidItems,
    outfitIdeas: styleDNA.outfitIdeas,
  },
  null,
  2,
)}

Return only valid JSON in this exact shape:
{
  "summary": "string",
  "outerwear": "string",
  "top": "string",
  "bottom": "string",
  "shoes": "string",
  "accessories": "string",
  "reason": "string"
}`;
}

async function generateDailyStyling({
  scene,
  styleDNA,
  weather,
}: {
  scene: DailyStylingScene;
  styleDNA: StyleDNA;
  weather: DailyStylingWeather;
}): Promise<DailyStylingSuggestion> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY.");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildDailyStylingPrompt({ scene, styleDNA, weather }),
        },
      ],
      temperature: 0.45,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();

    console.error("DeepSeek request failed", {
      status: response.status,
      statusText: response.statusText,
      responseText,
    });

    throw new Error(
      `Daily styling AI request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Daily styling AI returned empty content.");
  }

  return {
    ...parseDailyStyling(content),
    weather,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DailyStylingRequest;
    const city = body.city?.trim() || "Sydney";
    const scene = body.scene;

    if (!isDailyStylingScene(scene) || !isStyleDNA(body.styleDNA)) {
      return Response.json(
        { error: "Missing city, scene, or Style DNA." },
        { status: 400 },
      );
    }

    console.log(
      "FULL STYLE DNA:",
      JSON.stringify(body.styleDNA, null, 2)
    );
    const weather = await getCurrentWeather(city);
    const suggestion = await generateDailyStyling({
      scene,
      styleDNA: body.styleDNA,
      weather,
    });

    return Response.json(suggestion);
  } catch (error) {
    console.error("DAILY_STYLING_API_ERROR:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Daily styling request failed.",
      },
      { status: 500 },
    );
  }
}
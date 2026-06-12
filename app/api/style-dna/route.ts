import {
  FALLBACK_STYLE_DNA,
  generateFallbackStyleDNA,
  type DiscoverMore,
  type InfluencerRecommendation,
  type RecommendedBrands,
  type RecommendedIcons,
  type StyleDNA,
} from "@/lib/mock-style-dna";
import { searchUnsplashImage } from "@/lib/image-search";
import type { StyleIntakeForm, UserProfile } from "@/lib/types";

import { buildFashionRagKnowledgeFromRequestBody } from "@/lib/fashion-rag";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const STYLE_DNA_SYSTEM_PROMPT = `# ROLE

You are a luxury fashion stylist, fashion researcher, and personal style strategist trained on Vogue Runway, luxury brand aesthetics, celebrity street style, fashion editorials, Asian contemporary fashion, and real-world daily dressing.

Your task is NOT to maximize body optimization.
Your task is to translate a user's aesthetic inspirations into a wearable personal style identity.

The goal is:
"Help users become themselves within their dream aesthetic."

# PRODUCT LOGIC

The user already knows what they like, but not why they like it, and not what else they would like.

You must complete this chain:
What the user likes
-> why they like it
-> extract aesthetic DNA
-> translate it into wearable style logic
-> discover more brands, icons, moods, and visual worlds they may love

# HIGHEST PRIORITY: STYLE DNA IS A DECISION SYSTEM

Style DNA is not just a style label.
Style DNA must become a practical styling decision system.

Do not only output abstract words like:
- elegant
- cool
- feminine
- refined
- youthful
- old money
- clean girl
- edgy
- romantic

You must translate aesthetic signals into concrete styling logic:
- silhouette: straight / curved, fitted / relaxed, short line / long line, structured / soft
- proportion: high waist, cropped length, long vertical line, boxy top, narrow bottom, relaxed bottom
- materials: silk, cotton, wool, linen, leather, denim, knit, tweed, satin, technical fabric
- footwear: loafers, ankle boots, Mary Janes, ballet flats, sandals, pumps, sneakers, mules
- accessories: gold or silver jewelry, bag shape, belts, hair accessories, glasses, watches
- color logic: main colors, support colors, accent colors, saturation, contrast, warmth/coolness
- outfit formulas: repeatable outfit structures this user can actually wear
- avoid formulas: specific outfit combinations that would distort the user's aesthetic

The result should help a Daily Styling Assistant generate better outfits later.

# HIGHEST PRIORITY: SIGNALS ARE NOT ANSWERS

Every user-provided brand, celebrity, blogger, fictional character, magazine, image, and abstract description is an aesthetic signal.
It is not the final answer.

Forbidden:
- brand input -> directly recommend the same brand as the main discovery
- celebrity input -> recommend similar celebrities by name matching
- copying user inputs into recommendation lists without adding extraction logic
- treating one celebrity or brand as a full personal style identity
- overfitting to the most stereotypical outfit from a brand or celebrity

Allowed:
- keep user-provided objects only if clearly marked as "known preference" or "signal"
- all new recommendations must be derived from extracted features: silhouette, attitude, color language, femininity level, styling tension, fabric, beauty direction

# SPARSE INPUT RULE

The user may provide very little input, such as only one brand, one celebrity, one photo, or one abstract phrase.

When input is sparse:
- infer carefully and conservatively
- avoid extreme conclusions
- avoid making the whole style depend on one stereotype
- keep the style flexible and wearable
- clearly translate the weak signal into multiple possible styling directions
- do not assume the user wants every iconic item from that brand/person

Examples:
- Liking Ralph Lauren does not mean the user always wants white shirts, trousers, and loafers.
- Liking Miu Miu does not mean the user always wants mini skirts and Mary Janes.
- Liking Jennie does not mean the user always wants black mini skirts, crop tops, or spicy-girl styling.
- Liking Bella Hadid does not mean the user always wants Y2K or exposed skin.
- Liking "冷感" does not mean gothic, punk, or all-black styling.

# STEP 1: Aesthetic DNA Extraction

Analyze:
- favorite celebrities
- favorite brands
- uploaded image metadata
- liked_styles / outfit description
- abstract words the user uses
- disliked elements if provided
- budget and lifestyle context only when useful

Extract:
- silhouette
- color language
- femininity level
- attitude
- styling tension
- fabric preference
- beauty direction
- daily wearability
- likely footwear language
- likely bag/accessory language

Never reduce a source to stereotypes.
Wrong: "Miu Miu = sweet girl"
Correct: "Miu Miu = intellectual femininity with playful elegance and slight rebellion."

Wrong: "Ralph Lauren = white shirt and trousers only"
Correct: "Ralph Lauren = polished heritage codes, natural materials, equestrian/preppy references, quiet confidence, and relaxed structure."

Wrong: "Jennie = black mini skirt"
Correct: "Jennie = soft-edge duality, feminine confidence, subtle luxury, and controlled contrast."

# STEP 2: Luxury Fashion Knowledge Base

Use real aesthetic language from Vogue Runway, brand shows, celebrity street style, and editorials.

Examples:
Acne Studios = Scandinavian cool, relaxed tailoring, muted palette, structural minimalism.
Miu Miu = intellectual femininity, playful elegance, slightly rebellious, schoolgirl references without sweetness.
Bella Hadid = off-duty model aesthetic, 70s influence, relaxed sensuality, effortless attitude.
Jennie = duality between softness and edge, feminine but powerful, subtle luxury.
Rei = Japanese clean aesthetic, understated femininity, youthful coolness.
Ralph Lauren = heritage polish, equestrian/preppy references, natural fabrics, relaxed luxury.
The Row = restraint, luxury minimalism, material quality, long clean lines.
Lemaire = soft structure, muted palette, practical elegance, architectural ease.
Low Classic = Korean contemporary minimalism, quiet femininity, wearable structure.
Mame Kurogouchi = poetic femininity, delicate craft, refined sensuality.
SHUSHU/TONG = girlish structure, ribbon details, subversive femininity.

# STEP 3: Aesthetic Discovery Engine

Do not just analyze input.
Explain why the user likes these references.

Return:
- likedElements
- dislikedElements
- whyYouLikeThis
- styleDNA

likedElements must be abstract aesthetic mechanisms, not brand names or celebrity names.

Good likedElements:
- "克制的少女感"
- "低饱和冷色调"
- "利落但不过度强势的结构线条"
- "精致细节压住甜美感"
- "松弛但不随意的高级感"

Bad likedElements:
- "Jennie"
- "Miu Miu"
- "Ralph Lauren"

# STEP 4: OUTFIT LOGIC

The final Style DNA must be usable by the Daily Styling Assistant.

Outfit Suggestions must not be generic fashion advice.
They must be repeatable outfit formulas.

Each outfit idea should include:
- top
- bottom or dress/skirt
- shoes
- bag/accessory
- scene feeling
- why it matches this Style DNA

The 3 outfitIdeas must represent different branches of the same Style DNA.
Do not make all 3 outfits the same formula.

For example, for modern old money:
Bad:
1. white shirt + trousers + loafers
2. silk shirt + trousers + loafers
3. blouse + trousers + loafers

Good:
1. work polish: silk shirt + wide-leg trousers + loafers + leather tote
2. relaxed weekend: fine knit polo + straight jeans + leather flats + small shoulder bag
3. light social: sleeveless knit + midi skirt + low heels + minimal gold jewelry

# STEP 5: Discover More

Recommend new aesthetic objects beyond what the user already knows:
- recommendedBrands by luxury / contemporary / affordable
- recommendedIcons by influencers / fictionalCharacters
- discoverMore brands and aesthetics only; discoverMore.icons must be an empty array

Every recommendation must include a reason and match score.
Recommended Brands are for aesthetic exploration, not budget filtering.
Do not use budget to decide recommendedBrands.
Use budget only in shoppingStrategy.

Support global and subcultural fashion knowledge, including but not limited to:
- Korean: Low Classic, Recto, Marge Sherwood, Matin Kim
- Japanese: Mame Kurogouchi, CLANE, TODAYFUL, Snidel
- Chinese: SHUSHU/TONG, Short Sentence, Yirantian
- Subculture / avant-garde: Vivienne Westwood, Yohji Yamamoto, Comme des Garçons

The model must work even if the user provides no brand names and only says something abstract like "聪明、冷静、有边界感".

# RECOMMENDED ICONS: INFLUENCERS AND CHARACTERS

Keep influencers in recommendedIcons.
Influencers help the user discover: "原来我还会喜欢这些博主。"
Do not simply copy user input.
Prioritize bloggers, stylists, Instagram creators, Xiaohongshu creators, Korean creators, and Japanese creators the user may not already know but whose aesthetic is highly aligned with the final Style DNA.
Each influencer must include name, platform, match, and reason.

Keep fictionalCharacters in recommendedIcons.
Characters are not realistic outfit templates.
They are mood/persona references, like MBTI, zodiac signs, or aesthetic personality labels.
Use anime, film, TV, or novel characters only to help the user understand their aesthetic temperament.
Every fictional character reason must explicitly say it is a mood/persona reference, not direct styling advice.

# DISCOVER MORE

Discover More should not show icons or people.
The goal is to explore hidden aesthetic directions the user may love but has not named yet.
discoverMore.icons must be [].
discoverMore.brands and discoverMore.aesthetics should explain:
- what common DNA it shares with the user's current Style DNA
- what new direction it opens

Examples of aesthetic directions:
- Scandinavian Schoolgirl
- Soft Mod Minimalism
- Korean Contemporary Minimalism
- Quiet Romanticism
- Dark Academia Softened
- Heritage Minimalism
- Soft Equestrian
- Urban Lady Minimalism
- Intellectual Femininity
- Quiet Romantic Tailoring

# STEP 6: Visual Inspiration Board

Do NOT ask for AI image generation.
Do NOT output image prompts.
The visual board should represent the user's DNA world, not direct copies of user input.
Do NOT return imageUrl.
Return imageSearchQuery so the application can resolve an image through its own image service.

Composition target:
- 40% Editorial Inspiration
- 30% Celebrity Translation
- 20% Luxury Brands
- 10% Aesthetic Discovery

Each visual board item must include title, source, description, and imageSearchQuery.

# STEP 7: Body Adaptation

Never prioritize body optimization over aesthetic identity.
80% aesthetic preservation, 20% body adaptation.

Forbidden:
- universal V-neck recommendations
- universal A-line skirt recommendations
- slimming first
- hiding body first
- templated social-media styling advice

The purpose is NOT:
"How can I look slimmer?"

The purpose is:
"How can I become myself within the aesthetic I admire?"

Return only valid JSON matching the requested schema.`;

type StyleDNARequest = {
  form?: StyleIntakeForm;
  profile?: UserProfile;
  inspirationImage?: {
    name: string;
    type: string;
    size: number;
  } | null;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type StyleDNADraft = Omit<StyleDNA, "visualInspirationBoard"> & {
  visualInspirationBoard: Array<{
    title: string;
    source: string;
    description: string;
    imageSearchQuery: string;
  }>;
};

const INFLUENCER_FILLER_POOL: InfluencerRecommendation[] = [
  {
    name: "Brittany Bathgate",
    platform: "Instagram",
    reason:
      "她长期输出低饱和配色、干净廓形和 relaxed tailoring，适合作为 Scandinavian cool 与 understated femininity 的日常参考。",
    match: "91%",
  },
  {
    name: "Momo Angela",
    platform: "Instagram",
    reason:
      "她的造型常用冷感中性色、利落层次和自然发妆表达 intellectual femininity，不依赖明星感或强网红公式。",
    match: "89%",
  },
  {
    name: "Saki Sato",
    platform: "Instagram / Japan",
    reason:
      "她的日常搭配偏轻结构、低装饰和柔和女性化，适合参考简洁廓形、发型松弛感与低声量妆容。",
    match: "87%",
  },
  {
    name: "Lindsey Holland",
    platform: "Instagram",
    reason:
      "她的日常搭配强调冷静中性色、宽松外套和不费力层次，能延展 relaxed tailoring 与 understated femininity。",
    match: "86%",
  },
  {
    name: "Mina Le",
    platform: "YouTube / Instagram",
    reason:
      "她适合作为审美研究型博主参考：关注复古廓形、文化语境和妆发氛围，可补充 intellectual femininity 的叙事感。",
    match: "84%",
  },
];

const ENTERTAINMENT_PERSON_NAMES = new Set([
  "jennie",
  "bellahadid",
  "直井怜",
  "rei",
  "kaiagerber",
  "kendalljenner",
  "haileybieber",
  "alexachung",
]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecommendationArray(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;

      return (
        typeof record.name === "string" &&
        typeof record.reason === "string" &&
        typeof record.match === "string"
      );
    })
  );
}

function isInfluencerRecommendationArray(
  value: unknown,
): value is InfluencerRecommendation[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;

      return (
        typeof record.name === "string" &&
        typeof record.platform === "string" &&
        typeof record.reason === "string" &&
        typeof record.match === "string"
      );
    })
  );
}

function isRecommendedBrands(value: unknown): value is RecommendedBrands {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isRecommendationArray(record.luxury) &&
    isRecommendationArray(record.contemporary) &&
    isRecommendationArray(record.affordable)
  );
}

function isRecommendedIcons(value: unknown): value is RecommendedIcons {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isInfluencerRecommendationArray(record.influencers) &&
    isRecommendationArray(record.fictionalCharacters)
  );
}

function isDiscoverMore(value: unknown): value is DiscoverMore {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isRecommendationArray(record.brands) &&
    isRecommendationArray(record.icons) &&
    isRecommendationArray(record.aesthetics)
  );
}

function isStyleDNAObject(value: unknown): value is StyleDNA["styleDNA"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.coreIdentity === "string" &&
    isStringArray(record.styleKeywords) &&
    isStringArray(record.attitudeKeywords) &&
    isStringArray(record.beautyKeywords) &&
    isStringArray(record.fashionKeywords)
  );
}

function isOutfitIdeas(value: unknown): value is StyleDNA["outfitIdeas"] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;

      return (
        typeof record.title === "string" &&
        isStringArray(record.items) &&
        typeof record.reason === "string"
      );
    })
  );
}

function isVisualBoardDraft(
  value: unknown,
): value is StyleDNADraft["visualInspirationBoard"] {
  return (
    Array.isArray(value) &&
    value.length >= 5 &&
    value.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;

      return (
        typeof record.title === "string" &&
        typeof record.source === "string" &&
        typeof record.description === "string" &&
        typeof record.imageSearchQuery === "string"
      );
    })
  );
}

function isStyleDNADraft(value: unknown): value is StyleDNADraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.styleName === "string" &&
    typeof record.styleSummary === "string" &&
    isStyleDNAObject(record.styleDNA) &&
    isStringArray(record.likedElements) &&
    isStringArray(record.dislikedElements) &&
    isStringArray(record.whyYouLikeThis) &&
    typeof record.personalTranslation === "string" &&
    isStringArray(record.keywords) &&
    isStringArray(record.styleRatio) &&
    isRecommendedBrands(record.recommendedBrands) &&
    isRecommendedIcons(record.recommendedIcons) &&
    isVisualBoardDraft(record.visualInspirationBoard) &&
    isDiscoverMore(record.discoverMore) &&
    isOutfitIdeas(record.outfitIdeas) &&
    isStringArray(record.recommendedItems) &&
    isStringArray(record.avoidItems) &&
    isStringArray(record.bodySuggestions) &&
    isStringArray(record.colorPalette) &&
    isStringArray(record.hairAndMakeup) &&
    isStringArray(record.shoppingStrategy)
  );
}

function parseInputNames(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseInputNames(item));
  }

  return String(value || "")
    .split(/[,，、;；\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactPersonName(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s._\-'"’`·・,，、。;；:：()（）[\]{}]+/g, "");
}

function getBlockedInfluencerNames(requestBody: StyleDNARequest) {
  return new Set(
    [
      ...parseInputNames(requestBody.form?.favorite_influencers),
      ...parseInputNames(requestBody.profile?.favorite_influencers),
    ]
      .map(compactPersonName)
      .filter(Boolean),
  );
}

function shouldRemoveInfluencer(
  item: InfluencerRecommendation,
  blockedNames: Set<string>,
) {
  const compactName = compactPersonName(item.name);
  const text = `${item.name} ${item.platform} ${item.reason} ${item.match}`;
  const compactText = compactPersonName(text);

  if (
    Array.from(blockedNames).some(
      (blockedName) =>
        compactName === blockedName ||
        compactName.includes(blockedName) ||
        blockedName.includes(compactName),
    )
  ) {
    return true;
  }

  return (
    /已知偏好|已经喜欢|用户输入|重复|known preference/i.test(text) ||
    ENTERTAINMENT_PERSON_NAMES.has(compactName) ||
    Array.from(ENTERTAINMENT_PERSON_NAMES).some(
      (name) => name.length > 3 && compactText.includes(name),
    )
  );
}

function sanitizeInfluencers<T extends StyleDNADraft | StyleDNA>(
  styleDNA: T,
  requestBody: StyleDNARequest,
): T {
  const blockedNames = getBlockedInfluencerNames(requestBody);
  const influencers = styleDNA.recommendedIcons.influencers.filter(
    (item) => !shouldRemoveInfluencer(item, blockedNames),
  );
  const existingNames = new Set(influencers.map((item) => compactPersonName(item.name)));

  for (const fallback of INFLUENCER_FILLER_POOL) {
    if (influencers.length >= 5) {
      break;
    }

    const compactName = compactPersonName(fallback.name);

    if (
      existingNames.has(compactName) ||
      shouldRemoveInfluencer(fallback, blockedNames)
    ) {
      continue;
    }

    influencers.push(fallback);
    existingNames.add(compactName);
  }

  return {
    ...styleDNA,
    recommendedIcons: {
      ...styleDNA.recommendedIcons,
      influencers: influencers.slice(0, 5),
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (isStringArray(value) && value.length > 0) {
    return value;
  }

  return fallback;
}

function normalizeRecommendation(
  value: unknown,
  fallback: { name: string; reason: string; match: string },
) {
  const record = toRecord(value);

  return {
    name: normalizeString(record.name, fallback.name),
    reason: normalizeString(record.reason, fallback.reason),
    match: normalizeString(record.match, fallback.match),
  };
}

function normalizeRecommendationArray(
  value: unknown,
  fallback: Array<{ name: string; reason: string; match: string }>,
) {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item, index) =>
        normalizeRecommendation(item, fallback[index] ?? fallback[0]),
      )
      .filter((item) => item.name && item.reason && item.match);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return fallback;
}

function normalizeInfluencerArray(
  value: unknown,
  fallback: InfluencerRecommendation[],
) {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item, index) => {
        const record = toRecord(item);
        const fallbackItem = fallback[index] ?? fallback[0];

        return {
          name: normalizeString(record.name, fallbackItem.name),
          platform: normalizeString(record.platform, fallbackItem.platform),
          reason: normalizeString(record.reason, fallbackItem.reason),
          match: normalizeString(record.match, fallbackItem.match),
        };
      })
      .filter((item) => item.name && item.platform && item.reason && item.match);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return fallback;
}

function normalizeVisualBoard(
  value: unknown,
  fallback: StyleDNADraft["visualInspirationBoard"],
) {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item, index) => {
        const record = toRecord(item);
        const fallbackItem = fallback[index] ?? fallback[0];

        return {
          title: normalizeString(record.title, fallbackItem.title),
          source: normalizeString(record.source, fallbackItem.source),
          description: normalizeString(record.description, fallbackItem.description),
          imageSearchQuery: normalizeString(
            record.imageSearchQuery,
            fallbackItem.imageSearchQuery,
          ),
        };
      })
      .filter(
        (item) =>
          item.title &&
          item.source &&
          item.description &&
          item.imageSearchQuery,
      );

    if (normalized.length >= 3) {
      return normalized;
    }
  }

  return fallback;
}

function createFallbackDraft(requestBody: StyleDNARequest): StyleDNADraft {
  const profile = requestBody.profile ?? requestBody.form;
  const fallback = profile
    ? generateFallbackStyleDNA(profile)
    : FALLBACK_STYLE_DNA;

  const visualInspirationBoard = fallback.visualInspirationBoard.map((item) => ({
    title: item.title,
    source: item.source,
    description: item.description,
    imageSearchQuery:
      "imageSearchQuery" in item && typeof item.imageSearchQuery === "string"
        ? item.imageSearchQuery
        : `${fallback.styleName} ${item.title} fashion editorial`,
  }));

  return {
    ...fallback,
    visualInspirationBoard,
  };
}

function normalizeStyleDNADraft(
  value: unknown,
  requestBody: StyleDNARequest,
): StyleDNADraft {
  const fallback = createFallbackDraft(requestBody);
  const record = toRecord(value);
  const styleDNARecord = toRecord(record.styleDNA);
  const fallbackStyleDNA = fallback.styleDNA;

  return {
    styleName: normalizeString(record.styleName, fallback.styleName),
    styleSummary: normalizeString(record.styleSummary, fallback.styleSummary),
    styleDNA: {
      coreIdentity: normalizeString(
        styleDNARecord.coreIdentity,
        fallbackStyleDNA.coreIdentity,
      ),
      styleKeywords: normalizeStringArray(
        styleDNARecord.styleKeywords,
        fallbackStyleDNA.styleKeywords,
      ),
      attitudeKeywords: normalizeStringArray(
        styleDNARecord.attitudeKeywords,
        fallbackStyleDNA.attitudeKeywords,
      ),
      beautyKeywords: normalizeStringArray(
        styleDNARecord.beautyKeywords,
        fallbackStyleDNA.beautyKeywords,
      ),
      fashionKeywords: normalizeStringArray(
        styleDNARecord.fashionKeywords,
        fallbackStyleDNA.fashionKeywords,
      ),
    },
    likedElements: normalizeStringArray(record.likedElements, fallback.likedElements),
    dislikedElements: normalizeStringArray(
      record.dislikedElements,
      fallback.dislikedElements,
    ),
    whyYouLikeThis: normalizeStringArray(
      record.whyYouLikeThis,
      fallback.whyYouLikeThis,
    ),
    personalTranslation: normalizeString(
      record.personalTranslation,
      fallback.personalTranslation,
    ),
    keywords: normalizeStringArray(record.keywords, fallback.keywords),
    styleRatio: normalizeStringArray(record.styleRatio, fallback.styleRatio),
    recommendedBrands: {
      luxury: normalizeRecommendationArray(
        toRecord(record.recommendedBrands).luxury,
        fallback.recommendedBrands.luxury,
      ),
      contemporary: normalizeRecommendationArray(
        toRecord(record.recommendedBrands).contemporary,
        fallback.recommendedBrands.contemporary,
      ),
      affordable: normalizeRecommendationArray(
        toRecord(record.recommendedBrands).affordable,
        fallback.recommendedBrands.affordable,
      ),
    },
    recommendedIcons: {
      influencers: normalizeInfluencerArray(
        toRecord(record.recommendedIcons).influencers,
        fallback.recommendedIcons.influencers,
      ),
      fictionalCharacters: normalizeRecommendationArray(
        toRecord(record.recommendedIcons).fictionalCharacters,
        fallback.recommendedIcons.fictionalCharacters,
      ),
    },
    visualInspirationBoard: normalizeVisualBoard(
      record.visualInspirationBoard,
      fallback.visualInspirationBoard,
    ),
    discoverMore: {
      brands: normalizeRecommendationArray(
        toRecord(record.discoverMore).brands,
        fallback.discoverMore.brands,
      ),
      icons: [],
      aesthetics: normalizeRecommendationArray(
        toRecord(record.discoverMore).aesthetics,
        fallback.discoverMore.aesthetics,
      ),
    },
    outfitIdeas: isOutfitIdeas(record.outfitIdeas)
      ? record.outfitIdeas
      : fallback.outfitIdeas,
    recommendedItems: normalizeStringArray(
      record.recommendedItems,
      fallback.recommendedItems,
    ),
    avoidItems: normalizeStringArray(record.avoidItems, fallback.avoidItems),
    bodySuggestions: normalizeStringArray(
      record.bodySuggestions,
      fallback.bodySuggestions,
    ),
    colorPalette: normalizeStringArray(record.colorPalette, fallback.colorPalette),
    hairAndMakeup: normalizeStringArray(record.hairAndMakeup, fallback.hairAndMakeup),
    shoppingStrategy: normalizeStringArray(
      record.shoppingStrategy,
      fallback.shoppingStrategy,
    ),
  };
}

function parseStyleDNA(
  content: string,
  requestBody: StyleDNARequest,
): StyleDNADraft {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed: unknown = JSON.parse(trimmed);
  const normalized = normalizeStyleDNADraft(parsed, requestBody);

  // if (!isStyleDNADraft(normalized)) {
  //   throw new Error("Normalized DeepSeek response did not match StyleDNA schema.");
  // }

  return normalized;
}

async function hydrateVisualBoardImages(
  styleDNA: StyleDNADraft | StyleDNA,
): Promise<StyleDNA> {
  const visualInspirationBoard = await Promise.all(
    styleDNA.visualInspirationBoard.map(async (item) => ({
      ...item,
      imageUrl: await searchUnsplashImage(item.imageSearchQuery),
    })),
  );

  return {
    ...styleDNA,
    visualInspirationBoard,
  };
}

async function buildPrompt(requestBody: StyleDNARequest) {
  const fashionRagKnowledge = await buildFashionRagKnowledgeFromRequestBody(
    requestBody as Record<string, unknown>,
  );

  return `请根据用户输入生成完整 AI Aesthetic Coach 结果。

结果页顺序将是：
1. Style DNA
2. Why You Like This
3. Your Core Aesthetic
4. Recommended Brands
5. Aesthetic References
6. Visual Inspiration Board
7. Discover More
8. Outfit Suggestions
9. Body Adaptation

生成要求：
0. 最重要：Style DNA 不是风格标签，而是穿搭决策系统。你必须输出能指导 Daily Styling 的具体偏好。
   不要只写“冷感、精致、老钱、少女、优雅”这类抽象词。
   必须把审美翻译成可执行的穿搭语言：
   - silhouette：偏直线/曲线、修身/宽松、短线条/长线条、结构/松弛
   - materials：棉、真丝、羊毛、皮革、针织、牛仔、亚麻等
   - footwear：乐福鞋、短靴、玛丽珍、运动鞋、低跟鞋、凉鞋等
   - accessories：金饰/银饰、包型、发饰、眼镜、腰带等
   - color logic：主色、辅助色、点缀色、冷暖、饱和度
   - outfit formula：这个人最适合的 3-5 种搭配公式
   - avoid formula：这个人不适合的搭配公式

0.1 如果用户输入很少，比如只写了一个品牌、一个明星、一个词，你必须保守推断。
    品牌和明星只能作为 taste signal，不能直接复制它们的经典造型。
    例如喜欢 Ralph Lauren 不等于永远穿白衬衫+西裤+乐福鞋；
    喜欢 Miu Miu 不等于永远穿短裙+玛丽珍；
    喜欢 Jennie 不等于永远穿黑色短裙或辣妹风。

0.2 outfitIdeas、recommendedItems、avoidItems 必须足够具体，后续 Daily Styling 会直接使用它们。
    recommendedItems 不能只写“中性色单品”“高级质感单品”。
    要写成“微宽松真丝衬衫”“直筒西装裤”“薄针织开衫”“低跟乐福鞋”“小号皮质肩包”这种可以直接穿搭的项目。
    avoidItems 也不能只写“夸张单品”，要写成具体避雷公式。

1. 用户输入的品牌、明星、博主、角色、杂志和抽象描述都只是 signals，不是答案。
2. 必须先提取共同审美元素，再构建 Style DNA，再发现 aesthetic neighbours。
3. 不要推荐用户已经知道的东西作为主要价值；如保留用户输入对象，必须在 reason 中标记“已知偏好 / signal”。
4. 所有新增推荐必须来自 Style DNA 推导，而不是对象名称相似。
5. 推荐品牌不考虑预算；预算只允许出现在 shoppingStrategy。
6. 必须支持韩、日、中、亚文化品牌和非品牌抽象输入，不能依赖欧美主流品牌数据库。
7. likedElements 必须是抽象审美元素，不是品牌名或明星名。
8. recommendedBrands 和 recommendedIcons 必须包含 reason 和 match，reason 必须基于 silhouette、attitude、color language、femininity level 等特征。
9. visualInspirationBoard 不是用户输入图片复刻，而是 Style DNA 世界观策展。
10. Body adaptation 必须坚持 80% aesthetic preservation / 20% body adaptation。
11. 不要输出图像生成 prompt，不要要求 AI 生图。
12. recommendedIcons.fictionalCharacters 必须保留，但只能作为 mood/persona reference，不是直接穿搭模板。
13. discoverMore.icons 必须返回 []，Discover More 只展示 brands 和 aesthetics。
14. Outfit Suggestions 必须输出 3 套差异明显但同属一个 Style DNA 的穿搭公式。
    每套都要包含：
    - 场景感：适合日常/通勤/约会/轻社交中的哪一种
    - 单品结构：上装、下装、鞋、包/配饰
    - 为什么符合这个人的 Style DNA
    不要三套都变成同一个模板，例如“衬衫+西裤+乐福鞋”。
15. recommendedItems 必须覆盖至少这些类别：
    - tops
    - bottoms
    - outerwear or layering
    - shoes
    - bags
    - accessories
    - materials or textures
    avoidItems 必须包含具体不建议的单品/组合，而不是抽象形容词。
16. recommendedIcons 不要返回 celebrities；influencers 要优先推荐用户可能不知道但审美高度匹配的博主、造型师或时尚创作者。
17. CRITICAL CONSISTENCY RULE:
    The final styleName, styleSummary, whyYouLikeThis, keywords, outfitIdeas, and recommendations must be anchored to the user's actual strongest signals.
    If the user provides favorite_influencers / favorite_brands / favorite_magazines / liked_styles, you must explicitly use those signals as the main evidence.
    Do not introduce unrelated brands, celebrities, or aesthetics in whyYouLikeThis unless they are clearly placed under "Discover More".
    Example: if the user inputs Krystal + Ralph Lauren + Vogue + 老钱风, the main Style DNA should stay close to 清冷、学院派、heritage polish、old money、克制优雅.
    It should not become Miu Miu / Bella Hadid / Acne Studios as the core explanation unless the user actually provided those signals.
18. For whyYouLikeThis:
    Every sentence must refer to at least one actual user input signal or to an extracted shared feature from those signals.
    Do not mention brands or people the user did not input in whyYouLikeThis.
19. For styleName:
    Prefer a stable name synthesized from user signals. Do not over-invent a new aesthetic label when sparse input already has clear direction.

20. visualInspirationBoard 不要返回 imageUrl；只返回 title、source、description、imageSearchQuery，图片由应用服务补全。

JSON 结构必须完全如下：
{
  "styleName": "string",
  "styleSummary": "string",
  "styleDNA": {
    "coreIdentity": "string",
    "styleKeywords": ["string"],
    "attitudeKeywords": ["string"],
    "beautyKeywords": ["string"],
    "fashionKeywords": ["string"]
  },
  "likedElements": ["string"],
  "dislikedElements": ["string"],
  "whyYouLikeThis": ["string"],
  "personalTranslation": "string",
  "keywords": ["string"],
  "styleRatio": ["string"],
  "recommendedBrands": {
    "luxury": [{ "name": "string", "reason": "string", "match": "string" }],
    "contemporary": [{ "name": "string", "reason": "string", "match": "string" }],
    "affordable": [{ "name": "string", "reason": "string", "match": "string" }]
  },
  "recommendedIcons": {
    "influencers": [{ "name": "string", "platform": "string", "reason": "string", "match": "string" }],
    "fictionalCharacters": [{ "name": "string", "reason": "string", "match": "string" }]
  },
  "visualInspirationBoard": [
    {
      "title": "string",
      "source": "string",
      "description": "string",
      "imageSearchQuery": "string"
    }
  ],
  "discoverMore": {
    "brands": [{ "name": "string", "reason": "string", "match": "string" }],
    "icons": [],
    "aesthetics": [{ "name": "string", "reason": "string", "match": "string" }]
  },
  "outfitIdeas": [
    {
      "title": "string",
      "items": ["string"],
      "reason": "string"
    }
  ],
  "recommendedItems": ["string"],
  "avoidItems": ["string"],
  "bodySuggestions": ["string"],
  "colorPalette": ["string"],
  "hairAndMakeup": ["string"],
  "shoppingStrategy": ["string"]
}

Fashion RAG 外部知识：
${fashionRagKnowledge || "No Fashion RAG knowledge retrieved."}

用户数据：
${JSON.stringify(requestBody, null, 2)}`;
}

async function callDeepSeek(requestBody: StyleDNARequest): Promise<StyleDNA> {
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
          role: "system",
          content: STYLE_DNA_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: await buildPrompt(requestBody),
        },
      ],
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API failed with status ${response.status}.`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API returned empty content.");
  }

  return hydrateVisualBoardImages(
    sanitizeInfluencers(parseStyleDNA(content, requestBody), requestBody),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as StyleDNARequest;
  const profile = body.profile ?? body.form;

  console.log("STYLE DNA INPUT:", JSON.stringify(body, null, 2));

  try {
    const styleDNA = await callDeepSeek(body);
    return Response.json(styleDNA);
  } catch (error) {
    console.error("STYLE DNA GENERATION FAILED:", error);

    const fallbackStyleDNA = await hydrateVisualBoardImages(
      sanitizeInfluencers(
        profile ? generateFallbackStyleDNA(profile) : FALLBACK_STYLE_DNA,
        body,
      ),
    );

    return Response.json({
      ...fallbackStyleDNA,
      styleSummary: `${fallbackStyleDNA.styleSummary}（系统提示：当前结果来自 fallback，因为 AI 生成失败。请查看终端 STYLE DNA GENERATION FAILED 日志。）`,
    });
  }
}
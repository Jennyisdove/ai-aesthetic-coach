// lib/fashion-rag.ts

import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { analyzeFashionImagesWithOpenAI, type FashionVisionImage } from "@/lib/openai-vision"

const execFileAsync = promisify(execFile)

export type FashionEntityType =
  | "brand"
  | "magazine"
  | "celebrity"
  | "style_source"
  | "unknown"

export type MatchConfidence =
  | "exact"
  | "alias"
  | "fuzzy"
  | "ambiguous"
  | "search"
  | "none"

export type SourceRole =
  | "official"
  | "magazine_reference"
  | "media_reference"
  | "search_reference"
  | "fallback"

export type FashionEntity = {
  id: string
  type: FashionEntityType
  name: string
  aliases: string[]
  officialUrl?: string
  referenceUrls?: string[]
  description?: string
  styleKeywords?: string[]
}

export type FashionMatch = {
  input: string
  normalizedInput: string
  entity?: FashionEntity
  confidence: MatchConfidence
  score: number
  candidates?: FashionEntity[]
  reason?: string
}

export type WebSearchResult = {
  title?: string
  url?: string
  content?: string
  score?: number
}

export type PageMeta = {
  url: string
  title?: string
  metaDescription?: string
  ogDescription?: string
  ogImage?: string
  images?: FashionVisionImage[]
}

export type FashionRagSource = {
  role: SourceRole
  url?: string
  title?: string
  content?: string
  metaDescription?: string
  ogDescription?: string
  ogImage?: string
  images?: FashionVisionImage[]
  visionAnalysis?: string
  note?: string
}

export type FashionRagKnowledge = {
  input: string
  normalizedInput: string
  matchedName?: string
  type: FashionEntityType
  matchConfidence: MatchConfidence
  matchScore: number
  officialSource?: FashionRagSource
  magazineSources: FashionRagSource[]
  fallbackDescription?: string
  styleKeywords?: string[]
  note?: string
}

const SEARCH_API_TIMEOUT_MS = 8000
const PAGE_FETCH_TIMEOUT_MS = 6000

const FASHION_ENTITIES: FashionEntity[] = [
  {
    id: "dior",
    type: "brand",
    name: "Dior",
    aliases: ["dior", "christian dior"],
    officialUrl: "https://www.dior.com/",
    referenceUrls: [
      "https://www.vogue.com/fashion-shows/fall-2026-ready-to-wear/christian-dior/slideshow/collection",
      "https://www.vogue.com/fashion-shows/spring-2026-ready-to-wear/christian-dior/slideshow/collection",
      "https://www.vogue.com/fashion-shows/spring-2026-couture/christian-dior/slideshow/collection",
    ],
    description:
      "Dior is associated with French elegance, couture femininity, romantic silhouettes, polished tailoring, luxury craftsmanship and refined sophistication.",
    styleKeywords: [
      "French elegance",
      "couture femininity",
      "romantic silhouette",
      "polished tailoring",
      "luxury craftsmanship",
      "ladylike",
    ],
  },
  {
    id: "miu-miu",
    type: "brand",
    name: "Miu Miu",
    aliases: ["miumiu", "miu", "miu-miu"],
    officialUrl: "https://www.miumiu.com/",
    description:
      "Miu Miu is known for youthful, playful, subversive femininity, mixing preppy, girlish, vintage and intellectual styling codes.",
    styleKeywords: [
      "playful femininity",
      "preppy",
      "girlish",
      "vintage",
      "ironic elegance",
      "layering",
    ],
  },
  {
    id: "acne-studios",
    type: "brand",
    name: "Acne Studios",
    aliases: [
      "acne",
      "acne studio",
      "acne studios",
      "acnestudios",
      "acnestudio",
      "acnestudioi",
    ],
    officialUrl: "https://www.acnestudios.com/",
    description:
      "Acne Studios is associated with Scandinavian minimalism, experimental cuts, washed denim, muted colors and offbeat modern basics.",
    styleKeywords: [
      "Scandinavian minimalism",
      "washed denim",
      "muted colors",
      "oversized silhouettes",
      "modern basics",
      "androgynous",
    ],
  },
  {
    id: "alexander-wang",
    type: "brand",
    name: "Alexander Wang",
    aliases: [
      "alexander wang",
      "alexanderwang",
      "alex wang",
      "alexander w",
      "wang",
    ],
    officialUrl: "https://www.alexanderwang.com/",
    description:
      "Alexander Wang is often linked to downtown New York cool, sporty minimalism, black tailoring, nightlife energy and model-off-duty styling.",
    styleKeywords: [
      "downtown cool",
      "model off duty",
      "black tailoring",
      "sporty minimalism",
      "nightlife",
      "street-luxe",
    ],
  },
  {
    id: "alexander-mcqueen",
    type: "brand",
    name: "Alexander McQueen",
    aliases: [
      "alexander mcqueen",
      "alexander mc queen",
      "alexandermcqueen",
      "mcqueen",
    ],
    officialUrl: "https://www.alexandermcqueen.com/",
    description:
      "Alexander McQueen is known for dramatic tailoring, romantic darkness, sculptural silhouettes and gothic theatricality.",
    styleKeywords: [
      "dramatic tailoring",
      "romantic darkness",
      "gothic",
      "sculptural silhouette",
      "theatrical",
    ],
  },
  {
    id: "prada",
    type: "brand",
    name: "Prada",
    aliases: ["prada"],
    officialUrl: "https://www.prada.com/",
    description:
      "Prada is known for intellectual minimalism, nylon, uniform-like styling, strange elegance and understated luxury.",
    styleKeywords: [
      "intellectual minimalism",
      "nylon",
      "uniform",
      "understated luxury",
      "strange elegance",
    ],
  },
  {
    id: "the-row",
    type: "brand",
    name: "The Row",
    aliases: ["the row", "row"],
    officialUrl: "https://www.therow.com/",
    description:
      "The Row is associated with quiet luxury, refined minimalism, premium materials, loose tailoring and subtle neutral palettes.",
    styleKeywords: [
      "quiet luxury",
      "refined minimalism",
      "neutral palette",
      "loose tailoring",
      "premium basics",
    ],
  },
  {
    id: "rick-owens",
    type: "brand",
    name: "Rick Owens",
    aliases: ["rick owens", "rickowens"],
    officialUrl: "https://www.rickowens.eu/",
    description:
      "Rick Owens is known for dark avant-garde, elongated silhouettes, draping, leather, monochrome palettes and gothic futurism.",
    styleKeywords: [
      "dark avant-garde",
      "gothic",
      "draping",
      "monochrome",
      "leather",
      "elongated silhouette",
    ],
  },
  {
    id: "maison-margiela",
    type: "brand",
    name: "Maison Margiela",
    aliases: [
      "maison margiela",
      "margiela",
      "maison martin margiela",
      "mm6",
    ],
    officialUrl: "https://www.maisonmargiela.com/",
    description:
      "Maison Margiela is associated with deconstruction, anonymity, conceptual fashion, raw edges and experimental styling.",
    styleKeywords: [
      "deconstruction",
      "conceptual",
      "raw edges",
      "experimental",
      "avant-garde",
    ],
  },
  {
    id: "yohji-yamamoto",
    type: "brand",
    name: "Yohji Yamamoto",
    aliases: ["yohji", "yohji yamamoto", "yohjiyamamoto"],
    officialUrl: "https://www.yohjiyamamoto.co.jp/",
    description:
      "Yohji Yamamoto is known for poetic black clothing, oversized shapes, asymmetry, draping and Japanese avant-garde tailoring.",
    styleKeywords: [
      "poetic black",
      "oversized",
      "asymmetry",
      "draping",
      "Japanese avant-garde",
    ],
  },
  {
    id: "comme-des-garcons",
    type: "brand",
    name: "Comme des Garçons",
    aliases: [
      "comme des garcons",
      "comme des garçons",
      "commedesgarcons",
      "cdg",
    ],
    officialUrl: "https://www.comme-des-garcons.com/",
    description:
      "Comme des Garçons is known for conceptual, anti-fashion, sculptural forms, asymmetry and experimental silhouettes.",
    styleKeywords: [
      "conceptual",
      "anti-fashion",
      "sculptural",
      "asymmetry",
      "experimental",
    ],
  },
  {
    id: "issey-miyake",
    type: "brand",
    name: "Issey Miyake",
    aliases: ["issey miyake", "isseymiyake", "issey"],
    officialUrl: "https://www.isseymiyake.com/",
    description:
      "Issey Miyake is associated with pleats, movement, architectural form, textile innovation and clean Japanese design.",
    styleKeywords: [
      "pleats",
      "movement",
      "architectural",
      "textile innovation",
      "clean Japanese design",
    ],
  },
  {
    id: "balenciaga",
    type: "brand",
    name: "Balenciaga",
    aliases: ["balenciaga", "balen"],
    officialUrl: "https://www.balenciaga.com/",
    description:
      "Balenciaga is known for oversized silhouettes, streetwear luxury, exaggerated proportions and provocative contemporary styling.",
    styleKeywords: [
      "oversized",
      "streetwear luxury",
      "exaggerated proportion",
      "provocative",
      "modern",
    ],
  },
  {
    id: "loewe",
    type: "brand",
    name: "Loewe",
    aliases: ["loewe", "lowe", "lo-we"],
    officialUrl: "https://www.loewe.com/",
    description:
      "Loewe is known for craft, leather goods, surreal details, artful styling and soft sculptural silhouettes.",
    styleKeywords: [
      "craft",
      "leather",
      "artful",
      "surreal",
      "soft sculpture",
    ],
  },
  {
    id: "bottega-veneta",
    type: "brand",
    name: "Bottega Veneta",
    aliases: ["bottega", "bottega veneta", "bv"],
    officialUrl: "https://www.bottegaveneta.com/",
    description:
      "Bottega Veneta is associated with leather craft, quiet luxury, modern minimalism, woven textures and confident simplicity.",
    styleKeywords: [
      "quiet luxury",
      "leather craft",
      "woven texture",
      "modern minimalism",
      "confident simplicity",
    ],
  },
  {
    id: "khaite",
    type: "brand",
    name: "Khaite",
    aliases: ["khaite", "kaite"],
    officialUrl: "https://khaite.com/",
    description:
      "Khaite is known for polished New York minimalism, strong denim, feminine tailoring and refined wardrobe staples.",
    styleKeywords: [
      "New York minimalism",
      "polished",
      "denim",
      "feminine tailoring",
      "wardrobe staples",
    ],
  },
  {
    id: "jacquemus",
    type: "brand",
    name: "Jacquemus",
    aliases: ["jacquemus", "jacquemues", "jacque mus"],
    officialUrl: "https://www.jacquemus.com/",
    description:
      "Jacquemus is associated with sunny French sensuality, playful proportions, minimal silhouettes and Mediterranean ease.",
    styleKeywords: [
      "French sensuality",
      "playful proportions",
      "sunny",
      "Mediterranean",
      "minimal silhouette",
    ],
  },
  {
    id: "sandy-liang",
    type: "brand",
    name: "Sandy Liang",
    aliases: ["sandy liang", "sandyliang"],
    officialUrl: "https://www.sandyliang.info/",
    description:
      "Sandy Liang is known for girlish nostalgia, bows, ballet references, downtown sweetness and playful feminine details.",
    styleKeywords: [
      "girlish nostalgia",
      "bows",
      "balletcore",
      "downtown sweetness",
      "playful femininity",
    ],
  },
  {
    id: "ganni",
    type: "brand",
    name: "Ganni",
    aliases: ["ganni"],
    officialUrl: "https://www.ganni.com/",
    description:
      "Ganni is associated with playful Scandinavian style, casual femininity, bold prints and relaxed confidence.",
    styleKeywords: [
      "playful Scandinavian",
      "casual femininity",
      "bold prints",
      "relaxed confidence",
    ],
  },
  {
    id: "coperni",
    type: "brand",
    name: "Coperni",
    aliases: ["coperni"],
    officialUrl: "https://coperniparis.com/",
    description:
      "Coperni is known for futuristic minimalism, tech-inspired design, clean shapes and sleek Parisian cool.",
    styleKeywords: [
      "futuristic minimalism",
      "tech-inspired",
      "sleek",
      "Parisian cool",
    ],
  },
  {
    id: "courreges",
    type: "brand",
    name: "Courrèges",
    aliases: ["courreges", "courrèges", "courrege"],
    officialUrl: "https://www.courreges.com/",
    description:
      "Courrèges is associated with retro futurism, 60s minimalism, vinyl textures, mini silhouettes and clean graphic lines.",
    styleKeywords: [
      "retro futurism",
      "60s",
      "mini silhouette",
      "vinyl",
      "graphic lines",
    ],
  },
  {
    id: "chanel",
    type: "brand",
    name: "Chanel",
    aliases: ["chanel"],
    officialUrl: "https://www.chanel.com/",
    description:
      "Chanel is known for tweed, pearls, classic femininity, refined tailoring and timeless Parisian elegance.",
    styleKeywords: [
      "classic femininity",
      "tweed",
      "pearls",
      "Parisian elegance",
      "timeless",
    ],
  },
  {
    id: "celine",
    type: "brand",
    name: "Celine",
    aliases: ["celine", "céline"],
    officialUrl: "https://www.celine.com/",
    description:
      "Celine is associated with Parisian minimalism, sharp tailoring, bourgeois chic, slim silhouettes and polished basics.",
    styleKeywords: [
      "Parisian minimalism",
      "sharp tailoring",
      "bourgeois chic",
      "polished basics",
    ],
  },
  {
    id: "saint-laurent",
    type: "brand",
    name: "Saint Laurent",
    aliases: [
      "saint laurent",
      "ysl",
      "yves saint laurent",
      "saintlaurent",
    ],
    officialUrl: "https://www.ysl.com/",
    description:
      "Saint Laurent is known for sleek black tailoring, Parisian rock chic, sharp silhouettes, leather and sensual eveningwear.",
    styleKeywords: [
      "rock chic",
      "black tailoring",
      "leather",
      "Parisian",
      "sensual",
    ],
  },
  {
    id: "vogue",
    type: "magazine",
    name: "Vogue",
    aliases: ["vogue"],
    officialUrl: "https://www.vogue.com/fashion-shows",
    referenceUrls: [
      "https://www.vogue.com/fashion-shows",
      "https://www.vogue.com/fashion-shows/spring-2026-ready-to-wear",
    ],
    description:
      "Vogue is a major fashion publication covering runway, celebrity style, fashion trends, designers and culture.",
    styleKeywords: [
      "runway",
      "celebrity style",
      "fashion trend",
      "editorial",
      "high fashion",
    ],
  },
  {
    id: "harpers-bazaar",
    type: "magazine",
    name: "Harper's Bazaar",
    aliases: [
      "bazaar",
      "harpers bazaar",
      "harper bazaar",
      "harper's bazaar",
    ],
    officialUrl: "https://www.harpersbazaar.com/",
    description:
      "Harper's Bazaar covers fashion, beauty, celebrity style, culture and luxury editorial trends.",
    styleKeywords: [
      "editorial",
      "luxury",
      "celebrity style",
      "fashion trend",
      "beauty",
    ],
  },
  {
    id: "elle",
    type: "magazine",
    name: "Elle",
    aliases: ["elle"],
    officialUrl: "https://www.elle.com/",
    description:
      "Elle covers fashion, beauty, celebrity style, culture and lifestyle with a modern accessible editorial voice.",
    styleKeywords: [
      "modern fashion",
      "beauty",
      "celebrity style",
      "trend",
      "accessible editorial",
    ],
  },
  {
    id: "w-magazine",
    type: "magazine",
    name: "W Magazine",
    aliases: ["w magazine", "wmagazine", "w mag"],
    officialUrl: "https://www.wmagazine.com/",
    description:
      "W Magazine covers fashion, art, celebrity style, luxury culture and editorial visual references.",
    styleKeywords: [
      "editorial",
      "art fashion",
      "celebrity style",
      "luxury culture",
      "visual reference",
    ],
  },
  {
    id: "i-d",
    type: "magazine",
    name: "i-D",
    aliases: ["i-d", "id magazine", "i d"],
    officialUrl: "https://i-d.co/",
    description:
      "i-D is associated with youth culture, subculture, street style, identity, music and directional fashion.",
    styleKeywords: [
      "youth culture",
      "subculture",
      "street style",
      "directional fashion",
      "identity",
    ],
  },
]

const DEFAULT_MAGAZINE_REFERENCE_SITES = [
  {
    name: "Vogue",
    domain: "vogue.com",
  },
  {
    name: "Harper's Bazaar",
    domain: "harpersbazaar.com",
  },
  {
    name: "Elle",
    domain: "elle.com",
  },
]

const BLOCKED_OFFICIAL_DOMAINS = [
  "vogue.com",
  "harpersbazaar.com",
  "elle.com",
  "wmagazine.com",
  "i-d.co",
  "id.vice.com",
  "wikipedia.org",
  "instagram.com",
  "tiktok.com",
  "pinterest.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "farfetch.com",
  "net-a-porter.com",
  "matchesfashion.com",
  "ssense.com",
  "mytheresa.com",
  "mrporter.com",
  "lyst.com",
  "grailed.com",
  "therealreal.com",
]

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, "")
}

function safeUrlHostname(url: string | undefined): string {
  if (!url) return ""

  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return ""
  }
}

function isBlockedAsOfficialSource(url: string | undefined): boolean {
  const hostname = safeUrlHostname(url)
  if (!hostname) return true

  return BLOCKED_OFFICIAL_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

function isMagazineOrMediaUrl(url: string | undefined): boolean {
  const hostname = safeUrlHostname(url)
  if (!hostname) return false

  return DEFAULT_MAGAZINE_REFERENCE_SITES.some(
    (site) => hostname === site.domain || hostname.endsWith(`.${site.domain}`)
  )
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const x = compactText(a)
  const y = compactText(b)

  if (!x || !y) return 0
  if (x === y) return 1

  const maxLen = Math.max(x.length, y.length)
  const distance = levenshteinDistance(x, y)

  return Math.max(0, 1 - distance / maxLen)
}

function getEntitySearchTerms(entity: FashionEntity): string[] {
  return [entity.name, ...entity.aliases]
}

function isTooGenericInput(input: string): boolean {
  const normalized = normalizeText(input)

  const genericInputs = [
    "style",
    "fashion",
    "brand",
    "magazine",
    "runway",
    "editorial",
    "alexander",
    "wang",
  ]

  return genericInputs.includes(normalized)
}

function dedupeByUrl(sources: FashionRagSource[]): FashionRagSource[] {
  const seen = new Set<string>()
  const result: FashionRagSource[] = []

  for (const source of sources) {
    const key = source.url || source.title || source.content
    if (!key) {
      result.push(source)
      continue
    }

    if (seen.has(key)) continue

    seen.add(key)
    result.push(source)
  }

  return result
}

function cleanSearchResults(results: WebSearchResult[]): WebSearchResult[] {
  const seen = new Set<string>()

  return results.filter((item) => {
    if (!item.url) return false

    const url = item.url.split("#")[0]
    if (seen.has(url)) return false

    seen.add(url)
    return true
  })
}

export function matchFashionEntity(input: string): FashionMatch {
  const normalizedInput = normalizeText(input)

  if (!normalizedInput) {
    return {
      input,
      normalizedInput,
      confidence: "none",
      score: 0,
      reason: "Empty input.",
    }
  }

  const exactMatches = FASHION_ENTITIES.filter((entity) => {
    const terms = getEntitySearchTerms(entity)

    return terms.some((term) => normalizeText(term) === normalizedInput)
  })

  if (exactMatches.length === 1) {
    const entity = exactMatches[0]
    const isOfficialName = normalizeText(entity.name) === normalizedInput

    return {
      input,
      normalizedInput,
      entity,
      confidence: isOfficialName ? "exact" : "alias",
      score: isOfficialName ? 1 : 0.96,
      reason: isOfficialName
        ? "Matched official entity name."
        : "Matched known alias.",
    }
  }

  if (exactMatches.length > 1) {
    return {
      input,
      normalizedInput,
      confidence: "ambiguous",
      score: 0.9,
      candidates: exactMatches,
      reason: "Input matched multiple known entities.",
    }
  }

  const partialMatches = FASHION_ENTITIES.filter((entity) => {
    const terms = getEntitySearchTerms(entity).map(normalizeText)

    return terms.some((term) => {
      if (normalizedInput.length < 4) return false

      return term.includes(normalizedInput) || normalizedInput.includes(term)
    })
  })

  if (partialMatches.length === 1 && !isTooGenericInput(input)) {
    return {
      input,
      normalizedInput,
      entity: partialMatches[0],
      confidence: "alias",
      score: 0.88,
      reason: "Matched by partial known name or alias.",
    }
  }

  if (partialMatches.length > 1) {
    return {
      input,
      normalizedInput,
      confidence: "ambiguous",
      score: 0.75,
      candidates: partialMatches,
      reason: "Input is broad and may refer to multiple fashion entities.",
    }
  }

  let bestEntity: FashionEntity | undefined
  let bestScore = 0

  for (const entity of FASHION_ENTITIES) {
    const terms = getEntitySearchTerms(entity)

    for (const term of terms) {
      const currentScore = similarity(input, term)

      if (currentScore > bestScore) {
        bestScore = currentScore
        bestEntity = entity
      }
    }
  }

  const fuzzyThreshold = normalizedInput.length <= 5 ? 0.86 : 0.78

  if (bestEntity && bestScore >= fuzzyThreshold && !isTooGenericInput(input)) {
    return {
      input,
      normalizedInput,
      entity: bestEntity,
      confidence: "fuzzy",
      score: Number(bestScore.toFixed(3)),
      reason: "Matched by fuzzy spelling similarity.",
    }
  }

  return {
    input,
    normalizedInput,
    confidence: "none",
    score: Number(bestScore.toFixed(3)),
    reason: "No confident local match found.",
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function extractMetaContent(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return decodeHtml(match[1].trim())
    }
  }

  return undefined
}

function absolutizeImageUrl(imageUrl: string, pageUrl: string): string {
  try {
    if (imageUrl.startsWith("//")) {
      return `https:${imageUrl}`
    }

    return new URL(imageUrl, pageUrl).toString()
  } catch {
    return imageUrl
  }
}

function isUsefulFashionImageUrl(url: string): boolean {
  const lower = url.toLowerCase()

  if (!lower.startsWith("http")) return false
  if (lower.startsWith("data:")) return false

  const hardBlocked = [
    ".svg",
    "favicon",
    "logo",
    "sprite",
    "icon",
    "avatar",
    "placeholder",
    "transparent",
    "1x1",
    "pixel",
    "tracking",
    "analytics",
    "advert",
    "banner",
    "ticker",
    "newsletter",
  ]

  if (hardBlocked.some((word) => lower.includes(word))) return false

  return (
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower) ||
    lower.includes("image") ||
    lower.includes("media") ||
    lower.includes("assets")
  )
}

function isBadFashionImageContext(text: string): boolean {
  const lower = text.toLowerCase()

  const blockedWords = [
    "died",
    "dead",
    "obituary",
    "artist",
    "painting",
    "politics",
    "election",
    "war",
    "crime",
    "movie",
    "film",
    "culture",
    "food",
    "recipe",
    "travel",
    "interior",
    "home",
    "beauty",
    "skincare",
    "makeup",
    "hair",
    "celebrity news",
    "prom",
    "high school",
    "high schoolers",
    "americanstyle",
    "american style",
    "teen",
    "frat",
    "finalists",
  ]

  return blockedWords.some((word) => lower.includes(word))
}

function scoreFashionImage(image: FashionVisionImage): number {
  const text = `${image.url} ${image.alt || ""} ${image.source || ""}`.toLowerCase()
  let score = 0

  const positiveWords = [
    "fashion",
    "style",
    "runway",
    "collection",
    "look",
    "looks",
    "ready-to-wear",
    "rtw",
    "dress",
    "outfit",
    "street-style",
    "streetstyle",
    "vogue",
    "dior",
    "couture",
    "wear",
    "model",
  ]

  for (const word of positiveWords) {
    if (text.includes(word)) score += 2
  }

  if (/w_(\d+)/i.test(text)) {
    const width = Number(text.match(/w_(\d+)/i)?.[1] || 0)
    if (width >= 500) score += 3
    if (width > 0 && width < 300) score -= 5
  }

  if (/\d+:\d+/.test(text)) score += 1
  if (isBadFashionImageContext(text)) score -= 10

  return score
}

function pickBestSrcFromSrcset(srcset: string): string {
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1) || ""
}

function extractPageImages(html: string, pageUrl: string, ogImage?: string): FashionVisionImage[] {
  const images: FashionVisionImage[] = []
  const seen = new Set<string>()

  function addImage(rawUrl: string | undefined, alt?: string, source?: string) {
    if (!rawUrl) return

    const absoluteUrl = absolutizeImageUrl(decodeHtml(rawUrl), pageUrl)
    const cleanUrl = absoluteUrl.split("#")[0]
    const context = `${cleanUrl} ${alt || ""} ${source || ""}`

    if (!isUsefulFashionImageUrl(cleanUrl)) return
    if (isBadFashionImageContext(context)) return
    if (seen.has(cleanUrl)) return

    seen.add(cleanUrl)
    images.push({
      url: cleanUrl,
      alt: alt ? decodeHtml(alt) : undefined,
      source,
    })
  }

  addImage(ogImage, "Open Graph image", pageUrl)

  const imgRegex = /<img\b[^>]*>/gi
  const sourceRegex = /<source\b[^>]*>/gi
  const attrRegex = /([\w:-]+)=["']([^"']*)["']/gi

  for (const tag of html.match(imgRegex) || []) {
    const attrs: Record<string, string> = {}
    for (const match of tag.matchAll(attrRegex)) {
      attrs[match[1].toLowerCase()] = match[2]
    }

    const src =
      attrs.src ||
      attrs["data-src"] ||
      attrs["data-original"] ||
      attrs["data-image"] ||
      attrs["data-lazy-src"] ||
      (attrs.srcset ? pickBestSrcFromSrcset(attrs.srcset) : "") ||
      (attrs["data-srcset"] ? pickBestSrcFromSrcset(attrs["data-srcset"]) : "")

    addImage(src, attrs.alt, pageUrl)
  }

  for (const tag of html.match(sourceRegex) || []) {
    const attrs: Record<string, string> = {}
    for (const match of tag.matchAll(attrRegex)) {
      attrs[match[1].toLowerCase()] = match[2]
    }

    const src =
      (attrs.srcset ? pickBestSrcFromSrcset(attrs.srcset) : "") ||
      (attrs["data-srcset"] ? pickBestSrcFromSrcset(attrs["data-srcset"]) : "")

    addImage(src, undefined, pageUrl)
  }

  return images
    .map((image) => ({ image, score: scoreFashionImage(image) }))
    .filter((item) => item.score >= -2)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.image)
    .slice(0, 3)
}

async function analyzeSourceImages(images: FashionVisionImage[] | undefined): Promise<string | undefined> {
  const usefulImages = (images || []).slice(0, 3)

  if (usefulImages.length === 0) return undefined

  const analysis = await analyzeFashionImagesWithOpenAI(usefulImages)

  return analysis || undefined
}

async function fetchPageHtmlWithFetch(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.warn("[Fashion RAG] Page fetch failed:", url, response.status)
      return null
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchPageHtmlWithCurl(url: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-L",
        "-sS",
        "--connect-timeout",
        "12",
        "--max-time",
        "25",
        "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "-H",
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "-H",
        "Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        url,
      ],
      {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 8,
        env: {
          ...process.env,
          ALL_PROXY: process.env.ALL_PROXY || "socks5h://127.0.0.1:1081",
          all_proxy: process.env.all_proxy || "socks5h://127.0.0.1:1081",
        },
      },
    )

    return stdout || null
  } catch (error) {
    console.warn("[Fashion RAG] Page curl error:", url, error)
    return null
  }
}

function parsePageMetaFromHtml(url: string, html: string): PageMeta {
  const title = extractMetaContent(html, [
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ])

  const metaDescription = extractMetaContent(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  ])

  const ogDescription = extractMetaContent(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["'][^>]*>/i,
  ])

  const ogImage = extractMetaContent(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ])

  const images = extractPageImages(html, url, ogImage)

  console.log(
    "[Fashion RAG] Page images:",
    url,
    images.map((image) => image.url),
  )

  return {
    url,
    title,
    metaDescription,
    ogDescription,
    ogImage,
    images,
  }
}

async function fetchPageMeta(url: string): Promise<PageMeta | null> {
  try {
    // curl is more reliable in the user's local VPN setup because Node fetch may not use SOCKS proxy.
    const curlHtml = await fetchPageHtmlWithCurl(url)
    if (curlHtml) {
      return parsePageMetaFromHtml(url, curlHtml)
    }

    const fetchHtml = await fetchPageHtmlWithFetch(url)
    if (fetchHtml) {
      return parsePageMetaFromHtml(url, fetchHtml)
    }

    return { url }
  } catch (error) {
    console.warn("[Fashion RAG] Page fetch error:", url, error)
    return { url }
  }
}

async function searchWithTavily(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    return []
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SEARCH_API_TIMEOUT_MS)

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 5,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data.results)) {
      return []
    }

    return cleanSearchResults(
      data.results.map((item: any) => ({
        title: typeof item.title === "string" ? item.title : undefined,
        url: typeof item.url === "string" ? item.url : undefined,
        content: typeof item.content === "string" ? item.content : undefined,
        score: typeof item.score === "number" ? item.score : undefined,
      }))
    )
  } catch {
    return []
  }
}

function chooseBestOfficialResult(
  input: string,
  results: WebSearchResult[]
): WebSearchResult | undefined {
  const normalizedInput = normalizeText(input)
  const compactInput = compactText(input)

  const scored = results
    .filter((item) => item.url)
    .filter((item) => !isBlockedAsOfficialSource(item.url))
    .map((item) => {
      const hostname = safeUrlHostname(item.url)
      const compactHostname = compactText(hostname)
      const title = normalizeText(item.title || "")
      const content = normalizeText(item.content || "")

      let score = 0

      if (compactHostname.includes(compactInput)) score += 5
      if (title.includes(normalizedInput)) score += 3
      if (title.includes("official")) score += 2
      if (content.includes(normalizedInput)) score += 1
      if (item.score) score += item.score

      return {
        item,
        score,
      }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0]?.item
}

async function getOfficialSourceForEntityOrInput(params: {
  input: string
  entity?: FashionEntity
}): Promise<FashionRagSource | undefined> {
  const { input, entity } = params

  if (entity?.officialUrl) {
    const meta = await fetchPageMeta(entity.officialUrl)
    const images = meta?.images?.slice(0, 3) || []
    const visionAnalysis = await analyzeSourceImages(images)

    return {
      role: entity.type === "magazine" ? "magazine_reference" : "official",
      url: entity.officialUrl,
      title: meta?.title,
      metaDescription: meta?.metaDescription,
      ogDescription: meta?.ogDescription,
      ogImage: meta?.ogImage,
      images,
      visionAnalysis,
      note:
        entity.type === "magazine"
          ? "Official magazine site used as a fashion aesthetic reference. Up to 3 images were extracted and analyzed when available."
          : "Official brand site found from local entity library. Up to 3 images were extracted and analyzed when available.",
    }
  }

  const results = await searchWithTavily(`${input} official website fashion brand`)

  const officialResult = chooseBestOfficialResult(input, results)

  if (!officialResult?.url) {
    return undefined
  }

  const meta = await fetchPageMeta(officialResult.url)
  const images = meta?.images?.slice(0, 3) || []
  const visionAnalysis = await analyzeSourceImages(images)

  return {
    role: "official",
    url: officialResult.url,
    title: meta?.title || officialResult.title,
    content: officialResult.content,
    metaDescription: meta?.metaDescription,
    ogDescription: meta?.ogDescription,
    ogImage: meta?.ogImage,
    images,
    visionAnalysis,
    note: "Official source inferred from web search. Up to 3 images were extracted and analyzed when available. Use carefully.",
  }
}

async function getReferenceSourcesForEntity(entity: FashionEntity): Promise<FashionRagSource[]> {
  if (!entity.referenceUrls?.length) {
    return []
  }

  const sources: FashionRagSource[] = []

  for (const referenceUrl of entity.referenceUrls.slice(0, 3)) {
    const meta = await fetchPageMeta(referenceUrl)
    const images = meta?.images?.slice(0, 3) || []

    if (images.length === 0 && !meta?.title && !meta?.metaDescription) {
      continue
    }

    const visionAnalysis = await analyzeSourceImages(images)

    sources.push({
      role: "magazine_reference",
      url: referenceUrl,
      title: meta?.title,
      metaDescription: meta?.metaDescription,
      ogDescription: meta?.ogDescription,
      ogImage: meta?.ogImage,
      images,
      visionAnalysis,
      note:
        "Curated runway/editorial reference source for this entity. This is used when official brand pages are blocked or too unstable for image extraction.",
    })

    if (sources.some((source) => (source.images?.length || 0) >= 3)) {
      break
    }
  }

  return dedupeByUrl(sources)
}

async function getMagazineReferenceSources(params: {
  input: string
  entity?: FashionEntity
}): Promise<FashionRagSource[]> {
  const { input, entity } = params

  if (entity?.referenceUrls?.length) {
    const referenceSources = await getReferenceSourcesForEntity(entity)

    if (referenceSources.length > 0) {
      return referenceSources
    }
  }

  if (entity?.type === "magazine") {
    const officialSource = await getOfficialSourceForEntityOrInput({
      input,
      entity,
    })

    return officialSource
      ? [
          {
            ...officialSource,
            role: "magazine_reference",
            note:
              "User explicitly mentioned this magazine, so it is treated as a high-priority aesthetic reference.",
          },
        ]
      : []
  }

  const magazineQueries = DEFAULT_MAGAZINE_REFERENCE_SITES.map(
    (site) => `site:${site.domain} ${input} fashion style runway outfit`
  )

  const allResults: WebSearchResult[] = []

  for (const query of magazineQueries) {
    const results = await searchWithTavily(query)
    allResults.push(...results)
  }

  const mediaResults = cleanSearchResults(allResults)
    .filter((item) => isMagazineOrMediaUrl(item.url))
    .slice(0, 4)

  const sources: FashionRagSource[] = []

  for (const result of mediaResults) {
    let meta: PageMeta | null = null

    if (result.url) {
      meta = await fetchPageMeta(result.url)
    }

    const images = meta?.images?.slice(0, 3) || []
    const visionAnalysis = await analyzeSourceImages(images)

    sources.push({
      role: "magazine_reference",
      url: result.url,
      title: meta?.title || result.title,
      content: result.content,
      metaDescription: meta?.metaDescription,
      ogDescription: meta?.ogDescription,
      ogImage: meta?.ogImage,
      images,
      visionAnalysis,
      note:
        "Magazine or fashion media reference used for styling context, not as the brand official source. Up to 3 images were extracted and analyzed when available.",
    })
  }

  return dedupeByUrl(sources)
}

async function retrieveFashionRagKnowledgeForInput(
  rawInput: string
): Promise<FashionRagKnowledge | null> {
  const input = rawInput.trim()

  if (!input) return null

  const match = matchFashionEntity(input)
  const entity = match.entity

  if (match.confidence === "ambiguous") {
    return {
      input,
      normalizedInput: match.normalizedInput,
      matchedName: undefined,
      type: "unknown",
      matchConfidence: match.confidence,
      matchScore: match.score,
      magazineSources: [],
      note: match.candidates?.length
        ? `Ambiguous input. Possible matches: ${match.candidates
            .map((candidate) => candidate.name)
            .join(", ")}. Do not assume one unless the user's other inputs make it clear.`
        : "Ambiguous input.",
    }
  }

  if (entity) {
    const officialSource = await getOfficialSourceForEntityOrInput({
      input,
      entity,
    })

    const magazineSources =
      entity.type === "brand"
        ? await getMagazineReferenceSources({
            input: entity.name,
            entity,
          })
        : await getMagazineReferenceSources({
            input,
            entity,
          })

    return {
      input,
      normalizedInput: match.normalizedInput,
      matchedName: entity.name,
      type: entity.type,
      matchConfidence: match.confidence,
      matchScore: match.score,
      officialSource: entity.type === "magazine" ? undefined : officialSource,
      magazineSources:
        entity.type === "magazine" && officialSource
          ? [
              {
                ...officialSource,
                role: "magazine_reference",
              },
            ]
          : magazineSources,
      fallbackDescription: entity.description,
      styleKeywords: entity.styleKeywords,
      note: match.reason,
    }
  }

  const officialSource = await getOfficialSourceForEntityOrInput({
    input,
  })

  const magazineSources = await getMagazineReferenceSources({
    input,
  })

  if (!officialSource && magazineSources.length === 0) {
    return {
      input,
      normalizedInput: match.normalizedInput,
      matchedName: undefined,
      type: "unknown",
      matchConfidence: "none",
      matchScore: match.score,
      magazineSources: [],
      note:
        "No local match and no web search result. If TAVILY_API_KEY is missing, add it to enable dynamic Fashion RAG.",
    }
  }

  return {
    input,
    normalizedInput: match.normalizedInput,
    matchedName: officialSource?.title || input,
    type: "unknown",
    matchConfidence: "search",
    matchScore: 0.7,
    officialSource,
    magazineSources,
    note:
      "Entity was not found in local library. Sources were inferred from web search, so use them as supporting context only.",
  }
}

export async function retrieveFashionRagKnowledgeList(
  inputs: string[]
): Promise<FashionRagKnowledge[]> {
  const cleanedInputs = Array.from(
    new Set(
      inputs
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.replace(/\s+/g, " "))
    )
  )

  const results: FashionRagKnowledge[] = []

  for (const input of cleanedInputs) {
    const knowledge = await retrieveFashionRagKnowledgeForInput(input)

    if (knowledge) {
      results.push(knowledge)
    }
  }

  return results
}

function formatSourceForPrompt(source: FashionRagSource): string {
  return [
    `  - Role: ${source.role}`,
    source.url ? `    URL: ${source.url}` : "",
    source.title ? `    Title: ${source.title}` : "",
    source.metaDescription
      ? `    Meta description: ${source.metaDescription}`
      : "",
    source.ogDescription ? `    OG description: ${source.ogDescription}` : "",
    source.content ? `    Search snippet: ${source.content}` : "",
    source.ogImage ? `    OG image: ${source.ogImage}` : "",
    source.images?.length
      ? `    Visual evidence images: ${source.images
          .map((image) => image.url)
          .join(" | ")}`
      : "",
    source.visionAnalysis
      ? `    OpenAI visual analysis: ${source.visionAnalysis}`
      : "",
    source.note ? `    Note: ${source.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatFashionRagKnowledgeForPrompt(
  knowledgeList: FashionRagKnowledge[]
): string {
  if (knowledgeList.length === 0) return ""

  const sections = knowledgeList.map((item) => {
    const officialSourceText = item.officialSource
      ? formatSourceForPrompt(item.officialSource)
      : ""

    const magazineSourceText = item.magazineSources.length
      ? item.magazineSources.map(formatSourceForPrompt).join("\n")
      : ""

    return [
      `Input: ${item.input}`,
      item.matchedName ? `Matched / inferred name: ${item.matchedName}` : "",
      `Type: ${item.type}`,
      `Match confidence: ${item.matchConfidence} (${item.matchScore})`,
      item.fallbackDescription
        ? `Local style description: ${item.fallbackDescription}`
        : "",
      item.styleKeywords?.length
        ? `Local style keywords: ${item.styleKeywords.join(", ")}`
        : "",
      officialSourceText ? `Official brand source:\n${officialSourceText}` : "",
      magazineSourceText
        ? `Magazine / fashion media references:\n${magazineSourceText}`
        : "",
      item.note ? `Note: ${item.note}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  })

  return [
    "Fashion RAG Knowledge:",
    "",
    "System instruction:",
    "- The user's explicit inputs are the highest-priority signals.",
    "- Brand official sources are used to confirm brand identity and stable brand positioning.",
    "- Vogue / Harper's Bazaar / Elle / other fashion media references are valid styling references, especially for outfit ideas, runway context, and visual vocabulary.",
    "- When visual evidence images and OpenAI visual analysis are available, use them to infer current color palette, silhouette, material, mood, and styling formulas.",
    "- Do not treat magazine articles as the brand's official website.",
    "- If an input is ambiguous, do not force a single interpretation unless other user inputs clearly support it.",
    "- Use the retrieved knowledge as supporting context. Do not mechanically copy it.",
    "",
    sections.join("\n\n---\n\n"),
  ].join("\n")
}

export function splitFashionInputs(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitFashionInputs(item))
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value !== "string") return []

  return value
    .split(/[,，/、;；\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getNestedValue(
  requestBody: Record<string, unknown>,
  key: string
): unknown {
  const form = requestBody.form as Record<string, unknown> | undefined
  const profile = requestBody.profile as Record<string, unknown> | undefined

  return requestBody[key] ?? form?.[key] ?? profile?.[key]
}

function dedupeInputs(inputs: string[]): string[] {
  return Array.from(
    new Set(
      inputs
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.replace(/\s+/g, " "))
    )
  )
}

export async function buildFashionRagKnowledgeFromRequestBody(
  requestBody: Record<string, unknown>
): Promise<string> {
  const explicitBrandInputs = [
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteBrands")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_brands")),
    ...splitFashionInputs(getNestedValue(requestBody, "brands")),
    ...splitFashionInputs(getNestedValue(requestBody, "inspiredByBrands")),
    ...splitFashionInputs(getNestedValue(requestBody, "inspired_by_brands")),
  ]

  const explicitMagazineInputs = [
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteMagazines")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_magazines")),
    ...splitFashionInputs(getNestedValue(requestBody, "magazines")),
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteFashionMedia")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_fashion_media")),
  ]

  const otherStyleInputs = [
    ...splitFashionInputs(getNestedValue(requestBody, "styleReferences")),
    ...splitFashionInputs(getNestedValue(requestBody, "style_references")),
    ...splitFashionInputs(getNestedValue(requestBody, "inspirations")),
    ...splitFashionInputs(getNestedValue(requestBody, "influencers")),
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteInfluencers")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_influencers")),
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteCelebrities")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_celebrities")),
    ...splitFashionInputs(getNestedValue(requestBody, "favoriteCharacters")),
    ...splitFashionInputs(getNestedValue(requestBody, "favorite_characters")),
  ]

  const defaultMagazineInputs =
    explicitMagazineInputs.length === 0 && explicitBrandInputs.length > 0
      ? ["Vogue", "Harper's Bazaar", "Elle"]
      : []

  const allInputs = dedupeInputs([
    ...explicitBrandInputs,
    ...explicitMagazineInputs,
    ...otherStyleInputs,
    ...defaultMagazineInputs,
  ])

  console.log("[Fashion RAG] Inputs:", allInputs)

  const knowledgeList = await retrieveFashionRagKnowledgeList(allInputs)

  console.log(
    "[Fashion RAG] Result:",
    JSON.stringify(knowledgeList, null, 2)
  )

  return formatFashionRagKnowledgeForPrompt(knowledgeList)
}
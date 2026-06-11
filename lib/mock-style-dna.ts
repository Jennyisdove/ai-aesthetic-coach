import type { StyleIntakeForm, UserProfile } from "@/lib/types";

export interface OutfitIdea {
  title: string;
  items: string[];
  reason: string;
}

export interface ExtractedStyleDNA {
  coreIdentity: string;
  styleKeywords: string[];
  attitudeKeywords: string[];
  beautyKeywords: string[];
  fashionKeywords: string[];
}

export interface Recommendation {
  name: string;
  reason: string;
  match: string;
}

export interface InfluencerRecommendation extends Recommendation {
  platform: string;
}

export interface RecommendedBrands {
  luxury: Recommendation[];
  contemporary: Recommendation[];
  affordable: Recommendation[];
}

export interface RecommendedIcons {
  influencers: InfluencerRecommendation[];
  fictionalCharacters: Recommendation[];
}

export interface VisualBoardItem {
  title: string;
  source: string;
  description: string;
  imageSearchQuery: string;
  imageUrl: string | null;
}

export interface DiscoverMore {
  brands: Recommendation[];
  icons: Recommendation[];
  aesthetics: Recommendation[];
}

export interface StyleDNA {
  styleName: string;
  styleSummary: string;
  styleDNA: ExtractedStyleDNA;
  likedElements: string[];
  dislikedElements: string[];
  whyYouLikeThis: string[];
  personalTranslation: string;
  keywords: string[];
  styleRatio: string[];
  recommendedBrands: RecommendedBrands;
  recommendedIcons: RecommendedIcons;
  visualInspirationBoard: VisualBoardItem[];
  discoverMore: DiscoverMore;
  outfitIdeas: OutfitIdea[];
  recommendedItems: string[];
  avoidItems: string[];
  bodySuggestions: string[];
  colorPalette: string[];
  hairAndMakeup: string[];
  shoppingStrategy: string[];
}

function normalizeList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value || "")
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getText(value: string | undefined, fallback = "未填写") {
  return value?.trim() || fallback;
}

function chooseStyleName(form: StyleIntakeForm | UserProfile): string {
  const inspiration = [
    ...normalizeList(form.favorite_influencers),
    ...normalizeList(form.favorite_brands),
    ...normalizeList(form.favorite_characters),
    getText(form.liked_styles, ""),
  ]
    .join(" ")
    .toLowerCase();

  if (/acne|miu miu|chanel|jennie|bella|直井怜|rei|冷淡|公主/.test(inspiration)) {
    return "Cool Intellectual Princess";
  }

  if (/the row|cos|极简|松弛|刘雯/.test(inspiration)) {
    return "Scandinavian Editorial Minimalist";
  }

  return "Cool Editorial Femininity";
}

export const FALLBACK_STYLE_DNA: StyleDNA = {
  styleName: "Cool Intellectual Princess",
  styleSummary:
    "你真正靠近的是一种冷感、精致、少女但不甜的审美世界：Miu Miu 的 intellectual femininity、Acne Studios 的北欧结构感、Jennie 的柔软与 edge，以及 Bella Hadid 的随性态度在这里重叠。",
  styleDNA: {
    coreIdentity: "Cool Intellectual Princess",
    styleKeywords: [
      "clean silhouette",
      "muted palette",
      "structured softness",
      "understated femininity",
      "editorial ease",
    ],
    attitudeKeywords: ["冷感", "随意但有态度", "微叛逆", "精致但不刻意"],
    beautyKeywords: ["黑长直", "黑长卷", "空气刘海", "清透底妆", "低饱和唇色"],
    fashionKeywords: [
      "intellectual femininity",
      "Scandinavian cool",
      "schoolgirl references without sweetness",
      "relaxed tailoring",
    ],
  },
  likedElements: [
    "低饱和配色",
    "结构感剪裁",
    "精致但不刻意",
    "冷感少女气质",
    "随意但有态度",
  ],
  dislikedElements: [
    "甜妹感",
    "Y2K",
    "欧美辣妹",
    "过度成熟",
    "过度装饰",
  ],
  whyYouLikeThis: [
    "你喜欢的不是单个明星或品牌，而是它们共同传达的“冷静、精致、有边界”的状态。",
    "你被 Miu Miu 吸引的原因不是甜美，而是 youthful elegance 里带着一点反叛。",
    "你被 Acne Studios 和 Bella Hadid 吸引的原因，是松弛廓形带来的 effortless attitude。",
    "黑长直、刘海和冷淡色系说明你想要的是完整审美气质，而不只是几件衣服。",
  ],
  personalTranslation:
    "你的风格翻译不是复制 Jennie、Bella 或 Miu Miu，而是把她们共同的冷感、结构、少女气与不费力态度变成你的个人语气。现实条件只做 20% 微调，绝不改变这个审美身份。",
  keywords: [
    "Cool Intellectual Princess",
    "intellectual femininity",
    "Scandinavian cool",
    "低饱和",
    "随性态度",
  ],
  styleRatio: ["审美 DNA 保留 80%", "现实条件微调 20%"],
  recommendedBrands: {
    luxury: [
      {
        name: "Miu Miu",
        reason:
          "已知偏好 / signal：保留少女符号，但通过 intellectual femininity 和微叛逆气质弱化甜感。",
        match: "已知偏好",
      },
      {
        name: "Acne Studios",
        reason:
          "已知偏好 / signal：提供北欧冷感、松弛剪裁和低饱和色彩，补足你的随性态度面。",
        match: "已知偏好",
      },
      {
        name: "The Row",
        reason:
          "作为审美邻居，它延展了你的 clean silhouette 和 understated confidence，而不是复制已知品牌。",
        match: "90%",
      },
      {
        name: "Yohji Yamamoto",
        reason:
          "如果你喜欢冷静、有边界感和非讨好式女性气质，它提供更强的阴影感与结构语言。",
        match: "87%",
      },
    ],
    contemporary: [
      {
        name: "Toteme",
        reason:
          "保留 Acne 的北欧冷感与结构感，同时增加 Chanel 式精致，弱化 Miu Miu 的少女感。",
        match: "92%",
      },
      {
        name: "Low Classic",
        reason:
          "韩式冷静线条和低饱和色彩，适合把你的 DNA 落到日常，不依赖欧美品牌语境。",
        match: "91%",
      },
      {
        name: "Lemaire",
        reason:
          "宽松但有知识分子气质，可以承接你的 understated confidence。",
        match: "89%",
      },
      {
        name: "Mame Kurogouchi",
        reason:
          "日本品牌中更适合你的 refined femininity：柔和但聪明，装饰克制且有文化感。",
        match: "88%",
      },
    ],
    affordable: [
      {
        name: "COS",
        reason:
          "用干净线条和低饱和色彩实现 Scandinavian cool，是最稳定的入门替代。",
        match: "90%",
      },
      {
        name: "Recto",
        reason:
          "韩国语境里的 clean structure 和冷感通勤，可作为 Acne / Toteme 审美的日常邻居。",
        match: "87%",
      },
      {
        name: "Marge Sherwood",
        reason:
          "如果你喜欢小包和配饰里的低调态度，它能补充精致但不刻意的细节层。",
        match: "85%",
      },
      {
        name: "Short Sentence",
        reason:
          "中国品牌里更接近冷静、独立、低饱和的日常美学，适合做本土语境探索。",
        match: "86%",
      },
    ],
  },
  recommendedIcons: {
    influencers: [
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
    ],
    fictionalCharacters: [
      {
        name: "Nana Osaki",
        reason:
          "Mood/persona reference，不是直接穿搭模板：她代表有边界感、不讨好和冷静反叛的审美人格，朋克符号只能作为少量 accent。",
        match: "82%",
      },
      {
        name: "Jo March",
        reason:
          "Mood/persona reference，不是直接穿搭模板：她代表知识分子气质、独立感和低装饰女性化，可作为 softer intellectual temperament。",
        match: "80%",
      },
    ],
  },
  visualInspirationBoard: [
    {
      title: "Editorial Coolness",
      source: "Editorial Styling Mood",
      description:
        "代表 40% 的 editorial inspiration：不是展示某个已知明星，而是呈现低饱和、留白和结构感构成的世界。",
      imageSearchQuery: "muted editorial fashion styling clean silhouette",
      imageUrl: null,
    },
    {
      title: "Muted Fashion Story",
      source: "Magazine Mood",
      description:
        "强化你真正喜欢的冷淡色彩语言和精致但不刻意的氛围。",
      imageSearchQuery: "muted fashion editorial cool minimalist portrait",
      imageUrl: null,
    },
    {
      title: "Off-duty Translation",
      source: "Street Style Translation",
      description:
        "代表 30% 的 celebrity translation：提取随性态度，而不是重复用户已输入的明星照片。",
      imageSearchQuery: "off duty model street style relaxed tailoring",
      imageUrl: null,
    },
    {
      title: "Runway Structure",
      source: "Runway / Lookbook Mood",
      description:
        "代表 20% 的 luxury brand 语言：廓形、线条和剪裁关系比 logo 更重要。",
      imageSearchQuery: "minimal runway structure muted tailoring fashion",
      imageUrl: null,
    },
    {
      title: "New Discovery Texture",
      source: "Discovery Mood",
      description:
        "代表 10% 的新发现：帮助你看到自己可能会喜欢的相邻审美对象。",
      imageSearchQuery: "quiet luxury fashion texture muted editorial",
      imageUrl: null,
    },
  ],
  discoverMore: {
    brands: [
      {
        name: "Toteme",
        reason:
          "如果你喜欢 Acne 的北欧冷感，又想要更接近 Chanel 的精致度，它会是新的方向。",
        match: "92%",
      },
      {
        name: "CLANE",
        reason:
          "如果你的关键词是冷静、简约、女性化但不讨好，CLANE 能提供更日本式的干净廓形。",
        match: "88%",
      },
      {
        name: "SHUSHU/TONG",
        reason:
          "当你想探索更戏剧化的少女感时，它能保留结构与反叛，避免落入普通甜美。",
        match: "84%",
      },
      {
        name: "Comme des Garçons",
        reason:
          "如果你想把“有边界感”推向更强的亚文化和概念化方向，它是相邻宇宙。",
        match: "80%",
      },
    ],
    icons: [],
    aesthetics: [
      {
        name: "Scandinavian Schoolgirl",
        reason:
          "共性是低饱和、克制少女感和 clean silhouette；新方向是把学院感放进更北欧、更冷静的日常线条里。",
        match: "91%",
      },
      {
        name: "Soft Mod Minimalism",
        reason:
          "共性是简洁廓形和低装饰女性化；新方向是加入 60s mod 的图形感，让整体更聪明、更有标签感。",
        match: "85%",
      },
      {
        name: "Korean Contemporary Minimalism",
        reason:
          "共性是冷感、结构和低饱和；新方向是把 Luxury DNA 翻译成更适合日常的韩国当代语境。",
        match: "88%",
      },
      {
        name: "Quiet Romanticism",
        reason:
          "共性是精致但不刻意；新方向是在冷感结构里加入更柔和的材质和低声量浪漫。",
        match: "83%",
      },
      {
        name: "Dark Academia Softened",
        reason:
          "共性是聪明、冷静、有边界感；新方向是加入文学感和深色层次，但保持柔和，不走哥特或重金属。",
        match: "81%",
      },
    ],
  },
  outfitIdeas: [
    {
      title: "Miu Miu without sweetness",
      items: [
        "灵感：Miu Miu schoolgirl references without sweetness",
        "廓形/搭配：小领型衬衫 + 灰色及膝百褶裙，保持少女参照但降低装饰密度",
        "鞋包：黑色细带玛丽珍 + 小号腋下包",
        "发型：黑长直或微卷刘海",
        "妆容：清透底妆 + 低饱和玫瑰唇",
      ],
      reason:
        "这是 Style DNA 的 intellectual femininity 分支：保留少女符号但控制甜度。即使出现黑色或金属配饰，也只是冷感点缀，不会把整套推向朋克或哥特。",
    },
    {
      title: "Acne off-duty structure",
      items: [
        "灵感：Acne Studios relaxed tailoring",
        "廓形/搭配：略宽松短夹克 + 低饱和宽松长裤，肩线只做轻微校准",
        "鞋包：方头短靴 + 软质肩背包",
        "发型：自然披发或低马尾",
        "妆容：雾面底妆 + 淡棕眼影",
      ],
      reason:
        "这是 Style DNA 的 relaxed tailoring 分支：主导信号是北欧冷感和结构松弛，而不是暗黑、重金属或极端街头。",
    },
    {
      title: "Bella relaxed attitude",
      items: [
        "灵感：Bella Hadid off-duty 70s influence",
        "廓形/搭配：冷灰针织背心 + 微提高腰位的宽松长裤",
        "鞋包：复古窄头鞋 + 做旧皮革小包",
        "发型：黑长卷",
        "妆容：轻微烟熏眼线 + 裸棕唇",
      ],
      reason:
        "这是 Style DNA 的 off-duty attitude 分支：少量 70s 或做旧皮革只是 accent，不会覆盖冷感、低饱和和克制女性化这些 dominant signals。",
    },
  ],
  recommendedItems: [
    "小领型棉质衬衫",
    "灰色及膝百褶裙",
    "relaxed tailoring 轻薄西装",
    "低饱和宽松长裤",
    "窄头乐福鞋或玛丽珍",
    "做旧皮革小包",
  ],
  avoidItems: [
    "把 Miu Miu 简化成甜妹蕾丝和大蝴蝶结",
    "为了显瘦而把所有廓形改成安全基础款",
    "高饱和糖果色破坏冷感色彩语言",
    "过度网红化的固定搭配公式",
  ],
  bodySuggestions: [
    "身体适配只占 20%：保留 Cool Intellectual Princess DNA，优先调整裙长、裤腰和肩线，不改变整体审美方向。",
    "如果喜欢 Miu Miu 短裙但担心比例，可改为同语境的及膝百褶裙，而不是换成模板化 A 字裙。",
    "如果喜欢 Acne oversized blazer，只轻微调整肩线和袖长，保留 relaxed tailoring 的松弛感。",
  ],
  colorPalette: ["奶油白", "炭灰色", "冷黑色", "雾粉色", "灰蓝色", "冷棕色"],
  hairAndMakeup: [
    "优先黑长直、黑长卷、低马尾或自然披发，刘海可以保留但不要厚重。",
    "妆容适合干净底妆、淡眉、细眼线和低饱和唇色。",
    "避免高饱和眼影和过强修容，重点放在发丝光泽和皮肤清透感。",
  ],
  shoppingStrategy: [
    "先买能表达审美 DNA 的单品，而不是先买所谓万能显瘦款：灰色百褶裙、克制衬衫、松弛西装、窄头鞋。",
    "购买前检查它是否符合你的 silhouette、color language、attitude，而不只是是否“修饰身材”。",
    "预算只影响购买路径，不影响审美推荐：Investment Pieces 优先鞋包、外套、剪裁稳定的下装；Affordable Alternatives 可从 COS、Recto、Short Sentence、Musinsa 系品牌寻找相同 silhouette 和 color language。",
  ],
};

export function generateFallbackStyleDNA(
  form: StyleIntakeForm | UserProfile,
): StyleDNA {
  const styleName = chooseStyleName(form);
  const dislikes = normalizeList(form.style_dislikes);
  const scenes = normalizeList(form.daily_scenes);
  const favoriteBrands = normalizeList(form.favorite_brands);
  const likedStyles = getText(form.liked_styles);
  const budget = form.budget || "未选择";
  const knownPreferenceSignals = favoriteBrands.slice(0, 2).map((brand) => ({
    name: brand,
    reason:
      "已知偏好 / signal：保留为审美线索，不作为新增发现；系统会从它背后的 silhouette、attitude、color language 推导邻居品牌。",
    match: "已知偏好",
  }));

  return {
    ...FALLBACK_STYLE_DNA,
    styleName,
    styleSummary: `你的 Style DNA 是「${styleName}」。它来自你描述的“${likedStyles}”，重点不是重复你已经输入的明星或品牌，而是解释你为什么喜欢它们，并发现更多属于同一审美世界的对象。`,
    styleDNA: {
      ...FALLBACK_STYLE_DNA.styleDNA,
      coreIdentity: styleName,
    },
    dislikedElements: Array.from(
      new Set([...FALLBACK_STYLE_DNA.dislikedElements, ...dislikes]),
    ).slice(0, 8),
    personalTranslation: `你的版本应该保留 80% 的 ${styleName}：冷感、结构感、低饱和、随意态度和 intellectual femininity；只用 20% 来适配${scenes.join("、") || "日常"}场景和现实比例。`,
    recommendedBrands: {
      ...FALLBACK_STYLE_DNA.recommendedBrands,
      luxury: [
        ...knownPreferenceSignals,
        ...FALLBACK_STYLE_DNA.recommendedBrands.luxury,
      ].slice(0, 5),
    },
    shoppingStrategy: [
      `你的预算是 ${budget}，它只用于落地购买，不影响审美推荐本身。`,
      "Investment Pieces：优先买能长期定义审美的外套、鞋包、剪裁稳定的裙裤。",
      "Affordable Alternatives：用 COS、Recto、Short Sentence、Musinsa 系品牌寻找相同的低饱和色彩、冷感结构和不费力态度。",
      "Purchase Priorities：先补 silhouette，再补 color language，最后补饰品和 beauty direction。",
    ],
  };
}

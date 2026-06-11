export type FitFeedback = "very" | "partial" | "none" | "";

export interface UserProfile {
  favorite_influencers: string[];
  favorite_brands: string[];
  favorite_magazines: string[];
  favorite_characters: string[];
  liked_styles: string;
  height: string;
  skin_color: string;
  body_types: string[];
  body_concerns: string[];
  body_other?: string;
  budget: string;
  daily_scenes: string[];
  style_goals: string[];
  style_dislikes: string[];
  fit_feedback: FitFeedback;
}

export interface StyleIntakeForm {
  favorite_influencers: string;
  favorite_brands: string;
  favorite_magazines: string;
  favorite_characters: string;
  liked_styles: string;
  height: string;
  skin_color: string;
  body_types: string[];
  body_concerns: string[];
  body_other: string;
  budget: string;
  daily_scenes: string[];
  style_goals: string[];
  style_dislikes: string[];
  fit_feedback: FitFeedback;
}

function parseList(value: string): string[] {
  return value
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formToProfile(form: StyleIntakeForm): UserProfile {
  return {
    favorite_influencers: parseList(form.favorite_influencers),
    favorite_brands: parseList(form.favorite_brands),
    favorite_magazines: parseList(form.favorite_magazines),
    favorite_characters: parseList(form.favorite_characters),
    liked_styles: form.liked_styles || "未填写",
    height: form.height ? `${form.height}cm` : "未填写",
    skin_color: form.skin_color || "未选择",
    body_types: form.body_types,
    body_concerns: form.body_concerns,
    body_other: form.body_other || undefined,
    budget: form.budget || "未选择",
    daily_scenes: form.daily_scenes,
    style_goals: form.style_goals,
    style_dislikes: form.style_dislikes,
    fit_feedback: form.fit_feedback,
  };
}

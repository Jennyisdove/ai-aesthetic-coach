export type DailyStylingScene = "work" | "casual" | "date" | "party";

export const DAILY_STYLING_SCENES: Array<{
  value: DailyStylingScene;
  label: string;
}> = [
  { value: "work", label: "上班 Work" },
  { value: "casual", label: "日常 Casual" },
  { value: "date", label: "约会 Date" },
  { value: "party", label: "聚会 Party" },
];

export interface DailyStylingWeather {
  city: string;
  temperature: number;
  condition: string;
}

export interface DailyStylingSuggestion {
  summary: string;
  outerwear: string;
  top: string;
  bottom: string;
  shoes: string;
  accessories: string;
  reason: string;
  weather: DailyStylingWeather;
}

import { FIT_FEEDBACK_OPTIONS } from "@/lib/form-options";
import {
  DAILY_STYLING_SCENES,
  type DailyStylingScene,
  type DailyStylingSuggestion,
} from "@/lib/daily-styling";
import type { Recommendation, StyleDNA } from "@/lib/mock-style-dna";
import type { StyleProfile } from "@/lib/style-memory";
import type { FitFeedback } from "@/lib/types";
import { useEffect, useState, type ReactNode } from "react";

interface StyleInferenceResultProps {
  activeProfileId: string;
  isCollapsed: boolean;
  styleDNA: StyleDNA | null;
  fitFeedback: FitFeedback;
  onActivateProfile: (id: string) => void;
  onCreateNewStyle: () => void;
  onDeleteProfile: (id: string) => void;
  onExpandResult: () => void;
  onFitFeedbackChange: (value: FitFeedback) => void;
  onSaveStyle: (name: string) => void;
  profiles: StyleProfile[];
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <p className="mb-5 text-xs uppercase tracking-[0.2em] text-muted">
        {title}
      </p>
      {children}
    </section>
  );
}

function TextList({
  items,
  quiet = false,
}: {
  items: string[];
  quiet?: boolean;
}) {
  return (
    <ul
      className={`space-y-3 text-sm leading-7 ${
        quiet ? "text-muted" : "text-foreground"
      }`}
    >
      {items.map((item) => (
        <li key={item} className="border-l border-border pl-4">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-7 text-foreground">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 border-t border-border/80 pt-3">
          <span className="shrink-0 font-serif text-base text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-border bg-white/45 px-4 py-1.5 text-sm"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function RecommendationCard({
  item,
  variant = "default",
}: {
  item: Recommendation;
  variant?: "default" | "brand" | "persona" | "discover";
}) {
  const variantClassName = {
    default: "bg-white/45",
    brand: "bg-white/60 shadow-[0_14px_40px_rgba(26,26,26,0.05)]",
    persona: "bg-[#f5f1eb]/70",
    discover: "bg-background/55",
  }[variant];

  return (
    <article
      className={`rounded-sm border border-border p-5 ${variantClassName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-serif text-lg leading-snug">{item.name}</p>
        <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-accent">
          {item.match}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted">{item.reason}</p>
    </article>
  );
}

function RecommendationGroup({
  title,
  items,
  note,
  variant = "default",
}: {
  title: string;
  items: Recommendation[];
  note?: string;
  variant?: "default" | "brand" | "persona" | "discover";
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
        {title}
      </p>
      {note && <p className="mb-4 text-xs leading-relaxed text-muted">{note}</p>}
      <div className="space-y-4">
        {items.map((item) => (
          <RecommendationCard
            key={`${title}-${item.name}`}
            item={item}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

function VisualImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center bg-[#f1eee8] px-6 text-center text-xs uppercase tracking-[0.16em] text-muted">
        Image reference unavailable
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#f1eee8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={(event) => {
          event.currentTarget.classList.add("hidden");
          event.currentTarget.nextElementSibling?.classList.add("grid");
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
        className="aspect-[3/4] w-full object-cover transition duration-700 hover:scale-[1.025]"
      />
      <div className="hidden aspect-[3/4] w-full place-items-center bg-[#f1eee8] px-6 text-center text-xs uppercase tracking-[0.16em] text-muted">
        Image reference unavailable
      </div>
    </div>
  );
}

function DailyStylingAssistant({ styleDNA }: { styleDNA: StyleDNA }) {
  const [city, setCity] = useState("");
  const [scene, setScene] = useState<DailyStylingScene>("work");
  const [suggestion, setSuggestion] = useState<DailyStylingSuggestion | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSuggestion(null);
    setError("");
    setIsLoading(false);
  }, [styleDNA]);

  async function handleGenerateDailyStyling() {
    setIsLoading(true);
    setError("");
    setSuggestion(null);

    try {
      const response = await fetch("/api/daily-styling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city,
          scene,
          styleDNA,
        }),
      });

      const data = (await response.json()) as
        | DailyStylingSuggestion
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Daily styling request failed.",
        );
      }

      setSuggestion(data as DailyStylingSuggestion);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "无法生成今日穿搭建议，请稍后再试。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ResultSection title="Daily Styling Assistant">
      <div className="rounded-sm border border-border bg-white/45 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="daily-styling-city"
              className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
            >
              City
            </label>
            <input
              id="daily-styling-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full border-b border-border bg-transparent px-0 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground"
              placeholder="e.g. Sydney, Shanghai, Tokyo"
            />
          </div>

          <div>
            <label
              htmlFor="daily-styling-scene"
              className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
            >
              Scene
            </label>
            <select
              id="daily-styling-scene"
              value={scene}
              onChange={(event) =>
                setScene(event.target.value as DailyStylingScene)
              }
              className="w-full border-b border-border bg-transparent px-0 py-3 text-sm outline-none transition-colors focus:border-foreground"
            >
              {DAILY_STYLING_SCENES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateDailyStyling}
            disabled={isLoading}
            className="bg-foreground px-5 py-3 text-xs uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "生成中..." : "生成今日穿搭建议"}
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          将你的 Style DNA 应用到今天的天气和场景中，而不是重新定义你的风格。
        </p>

        {error && (
          <p className="mt-5 border-l border-accent pl-4 text-sm leading-7 text-muted">
            {error}
          </p>
        )}

        {suggestion && (
          <div className="mt-6 space-y-5 border-t border-border pt-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-accent">
                {suggestion.weather.city} / {suggestion.weather.temperature}
                {"C"} / {suggestion.weather.condition}
              </p>
              <p className="mt-2 font-serif text-xl leading-snug">
                {suggestion.summary}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Outerwear", suggestion.outerwear],
                ["Top", suggestion.top],
                ["Bottom", suggestion.bottom],
                ["Shoes", suggestion.shoes],
                ["Accessories", suggestion.accessories],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-sm border border-border bg-background/50 p-4"
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {label}
                  </p>
                  <p className="text-sm leading-7">{value}</p>
                </div>
              ))}
            </div>

            <p className="border-l border-border pl-4 text-sm leading-7 text-muted">
              {suggestion.reason}
            </p>
          </div>
        )}
      </div>
    </ResultSection>
  );
}

function formatProfileDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function createDefaultProfileName(styleDNA: StyleDNA) {
  return `${styleDNA.styleName} · ${new Date().toISOString().slice(0, 10)}`;
}

function StyleProfileList({
  activeProfileId,
  onActivateProfile,
  onDeleteProfile,
  profiles,
}: {
  activeProfileId: string;
  onActivateProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  profiles: StyleProfile[];
}) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-border p-5 text-sm leading-7 text-muted">
        No saved profiles yet. Save the current Style DNA to keep using it later.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => {
        const isActive = profile.id === activeProfileId;

        return (
          <article
            key={profile.id}
            className={`rounded-sm border p-5 ${
              isActive
                ? "border-foreground bg-white/65"
                : "border-border bg-white/35"
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-serif text-lg leading-snug">
                    {profile.name}
                  </p>
                  {isActive && (
                    <span className="text-xs uppercase tracking-[0.18em] text-accent">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatProfileDate(profile.createdAt)} /{" "}
                  {profile.styleDNA.styleName}
                </p>
              </div>

              <div className="flex gap-3">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => onActivateProfile(profile.id)}
                    className="border border-border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors hover:border-foreground"
                  >
                    View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteProfile(profile.id)}
                  className="border border-border px-4 py-2 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StyleMemoryPanel({
  activeProfile,
  activeProfileId,
  isViewingSavedProfile,
  onActivateProfile,
  onCreateNewStyle,
  onDeleteProfile,
  onSaveStyle,
  profiles,
  styleDNA,
}: {
  activeProfile: StyleProfile | null;
  activeProfileId: string;
  isViewingSavedProfile: boolean;
  onActivateProfile: (id: string) => void;
  onCreateNewStyle: () => void;
  onDeleteProfile: (id: string) => void;
  onSaveStyle: (name: string) => void;
  profiles: StyleProfile[];
  styleDNA: StyleDNA;
}) {
  const [defaultProfileName, setDefaultProfileName] = useState(() =>
    createDefaultProfileName(styleDNA),
  );
  const [profileName, setProfileName] = useState(defaultProfileName);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (isViewingSavedProfile) {
      setSaveMessage("");
      return;
    }

    const nextDefaultName = createDefaultProfileName(styleDNA);
    setDefaultProfileName(nextDefaultName);
    setProfileName(nextDefaultName);
    setSaveMessage("");
  }, [isViewingSavedProfile, styleDNA]);

  function handleSave() {
    onSaveStyle(profileName || defaultProfileName);
    setSaveMessage("Saved to My Style Profiles.");
  }

  return (
    <ResultSection title="My Style Profiles">
      <div className="space-y-5">
        {isViewingSavedProfile ? (
          <div className="rounded-sm border border-border bg-white/45 p-5">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">
              Viewing Saved Style
            </p>
            <p className="font-serif text-xl leading-snug">
              {activeProfile?.name ?? styleDNA.styleName}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              This Style DNA is already saved. You can keep using it, delete it,
              or create a new Style DNA.
            </p>
          </div>
        ) : (
          <div className="rounded-sm border border-border bg-white/45 p-5">
            <p className="mb-4 font-serif text-xl leading-snug">
              Save this Style
            </p>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label
                  htmlFor="style-profile-name"
                  className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
                >
                  Profile Name
                </label>
                <input
                  id="style-profile-name"
                  value={profileName}
                  onChange={(event) => {
                    setProfileName(event.target.value);
                    setSaveMessage("");
                  }}
                  className="w-full border-b border-border bg-transparent px-0 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground"
                  placeholder={defaultProfileName}
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="bg-foreground px-5 py-3 text-xs uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90"
              >
                Save this Style
              </button>
            </div>
            {saveMessage && (
              <p className="mt-3 text-xs tracking-wider text-muted">
                {saveMessage}
              </p>
            )}
          </div>
        )}

        <StyleProfileList
          activeProfileId={activeProfileId}
          onActivateProfile={onActivateProfile}
          onDeleteProfile={onDeleteProfile}
          profiles={profiles}
        />

        <button
          type="button"
          onClick={onCreateNewStyle}
          className="w-full rounded-sm border border-dashed border-border bg-background/40 px-5 py-4 text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Create New Style
        </button>
      </div>
    </ResultSection>
  );
}

function CollapsedStyleHub({
  activeProfileId,
  onActivateProfile,
  onCreateNewStyle,
  onDeleteProfile,
  onExpandResult,
  profiles,
  styleDNA,
}: {
  activeProfileId: string;
  onActivateProfile: (id: string) => void;
  onCreateNewStyle: () => void;
  onDeleteProfile: (id: string) => void;
  onExpandResult: () => void;
  profiles: StyleProfile[];
  styleDNA: StyleDNA | null;
}) {
  return (
    <div className="space-y-6 rounded-sm border border-border bg-background/60 p-6 md:p-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          My Style Profiles
        </p>
        <h4 className="font-serif text-3xl leading-tight">
          你的风格档案已保存
        </h4>
        <p className="max-w-2xl text-sm leading-7 text-muted">
          你可以继续使用当前风格做每日穿搭，也可以创建一个新的 Style DNA。
        </p>
      </div>

      {styleDNA && (
        <div className="rounded-sm border border-border bg-white/45 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            Current Active Style
          </p>
          <p className="mt-2 font-serif text-2xl leading-snug">
            {styleDNA.styleName}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            {styleDNA.styleSummary}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onExpandResult}
              className="bg-foreground px-5 py-3 text-xs uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90"
            >
              View Active Style
            </button>
            <button
              type="button"
              onClick={onCreateNewStyle}
              className="border border-border px-5 py-3 text-xs uppercase tracking-[0.16em] transition-colors hover:border-foreground"
            >
              + Create New Style
            </button>
          </div>
        </div>
      )}

      <StyleProfileList
        activeProfileId={activeProfileId}
        onActivateProfile={onActivateProfile}
        onDeleteProfile={onDeleteProfile}
        profiles={profiles}
      />

      {!styleDNA && (
        <button
          type="button"
          onClick={onCreateNewStyle}
          className="w-full bg-foreground px-5 py-3 text-xs uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-90"
        >
          + Create New Style
        </button>
      )}
    </div>
  );
}

export function StyleInferenceResult({
  activeProfileId,
  isCollapsed,
  styleDNA,
  fitFeedback,
  onActivateProfile,
  onCreateNewStyle,
  onDeleteProfile,
  onExpandResult,
  onFitFeedbackChange,
  onSaveStyle,
  profiles,
}: StyleInferenceResultProps) {
  if (!styleDNA) {
    if (profiles.length > 0) {
      return (
        <CollapsedStyleHub
          activeProfileId={activeProfileId}
          onActivateProfile={onActivateProfile}
          onCreateNewStyle={onCreateNewStyle}
          onDeleteProfile={onDeleteProfile}
          onExpandResult={onExpandResult}
          profiles={profiles}
          styleDNA={null}
        />
      );
    }

    return (
      <div className="rounded-sm border border-dashed border-border bg-background/40 p-8 text-center">
        <p className="font-serif text-lg text-muted">
          点击生成 Style DNA 后查看结果
        </p>
        <p className="mt-3 text-xs text-muted">
          AI 将解释你为什么喜欢这些审美，并发现更多你可能会喜欢的对象
        </p>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <CollapsedStyleHub
        activeProfileId={activeProfileId}
        onActivateProfile={onActivateProfile}
        onCreateNewStyle={onCreateNewStyle}
        onDeleteProfile={onDeleteProfile}
        onExpandResult={onExpandResult}
        profiles={profiles}
        styleDNA={styleDNA}
      />
    );
  }

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? null;
  const isViewingSavedProfile =
    Boolean(activeProfile) &&
    activeProfile?.styleDNA.styleName === styleDNA.styleName &&
    activeProfile?.styleDNA.styleSummary === styleDNA.styleSummary &&
    activeProfile?.styleDNA.personalTranslation === styleDNA.personalTranslation;

  return (
    <div className="space-y-10 rounded-sm border border-border bg-background/60 p-6 md:p-8">
      <div className="space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Style DNA
        </p>
        <div>
          <h4 className="font-serif text-3xl leading-tight md:text-4xl">
            {styleDNA.styleName}
          </h4>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            {styleDNA.styleSummary}
          </p>
        </div>
        <Chips items={styleDNA.keywords} />
      </div>

      <StyleMemoryPanel
        key={`${styleDNA.styleName}-${styleDNA.styleSummary}-${activeProfileId}`}
        activeProfile={activeProfile}
        activeProfileId={activeProfileId}
        isViewingSavedProfile={isViewingSavedProfile}
        onActivateProfile={onActivateProfile}
        onCreateNewStyle={onCreateNewStyle}
        onDeleteProfile={onDeleteProfile}
        onSaveStyle={onSaveStyle}
        profiles={profiles}
        styleDNA={styleDNA}
      />

      <ResultSection title="Why You Like This">
        <TextList items={styleDNA.whyYouLikeThis} />
      </ResultSection>

      <ResultSection title="Your Core Aesthetic">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-muted">Core Identity</p>
            <p className="font-serif text-2xl leading-snug">
              {styleDNA.styleDNA.coreIdentity}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Liked Elements
              </p>
              <Chips items={styleDNA.likedElements} />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Not Your World
              </p>
              <Chips items={styleDNA.dislikedElements} />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Style
              </p>
              <Chips items={styleDNA.styleDNA.styleKeywords} />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Attitude
              </p>
              <Chips items={styleDNA.styleDNA.attitudeKeywords} />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Beauty
              </p>
              <Chips items={styleDNA.styleDNA.beautyKeywords} />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Fashion Language
              </p>
              <Chips items={styleDNA.styleDNA.fashionKeywords} />
            </div>
          </div>
          <p className="border-t border-border pt-5 text-sm leading-7">
            {styleDNA.personalTranslation}
          </p>
        </div>
      </ResultSection>

      <ResultSection title="Recommended Brands">
        <div className="grid gap-5 md:grid-cols-3">
          <RecommendationGroup
            title="Luxury"
            items={styleDNA.recommendedBrands.luxury}
            variant="brand"
          />
          <RecommendationGroup
            title="Contemporary"
            items={styleDNA.recommendedBrands.contemporary}
            variant="brand"
          />
          <RecommendationGroup
            title="Affordable"
            items={styleDNA.recommendedBrands.affordable}
            variant="brand"
          />
        </div>
      </ResultSection>

      <ResultSection title="Aesthetic References">
        <div className="grid gap-5 md:grid-cols-2">
          <RecommendationGroup
            title="Influencers"
            items={styleDNA.recommendedIcons.influencers}
          />
          <RecommendationGroup
            title="Characters"
            items={styleDNA.recommendedIcons.fictionalCharacters}
            note="These characters represent your aesthetic persona rather than direct outfit references."
            variant="persona"
          />
        </div>
      </ResultSection>

      <ResultSection title="Visual Inspiration Board">
        <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
          {styleDNA.visualInspirationBoard.map((item) => (
            <article
              key={`${item.source}-${item.title}`}
              className="mb-5 break-inside-avoid overflow-hidden rounded-sm border border-border bg-white/50 transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(26,26,26,0.1)]"
            >
              <VisualImage src={item.imageUrl} alt={item.title} />
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-accent">
                    {item.source}
                  </p>
                  <p className="mt-2 font-serif text-xl leading-snug">
                    {item.title}
                  </p>
                </div>
                <p className="text-sm leading-7 text-muted">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </ResultSection>

      <ResultSection title="Discover More">
        <div className="grid gap-5 md:grid-cols-2">
          <RecommendationGroup
            title="Brands"
            items={styleDNA.discoverMore.brands}
            variant="discover"
          />
          <RecommendationGroup
            title="Aesthetic Directions"
            items={styleDNA.discoverMore.aesthetics}
            variant="discover"
          />
        </div>
      </ResultSection>

      <ResultSection title="Outfit Suggestions">
        <div className="space-y-5">
          {styleDNA.outfitIdeas.map((idea, index) => (
            <article
              key={`${idea.title}-${index}`}
              className="rounded-sm border border-border bg-white/45 p-5"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-accent">
                Look {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mb-4 font-serif text-xl leading-snug">
                {idea.title}
              </p>
              <ul className="space-y-2 text-sm leading-7">
                {idea.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-sm leading-7 text-muted">
                {idea.reason}
              </p>
            </article>
          ))}
        </div>
      </ResultSection>

      <ResultSection title="Body Adaptation">
        <div className="rounded-sm border border-border bg-white/25 p-5">
          <TextList items={styleDNA.bodySuggestions} quiet />
        </div>
      </ResultSection>

      <div className="grid gap-8 border-t border-border pt-8 md:grid-cols-2">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            适合购买的单品方向
          </p>
          <TextList items={styleDNA.recommendedItems} />
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            避免项
          </p>
          <TextList items={styleDNA.avoidItems} />
        </div>
      </div>

      <div className="grid gap-8 border-t border-border pt-8 md:grid-cols-2">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            色彩建议
          </p>
          <Chips items={styleDNA.colorPalette} />
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            发型 / 妆容
          </p>
          <TextList items={styleDNA.hairAndMakeup} />
        </div>
      </div>

      <ResultSection title="预算内购物策略">
        <Checklist items={styleDNA.shoppingStrategy} />
      </ResultSection>

      <DailyStylingAssistant
        key={`${styleDNA.styleName}-${styleDNA.styleSummary}`}
        styleDNA={styleDNA}
      />

      <div className="border-t border-border pt-8">
        <p className="mb-4 text-sm text-foreground">
          这个结果符合你的感觉吗？
        </p>
        <div className="space-y-3">
          {FIT_FEEDBACK_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 text-sm text-muted transition-colors hover:text-foreground"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  fitFeedback === option.value
                    ? "border-foreground"
                    : "border-border"
                }`}
              >
                {fitFeedback === option.value && (
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                )}
              </span>
              <input
                type="radio"
                name="fit-feedback"
                value={option.value}
                checked={fitFeedback === option.value}
                onChange={() => onFitFeedbackChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
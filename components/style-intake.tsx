"use client";

import { useEffect, useRef, useState } from "react";
import {
  BODY_CONCERNS,
  BODY_TYPES,
  BUDGET_OPTIONS,
  SCENE_OPTIONS,
  SKIN_COLORS,
  STYLE_DISLIKES,
  STYLE_GOALS,
} from "@/lib/form-options";
import {
  generateFallbackStyleDNA,
  type StyleDNA,
} from "@/lib/mock-style-dna";
import { useStyleMemory } from "@/hooks/use-style-memory";
import type { FitFeedback, StyleIntakeForm } from "@/lib/types";
import { formToProfile } from "@/lib/types";
import { PillSelector } from "./pill-selector";
import { StyleInferenceResult } from "./style-inference-result";
import { TagSelector } from "./tag-selector";

const inputClassName =
  "w-full border-b border-border bg-transparent px-0 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-foreground";

const labelClassName =
  "mb-2 block text-xs uppercase tracking-[0.2em] text-muted";

const sectionClassName = "space-y-6";

const sectionHeaderClassName = "border-b border-border pb-4";

const progressSteps = [
  "分析你的审美灵感...",
  "发现你真正喜欢的元素...",
  "校准现实穿着比例...",
  "扩展新的审美对象...",
  "策展视觉灵感板...",
  "完成！你的 Style DNA 已就绪",
];

const initialForm: StyleIntakeForm = {
  favorite_influencers: "",
  favorite_brands: "",
  favorite_magazines: "",
  favorite_characters: "",
  liked_styles: "",
  height: "",
  skin_color: "",
  body_types: [],
  body_concerns: [],
  body_other: "",
  budget: "",
  daily_scenes: [],
  style_goals: [],
  style_dislikes: [],
  fit_feedback: "",
};

function SectionHeader({
  part,
  title,
  subtitle,
}: {
  part: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={sectionHeaderClassName}>
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{part}</p>
      <h3 className="mt-2 font-serif text-2xl">{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

function FashionProgressOverlay({ step }: { step: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-6 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-sm border border-border bg-white/80 px-6 py-10 text-center shadow-[0_24px_80px_rgba(26,26,26,0.12)] md:px-12">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-muted">
          AI Aesthetic Coach
        </p>
        <h3 className="font-serif text-3xl leading-tight">
          正在定制你的 Style DNA
        </h3>
        <div className="mt-10 flex items-center justify-center gap-3 sm:gap-5">
          {progressSteps.map((_, index) => {
            const isDone = index < step;
            const isCurrent = index === step;

            return (
              <span
                key={index}
                className={`fashion-progress-shoe ${
                  isDone ? "is-done" : ""
                } ${isCurrent ? "is-current" : ""}`}
                aria-hidden="true"
              >
                👠
              </span>
            );
          })}
        </div>
        <p
          key={step}
          className="fashion-progress-copy mt-8 text-sm tracking-[0.08em] text-foreground"
        >
          {progressSteps[step]}
        </p>
        <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-accent to-transparent" />
      </div>
    </div>
  );
}

export function StyleIntake() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const inferenceRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState(initialForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const styleMemory = useStyleMemory();

  const [styleDNA, setStyleDNA] = useState<StyleDNA | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCreatingNewStyle, setIsCreatingNewStyle] = useState(true);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

useEffect(() => {
  if (!styleMemory.isLoaded) {
    return;
  }

  const timer = window.setTimeout(() => {
    if (styleMemory.activeProfile) {
      setStyleDNA(styleMemory.activeProfile.styleDNA);
      setHasGenerated(true);
      setIsCreatingNewStyle(false);
      setIsResultCollapsed(false);
    }

    setIsHydrated(true);
  }, 0);

  return () => window.clearTimeout(timer);
}, [styleMemory.activeProfile, styleMemory.isLoaded]);

  function handleChange<K extends keyof StyleIntakeForm>(
    field: K,
    value: StyleIntakeForm[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      setSelectedImage(null);
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setProgressStep(0);
    setIsResultCollapsed(false);

    const profile = formToProfile(form);
    const fallback = generateFallbackStyleDNA(form);

    const minimumProgress = new Promise((resolve) => {
      window.setTimeout(resolve, 11000);
    });

    const progressTimer = window.setInterval(() => {
      setProgressStep((current) => Math.min(current + 1, 4));
    }, 2200);

    async function requestStyleDNA() {
      try {
        const response = await fetch("/api/style-dna", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            form,
            profile,
            inspirationImage: selectedImage
              ? {
                  name: selectedImage.name,
                  type: selectedImage.type,
                  size: selectedImage.size,
                }
              : null,
          }),
        });

        if (!response.ok) {
          throw new Error("Style DNA API request failed.");
        }

        return (await response.json()) as StyleDNA;
      } catch {
        return fallback;
      }
    }

    const [generatedStyleDNA] = await Promise.all([
      requestStyleDNA(),
      minimumProgress,
    ]);

    window.clearInterval(progressTimer);
    setProgressStep(5);
    setStyleDNA(generatedStyleDNA);
    setHasGenerated(true);
    setIsCreatingNewStyle(false);

    window.setTimeout(() => {
      setIsGenerating(false);
      requestAnimationFrame(() => {
        inferenceRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }, 900);
  }

  function handleFitFeedback(value: FitFeedback) {
    handleChange("fit_feedback", value);
  }

  function handleSaveStyle(name: string) {
    if (!styleDNA) {
      return;
    }

    const profile = styleMemory.saveCurrentStyle(styleDNA, name);
    setStyleDNA(profile.styleDNA);
    setHasGenerated(true);
    setIsCreatingNewStyle(false);
    setIsResultCollapsed(true);

    window.setTimeout(() => {
      inferenceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function handleActivateProfile(id: string) {
    const profile = styleMemory.activateProfile(id);

    if (!profile) {
      return;
    }

    setStyleDNA(profile.styleDNA);
    setHasGenerated(true);
    setIsCreatingNewStyle(false);
    setIsResultCollapsed(false);

    window.setTimeout(() => {
      inferenceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function handleDeleteProfile(id: string) {
    const nextActiveProfile = styleMemory.deleteProfile(id);

    if (nextActiveProfile) {
      setStyleDNA(nextActiveProfile.styleDNA);
      setHasGenerated(true);
      setIsCreatingNewStyle(false);
      setIsResultCollapsed(false);
      return;
    }

    setStyleDNA(null);
    setHasGenerated(false);
    setIsCreatingNewStyle(true);
    setIsResultCollapsed(false);
  }

  function handleCreateNewStyle() {
    setForm(initialForm);
    setPreviewUrl(null);
    setSelectedImage(null);
    setStyleDNA(null);
    setHasGenerated(false);
    setIsCreatingNewStyle(true);
    setIsResultCollapsed(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function handleExpandResult() {
    setIsResultCollapsed(false);
  }

  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
      {isGenerating && <FashionProgressOverlay step={progressStep} />}

      <div className="mx-auto max-w-3xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted">
            Style Intake
          </p>
          <h2 className="font-serif text-3xl md:text-4xl">
            从灵感出发，找到你的 Style DNA
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            你不需要知道自己属于什么风格。告诉我们你喜欢谁、喜欢什么品牌与感觉、不喜欢什么——AI
            负责把这些翻译成真正适合你的个人风格。
          </p>
        </div>

        <div className="space-y-14 rounded-sm border border-border bg-white/50 p-6 md:p-10">
          {isCreatingNewStyle && (
            <div ref={formRef} className="space-y-14">
              {/* Part 01 */}
              <div className={sectionClassName}>
                <SectionHeader
                  part="Part 01"
                  title="找到你的时尚灵感"
                  subtitle="这是最重要的部分。填写越多，AI 越能准确理解你的审美。"
                />

                <div>
                  <label
                    htmlFor="favorite_influencers"
                    className={labelClassName}
                  >
                    喜欢的明星 / 博主
                  </label>
                  <input
                    id="favorite_influencers"
                    type="text"
                    placeholder="例如：Jennie、Bella Hadid、刘雯、直井怜"
                    className={inputClassName}
                    value={form.favorite_influencers}
                    onChange={(e) =>
                      handleChange("favorite_influencers", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label htmlFor="favorite_brands" className={labelClassName}>
                    喜欢的品牌
                  </label>
                  <input
                    id="favorite_brands"
                    type="text"
                    placeholder="例如：Chanel、Acne Studios、Miu Miu、The Row"
                    className={inputClassName}
                    value={form.favorite_brands}
                    onChange={(e) =>
                      handleChange("favorite_brands", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="favorite_magazines"
                    className={labelClassName}
                  >
                    喜欢的时尚杂志
                  </label>
                  <input
                    id="favorite_magazines"
                    type="text"
                    placeholder="例如：Vogue、Elle、Harper's Bazaar"
                    className={inputClassName}
                    value={form.favorite_magazines}
                    onChange={(e) =>
                      handleChange("favorite_magazines", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="favorite_characters"
                    className={labelClassName}
                  >
                    喜欢的人物角色（可选）
                  </label>
                  <p className="mb-2 text-xs text-muted">
                    影视角色、动漫角色、小说角色都可以。
                  </p>
                  <input
                    id="favorite_characters"
                    type="text"
                    placeholder="例如：洪海仁、廉美贞、娜娜"
                    className={inputClassName}
                    value={form.favorite_characters}
                    onChange={(e) =>
                      handleChange("favorite_characters", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label htmlFor="liked_styles" className={labelClassName}>
                    描述你最喜欢的穿搭感觉
                  </label>
                  <textarea
                    id="liked_styles"
                    rows={5}
                    placeholder="例如：冷淡公主风，类似泡泡袖娃娃领，但更简约；冷淡色系，无过多装饰；发型黑长直或黑长卷，最好有刘海；整体随意但有态度。"
                    className={`${inputClassName} min-h-32 resize-y leading-relaxed`}
                    value={form.liked_styles}
                    onChange={(e) =>
                      handleChange("liked_styles", e.target.value)
                    }
                  />
                </div>

                <div>
                  <p className={labelClassName}>上传喜欢的穿搭图片</p>
                  <p className="mb-3 text-xs text-muted">
                    支持 JPG、PNG。Pinterest 截图、街拍、杂志内页都可以。
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex min-h-[200px] w-full flex-col items-center justify-center rounded-sm border border-dashed border-border bg-white/30 p-8 text-center transition-colors hover:border-accent hover:bg-white/50"
                  >
                    {previewUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="灵感图预览"
                          className="mx-auto max-h-48 w-full object-cover object-center"
                        />
                        <p className="mt-4 text-xs tracking-wider text-muted">
                          点击更换图片
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border text-xl text-muted transition-colors group-hover:border-accent">
                          +
                        </div>
                        <p className="font-serif text-base">点击上传穿搭灵感</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Part 02 */}
              <div className={sectionClassName}>
                <SectionHeader
                  part="Part 02"
                  title="你的现实条件"
                  subtitle="帮助 AI 把审美翻译为真正适合你的穿搭方案。"
                />

                <div>
                  <label htmlFor="height" className={labelClassName}>
                    身高（cm）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="height"
                      type="number"
                      min={140}
                      max={200}
                      placeholder="164"
                      className={inputClassName}
                      value={form.height}
                      onChange={(e) => handleChange("height", e.target.value)}
                    />
                    <span className="text-sm text-muted">cm</span>
                  </div>
                </div>

                <PillSelector
                  label="肤色"
                  options={SKIN_COLORS}
                  selected={form.skin_color}
                  onChange={(v) => handleChange("skin_color", v)}
                />

                <TagSelector
                  label="身材类型"
                  options={BODY_TYPES}
                  selected={form.body_types}
                  onChange={(v) => handleChange("body_types", v)}
                />

                <TagSelector
                  label="身材困扰"
                  options={BODY_CONCERNS}
                  selected={form.body_concerns}
                  onChange={(v) => handleChange("body_concerns", v)}
                />

                <div>
                  <label htmlFor="body_other" className={labelClassName}>
                    其他身材特点（可选）
                  </label>
                  <input
                    id="body_other"
                    type="text"
                    placeholder="例如：容易水肿、肩颈厚、大腿粗"
                    className={inputClassName}
                    value={form.body_other}
                    onChange={(e) =>
                      handleChange("body_other", e.target.value)
                    }
                  />
                </div>

                <PillSelector
                  label="单品预算区间"
                  options={BUDGET_OPTIONS}
                  selected={form.budget}
                  onChange={(v) => handleChange("budget", v)}
                />

                <TagSelector
                  label="日常场景"
                  options={SCENE_OPTIONS}
                  selected={form.daily_scenes}
                  onChange={(v) => handleChange("daily_scenes", v)}
                />
              </div>

              {/* Part 03 */}
              <div className={sectionClassName}>
                <SectionHeader
                  part="Part 03"
                  title="你最希望通过穿搭获得什么？"
                  subtitle="穿搭不是为了追随别人，而是为了成为更满意的自己。"
                />
                <TagSelector
                  label="穿搭目标（可多选）"
                  options={STYLE_GOALS}
                  selected={form.style_goals}
                  onChange={(v) => handleChange("style_goals", v)}
                />
              </div>

              {/* Part 04 */}
              <div className={sectionClassName}>
                <SectionHeader
                  part="Part 04"
                  title="哪些风格你绝对不想要？"
                  subtitle="如果不知道喜欢什么，也没关系。告诉我们你不喜欢什么，AI 一样能找到适合你的方向。"
                />
                <TagSelector
                  label="绝对不喜欢（可多选）"
                  options={STYLE_DISLIKES}
                  selected={form.style_dislikes}
                  onChange={(v) => handleChange("style_dislikes", v)}
                />
              </div>

              {/* Generate button */}
              <div className="space-y-4 border-t border-border pt-10">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-foreground px-6 py-4 text-sm tracking-[0.15em] text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                >
                  {isGenerating ? "正在生成 Style DNA" : "生成我的 Style DNA"}
                </button>
                <p className="text-center text-xs leading-relaxed text-muted">
                  AI 将综合你的灵感来源、现实条件与目标，
                  <br className="hidden sm:inline" />
                  生成真正适合你的个人风格档案。
                </p>
              </div>
            </div>
          )}

          {/* Part 05 */}
          <div ref={inferenceRef} className={sectionClassName}>
            <SectionHeader
              part="Part 05"
              title="AI 风格推断"
              subtitle="AI 会根据你的灵感来源自动推断风格方向。"
            />

            {isHydrated ? (
              <StyleInferenceResult
                activeProfileId={styleMemory.activeProfileId}
                isCollapsed={isResultCollapsed}
                onActivateProfile={handleActivateProfile}
                onCreateNewStyle={handleCreateNewStyle}
                onDeleteProfile={handleDeleteProfile}
                onExpandResult={handleExpandResult}
                styleDNA={styleDNA}
                fitFeedback={form.fit_feedback}
                onFitFeedbackChange={handleFitFeedback}
                onSaveStyle={handleSaveStyle}
                profiles={styleMemory.profiles}
              />
            ) : (
              <div className="rounded-sm border border-dashed border-border bg-background/40 p-8 text-center">
                <p className="font-serif text-lg text-muted">
                  正在读取你的 Style Profiles
                </p>
              </div>
            )}

            {hasGenerated && !isResultCollapsed && (
              <p className="text-center text-xs tracking-wider text-muted">
                以上为 AI 推断结果
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
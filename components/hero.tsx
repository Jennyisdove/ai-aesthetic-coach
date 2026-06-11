export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border px-6 py-20 md:px-12 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(196,167,125,0.08),_transparent_60%)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-muted">
          AI Aesthetic Coach
        </p>
        <h1 className="font-serif text-4xl leading-[1.15] tracking-tight md:text-6xl">
          把你喜欢的审美，
          <br />
          翻译成适合你的个人风格
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          不是明星同款生成器。你不必知道自己属于什么风格——只需告诉我们你喜欢谁、喜欢什么品牌与感觉、不喜欢什么，AI
          负责翻译审美，帮你找到真正属于自己的 Style DNA。
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs tracking-widest text-muted">
          <span className="rounded-full border border-border px-4 py-2">
            灵感解构
          </span>
          <span className="rounded-full border border-border px-4 py-2">
            风格翻译
          </span>
          <span className="rounded-full border border-border px-4 py-2">
            排除干扰项
          </span>
        </div>
      </div>
    </section>
  );
}

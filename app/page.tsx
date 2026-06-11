import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { StyleIntake } from "@/components/style-intake";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-6 py-5 backdrop-blur-sm md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="font-serif text-xl tracking-wide md:text-2xl">
            AI Aesthetic Coach
          </p>
          <p className="hidden text-xs tracking-[0.25em] text-muted md:block">
            PERSONAL STYLE INTELLIGENCE
          </p>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <StyleIntake />
      </main>

      <Footer />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Category = { slug: string; name: string; image: string };
type Product = { sku: string; image: string };

const categories: Category[] = [
  { slug: "rings", name: "Rings", image: "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop" },
  { slug: "necklaces", name: "Necklaces", image: "https://images.unsplash.com/photo-1520974044823-b88c0b4a0f64?q=80&w=1600&auto=format&fit=crop" },
  { slug: "bracelets", name: "Bracelets", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop" },
  { slug: "earrings", name: "Earrings", image: "https://images.unsplash.com/photo-1603575449236-21efc50d8f63?q=80&w=1600&auto=format&fit=crop" },
];

const productsByCategory: Record<string, Product[]> = {
  rings: [
    { sku: "RNG-CRY-001", image: "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1400&auto=format&fit=crop" },
    { sku: "RNG-GLD-014", image: "https://images.unsplash.com/photo-1518544801976-3e18df9ab01f?q=80&w=1400&auto=format&fit=crop" },
    { sku: "RNG-RQZ-112", image: "https://images.unsplash.com/photo-1520962916132-6000e8c1c1d6?q=80&w=1400&auto=format&fit=crop" },
  ],
  necklaces: [
    { sku: "NCK-GLD-220", image: "https://images.unsplash.com/photo-1617038260897-3b6e22fc26a5?q=80&w=1400&auto=format&fit=crop" },
    { sku: "NCK-PRL-333", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1400&auto=format&fit=crop" },
    { sku: "NCK-CRY-908", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400&auto=format&fit=crop" },
  ],
  bracelets: [
    { sku: "BRC-GLD-010", image: "https://images.unsplash.com/photo-1603565815872-4b0b1a4a9d8a?q=80&w=1400&auto=format&fit=crop" },
    { sku: "BRC-CRY-021", image: "https://images.unsplash.com/photo-1611276723551-98ac5d26a254?q=80&w=1400&auto=format&fit=crop" },
    { sku: "BRC-RSE-044", image: "https://images.unsplash.com/photo-1620000000391-25a1b7eb98c2?q=80&w=1400&auto=format&fit=crop" },
  ],
  earrings: [
    { sku: "EAR-GLD-511", image: "https://images.unsplash.com/photo-1603575449236-21efc50d8f63?q=80&w=1400&auto=format&fit=crop" },
    { sku: "EAR-PRL-502", image: "https://images.unsplash.com/photo-1609252925143-0f4c48eb2b69?q=80&w=1400&auto=format&fit=crop" },
    { sku: "EAR-DMD-577", image: "https://images.unsplash.com/photo-1601655781321-9ec6a3a3aad0?q=80&w=1400&auto=format&fit=crop" },
  ],
};

function ArrowButton({ direction, onClick, disabled }: { direction: "left" | "right"; onClick: () => void; disabled?: boolean }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={direction === "left" ? "Previous page" : "Next page"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group rounded-full p-3 md:p-4 shadow-lg ring-1 ring-border transition-all",
        "bg-primary/10 hover:bg-primary/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
        "backdrop-blur supports-[backdrop-filter]:bg-primary/10",
      )}
    >
      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
    </button>
  );
}

function PageShell({ children, side, full }: { children: React.ReactNode; side: "left" | "right"; full?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden rounded-2xl bg-card p-6 md:p-8",
        "shadow-[inset_0_0_0_1px_hsl(var(--border)),0_30px_80px_-20px_rgba(0,0,0,0.25)]",
        full ? "rounded-2xl" : side === "left" ? "rounded-r-none" : "rounded-l-none",
        "h-[var(--page-h)]",
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)" }} />
      <div className="h-full overflow-auto pr-1">{children}</div>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-black/0 via-black/0 to-black/5" />
    </div>
  );
}

function FlipOverlay({ side, front, back, dir, onComplete }: { side: "left" | "right" | "single"; front: React.ReactNode; back: React.ReactNode; dir: "next" | "prev"; onComplete: () => void }) {
  const isRight = side === "right";
  const isLeft = side === "left";
  const isSingle = side === "single";
  const origin = isRight ? "left center" : isLeft ? "right center" : dir === "next" ? "left center" : "right center";
  const exit = isRight || (isSingle && dir === "next") ? -180 : 180;
  return (
    <div className={cn("absolute inset-y-0 z-20", isRight && "left-1/2 w-1/2", isLeft && "right-1/2 w-1/2", isSingle && "left-0 right-0")} style={{ perspective: 1600 }}>
      <motion.div
        initial={{ rotateY: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
        animate={{ rotateY: exit, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: origin, transformStyle: "preserve-3d" }}
        onAnimationComplete={onComplete}
        className={cn("relative h-full rounded-2xl bg-card ring-1 ring-border", isRight ? "rounded-l-none" : isLeft ? "rounded-r-none" : "")}
      >
        <div className="absolute inset-0 h-full w-full overflow-hidden [backface-visibility:hidden]">
          <div className="h-full p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)" }} />
            <div className="h-full overflow-auto pr-1">{front}</div>
          </div>
          <div className={cn("pointer-events-none absolute inset-0", isRight ? "bg-gradient-to-l from-black/20 to-transparent" : "bg-gradient-to-r from-black/20 to-transparent")} />
        </div>
        <div className="absolute inset-0 h-full w-full overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="h-full p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)" }} />
            <div className="h-full overflow-auto pr-1">{back}</div>
          </div>
          <div className={cn("pointer-events-none absolute inset-0", isRight ? "bg-gradient-to-r from-black/15 to-transparent" : "bg-gradient-to-l from-black/15 to-transparent")} />
        </div>
      </motion.div>
    </div>
  );
}

export default function Index() {
  // 0: cover closed (only right page visible)
  // 1: open welcome (left image, right content)
  // 2: categories on both sides
  // 3: products (right shows products; left keeps categories)
  const [view, setView] = useState(0);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [flipping, setFlipping] = useState<"none" | "left" | "right" | "single">("none");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const clamp = (v: number) => Math.max(0, Math.min(v, 3));
  const isCover = view === 0;
  const pageHeight = "clamp(520px, 72vh, 680px)";

  const LeftImage = (
    <div className="h-full relative">
      <img src="https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1400&auto=format&fit=crop" alt="Jewelry" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
    </div>
  );

  const RightWelcome = (
    <div className="flex h-full flex-col items-center justify-center text-center select-none">
      <div className="mb-4 flex items-center gap-3 text-primary">
        <Gem className="h-7 w-7" />
        <span className="tracking-[0.35em] text-xs uppercase text-muted-foreground">Jewelry Diary</span>
      </div>
      <h1 className="font-brand text-5xl md:text-6xl lg:text-7xl font-semibold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">Crystova</h1>
      <p className="mt-4 max-w-sm text-sm md:text-base text-muted-foreground">A personal log for your gems, gold, and timeless keepsakes. Keep every sparkle remembered.</p>
    </div>
  );

  const CategoriesGrid = (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">Categories</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">Tap a category</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <button key={cat.slug} onClick={() => onSelectCategory(cat.slug)} className="group relative overflow-hidden rounded-xl ring-1 ring-border shadow hover:shadow-lg transition-all">
            <div className="relative aspect-[4/3] w-full">
              <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="inline-flex items-center rounded-full bg-card/80 backdrop-blur px-3 py-1 text-xs ring-1 ring-border text-foreground">{cat.name}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const ProductsGrid = (
    <div className="h-full">
      <div className="mb-4 flex items-center gap-3">
        <Gem className="h-5 w-5 text-primary" />
        <h2 className="font-brand text-2xl md:text-3xl">{selectedCategory ? selectedCategory.name : "Products"}</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {(selectedCategory ? productsByCategory[selectedCategory.slug] : [])?.map((p) => (
          <div key={p.sku} className="rounded-xl ring-1 ring-border bg-card shadow hover:shadow-lg transition-all overflow-hidden">
            <div className="relative aspect-square">
              <img src={p.image} alt={p.sku} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-black/10" />
            </div>
            <div className="-mb-0.5 p-3">
              <div className="text-[rgb(117,99,87)] text-xs">SKU</div>
              <div className="font-medium tracking-[0.4px]">{p.sku}</div>
              <div className="mt-3">
                <Button className="w-full" onClick={() => toast("Buy Now", { description: `SKU: ${p.sku}` })}>Buy Now</Button>
              </div>
            </div>
          </div>
        ))}
        {!selectedCategory && (
          <div className="col-span-full flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Select a category first</div>
        )}
      </div>
    </div>
  );

  const leftContentFor = (v: number) => {
    switch (v) {
      case 1:
        return LeftImage;
      case 2:
        return CategoriesGrid;
      case 3:
        return CategoriesGrid;
      default:
        return null;
    }
  };

  const rightContentFor = (v: number) => {
    switch (v) {
      case 0:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center select-none">
            <div className="relative mb-6">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-200/60 to-rose-200/60 blur-xl" />
              <div className="relative rounded-[2rem] px-10 py-8 ring-1 ring-border bg-gradient-to-br from-amber-50 to-rose-50">
                <div className="mb-3 flex items-center justify-center gap-3 text-primary">
                  <Gem className="h-7 w-7" />
                  <span className="tracking-[0.35em] text-xs uppercase text-muted-foreground">Jewelry Diary</span>
                </div>
                <div className="font-brand text-5xl md:text-6xl font-semibold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">Crystova</div>
              </div>
            </div>
            <p className="text-muted-foreground">Flip to open the diary</p>
          </div>
        );
      case 1:
        return RightWelcome;
      case 2:
        return CategoriesGrid;
      case 3:
        return ProductsGrid;
      default:
        return RightWelcome;
    }
  };

  const onSelectCategory = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug) || null;
    setSelectedCategory(cat);
    if (view < 3) startFlipNext();
  };

  const startFlipPrev = () => {
    if (view === 0 || flipping !== "none") return;
    setFlipDir("prev");
    if (view === 1) setFlipping("single");
    else setFlipping("left");
  };

  const startFlipNext = () => {
    if (view >= 3 || flipping !== "none") return;
    setFlipDir("next");
    if (view === 0) setFlipping("single");
    else setFlipping("right");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") startFlipNext();
      if (e.key === "ArrowLeft") startFlipPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, flipping]);

  return (
    <main className={cn("min-h-screen w-full bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100", "dark:from-[hsl(24_30%_7%)] dark:via-[hsl(24_22%_10%)] dark:to-[hsl(20_20%_8%)]")}> 
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4" style={{ ["--page-h" as any]: "clamp(520px, 72vh, 680px)", perspective: 1600 }}>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
          <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-amber-300/40" />
          <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-rose-300/40" />
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <ArrowButton direction="left" onClick={startFlipPrev} disabled={view === 0 || flipping !== "none"} />

          <div className="relative hidden md:flex w-[900px] max-w-[90vw] rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 h-[var(--page-h)]">
            {! (view === 0) && (
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />
            )}

            {view === 0 ? (
              <PageShell side="right" full>{rightContentFor(view)}</PageShell>
            ) : (
              <>
                <PageShell side="left">{leftContentFor(view)}</PageShell>
                <PageShell side="right">{rightContentFor(view)}</PageShell>
              </>
            )}

            {flipping === "right" && (
              <FlipOverlay
                side="right"
                dir={flipDir}
                front={rightContentFor(view)}
                back={rightContentFor(clamp(view + 1))}
                onComplete={() => {
                  setView((v) => clamp(v + 1));
                  setFlipping("none");
                }}
              />
            )}

            {flipping === "left" && (
              <FlipOverlay
                side="left"
                dir={flipDir}
                front={leftContentFor(clamp(view - 1))}
                back={leftContentFor(view)}
                onComplete={() => {
                  setView((v) => clamp(v - 1));
                  setFlipping("none");
                }}
              />
            )}

            {flipping === "single" && (
              <FlipOverlay
                side="single"
                dir={flipDir}
                front={rightContentFor(view)}
                back={rightContentFor(clamp(view + (flipDir === "next" ? 1 : -1)))}
                onComplete={() => {
                  setView((v) => clamp(v + (flipDir === "next" ? 1 : -1)));
                  setFlipping("none");
                }}
              />
            )}
          </div>

          <div className="md:hidden w-full max-w-xl rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 p-6 h-[var(--page-h)] overflow-hidden" style={{ perspective: 1600 }}>
            <div className="h-full">{rightContentFor(view)}</div>
            {flipping !== "none" && (
              <FlipOverlay
                side="single"
                dir={flipDir}
                front={rightContentFor(view)}
                back={rightContentFor(clamp(view + (flipDir === "next" ? 1 : -1)))}
                onComplete={() => {
                  setView((v) => clamp(v + (flipDir === "next" ? 1 : -1)));
                  setFlipping("none");
                }}
              />
            )}
          </div>

          <ArrowButton direction="right" onClick={startFlipNext} disabled={view === 3 || flipping !== "none"} />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-2 text-sm shadow ring-1 ring-border">Page {view + 1} / 4</div>
      </div>
    </main>
  );
}

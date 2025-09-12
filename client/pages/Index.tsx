import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
}) {
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

function Paper({
  children,
  side,
  k,
  dir,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  k: string | number;
  dir: "next" | "prev";
}) {
  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden rounded-2xl bg-card p-6 md:p-8",
        "shadow-[inset_0_0_0_1px_hsl(var(--border)),0_30px_80px_-20px_rgba(0,0,0,0.25)]",
        side === "left" ? "rounded-r-none" : "rounded-l-none",
        "h-[var(--page-h)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
        }}
      />
      <AnimatePresence mode="wait" initial={false}
      >
        <motion.div
          key={k}
          initial={{ x: dir === "next" ? 40 : -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: dir === "next" ? -40 : 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="h-full"
        >
          <div className="h-full overflow-auto pr-1">{children}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Index() {
  const pages = useMemo(
    () => [
      {
        id: 1,
        content: (
          <div className="flex h-full flex-col items-center justify-center text-center select-none">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <Gem className="h-7 w-7" />
              <span className="tracking-[0.35em] text-xs uppercase text-muted-foreground">
                Jewelry Diary
              </span>
            </div>
            <h1 className="font-brand text-5xl md:text-6xl lg:text-7xl font-semibold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">
              Crystova
            </h1>
            <p className="mt-4 max-w-sm text-sm md:text-base text-muted-foreground">
              A personal log for your gems, gold, and timeless keepsakes. Keep
              every sparkle remembered.
            </p>
          </div>
        ),
      },
      {
        id: 2,
        content: (
          <div className="h-full">
            <div className="mb-4 flex items-center gap-3">
              <Gem className="h-5 w-5 text-primary" />
              <h2 className="font-brand text-2xl md:text-3xl">Collection Details</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                  Owner
                </h3>
                <p className="font-medium">Mahek Mayani</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                  Brand
                </h3>
                <p className="font-medium">Crystova</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                  Materials
                </h3>
                <p className="font-medium">18K Gold, Diamonds, Rose Quartz</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                  Notes
                </h3>
                <p className="font-medium">
                  Soft blush palette with warm gold accents. Maintain in a
                  velvet case.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-border p-4">
              <p className="text-sm text-muted-foreground">
                Tip: Use the arrows to flip pages. More diary pages can be
                added later for purchases, appraisals, and memories.
              </p>
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const prev = () => {
    setDir("prev");
    setPageIndex((p) => Math.max(0, p - 1));
  };
  const next = () => {
    setDir("next");
    setPageIndex((p) => Math.min(pages.length - 1, p + 1));
  };

  const pageHeight = "clamp(480px, 70vh, 640px)";

  return (
    <main
      className={cn(
        "min-h-screen w-full bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100",
        "dark:from-[hsl(24_30%_7%)] dark:via-[hsl(24_22%_10%)] dark:to-[hsl(20_20%_8%)]",
      )}
    >
      <div
        className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4"
        style={{ ["--page-h" as any]: pageHeight }}
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
          <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-amber-300/40" />
          <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-rose-300/40" />
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <ArrowButton direction="left" onClick={prev} disabled={pageIndex === 0} />

          {/* Desktop: two-page spread */}
          <div className="relative hidden md:flex w-[900px] max-w-[90vw] rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 h-[var(--page-h)]">
            {/* spine */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />

            <Paper
              side="left"
              k={`left-${Math.max(0, pageIndex - 1)}`}
              dir={dir}
            >
              {pageIndex === 0
                ? pages[0].content
                : pages[pageIndex - 1]?.content ?? pages[0].content}
            </Paper>

            <Paper side="right" k={`right-${pageIndex}`} dir={dir}>
              {pages[pageIndex].content}
            </Paper>
          </div>

          {/* Mobile: single page */}
          <div className="md:hidden w-full max-w-xl rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 p-6 h-[var(--page-h)] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`mobile-${pageIndex}`}
                initial={{ x: dir === "next" ? 40 : -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir === "next" ? -40 : 40, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full"
              >
                <div className="h-full overflow-auto pr-1">{pages[pageIndex].content}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <ArrowButton
            direction="right"
            onClick={next}
            disabled={pageIndex === pages.length - 1}
          />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-2 text-sm shadow ring-1 ring-border">
          Page {pageIndex + 1} / {pages.length}
        </div>
      </div>
    </main>
  );
}

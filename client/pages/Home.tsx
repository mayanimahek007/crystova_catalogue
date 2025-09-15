import { Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const handleCatalogClick = () => {
    // Open catalog in new window/tab
    window.open('/catalog', '_blank');
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 dark:from-[hsl(24_30%_7%)] dark:via-[hsl(24_22%_10%)] dark:to-[hsl(20_20%_8%)]">
      <div className="flex min-h-screen items-center justify-center px-2 md:px-4">
        {/* Main Content */}
        <div className="w-full max-w-2xl rounded-xl md:rounded-2xl bg-card/90 p-5 sm:p-8 md:p-16 text-center shadow-2xl ring-1 ring-border">
          {/* Logo/Brand */}
          <div className="mb-10 md:mb-12">
            <div className="relative mb-6 md:mb-8">
              <div className="absolute -inset-3 sm:-inset-6 md:-inset-8 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-amber-200/60 to-rose-200/60 blur-2xl" />
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] px-6 py-6 sm:px-10 sm:py-8 md:px-16 md:py-12 ring-1 ring-border bg-gradient-to-br from-amber-50 to-rose-50">
                <div className="mb-4 md:mb-6 flex items-center justify-center gap-3 md:gap-4 text-primary">
                  <Gem className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" />
                  <span className="tracking-[0.35em] text-xs sm:text-sm uppercase text-muted-foreground">
                    Jewelry Diary
                  </span>
                </div>
                <div className="flex justify-center mb-5 md:mb-6">
                  <img
                    src="/crystova.png"
                    alt="CRYSTOVA"
                    className="h-10 sm:h-12 md:h-20 w-auto max-w-[200px] sm:max-w-[260px] md:max-w-[300px]"
                  />
                </div>
                <p className="mt-4 md:mt-6 text-base sm:text-lg text-muted-foreground">
                  Lab Grown Diamond Jewelry
                </p>
                <p className="mt-1.5 md:mt-2 text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
                  Wholesale catalog 2025
                </p>
              </div>
            </div>
          </div>

          {/* Catalog Button */}
          <Button
            onClick={handleCatalogClick}
            size="lg"
            className="w-full max-w-xs mx-auto text-base sm:text-lg font-semibold py-4 sm:py-5 md:py-6 px-6 md:px-8 rounded-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            📖 View Catalog
          </Button>
        </div>
      </div>
    </main>
  );
}

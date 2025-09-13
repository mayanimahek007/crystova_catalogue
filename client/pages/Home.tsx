import { Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const handleCatalogClick = () => {
    // Open catalog in new window/tab
    window.open('/catalog', '_blank');
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 dark:from-[hsl(24_30%_7%)] dark:via-[hsl(24_22%_10%)] dark:to-[hsl(20_20%_8%)]">
      <div className="flex min-h-screen items-center justify-center px-4">
        {/* Main Content */}
        <div className="w-full max-w-2xl rounded-2xl bg-card/90 p-16 text-center shadow-2xl ring-1 ring-border">
          {/* Logo/Brand */}
          <div className="mb-12">
            <div className="relative mb-8">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-amber-200/60 to-rose-200/60 blur-2xl" />
              <div className="relative rounded-[3rem] px-16 py-12 ring-1 ring-border bg-gradient-to-br from-amber-50 to-rose-50">
                <div className="mb-6 flex items-center justify-center gap-4 text-primary">
                  <Gem className="h-10 w-10" />
                  <span className="tracking-[0.35em] text-sm uppercase text-muted-foreground">
                    Jewelry Diary
                  </span>
                </div>
                <div className="flex justify-center" style={{
            marginBottom: '20px'
          }}>
            <img 
              src="/crystova.png" 
              alt="CRYSTOVA" 
              style={{
                height: '80px',
                width: 'auto',
                maxWidth: '300px'
              }}
            />
          </div>
                <p className="mt-6 text-lg text-muted-foreground">
                  Lab Grown Diamond Jewelry
                </p>
                <p className="mt-2 text-sm text-muted-foreground uppercase tracking-wider">
                  Wholesale catalog 2025
                </p>
              </div>
            </div>
          </div>

          {/* Catalog Button */}
          <Button
            onClick={handleCatalogClick}
            size="lg"
            className="w-full max-w-xs text-lg font-semibold py-6 px-8 rounded-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            📖 View Catalog
          </Button>
        </div>
      </div>
    </main>
  );
}

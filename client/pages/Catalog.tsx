import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePageFlipAudio } from "../hooks/usePageFlipAudio";

type Category = {
  _id: string;
  name: string;
  imageUrl?: string;
  description?: string;
};
type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string;
  videoUrl?: string;
  categoryname: string;
  category: Category;
};

function ArrowButton({
  direction,
  onClick,
  disabled,
  className,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
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
        className,
      )}
    >
      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
    </button>
  );
}

function PageShell({
  children,
  side,
  full,
  noPadding,
  mobileHeight,
  pageNumber,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  full?: boolean;
  noPadding?: boolean;
  mobileHeight?: boolean;
  pageNumber?: number | null;
}) {
  const computedNoPadding =
    typeof noPadding === "boolean"
      ? noPadding
      : typeof pageNumber === "number"
      ? pageNumber === 1 || pageNumber === 2
      : false;

  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden rounded-2xl bg-card diary_pageee",
        computedNoPadding ? "p-0" : "p-6 md:p-8",
        "shadow-[inset_0_0_0_1px_hsl(var(--border)),0_30px_80px_-20px_rgba(0,0,0,0.25)]",
        full
          ? "rounded-2xl"
          : side === "left"
            ? "rounded-r-none"
            : "rounded-l-none",
        mobileHeight ? "h-[var(--page-h-mobile)]" : "h-[var(--page-h)]",
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
        }}
      />
      <div className=" h-full " style={{ scrollbarGutter: 'stable' }}>{children}</div>
      {typeof pageNumber === "number" && (
        <div
          className={cn(
            "pointer-events-none absolute bottom-3 text-xs text-muted-foreground",
            side === "left" ? "left-3" : "right-3",
          )}
        >
          <div className="rounded-full bg-card/80 backdrop-blur px-2 py-0.5 ring-1 ring-border">
            {pageNumber}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-black/0 via-black/0 to-black/5" />
    </div>
  );
}

function FlipOverlay({
  side,
  front,
  back,
  dir,
  onComplete,
  frontPageNumber,
  backPageNumber,
}: {
  side: "left" | "right" | "single";
  front: React.ReactNode;
  back: React.ReactNode;
  dir: "next" | "prev";
  onComplete: () => void;
  frontPageNumber?: number | null;
  backPageNumber?: number | null;
}) {
  const isRight = side === "right";
  const isLeft = side === "left";
  const isSingle = side === "single";
  const origin = isRight
    ? "left center"
    : isLeft
      ? "right center"
      : dir === "next"
        ? "left center"
        : "right center";
  const exit = isRight || (isSingle && dir === "next") ? -180 : 180;

  const pagePaddingClass = (n?: number | null) =>
    typeof n === "number" && (n === 1 || n === 2 || n === 3) ? "p-0" : "p-6 md:p-8";

  return (
    <div
      className={cn(
        "absolute inset-y-0 z-30",
        isRight && "left-1/2 w-1/2",
        isLeft && "right-1/2 w-1/2",
        isSingle && "left-0 right-0",
      )}
      style={{ perspective: 1600 }}
    >
      <motion.div
        key={`${side}-${dir}`}
        initial={{ rotateY: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
        animate={{ rotateY: exit, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: origin, transformStyle: "preserve-3d", backfaceVisibility: 'hidden', willChange: 'transform' }}
        onAnimationComplete={onComplete}
        className={cn(
          "absolute inset-0 h-full w-full rounded-2xl bg-card ring-1 ring-border",
          isRight ? "rounded-l-none" : isLeft ? "rounded-r-none" : "",
        )}
      >
        <div className="absolute inset-0 h-full w-full overflow-hidden [backface-visibility:hidden]">
          <div className={cn("h-full", pagePaddingClass(frontPageNumber))}>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
              }}
            />
            <div className=" h-full " style={{ scrollbarGutter: 'stable' }}>{front}</div>
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              isRight
                ? "bg-gradient-to-l from-black/20 to-transparent"
                : "bg-gradient-to-r from-black/20 to-transparent",
            )}
          />
        </div>
        <div className="absolute inset-0 h-full w-full overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className={cn("h-full", pagePaddingClass(backPageNumber))}>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
              }}
            />
            <div className=" h-full " style={{ scrollbarGutter: 'stable' }}>{back}</div>
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              isRight
                ? "bg-gradient-to-r from-black/15 to-transparent"
                : "bg-gradient-to-l from-black/15 to-transparent",
            )}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function Catalog() {
  const [view, setView] = useState(0); // 0 cover, 1 welcome, 2 categories, 3 products
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [flipping, setFlipping] = useState<
    "none" | "left" | "right" | "single"
  >("none");
  const [pagingFlip, setPagingFlip] = useState(false);
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [linearJumpTarget, setLinearJumpTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(8);
  const flipGuard = useRef(false);
  
  // Touch gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  // Single-page mode (requested): show one page at a time with page numbers 1..N
  const singleMode = true;
  const [linearPage, setLinearPage] = useState(1);

  // Page flip audio hook
  const { playPageFlipSound, AudioComponent } = usePageFlipAudio();

  // Simple audio function for testing
  const playSimpleSound = () => {
    try {
      console.log("Trying to play audio...");
      const audio = new Audio("/audio/page-flip2.mp3"); // Try different file
      audio.volume = 0.8;
      audio
        .play()
        .then(() => {
          console.log("Audio played successfully!");
        })
        .catch((err) => {
          console.log("Simple audio failed:", err);
          // Try another file
          const audio2 = new Audio("/audio/page-flip22.mp3");
          audio2
            .play()
            .catch((err2) => console.log("Second audio also failed:", err2));
        });
    } catch (error) {
      console.log("Error creating audio:", error);
    }
  };

  // WhatsApp function for Buy Now
  const handleBuyNow = (product: Product) => {
    const phoneNumber = "918460477177"; // WhatsApp number without + sign
    const message = `Hello! I'm interested in purchasing this product:

SKU: ${product.sku}
Price: ₹${product.price}
Category: ${product.categoryname}

Please provide more details.`;
    
    // Try different WhatsApp URL formats for automatic message passing
    const urls = [
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
      `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
      `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
    ];

    // Try to open WhatsApp with automatic message
    let success = false;
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const newWindow = window.open(urls[i], "_blank");
        if (newWindow) {
          success = true;
          break;
        }
      } catch (error) {
        console.log(`URL ${i + 1} failed:`, error);
        continue;
      }
    }

    if (success) {
      toast.success("Opening WhatsApp with message...", {
        description: `SKU: ${product.sku} | Price: ₹${product.price}`,
      });
    } else {
      // Fallback: show message for manual copy
      toast("WhatsApp opened! If message doesn't appear, copy this:", {
        description: message,
        action: {
          label: "Copy Message",
          onClick: () => {
            navigator.clipboard.writeText(message);
            toast.success("Message copied to clipboard!");
          }
        }
      });
    }
    
    // Log for debugging
    console.log("WhatsApp URLs tried:", urls);
    console.log("Message:", message);
  };

  // Dynamic products per page based on screen size
  const updateProductsPerPage = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 425) {
        setProductsPerPage(4); // 2x2 grid for very small screens
      } else if (width < 768) {
        setProductsPerPage(6); // 3x2 grid for small screens
      } else {
        setProductsPerPage(8); // 4x2 grid for medium+ screens
      }
    }
  };

  // Prefetch helper to avoid visible image loading during flips
  const preloadImages = (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    (window as any).__preloadedImages = (window as any).__preloadedImages || [];
    urls.forEach((u) => {
      if (!u) return;
      try {
        const img = new Image();
        img.src = u;
        (window as any).__preloadedImages.push(img);
      } catch (e) {
        // ignore
      }
    });
  };

  const getImagesForLinearPage = (n: number) => {
    if (n === 1) return ["/3.webp", "/crystova.webp"];
    if (n === 2) return ["/cate2.webp", "/crystova.webp"];
    if (n === 3) {
      return categories
        .map((c) => (c.imageUrl ? `https://catalogue-api.crystovajewels.com${c.imageUrl}` : ""))
        .filter(Boolean);
    }
    if (n >= 4) {
      const pageIdx = n - 3; // 4 => page 1
      const startIndex = (pageIdx - 1) * productsPerPage;
      const pageProducts = products.slice(startIndex, startIndex + productsPerPage);
      return pageProducts.map((p) => (p.imageUrl ? `https://catalogue-api.crystovajewels.com${p.imageUrl}` : "")).filter(Boolean);
    }
    return [] as string[];
  };

  const clamp = (v: number) => Math.max(0, Math.min(v, 4));
  const isCover = view === 0;

  const getPageNumber = (v: number, side: "left" | "right"): number | null => {
    if (v === 0) return side === "right" ? 1 : null;
    if (v === 1) return side === "left" ? 2 : 3;
    if (v === 2) return side === "left" ? 4 : 5;
    if (v >= 3) {
      const pageIdx =
        view >= 3 && pagingFlip ? (pendingPage ?? currentPage) : currentPage;
      const base = 6 + (pageIdx - 1) * 2;
      return side === "left" ? base : base + 1;
    }
    return null;
  };

  // Fetch categories from backend API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://catalogue-api.crystovajewels.com/api/categories",
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Failed to fetch categories");
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products by category name from backend API
  const fetchProductsByCategory = async (categoryName: string) => {
    try {
      setProductsLoading(true);
      const response = await fetch(
        `https://catalogue-api.crystovajewels.com/api/jewelry/category-name/${encodeURIComponent(categoryName)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setTotalPages(Math.ceil(data.length / productsPerPage));
        setCurrentPage(1); // Reset to first page when category changes
      } else {
        console.error("Failed to fetch products for category:", categoryName);
        toast.error("Failed to load products");
        setProducts([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error loading products");
      setProducts([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setProductsLoading(false);
    }
  };

  const LeftImage = (
    <div className="h-full relative">
      <img
        src="/cate2.webp"
        alt="Jewelry"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
    </div>
  );

  const RightWelcome = (
    <div className="flex h-full flex-col justify-center text-left select-none px-4 md:px-8 max-[348px]:px-2">
      <div className="mb-3 md:mb-6">
        <div className="flex justify-center items-center gap-2 mb-2">
          <img
            src="/crystova.webp"
            alt="CRYSTOVA"
            className="h-12 md:h-12 max-[991px]:h-10 max-[348px]:h-8 w-auto max-w-[300px]"
          />
        </div>
      </div>
      <div className="mb-3 md:mb-6">
        <h2 className="page2-heading text-base md:text-lg max-[348px]:text-sm font-semibold text-gray-800 uppercase tracking-wide">
          WORLD'S LARGEST GROWER OF CVD LAB GROWN DIAMONDS
        </h2>
      </div>
      <div className="mb-3 md:mb-6">
        <p className="text-xs md:text-sm max-[348px]:text-[11px] text-gray-700 leading-relaxed">
          Welcome to the world of Crystova Jewels, where brilliance meets
          craftsmanship. With a sprawling manufacturing facility spanning over
          7,00,000 sq ft powered by a 25 MW solar plant and over 30+ years of
          experience, we redefine luxury through our exquisite diamonds and
          meticulously crafted jewelry. Explore the essence of elegance as we
          unveil our strengths and statistics that set us apart.
        </p>
      </div>
      <div className="silver-content-large mt-6 space-y-4">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">925 Sterling Silver Collection</h3>
            <p className="text-sm text-gray-600">Premium quality silver jewelry crafted to perfection</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-700 mb-1">92.5%</div>
              <div className="text-xs text-gray-600">Pure Silver</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-700 mb-1">7.5%</div>
              <div className="text-xs text-gray-600">Copper Alloy</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-700 mb-1">925</div>
              <div className="text-xs text-gray-600">Hallmark</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-700 font-medium">
              "925 Sterling Silver: The perfect blend of durability and elegance"
            </p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-xs md:text-sm max-[348px]:text-[11px] text-gray-600 italic">
          "Crystova Jewels: Crafting timeless elegance with exquisite designs,
          epitomizing beauty and sophistication for those who cherish the finer
          things in life."
        </p>
      </div>
    </div>
  );

  // Page 2: split layout (left image, right content)
  const WelcomeSplit = (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0">
      <div className="relative h-44 md:h-full max-[348px]:h-56 page-img-range">
        <img src="/cate2.webp" alt="Jewelry" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
      </div>
      <div className="h-full flex p-4 md:p-10 max-[348px]:p-2 page2-content">
        {RightWelcome}
      </div>
    </div>
  );

  const CategoriesGrid = (
    <div className="h-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">Categories</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Tap a category
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading categories...</div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 categories-grid">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-xl ring-1 ring-border transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={
                    cat.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={cat.name}
                  onClick={() => onSelectCategory(cat._id)}
                  className="absolute inset-0 h-full w-full object-cover cursor-pointer"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="inline-flex items-center rounded-full bg-card/80 backdrop-blur px-2 py-0.5 text-[9px] ring-1 ring-border text-foreground cursor-pointer" onClick={() => onSelectCategory(cat._id)}>
                    {cat.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {categories.length === 0 && !loading && (
            <div className="col-span-2 flex items-center justify-center h-32 text-muted-foreground">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Get paginated products
  const getPaginatedProducts = (pageIndex?: number) => {
    const page = pageIndex ?? currentPage;
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return products.slice(startIndex, endIndex);
  };

  // Get left side products (first half of products)
  const getLeftProducts = (pageIndex?: number) => {
    const page = pageIndex ?? currentPage;
    const startIndex = (page - 1) * productsPerPage;
    const halfProducts = Math.ceil(productsPerPage / 2);
    return products.slice(startIndex, startIndex + halfProducts);
  };

  // Get right side products (second half of products)
  const getRightProducts = (pageIndex?: number) => {
    const page = pageIndex ?? currentPage;
    const startIndex = (page - 1) * productsPerPage + Math.ceil(productsPerPage / 2);
    const halfProducts = Math.floor(productsPerPage / 2);
    return products.slice(startIndex, startIndex + halfProducts);
  };

  const LeftProductsGrid = (pageOverride?: number) => (
    <div className="h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">
            {selectedCategory ? selectedCategory.name : "Products"}
          </h2>
        </div>
        {selectedCategory && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setProducts([]);
              setCurrentPage(1);
              setTotalPages(1);
              if (singleMode) {
                playPageFlipSound();
                playSimpleSound();
                setFlipDir("prev");
                setLinearJumpTarget(3);
                setFlipping("single");
              } else {
                setView(2);
              }
            }}
            className="text-xs"
          >
            Back to Categories
          </Button>
        )}
      </div>
      {productsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2">
          {getLeftProducts(pageOverride).map((p) => (
            <div key={p._id} className="max-w-max">
              <div className="relative aspect-square">
                <img
                  src={
                    p.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${p.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-contain "
                  loading="lazy"
                />
                <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
              </div>
              <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">
                <div className="text-xs tracking-[0.4px] flex justify-center w-full">₹{p.price}</div>

                <div className="mt-3">
                  <Button className="w-full" onClick={() => handleBuyNow(p)}>
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {selectedCategory && products.length === 0 && !productsLoading && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No products found for {selectedCategory.name}
            </div>
          )}
        
        </div>
      )}
    </div>
  );

  const RightProductsGrid = (pageOverride?: number) => (
    <div className="h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">
            {selectedCategory ? selectedCategory.name : "Products"}
          </h2>
        </div>
        {selectedCategory && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setProducts([]);
              setCurrentPage(1);
              setTotalPages(1);
              if (singleMode) {
                playPageFlipSound();
                playSimpleSound();
                setFlipDir("prev");
                setLinearJumpTarget(3);
                setFlipping("single");
              } else {
                setView(2);
              }
            }}
            className="text-xs"
          >
            Back to Categories
          </Button>
        )}
      </div>
      {productsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2">
          {getRightProducts(pageOverride).map((p) => (
            <div key={p._id} className="max-w-max">
              <div className="relative aspect-square">
                <img
                  src={
                    p.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${p.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-contain"
                  loading="lazy"
                />
                <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
              </div>
              <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">
                <div className="text-xs tracking-[0.4px] flex justify-center w-full">₹{p.price}</div>

                <div className="mt-3">
                  <Button className="w-full" onClick={() => handleBuyNow(p)}>
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {selectedCategory && products.length === 0 && !productsLoading && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No products found for {selectedCategory.name}
            </div>
          )}
       
        </div>
      )}
    </div>
  );

  // Full-width products page (single-mode). Shows 4x2 grid (8 items per page)
  const ProductsGrid = (pageOverride?: number) => (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">
            {selectedCategory ? selectedCategory.name : "Products"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                setProducts([]);
                setCurrentPage(1);
                setTotalPages(1);
                if (singleMode) {
                  playPageFlipSound();
                  playSimpleSound();
                  setFlipDir("prev");
                  setLinearJumpTarget(3);
                  setFlipping("single");
                } else {
                  setView(2);
                }
              }}
              className="text-xs"
            >
              Back to Categories
            </Button>
          )}
          {/* {totalPages > 1 && (
            <span className="text-sm text-muted-foreground">
              {Math.max(1, Math.min(totalPages, pageOverride ?? currentPage))} / {totalPages}
            </span>
          )} */}
        </div>
      </div>
      {productsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      ) : (
        <div className="grid gap-3 max-[425px]:grid-cols-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 product-grid-large">
          {getPaginatedProducts(pageOverride).map((p) => (
            <div key={p._id} className="">
              <div className="relative aspect-square flex w-full justify-center category-image-sdsad">
                <img
                  src={
                    p.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${p.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-contain product_img"
                  loading="lazy"
                />
                <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
              </div>
              <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">
                <div className="text-xs tracking-[0.4px] flex justify-center w-full">₹{p.price}</div>
                <div className="mt-3">
                  <Button className="w-full h-8 text-xs" onClick={() => handleBuyNow(p)}>
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {selectedCategory && products.length === 0 && !productsLoading && (
            <div className="col-span-full flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No products found for {selectedCategory.name}
            </div>
          )}
         
        </div>
      )}
    </div>
  );

  // Split categories into two halves for left and right pages
  const leftCategories = categories.slice(0, Math.ceil(categories.length / 2));
  const rightCategories = categories.slice(Math.ceil(categories.length / 2));

  const LeftCategoriesGrid = (
    <div className="h-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">Categories</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Tap a category
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading categories...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leftCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-lg ring-1 ring-border shadow hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={
                    cat.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={cat.name}
                  onClick={() => onSelectCategory(cat._id)}
                  className="absolute inset-0 h-full w-full object-cover cursor-pointer"
                  loading="lazy"
                />
                <div className=" " />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="inline-flex items-center rounded-md bg-card/90 backdrop-blur px-2 py-1 text-xs ring-1 ring-border text-foreground">
                    {cat.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {leftCategories.length === 0 && !loading && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );

  const RightCategoriesGrid = (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-2xl md:text-3xl">Categories</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Tap a category
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading categories...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rightCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-lg ring-1 ring-border shadow hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={
                    cat.imageUrl
                      ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}`
                      : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"
                  }
                  alt={cat.name}
                  onClick={() => onSelectCategory(cat._id)}
                  className="absolute inset-0 h-full w-full object-cover cursor-pointer"
                  loading="lazy"
                />
                <div className=" " />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="inline-flex items-center rounded-md bg-card/90 backdrop-blur px-2 py-1 text-xs ring-1 ring-border text-foreground">
                    {cat.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {rightCategories.length === 0 && !loading && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );

  const leftContentFor = (v: number) =>
    v === 1
      ? LeftImage
      : v === 2
        ? LeftCategoriesGrid
        : v >= 3
          ? LeftProductsGrid()
          : null;
  const rightContentFor = (v: number) =>
    v === 0 ? (
      <div className="h-full relative">
        {/* Background jewelry image */}
        <div className="absolute inset-0">
          <img
            src="/3.webp"
            alt="Jewelry Background"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Background overlay */}

        {/* Grid pattern */}
        {/* <div className="hidden md:block absolute top-16 left-24 z-10">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
            ))}
          </div>
        </div> */}

        {/* Main content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center z-10">
          {/* Brand name */}
          <div className="mb-4">
            <div className="flex justify-center items-center gap-2 mb-2">
              <img
                src="/crystova.webp"
                alt="CRYSTOVA"
                className="h-12 md:h-32 w-auto max-w-[400px]"
              />
            </div>
          </div>

          {/* Bottom text */}
        </div>
      </div>
    ) : v === 1 ? (
      RightWelcome
    ) : v === 2 ? (
      RightCategoriesGrid
    ) : v >= 3 ? (
      RightProductsGrid()
    ) : null;

  // Build linear single-page content based on page number
  const contentForLinear = (n: number) => {
    if (n === 1) return rightContentFor(0); // cover
    if (n === 2) return WelcomeSplit; // split welcome page
    if (n === 3) return CategoriesGrid; // all categories full width
    if (n >= 4) {
      const pageIdx = n - 3; // 4 => 1, 5 => 2, ...
      return ProductsGrid(pageIdx);
    }
    return null;
  };

  const totalLinearPages = useMemo(() => 3 + (selectedCategory ? totalPages : 0), [selectedCategory, totalPages]);

  const onSelectCategory = (categoryId: string) => {
    const cat = categories.find((c) => c._id === categoryId) || null;
    setSelectedCategory(cat);

    // Fetch products for the selected category
    if (cat) {
      fetchProductsByCategory(cat.name);
    }

    // Always auto-flip to products page when category is selected
    if (view < 3) {
      startFlipNext(true); // Pass true to bypass category check
    }
  };

  const startFlipPrev = () => {
    if (flipping !== "none") return;

    // Single-page mode
    if (singleMode) {
      if (linearPage <= 1) return;
      playPageFlipSound();
      playSimpleSound();
      setFlipDir("prev");
      const target = linearPage - 1;
      // Preload target page images before starting flip
      preloadImages(getImagesForLinearPage(target));
      setLinearJumpTarget(target);
      setFlipping("single");
      return;
    }

    if (view === 0) return;

    // Play page flip sound
    playPageFlipSound();
    playSimpleSound(); // Also try simple approach

    // If we're on a product page and not on the first product page, flip to previous product page
    if (view >= 3 && currentPage > 1) {
      setPendingPage(currentPage - 1);
      setFlipDir("prev");
      setPagingFlip(true);
      setFlipping("left");
      return;
    }

    // Otherwise, flip to previous main page
    setFlipDir("prev");
    setFlipping(view === 1 ? "single" : "left");
  };

  const startFlipNext = (bypassCategoryCheck = false) => {
    if (flipping !== "none") return;

    // Single-page mode
    if (singleMode) {
      const blockProducts = linearPage >= 3 && !selectedCategory && !bypassCategoryCheck; // block beyond categories
      const atEnd = !bypassCategoryCheck && linearPage >= totalLinearPages;
      if (blockProducts || atEnd) return;
      playPageFlipSound();
      playSimpleSound();
      setFlipDir("next");
      const target = linearPage + 1;
      // Preload target page images before starting flip
      preloadImages(getImagesForLinearPage(target));
      setLinearJumpTarget(target);
      setFlipping("single");
      return;
    }

    if (view >= 4) return;

    // Don't allow flipping to product pages if no category is selected (unless bypassed)
    if (view === 2 && !selectedCategory && !bypassCategoryCheck) return;

    // Play page flip sound
    playPageFlipSound();
    playSimpleSound(); // Also try simple approach

    // If we're on a product page and there are more product pages, flip to next product page
    if (view >= 3 && currentPage < totalPages) {
      setPendingPage(currentPage + 1);
      setFlipDir("next");
      setPagingFlip(true);
      setFlipping("right");
      return;
    }

    // Otherwise, flip to next main page
    setFlipDir("next");
    setFlipping(view === 0 ? "single" : "right");
  };

  const completeFlip = (delta: 1 | 0 | -1) => {
    if (flipGuard.current) return;
    flipGuard.current = true;

    if (singleMode) {
      if (linearJumpTarget !== null) {
        setLinearPage(linearJumpTarget);
        setLinearJumpTarget(null);
      } else {
        setLinearPage((p) => Math.max(1, p + delta));
      }
      setFlipping("none");
      setTimeout(() => {
        flipGuard.current = false;
      }, 0);
      return;
    }

    if (pagingFlip && pendingPage !== null) {
      setCurrentPage(pendingPage);
    }
    setView((v) => clamp(v + delta));
    setFlipping("none");
    setPagingFlip(false);
    setPendingPage(null);
    setTimeout(() => {
      flipGuard.current = false;
    }, 0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") startFlipNext();
      if (e.key === "ArrowLeft") startFlipPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, flipping, linearPage, singleMode]);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    
    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 50;
    
    // Check if it's a horizontal swipe (not vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        startFlipPrev();
      } else {
        // Swipe left - go to next page
        startFlipNext();
      }
    }
  };

  // Update products per page on mount and window resize
  useEffect(() => {
    updateProductsPerPage();
    
    const handleResize = () => {
      updateProductsPerPage();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update total pages when productsPerPage changes
  useEffect(() => {
    if (products.length > 0) {
      setTotalPages(Math.ceil(products.length / productsPerPage));
      setCurrentPage(1); // Reset to first page when products per page changes
    }
  }, [productsPerPage, products.length]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Preload cover + welcome images immediately to avoid flicker
  useEffect(() => {
    preloadImages(getImagesForLinearPage(1).concat(getImagesForLinearPage(2)));
  }, []);

  // When categories load, preload their images for the full categories page
  useEffect(() => {
    if (categories.length > 0) {
      preloadImages(getImagesForLinearPage(3));
    }
  }, [categories]);

  // When products load, preload first product page images
  useEffect(() => {
    if (products.length > 0) {
      preloadImages(getImagesForLinearPage(4));
    }
  }, [products]);

  // Reset to cover on initial mount (avoid HMR-resumed state)
  useEffect(() => {
    setView(0);
    setSelectedCategory(null);
  }, []);

  return (
    <>
      <AudioComponent />
      <main
        className={cn(
          "min-h-screen w-full overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100",
          "dark:from-[hsl(24_30%_7%)] dark:via-[hsl(24_22%_10%)] dark:to-[hsl(20_20%_8%)]",
        )}
      >
        <div
          className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-2 md:px-4 overflow-hidden catalog-container"
          style={{
            ["--page-h" as any]: "clamp(560px, 80vh, 1000px)",
            ["--page-h-mobile" as any]: "clamp(400px, 78vh, 800px)",
            perspective: 1600,
          }}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
            <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-amber-300/40" />
            <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-rose-300/40" />
          </div>

          <div 
            className="relative flex w-[1000px] max-w-[96vw] rounded-2xl ring-1 ring-border shadow-2xl bg-transparent h-[var(--page-h)] catalog-page" 
            style={{ maxWidth: "min(96vw, 1400px)" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full overflow-hidden rounded-2xl">
            {(() => {
              const renderPage =
                flipping === "single"
                  ? (linearJumpTarget ?? (flipDir === "next" ? linearPage + 1 : linearPage - 1))
                  : linearPage;
              return (
                <PageShell side="right" full pageNumber={renderPage}>
                  {contentForLinear(renderPage)}
                </PageShell>
              );
            })()}

            {flipping === "single" && (
              <FlipOverlay
                side="single"
                dir={flipDir}
                front={contentForLinear(linearPage)}
                back={contentForLinear(linearJumpTarget ?? (flipDir === "next" ? linearPage + 1 : linearPage - 1))}
                frontPageNumber={linearPage}
                backPageNumber={linearJumpTarget ?? (flipDir === "next" ? linearPage + 1 : linearPage - 1)}
                onComplete={() => completeFlip(linearJumpTarget !== null ? 0 : (flipDir === "next" ? 1 : -1))}
              />
            )}
            </div>

            <div className={cn("absolute left-[-20px] md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-1/2 z-20", linearPage === 1 ? "invisible" : undefined)}>
              <ArrowButton
                direction="left"
                onClick={startFlipPrev}
                disabled={linearPage === 1 || flipping !== "none"}
                className="" />
            </div>
            <ArrowButton
              direction="right"
              onClick={startFlipNext}
              disabled={
                flipping !== "none" ||
                linearPage >= totalLinearPages ||
                (linearPage >= 3 && !selectedCategory)
              }
              className="absolute right-[-20px] md:right-0 top-1/2 -translate-y-1/2 md:translate-x-1/2 z-20"
            />
          </div>
        </div>
      </main>
    </>
  );
}

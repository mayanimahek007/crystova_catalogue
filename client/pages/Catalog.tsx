import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePageFlipAudio } from "../hooks/usePageFlipAudio";

type Category = { _id: string; name: string; imageUrl?: string; description?: string };
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
  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden rounded-2xl bg-card",
        noPadding ? "p-0" : "p-6 md:p-8",
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
      <div className=" h-full ">{children}</div>
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
}: {
  side: "left" | "right" | "single";
  front: React.ReactNode;
  back: React.ReactNode;
  dir: "next" | "prev";
  onComplete: () => void;
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
  return (
    <div
      className={cn(
        "absolute inset-y-0 z-20",
        isRight && "left-1/2 w-1/2",
        isLeft && "right-1/2 w-1/2",
        isSingle && "left-0 right-0",
      )}
      style={{ perspective: 1600 }}
    >
      <motion.div
        initial={{ rotateY: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
        animate={{ rotateY: exit, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: origin, transformStyle: "preserve-3d" }}
        onAnimationComplete={onComplete}
        className={cn(
          "relative h-full rounded-2xl bg-card ring-1 ring-border",
          isRight ? "rounded-l-none" : isLeft ? "rounded-r-none" : "",
        )}
      >
        <div className="absolute inset-0 h-full w-full overflow-hidden [backface-visibility:hidden]">
          <div className="h-full p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
              }}
            />
            <div className=" h-full ">{front}</div>
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
          <div className="h-full p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.5) 29px)",
              }}
            />
            <div className=" h-full ">{back}</div>
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
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const flipGuard = useRef(false);

  // Page flip audio hook
  const { playPageFlipSound, AudioComponent } = usePageFlipAudio();
  
  // Simple audio function for testing
  const playSimpleSound = () => {
    try {
      console.log('Trying to play audio...');
      const audio = new Audio('/audio/page-flip2.mp3'); // Try different file
      audio.volume = 0.8;
      audio.play().then(() => {
        console.log('Audio played successfully!');
      }).catch(err => {
        console.log('Simple audio failed:', err);
        // Try another file
        const audio2 = new Audio('/audio/page-flip22.mp3');
        audio2.play().catch(err2 => console.log('Second audio also failed:', err2));
      });
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  };

  // WhatsApp function for Buy Now
  const handleBuyNow = (product: Product) => {
    const phoneNumber = "919099975424"; // WhatsApp number without + sign
    const message = `Hello! I'm interested in purchasing this product:\n\nSKU: ${product.sku}\nCategory: ${product.categoryname}\n\nPlease provide more details and pricing.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    // Also show a toast notification
    toast("Opening WhatsApp", { 
      description: `SKU: ${product.sku}` 
    });
  };

  const PRODUCTS_PER_PAGE = 6; // 3 products per side (left + right)

  const clamp = (v: number) => Math.max(0, Math.min(v, 4));
  const isCover = view === 0;

  const getPageNumber = (v: number, side: "left" | "right"): number | null => {
    if (v === 0) return side === "right" ? 1 : null;
    if (v === 1) return side === "left" ? 2 : 3;
    if (v === 2) return side === "left" ? 4 : 5;
    if (v >= 3) {
      const pageIdx = (view >= 3 && pagingFlip) ? (pendingPage ?? currentPage) : currentPage;
      const base = 6 + (pageIdx - 1) * 2;
      return side === "left" ? base : base + 1;
    }
    return null;
  };

  // Fetch categories from backend API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://catalogue-api.crystovajewels.com/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
        toast.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products by category name from backend API
  const fetchProductsByCategory = async (categoryName: string) => {
    try {
      setProductsLoading(true);
      const response = await fetch(`https://catalogue-api.crystovajewels.com/api/jewelry/category-name/${encodeURIComponent(categoryName)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setTotalPages(Math.ceil(data.length / PRODUCTS_PER_PAGE));
        setCurrentPage(1); // Reset to first page when category changes
      } else {
        console.error('Failed to fetch products for category:', categoryName);
        toast.error('Failed to load products');
        setProducts([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
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
        src="/cate.png"
        alt="Jewelry"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
    </div>
  );

  const RightWelcome = (
    <div className="flex h-full flex-col justify-center text-left select-none px-8 max-[991px]:px-0">
      {/* Logo */}
      <div className="mb-6">
        <div className="flex justify-center items-center gap-2 mb-2">
          <img
              src="/crystova.png"
              alt="CRYSTOVA"
              style={{
                height: '50px',
                width: 'auto',
                maxWidth: '300px'
              }}
            />
        </div>
      </div>

      {/* Tagline */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">
          WORLD'S LARGEST GROWER OF CVD LAB GROWN DIAMONDS
        </h2>
      </div>

      {/* Main Content */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 leading-relaxed">
          Welcome to the world of Crystova Jewels, where brilliance meets craftsmanship. With a sprawling manufacturing facility spanning over 7,00,000 sq ft powered by a 25 MW solar plant and over 30+ years of experience, we redefine luxury through our exquisite diamonds and meticulously crafted jewelry. Explore the essence of elegance as we unveil our strengths and statistics that set us apart.
        </p>
      </div>

      {/* Quote */}
      <div className="mt-auto">
        <p className="text-sm text-gray-600 italic">
          "Crystova Jewels: Crafting timeless elegance with exquisite designs, epitomizing beauty and sophistication for those who cherish the finer things in life."
        </p>
      </div>
    </div>
  );

  const CategoriesGrid = (
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-xl ring-1 ring-border shadow hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={cat.imageUrl ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="inline-flex items-center rounded-full bg-card/80 backdrop-blur px-3 py-1 text-xs ring-1 ring-border text-foreground">
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
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  };

  // Get left side products (first 3 products)
  const getLeftProducts = (pageIndex?: number) => {
    const page = pageIndex ?? currentPage;
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + 3);
  };

  // Get right side products (next 3 products)
  const getRightProducts = (pageIndex?: number) => {
    const page = pageIndex ?? currentPage;
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE + 3;
    return products.slice(startIndex, startIndex + 3);
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
              setView(2); // Go back to categories page
              setSelectedCategory(null);
              setProducts([]);
              setCurrentPage(1);
              setTotalPages(1);
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
        <div className="grid gap-0 grid-cols-2">
          {getLeftProducts(pageOverride).map((p) => (
            <div
              key={p._id}
              className="max-w-max"
            >
              <div className="relative aspect-square">
                <img
                  src={p.imageUrl ? `https://catalogue-api.crystovajewels.com${p.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-contain"
                  loading="lazy"
                />
                <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
              </div>
              <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">

                <div className="text-xs tracking-[0.4px]">{p.sku}</div>

                <div className="mt-3">
                  <Button
                    className="w-full"
                    onClick={() => handleBuyNow(p)}
                  >
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
          {!selectedCategory && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Select a category first
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
              setView(2); // Go back to categories page
              setSelectedCategory(null);
              setProducts([]);
              setCurrentPage(1);
              setTotalPages(1);
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
        <div className="grid gap-0 grid-cols-2">
          {getRightProducts(pageOverride).map((p) => (
            <div
              key={p._id}
              className="max-w-max"
            >
              <div className="relative aspect-square">
                <img
                  src={p.imageUrl ? `https://catalogue-api.crystovajewels.com${p.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-contain"
                  loading="lazy"
                />
                <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
              </div>
              <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">

                <div className="text-xs tracking-[0.4px]">{p.sku}</div>

                <div className="mt-3">
                  <Button
                    className="w-full"
                    onClick={() => handleBuyNow(p)}
                  >
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
          {!selectedCategory && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Select a category first
            </div>
          )}
        </div>
      )}
    </div>
  );

  const ProductsGrid = (
    <div className="h-full">
      {/* Categories Section */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Gem className="h-5 w-5 text-primary" />
          <h2 className="font-brand text-xl md:text-2xl">Categories</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="text-muted-foreground">Loading categories...</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => onSelectCategory(cat._id)}
                className={`group relative overflow-hidden rounded-lg ring-1 ring-border shadow hover:shadow-md transition-all ${selectedCategory?._id === cat._id ? 'ring-primary bg-primary/5' : ''
                  }`}
              >
                <div className="relative aspect-square w-full">
                  <img
                    src={cat.imageUrl ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-contain"
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
            {categories.length === 0 && !loading && (
              <div className="col-span-full flex items-center justify-center h-20 text-muted-foreground">
                No categories found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between">
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
                  setView(2); // Go back to categories page
                  setSelectedCategory(null);
                  setProducts([]);
                  setCurrentPage(1);
                  setTotalPages(1);
                }}
                className="text-xs"
              >
                Back to Categories
              </Button>
            )}
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {productsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        ) : (
          <div className="grid gap-0 grid-cols-2">
            {getPaginatedProducts().map((p) => (
              <div
                key={p._id}
                className="max-w-max"
              >
                <div className="relative aspect-square">
                  <img
                    src={p.imageUrl ? `https://catalogue-api.crystovajewels.com${p.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute from-transparent inset-0 to-black/10 via-transparent" />
                </div>
                <div className=" -inset-8 -mb-0.5 -mb-0.5 left-1 p-3 pb-0 relative">

                  <div className="text-xs tracking-[0.4px]">{p.sku}</div>
                  {p.price && (
                    <div className="text-sm font-medium text-primary mt-1">
                      ${p.price}
                    </div>
                  )}
                  <div className="mt-3">
                    <Button
                      className="w-full"
                      onClick={() =>
                        toast("Buy Now", { description: `SKU: ${p.sku} - ${p.name}` })
                      }
                    >
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
            {!selectedCategory && (
              <div className="col-span-full flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Select a category first
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Split categories into two halves for left and right pages
  const leftCategories = categories.slice(0, Math.ceil(categories.length / 2));
  const rightCategories = categories.slice(Math.ceil(categories.length / 2));

  const LeftCategoriesGrid = (
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
        <div className="grid grid-cols-2 gap-3">
          {leftCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-lg ring-1 ring-border shadow hover:shadow-md transition-all"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={cat.imageUrl ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-contain"
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
        <div className="grid grid-cols-2 gap-3">
          {rightCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className="group relative overflow-hidden rounded-lg ring-1 ring-border shadow hover:shadow-md transition-all"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={cat.imageUrl ? `https://catalogue-api.crystovajewels.com${cat.imageUrl}` : "https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1600&auto=format&fit=crop"}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-contain"
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
    v === 1 ? LeftImage : v === 2 ? LeftCategoriesGrid : v >= 3 ? LeftProductsGrid() : null;
  const rightContentFor = (v: number) =>
    v === 0 ? (
      <div className="h-full relative">
        {/* Background jewelry image */}
        <div className="absolute inset-0">
          <img
            src="/3.png"
            alt="Jewelry Background"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        
        {/* Background overlay */}
        
        {/* Grid pattern */}
        <div className="absolute top-16 left-24 z-10">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
            ))}
          </div>
        </div>
        
        {/* Main content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center z-10">
          {/* Brand name */}
          <div className="mb-4">
          <div className="flex justify-center items-center gap-2 mb-2">
 <img 
              src="/crystova.png" 
              alt="CRYSTOVA" 
              style={{
                height: '100px',
                width: 'auto',
                maxWidth: '380px'
              }}
            />          
        </div>
           
          </div>
          
          {/* Bottom text */}
          <div className="absolute bottom-16 left-20">
            <p className="text-sm text-gray-900 font-light text-start font-serif font-bold">
              Wholesale <br /> 
              catalog 2025
            </p>
          </div>
        </div>
      </div>
    ) : v === 1 ? (
      RightWelcome
    ) : v === 2 ? (
      RightCategoriesGrid
    ) : v >= 3 ? (
      RightProductsGrid()
    ) : null;

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
    if (view === 0 || flipping !== "none") return;

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
    setFlipping("left");
  };

  const startFlipNext = (bypassCategoryCheck = false) => {
    if (view >= 4 || flipping !== "none") return;

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
    setFlipping("right");
  };

  const completeFlip = (delta: 1 | 0 | -1) => {
    if (flipGuard.current) return;
    flipGuard.current = true;
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
  }, [view, flipping]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
          className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4"
          style={{
            ["--page-h" as any]: "clamp(520px, 72vh, 680px)",
            ["--page-h-mobile" as any]: "clamp(200px, 40vh, 450px)",
            perspective: 1600,
          }}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
            <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-amber-300/40" />
            <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-rose-300/40" />
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className={cn(view === 0 ? "invisible" : undefined)}>
              <ArrowButton
                direction="left"
                onClick={startFlipPrev}
                disabled={view === 0 || flipping !== "none"}
              />
            </div>

            <div className="relative hidden md:flex w-[900px] max-w-[90vw] rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 h-[var(--page-h)]">
              {view !== 0 && (
                <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />
              )}

              {(view === 0 && flipping !== "right") || (flipping === "single" && flipDir === "prev") ? (
                // Show cover as single page when on cover OR when flipping back to cover
                <PageShell side="right" full={true} noPadding={true} pageNumber={getPageNumber(view === 0 ? 0 : clamp(view - 1), 'right')}>{rightContentFor(view === 0 ? 0 : clamp(view - 1))}</PageShell>
              ) : (
                // Open book - two pages
                <>
                  <PageShell side="left" noPadding={view === 1 || (view === 0 && flipping === "right")} pageNumber={getPageNumber(
                          flipping === "right" ? clamp(view + 1) :
                          flipping === "left" ? clamp(view - 1) :
                          (view === 0 ? 1 : view)
                        , 'left')}>
                    {view >= 3 && pagingFlip
                      ? LeftProductsGrid(pendingPage ?? currentPage)
                      : leftContentFor(
                          flipping === "right" ? clamp(view + 1) :
                          flipping === "left" ? clamp(view - 1) :
                          (view === 0 ? 1 : view)
                        )}
                  </PageShell>
                  <PageShell side="right" pageNumber={getPageNumber(
                          flipping === "right" ? clamp(view + 1) :
                          flipping === "left" ? clamp(view - 1) :
                          (view === 0 ? 0 : view)
                        , 'right')}>
                    {view >= 3 && pagingFlip
                      ? RightProductsGrid(pendingPage ?? currentPage)
                      : rightContentFor(
                          flipping === "right" ? clamp(view + 1) :
                          flipping === "left" ? clamp(view - 1) :
                          (view === 0 ? 0 : view)
                        )}
                  </PageShell>
                </>
              )}

              {flipping === "right" && (
                <FlipOverlay
                  side="right"
                  dir={flipDir}
                  front={view >= 3 && pagingFlip ? RightProductsGrid(currentPage) : rightContentFor(view)}
                  back={view >= 3 && pagingFlip ? LeftProductsGrid(pendingPage ?? currentPage) : leftContentFor(clamp(view + 1))}
                  onComplete={() => completeFlip(pagingFlip ? 0 : 1)}
                />
              )}

              {flipping === "left" && (
                <FlipOverlay
                  side="left"
                  dir={flipDir}
                  front={view >= 3 && pagingFlip ? LeftProductsGrid(currentPage) : leftContentFor(view)}
                  back={view >= 3 && pagingFlip ? RightProductsGrid(pendingPage ?? currentPage) : rightContentFor(clamp(view - 1))}
                  onComplete={() => completeFlip(pagingFlip ? 0 : -1)}
                />
              )}

              {flipping === "single" && (
                <FlipOverlay
                  side="single"
                  dir={flipDir}
                  front={rightContentFor(view)}
                  back={view >= 3 && pagingFlip ? (flipDir === "next" ? LeftProductsGrid(pendingPage ?? currentPage) : RightProductsGrid(pendingPage ?? currentPage)) : (flipDir === "next" ? leftContentFor(clamp(view + 1)) : rightContentFor(clamp(view - 1)))}
                  onComplete={() => completeFlip(flipDir === "next" ? 1 : -1)}
                />
              )}
            </div>

            <div className="md:hidden flex w-full max-w-4xl rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 h-[var(--page-h-mobile)]">
              {view !== 0 && (
                <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />
              )}

              {view === 0 ? (
                // Closed book - single page covering the entire width
                <PageShell side="right" full={true} noPadding={true} mobileHeight={true} pageNumber={getPageNumber(view, 'right')}>{rightContentFor(view)}</PageShell>
              ) : (
                // Open book - two pages
                <>
                  <PageShell side="left" noPadding={view === 1} mobileHeight={true} pageNumber={getPageNumber(view, 'left')}>{leftContentFor(view)}</PageShell>
                  <PageShell side="right" mobileHeight={true} pageNumber={getPageNumber(view, 'right')}>{rightContentFor(view)}</PageShell>
                </>
              )}

              {flipping === "right" && (
                <FlipOverlay
                  side="right"
                  dir={flipDir}
                  front={view >= 3 && pagingFlip ? RightProductsGrid(currentPage) : rightContentFor(view)}
                  back={view >= 3 && pagingFlip ? LeftProductsGrid(pendingPage ?? currentPage) : leftContentFor(clamp(view + 1))}
                  onComplete={() => completeFlip(pagingFlip ? 0 : 1)}
                />
              )}

              {flipping === "left" && (
                <FlipOverlay
                  side="left"
                  dir={flipDir}
                  front={view >= 3 && pagingFlip ? LeftProductsGrid(currentPage) : leftContentFor(view)}
                  back={view >= 3 && pagingFlip ? RightProductsGrid(pendingPage ?? currentPage) : rightContentFor(clamp(view - 1))}
                  onComplete={() => completeFlip(pagingFlip ? 0 : -1)}
                />
              )}

              {flipping === "single" && (
                <FlipOverlay
                  side="single"
                  dir={flipDir}
                  front={rightContentFor(view)}
                  back={view >= 3 && pagingFlip ? (flipDir === "next" ? LeftProductsGrid(pendingPage ?? currentPage) : RightProductsGrid(pendingPage ?? currentPage)) : (flipDir === "next" ? leftContentFor(clamp(view + 1)) : rightContentFor(clamp(view - 1)))}
                  onComplete={() => completeFlip(flipDir === "next" ? 1 : -1)}
                />
              )}
            </div>

            <ArrowButton
              direction="right"
              onClick={startFlipNext}
              disabled={((view >= 3) && currentPage >= totalPages) || (view === 2 && !selectedCategory) || flipping !== "none"}
            />
          </div>

        </div>
      </main>
    </>
  );
}

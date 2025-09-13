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
}: {
  children: React.ReactNode;
  side: "left" | "right";
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden rounded-2xl bg-card p-6 md:p-8",
        "shadow-[inset_0_0_0_1px_hsl(var(--border)),0_30px_80px_-20px_rgba(0,0,0,0.25)]",
        full
          ? "rounded-2xl"
          : side === "left"
            ? "rounded-r-none"
            : "rounded-l-none",
        "h-[var(--page-h)]",
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

  const PRODUCTS_PER_PAGE = 6; // 3 products per side (left + right)

  const clamp = (v: number) => Math.max(0, Math.min(v, 4));
  const isCover = view === 0;

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
        src="https://images.unsplash.com/photo-1516632664305-eda5b4636b93?q=80&w=1400&auto=format&fit=crop"
        alt="Jewelry"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-black/0 to-black/0" />
    </div>
  );

  const RightWelcome = (
    <div className="flex h-full flex-col items-center justify-center text-center select-none">
      <div className="mb-4 flex items-center gap-3 text-primary">
        <Gem className="h-7 w-7" />
        <span className="tracking-[0.35em] text-xs uppercase text-muted-foreground">
          Jewelry Diary
        </span>
      </div>
      <h1 className="font-brand text-5xl md:text-6xl lg:text-7xl font-semibold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">
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
          </div>      </h1>
      <p className="mt-4 max-w-sm text-sm md:text-base text-muted-foreground">
        A personal log for your gems, gold, and timeless keepsakes. Keep every
        sparkle remembered.
      </p>
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
  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  };

  // Get left side products (first 3 products)
  const getLeftProducts = () => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + 3);
  };

  // Get right side products (next 3 products)
  const getRightProducts = () => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE + 3;
    return products.slice(startIndex, startIndex + 3);
  };

  const LeftProductsGrid = (
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
          {getLeftProducts().map((p) => (
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

  const RightProductsGrid = (
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
          {getRightProducts().map((p) => (
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
                  <div className="text-sm text-muted-foreground mt-1">{p.name}</div>
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
    v === 1 ? LeftImage : v === 2 ? LeftCategoriesGrid : v >= 3 ? LeftProductsGrid : null;
  const rightContentFor = (v: number) =>
    v === 0 ? (
      <div className="h-full flex flex-col items-center justify-center text-center select-none">
        <div className="relative mb-6">
          <div className="absolute -inset-8 -mb-0.5 rounded-[2rem] bg-gradient-to-br from-amber-200/60 to-rose-200/60 blur-xl" />
          <div className="relative rounded-[2rem] px-10 py-8 ring-1 ring-border bg-gradient-to-br from-amber-50 to-rose-50">
            <div className="mb-3 flex items-center justify-center gap-3 text-primary">
              <Gem className="h-7 w-7" />
              <span className="tracking-[0.35em] text-xs uppercase text-muted-foreground">
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
          </div>
        </div>
        <p className="text-muted-foreground">Flip to open the diary</p>
      </div>
    ) : v === 1 ? (
      RightWelcome
    ) : v === 2 ? (
      RightCategoriesGrid
    ) : v >= 3 ? (
      RightProductsGrid
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

    // If we're on a product page and not on the first product page, flip to previous product page
    if (view >= 3 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setFlipDir("prev");
      setFlipping("left");
      return;
    }

    // Otherwise, flip to previous main page
    setFlipDir("prev");
    setFlipping(view === 1 ? "single" : "left");
  };

  const startFlipNext = (bypassCategoryCheck = false) => {
    if (view >= 4 || flipping !== "none") return;

    // Don't allow flipping to product pages if no category is selected (unless bypassed)
    if (view === 2 && !selectedCategory && !bypassCategoryCheck) return;

    // Play page flip sound
    playPageFlipSound();

    // If we're on a product page and there are more product pages, flip to next product page
    if (view >= 3 && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setFlipDir("next");
      setFlipping("right");
      return;
    }

    // Otherwise, flip to next main page
    setFlipDir("next");
    setFlipping(view === 0 ? "single" : "right");
  };

  const completeFlip = (delta: 1 | -1) => {
    if (flipGuard.current) return;
    flipGuard.current = true;
    setView((v) => clamp(v + delta));
    setFlipping("none");
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
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />

              <>
                <PageShell side="left">{view === 0 ? null : leftContentFor(view)}</PageShell>
                <PageShell side="right">{rightContentFor(view)}</PageShell>
              </>

              {flipping === "right" && (
                <FlipOverlay
                  side="right"
                  dir={flipDir}
                  front={rightContentFor(view)}
                  back={rightContentFor(clamp(view + 1))}
                  onComplete={() => completeFlip(1)}
                />
              )}

              {flipping === "left" && (
                <FlipOverlay
                  side="left"
                  dir={flipDir}
                  front={leftContentFor(clamp(view - 1))}
                  back={leftContentFor(view)}
                  onComplete={() => completeFlip(-1)}
                />
              )}

              {flipping === "single" && (
                <FlipOverlay
                  side="single"
                  dir={flipDir}
                  front={rightContentFor(view)}
                  back={rightContentFor(
                    clamp(view + (flipDir === "next" ? 1 : -1)),
                  )}
                  onComplete={() => completeFlip(flipDir === "next" ? 1 : -1)}
                />
              )}
            </div>

            <div
              className="md:hidden w-full max-w-xl rounded-2xl ring-1 ring-border shadow-2xl bg-card/90 p-6 h-[var(--page-h)] overflow-hidden"
              style={{ perspective: 1600 }}
            >
              <div className="h-full">{rightContentFor(view)}</div>
              {flipping !== "none" && (
                <FlipOverlay
                  side="single"
                  dir={flipDir}
                  front={rightContentFor(view)}
                  back={rightContentFor(
                    clamp(view + (flipDir === "next" ? 1 : -1)),
                  )}
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

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-2 text-sm shadow ring-1 ring-border">
            Page {view + 1} / {!selectedCategory ? 3 : (view < 3 ? 4 : 3 + totalPages)}
          </div>
        </div>
      </main>
    </>
  );
}

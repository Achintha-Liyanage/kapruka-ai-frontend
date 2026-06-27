import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Grid2X2, Rows3, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  onAddToCart: (item: { product_id: string; name: string; price: number; image_url?: string }) => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, onAddToCart }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('grid');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(products.length > 2);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 8);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products, viewMode]);

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  if (!products?.length) return null;

  return (
    <section className="mt-2 w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/[0.04] px-3 py-2 shadow-sm">
          <ShoppingBag className="h-4 w-4 text-violet-200" />
          <span className="text-xs font-black text-indigo-100">
            {products.length} {products.length === 1 ? 'match' : 'matches'} from Kapruka
          </span>
        </div>

        <div className="flex rounded-full border border-violet-300/20 bg-white/[0.04] p-1 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`focus-ring flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black transition ${
              viewMode === 'grid' ? 'neon-primary text-white' : 'text-indigo-200/65 hover:text-white'
            }`}
            title="Grid view"
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('carousel')}
            className={`focus-ring flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black transition ${
              viewMode === 'carousel' ? 'neon-primary text-white' : 'text-indigo-200/65 hover:text-white'
            }`}
            title="Carousel view"
          >
            <Rows3 className="h-3.5 w-3.5" />
            Row
          </button>
        </div>
      </div>

      {viewMode === 'carousel' ? (
        <div className="group/row relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="focus-ring absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/25 bg-slate-950/88 text-white opacity-0 shadow-lg shadow-violet-950/30 transition group-hover/row:opacity-100"
              title="Previous products"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="focus-ring absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/25 bg-slate-950/88 text-white opacity-0 shadow-lg shadow-violet-950/30 transition group-hover/row:opacity-100"
              title="Next products"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-12"
            style={{ scrollbarWidth: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-[18rem] shrink-0 snap-start sm:w-[19rem]">
                <ProductCard product={product} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductCarousel;

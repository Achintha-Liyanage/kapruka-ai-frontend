import React, { useMemo, useState } from 'react';
import { Heart, Plus, Star, Truck } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (item: { product_id: string; name: string; price: number; image_url?: string }) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isLiked, setIsLiked] = useState(false);
  const imageUrl =
    product.image_url ||
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=700&auto=format&fit=crop&q=80';

  const rating = useMemo(() => {
    const seed = product.name.charCodeAt(0) + product.name.length;
    return (4.4 + (seed % 6) / 10).toFixed(1);
  }, [product.name]);

  const productBadge = useMemo(() => {
    const seed = product.name.length + product.id.length;
    if (seed % 5 === 0) return '🔥 Bestseller';
    if (seed % 4 === 0) return 'Free delivery';
    if (seed % 3 === 0) return 'Limited';
    return 'Gift ready';
  }, [product.id, product.name]);

  const handleAdd = (event: React.MouseEvent) => {
    event.stopPropagation();
    onAddToCart({
      product_id: product.id,
      name: product.name,
      price: product.price.amount,
      image_url: product.image_url,
    });
  };

  const handleCardClick = () => {
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="product-card neon-card group flex h-full min-h-[23rem] cursor-pointer flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-violet-300/60 hover:shadow-2xl hover:shadow-violet-950/35"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm backdrop-blur">
          {productBadge}
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="focus-ring absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white shadow-sm backdrop-blur transition hover:scale-110 hover:border-rose-300/60"
          title={isLiked ? 'Remove from wishlist' : 'Save product'}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/82 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {rating}
        </div>
      </div>

      <div className="product-card-body flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className={`product-stock-badge rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            product.in_stock ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20' : 'bg-slate-700/70 text-slate-300'
          }`}>
            {product.in_stock ? 'In stock' : 'Unavailable'}
          </span>
          <span className="product-delivery-label flex items-center gap-1 text-[10px] font-bold text-indigo-200/50">
            <Truck className="h-3 w-3" />
            Delivery check
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-11 text-[17px] font-black leading-5 text-white transition group-hover:text-violet-100">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-5 text-indigo-100/62">
          {product.description || product.summary || 'Curated from Kapruka with gifting, delivery, and checkout support.'}
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200/45">Price</p>
              <p className="text-2xl font-black tracking-tight text-white">
                LKR {product.price.amount.toLocaleString()}
              </p>
            </div>
            {product.compare_at_price && (
              <p className="text-xs font-bold text-indigo-200/40 line-through">
                LKR {product.compare_at_price.amount.toLocaleString()}
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            className="focus-ring neon-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition group-hover:shadow-[0_0_28px_rgba(168,85,247,0.42)] disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

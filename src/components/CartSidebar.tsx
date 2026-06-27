import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Gift,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isPersistent?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5141/api/shopping';
const DELIVERY_LOCATION_TYPES = ['house', 'apartment', 'office', 'other'] as const;
type DeliveryLocationType = (typeof DELIVERY_LOCATION_TYPES)[number];

const inputClass =
  'focus-ring w-full rounded-xl border border-violet-300/18 bg-slate-950/45 px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-indigo-200/40 focus:border-violet-300/60';

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, isPersistent = false }) => {
  const { cartItems, updateQuantity, updateCustomMessage, removeFromCart, clearCart, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ orderRef: string; checkoutUrl: string; grandTotal: number; currency: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAnonymous, setSenderAnonymous] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryLocType, setDeliveryLocType] = useState<DeliveryLocationType>('house');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  const deliveryFee = cartItems.length > 0 ? 350 : 0;
  const discountVal = cartItems.length > 0 ? 1000 : 0;
  const grandTotalLkr = Math.max(0, cartTotal + deliveryFee - discountVal);
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        cart: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          icingText: item.custom_message || null,
        })),
        recipient: {
          name: recipientName,
          phone: recipientPhone,
        },
        delivery: {
          address: deliveryAddress,
          city: deliveryCity,
          locationType: deliveryLocType,
          date: deliveryDate,
          instructions: deliveryInstructions || null,
        },
        sender: {
          name: senderName,
          anonymous: senderAnonymous,
        },
        giftMessage: giftMessage || null,
        currency: 'LKR',
        responseFormat: 'json',
      };

      const res = await fetch(`${API_BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setCheckoutResult({
        orderRef: data.order_ref,
        checkoutUrl: data.checkout_url,
        grandTotal: data.summary.grand_total,
        currency: data.summary.currency,
      });
      clearCart();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create checkout session. Verify the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <div className="flex h-full flex-col bg-[#070b1a] text-white">
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-violet-300/16 bg-[#070b1a] px-5">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Your Cart <span className="text-indigo-200/70">({itemCount})</span></h2>
        </div>
        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-indigo-200/55 transition hover:bg-white/10 hover:text-white"
              title="Clear cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-indigo-200/55 transition hover:bg-white/10 hover:text-white"
            title="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {checkoutResult ? (
          <div className="neon-card rounded-2xl p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-200">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-xl font-black text-white">Checkout link ready</h3>
            <p className="mt-2 text-sm leading-6 text-indigo-100/65">Open Kapruka checkout to pay securely and complete the order.</p>
            <div className="mt-5 rounded-xl bg-white/[0.04] p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/45">Order reference</p>
              <p className="mt-1 font-mono text-sm font-black text-white">{checkoutResult.orderRef}</p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/45">Locked total</p>
              <p className="mt-1 text-lg font-black text-white">
                {checkoutResult.currency} {checkoutResult.grandTotal.toLocaleString()}
              </p>
            </div>
            <a
              href={checkoutResult.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring neon-primary mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition"
            >
              Pay with Kapruka
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : !isCheckingOut ? (
          cartItems.length === 0 ? (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300/25 bg-white/[0.04] p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-indigo-200/35" />
              <h3 className="mt-4 text-lg font-black text-white">Your cart is waiting</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-indigo-100/60">Ask the agent to find cakes, flowers, hampers, electronics, or anything on Kapruka.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.product_id} className="rounded-2xl border border-violet-300/16 bg-[#0d1328] p-3 shadow-lg shadow-black/20">
                  <div className="flex gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <Gift className="h-5 w-5 text-indigo-200/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-black leading-5 text-white">{item.name}</h4>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-100 ring-1 ring-violet-300/20">Gift ready</span>
                        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-100 ring-1 ring-cyan-300/20">ETA 2-3 days</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">LKR {item.price.toLocaleString()}</p>
                      <div className="mt-3 flex w-fit items-center rounded-xl border border-violet-300/18 bg-slate-950/35">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10" title="Decrease quantity">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10" title="Increase quantity">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-indigo-200/65 transition hover:bg-white/10 hover:text-white"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <label className="block rounded-2xl border border-violet-300/16 bg-[#0d1328] p-4 shadow-lg shadow-black/20">
                <span className="flex items-center gap-2 text-xs font-semibold text-indigo-100/80">
                  <Gift className="h-4 w-4 text-violet-200" />
                  Add a Special Note
                </span>
                <textarea
                  placeholder="Happy Birthday! Wishing you a beautiful day."
                  value={cartItems[0]?.custom_message || ''}
                  onChange={(event) => {
                    if (cartItems.length > 0) updateCustomMessage(cartItems[0].product_id, event.target.value);
                  }}
                  className="focus-ring mt-3 h-16 w-full resize-none rounded-xl border border-violet-300/14 bg-slate-950/36 p-3 text-sm font-medium text-white outline-none transition placeholder:text-indigo-200/40 focus:border-violet-300/60"
                />
              </label>
            </div>
          )
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {errorMsg && (
              <div className="flex gap-3 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-50">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <section className="neon-card rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200/60">
                <UserIcon className="h-4 w-4 text-violet-200" />
                Sender
              </h3>
              <input className={inputClass} required placeholder="Your name" value={senderName} onChange={(event) => setSenderName(event.target.value)} />
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-indigo-100/70">
                <input type="checkbox" checked={senderAnonymous} onChange={(event) => setSenderAnonymous(event.target.checked)} className="h-4 w-4 accent-rose-600" />
                Show as anonymous on card
              </label>
            </section>

            <section className="neon-card rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200/60">
                <Phone className="h-4 w-4 text-violet-200" />
                Recipient
              </h3>
              <div className="grid gap-3">
                <input className={inputClass} required placeholder="Recipient name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
                <input className={inputClass} required placeholder="Phone number, e.g. 0771234567" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} />
              </div>
            </section>

            <section className="neon-card rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200/60">
                <Truck className="h-4 w-4 text-violet-200" />
                Delivery
              </h3>
              <div className="grid gap-3">
                <input className={inputClass} required placeholder="Street address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} required placeholder="City, e.g. Colombo 03" value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} />
                  <select
                    className={inputClass}
                    value={deliveryLocType}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDeliveryLocType(DELIVERY_LOCATION_TYPES.includes(value as DeliveryLocationType) ? (value as DeliveryLocationType) : 'other');
                    }}
                  >
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <input className={inputClass} type="date" required value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                <input className={inputClass} placeholder="Delivery instructions" value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} />
              </div>
            </section>

            <section className="neon-card rounded-2xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200/60">
                <Gift className="h-4 w-4 text-violet-200" />
                Card message
              </h3>
              <textarea className={`${inputClass} h-24 resize-none`} placeholder="Optional gift message" value={giftMessage} onChange={(event) => setGiftMessage(event.target.value)} />
            </section>

            <button type="submit" disabled={isLoading} className="focus-ring neon-primary flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none">
              <CreditCard className="h-4 w-4" />
              {isLoading ? 'Creating checkout...' : 'Generate secure pay link'}
            </button>
          </form>
        )}
      </main>

      {!checkoutResult && cartItems.length > 0 && (
        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-violet-300/16 bg-[#070b1a]/92 p-4 shadow-[0_-18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-indigo-100/65">
              <span>Subtotal</span>
              <span className="font-bold text-white">LKR {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-indigo-100/65">
              <span>Delivery estimate</span>
              <span className="font-bold text-white">LKR {deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-300">
              <span>Demo discount</span>
              <span className="font-bold">- LKR {discountVal.toLocaleString()}</span>
            </div>
            <div className="my-3 h-px bg-violet-300/16" />
            <div className="flex items-end justify-between">
              <span className="text-base font-semibold text-white">Total <span className="text-sm font-medium text-indigo-200/65">({itemCount} items)</span></span>
              <span className="text-2xl font-black tracking-tight text-white">LKR {grandTotalLkr.toLocaleString()}</span>
            </div>
          </div>

          {!isCheckingOut ? (
            <button onClick={() => setIsCheckingOut(true)} className="focus-ring neon-primary mt-4 flex h-12 w-full items-center justify-center rounded-xl text-sm font-black text-white transition">
              Continue to delivery
            </button>
          ) : (
            <button onClick={() => setIsCheckingOut(false)} className="focus-ring mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-violet-300/18 bg-white/[0.04] text-sm font-black text-indigo-100 transition hover:bg-white/10">
              Back to cart
            </button>
          )}

          <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-200/45">
            <ShieldCheck className="h-4 w-4" />
            Secure checkout powered by Kapruka
          </p>
        </footer>
      )}
    </div>
  );

  if (isPersistent) {
    return <div className="h-full w-full">{renderContent()}</div>;
  }

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative h-full w-full max-w-md shadow-2xl transition ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default CartSidebar;

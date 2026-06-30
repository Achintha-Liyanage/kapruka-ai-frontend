import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Camera,
  Check,
  ChevronRight,
  Gift,
  MapPin,
  Mic,
  Moon,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  User,
  WandSparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { Category, Message, Product } from '../types';
import ProductCarousel from './ProductCarousel';
import CartSidebar from './CartSidebar';
import BotAvatar from './BotAvatar';
import CategoryTicker from './CategoryTicker';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5141/api/shopping';

const getApiErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') return payload.message;
  } catch {
    // The API can return an empty response when it is restarting.
  }

  if (response.status === 429) {
    return 'AI request limit eka danata exceed wela. Tikak passe ayeth try karanna.';
  }

  return 'Kapruka AI service eka danata reach karanna ba. Tikak passe ayeth try karanna.';
};

const HERO_PROMPTS = [
  {
    label: 'Find a birthday cake',
    cmd: 'Find me a chocolate birthday cake under LKR 6000 for delivery in Colombo',
    icon: Gift,
  },
  {
    label: 'Send flowers today',
    cmd: 'Show me rose bouquets that can be delivered today',
    icon: Truck,
  },
  {
    label: 'Track an order',
    cmd: 'Track order VIMP34456CB2',
    icon: PackageSearch,
  },
  {
    label: 'Check delivery',
    cmd: 'Can you deliver to Colombo 03 tomorrow and what is the fee?',
    icon: MapPin,
  },
];

const DISCOVERY_SHORTCUTS = [
  {
    title: 'Birthday cake finder',
    body: 'Chocolate cakes, icing text, and Colombo delivery in one flow.',
    cmd: 'Find me a chocolate birthday cake under LKR 6000 for delivery in Colombo 03',
    icon: Gift,
  },
  {
    title: 'Same-day flowers',
    body: 'Browse bouquets, add a note, and check delivery coverage.',
    cmd: 'Show me rose bouquets that can be delivered today',
    icon: Truck,
  },
  {
    title: 'Delivery checker',
    body: 'Confirm city coverage and delivery fees before checkout.',
    cmd: 'Can you check delivery to Colombo 03?',
    icon: MapPin,
  },
];

const LOADING_STEPS = ['Searching Kapruka...', 'Checking delivery coverage...', 'Finding best offers...'];

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface CityResult {
  name: string;
  aliases?: string[];
}

interface OrderItemResult {
  quantity: number;
  name: string;
  selling_price: number;
}

interface OrderProgressResult {
  timestamp?: string;
  step: string;
}

const getProductResultMessage = (products: Product[], query: string) => {
  if (products.length === 0) {
    return `I could not find matching products for **${query}**. Try a broader category or price range.`;
  }

  const lowestPrice = Math.min(...products.map((product) => product.price.amount));
  const inStockCount = products.filter((product) => product.in_stock).length;

  return `I found **${products.length} Kapruka matches** for **${query}**. ${inStockCount} are marked in stock, with options from **LKR ${lowestPrice.toLocaleString()}**.`;
};

const getSuggestionIcon = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('birthday') || lower.includes('cake')) return '🎂';
  if (lower.includes('delivery')) return '🚚';
  if (lower.includes('rose') || lower.includes('flower')) return '🌹';
  if (lower.includes('gift') || lower.includes('message')) return '🎁';
  return '✨';
};

const UserAvatar: React.FC = () => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-300/30 bg-violet-500/20 text-white shadow-sm shadow-violet-950/40">
    <User className="h-4 w-4" />
  </div>
);

const KaprukaLogo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="neon-primary flex h-11 w-11 items-center justify-center rounded-xl text-white">
      <ShoppingBag className="h-5 w-5" />
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="text-base font-black tracking-tight text-white">Kapruka AI</span>
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100 ring-1 ring-violet-300/30">
          Live MCP
        </span>
      </div>
      <p className="text-xs font-medium text-indigo-200/70">Sri Lanka's shopping concierge</p>
    </div>
  </div>
);

const parseInline = (text: string) => {
  let parts: React.ReactNode[] = [text];

  const processParts = (
    regex: RegExp,
    formatter: (content: string, index: number) => React.ReactNode
  ) => {
    const nextParts: React.ReactNode[] = [];

    parts.forEach((part) => {
      if (typeof part !== 'string') {
        nextParts.push(part);
        return;
      }

      let lastIndex = 0;
      regex.lastIndex = 0;
      let match;

      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          nextParts.push(part.substring(lastIndex, match.index));
        }
        nextParts.push(formatter(match[1], match.index));
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < part.length) {
        nextParts.push(part.substring(lastIndex));
      }
    });

    parts = nextParts;
  };

  processParts(/\*\*(.*?)\*\*/g, (content, idx) => (
    <strong key={`bold-${idx}`} className="font-extrabold text-white">
      {content}
    </strong>
  ));

  processParts(/`(.*?)`/g, (content, idx) => (
    <code key={`code-${idx}`} className="rounded-md bg-violet-500/20 px-1.5 py-0.5 font-mono text-[11px] text-violet-100">
      {content}
    </code>
  ));

  processParts(/\*(.*?)\*/g, (content, idx) => (
    <em key={`italic-${idx}`} className="font-medium italic text-indigo-100">
      {content}
    </em>
  ));

  return parts;
};

const renderFormattedMessage = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  const listItems: React.ReactNode[] = [];
  let inList = false;

  const flushList = (idx: number | string) => {
    if (!inList || listItems.length === 0) return;
    elements.push(
      <ul key={`list-${idx}`} className="my-3 space-y-2">
        {[...listItems]}
      </ul>
    );
    listItems.length = 0;
    inList = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      elements.push(<div key={`space-${idx}`} className="h-1" />);
      return;
    }

    const listMatch = line.match(/^(\s*[-*•]\s+)(.*)/);
    if (listMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
          <span className="text-indigo-100">{parseInline(listMatch[2])}</span>
        </li>
      );
      return;
    }

    flushList(idx);

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${idx}`} className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
          {parseInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="mt-4 text-base font-black text-white">
          {parseInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="mt-4 text-lg font-black text-white">
          {parseInline(trimmed.substring(2))}
        </h2>
      );
    } else {
      elements.push(
        <p key={`p-${idx}`} className="text-sm leading-relaxed text-indigo-100">
          {parseInline(line)}
        </p>
      );
    }
  });

  flushList('final');
  return elements;
};

export const ChatInterface: React.FC = () => {
  const { cartItems, addToCart, cartCount } = useCart();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = window.localStorage.getItem('kapruka-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text:
        'Ayubowan! I can search Kapruka products, check delivery coverage, track orders, and help you build a gift-ready cart.\n\nTell me what you need in English, Sinhala, or Singlish. Try: **"birthday cake for my mother in Colombo 03"** or **"roses with same-day delivery"**.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartPopping, setIsCartPopping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionLang, setRecognitionLang] = useState<'si-LK' | 'en-US'>('si-LK');
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const prevCartLength = useRef(cartItems.length);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('kapruka-theme', theme);
  }, [theme]);

  const checkoutStep = useMemo(() => {
    const hasCheckoutAction = messages.some(
      (m) =>
        m.text.toLowerCase().includes('checkout') ||
        m.text.includes('ORD-') ||
        m.text.includes('checkout_url') ||
        m.text.includes('token=')
    );
    if (hasCheckoutAction) return 'pay';
    if (isCartOpen) return 'cart';
    return 'discover';
  }, [isCartOpen, messages]);

  useEffect(() => {
    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = recognitionLang;
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [recognitionLang]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (cartItems.length > prevCartLength.current) {
      setIsCartPopping(true);
      const timer = window.setTimeout(() => setIsCartPopping(false), 420);
      prevCartLength.current = cartItems.length;
      return () => window.clearTimeout(timer);
    }
    prevCartLength.current = cartItems.length;
  }, [cartItems.length]);

  const addMessage = (
    sender: 'user' | 'agent',
    text: string,
    type: Message['type'] = 'text',
    extra?: Partial<Message>
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender,
        text,
        timestamp: new Date(),
        type,
        ...extra,
      },
    ]);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleToggleLang = () => {
    const nextLang = recognitionLang === 'si-LK' ? 'en-US' : 'si-LK';
    setRecognitionLang(nextLang);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      window.setTimeout(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        recognition.lang = nextLang;
        recognition.start();
        setIsListening(true);
      }, 250);
    }
  };

  const getContextSuggestions = () => {
    const lowerInput = inputText.toLowerCase();

    if (cartItems.length > 0) {
      return [
        { label: 'Find birthday cake', cmd: 'Find birthday cakes under LKR 6000' },
        { label: 'Check delivery fee', cmd: 'Can you check delivery to Colombo 03?' },
        { label: 'Gift message help', cmd: 'How can I add a gift card message?' },
      ];
    }

    if (lowerInput.includes('cake') || lowerInput.includes('birthday')) {
      return [
        { label: 'Chocolate cakes', cmd: 'Search for chocolate birthday cakes' },
        { label: 'Icing message', cmd: 'How do I add icing text to my cake?' },
        { label: 'Earliest delivery', cmd: 'What is the earliest delivery date for cakes?' },
      ];
    }

    if (lowerInput.includes('flower') || lowerInput.includes('rose')) {
      return [
        { label: 'Red roses', cmd: 'Search for red roses' },
        { label: 'Greeting card', cmd: 'Can I include a gift card message with the flowers?' },
        { label: 'Same day', cmd: 'Can flowers be delivered today to Colombo?' },
      ];
    }

    return [
      { label: 'Birthday cake under LKR 6000', cmd: 'Find birthday cakes under LKR 6000' },
      { label: 'Luxury gift box', cmd: 'Show me premium gift boxes' },
      { label: 'Delivery fee', cmd: 'What is the delivery fee to Colombo 03?' },
    ];
  };

  const handleCommand = async (input: string) => {
    const text = input.trim();
    if (!text || isLoading) return;

    const historyPayload = messages
      .filter((message) => message.id !== 'welcome' && message.type !== 'error')
      .slice(-10)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'model',
        text: message.text,
      }));

    addMessage('user', text);
    setInputText('');
    setIsLoading(true);

    try {
      if (text.startsWith('/')) {
        if (text.startsWith('/search ')) {
          const query = text.substring(8);
          const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const data = await res.json();
          const productsList: Product[] = data.results || [];

          addMessage('agent', getProductResultMessage(productsList, query), productsList.length ? 'products' : 'text', {
            products: productsList,
          });
        } else if (text.startsWith('/product ')) {
          const prodId = text.substring(9);
          const res = await fetch(`${API_BASE}/product/${prodId}?responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const prod: Product = await res.json();
          addMessage('agent', `Here are the details for **${prod.name}**.`, 'products', { products: [prod] });
        } else if (text === '/categories') {
          const res = await fetch(`${API_BASE}/categories?depth=2&responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const data = await res.json();
          const categoriesList: Category[] = data.categories || [];
          addMessage('agent', 'Here are the Kapruka shopping departments.', 'categories', { categories: categoriesList });
        } else if (text.startsWith('/cities ')) {
          const cityQuery = text.substring(8);
          const res = await fetch(`${API_BASE}/cities?query=${encodeURIComponent(cityQuery)}&responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const data = await res.json();
          const cityTexts = ((data.cities || []) as CityResult[])
            .map((c) => `- **${c.name}** ${c.aliases?.length ? `(aliases: ${c.aliases.join(', ')})` : ''}`)
            .join('\n');
          addMessage('agent', `Found ${data.total_matched} cities matching **${cityQuery}**:\n\n${cityTexts}`);
        } else if (text.startsWith('/delivery ')) {
          const cityName = text.substring(10);
          const res = await fetch(`${API_BASE}/delivery-check?city=${encodeURIComponent(cityName)}&responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const data = await res.json();

          if (data.available) {
            addMessage(
              'agent',
              `Delivery is **available** to **${data.city}**.\n\n- Flat rate: **LKR ${data.rate.toLocaleString()}**\n- Checked date: ${data.checked_date}`
            );
          } else {
            addMessage(
              'agent',
              `Delivery is not available to **${cityName}** on this date.\n\n- Reason: ${data.reason || 'None'}\n- Next available date: **${data.next_available_date || 'N/A'}**`
            );
          }
        } else if (text.startsWith('/track ')) {
          const orderNo = text.substring(7);
          const res = await fetch(`${API_BASE}/order-track/${orderNo}?responseFormat=json`);
          if (!res.ok) throw new Error(await getApiErrorMessage(res));
          const data = await res.json();
          const itemRows = (data.items as OrderItemResult[])
            .map((it) => `- ${it.quantity}x ${it.name} - LKR ${it.selling_price.toLocaleString()}`)
            .join('\n');
          const progressRows = (data.progress as OrderProgressResult[])
            .map((p) => `- [${p.timestamp || 'Pending'}] ${p.step}`)
            .join('\n');

          addMessage(
            'agent',
            `## Order Track - ${orderNo}\n\n- Status: **${data.status_display}**\n- Amount: **LKR ${parseFloat(data.amount).toLocaleString()}**\n- Date placed: ${data.order_date}\n- Target delivery: ${data.delivery_date}\n- Recipient: **${data.recipient.name}**\n- Address: ${data.recipient.address}, ${data.recipient.city}\n\n### Items Ordered\n${itemRows}\n\n### Delivery Timeline\n${progressRows}`
          );
        } else {
          addMessage('agent', 'I did not recognise that command. Try `/search roses`, `/categories`, `/delivery Colombo 03`, or chat naturally.');
        }
      } else {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: historyPayload }),
        });

        if (!res.ok) throw new Error(await getApiErrorMessage(res));

        const chatResponse = await res.json();
        const agentReply = chatResponse.text;
        const toolCalled = chatResponse.toolCalled;
        const toolResult = chatResponse.toolResult;

        if (toolCalled === 'kapruka_search_products' && toolResult?.results) {
          const products = toolResult.results as Product[];
          addMessage('agent', getProductResultMessage(products, text), 'products', { products });
        } else if (toolCalled === 'kapruka_get_product' && toolResult) {
          const product = toolResult as Product;
          addMessage(
            'agent',
            `Here is the product card for **${product.name}**. You can add it to cart or open the product page for more details.`,
            'products',
            { products: [product] }
          );
        } else if (toolCalled === 'kapruka_list_categories' && toolResult?.categories) {
          addMessage('agent', agentReply, 'categories', { categories: toolResult.categories });
        } else {
          addMessage('agent', agentReply);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addMessage('agent', `Sorry, ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`app-grid-bg relative flex h-screen w-full overflow-hidden font-sans text-white ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className="app-ambient pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />

      <section className="neon-panel relative z-10 m-3 hidden w-[18rem] shrink-0 flex-col rounded-2xl px-4 py-5 backdrop-blur-xl xl:flex 2xl:w-[19rem]">
        <KaprukaLogo />

        <div className="mt-5 rounded-2xl border border-violet-300/18 bg-white/[0.035] p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Competition demo</p>
          <h1 className="mt-2 text-2xl font-black leading-none tracking-tight text-white">AI Shopping Agent</h1>
          <p className="mt-2 text-xs leading-5 text-indigo-100/65">Gift discovery, local delivery checks, cart building, and checkout.</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">AI retail workflow</p>
          <h2 className="mt-2 text-lg font-black leading-tight tracking-tight text-white">
            Discover, deliver, and delight.
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-indigo-100/65">
            Search Kapruka products, check delivery, track orders, and build a gift-ready cart through MCP.
          </p>
        </div>

        <div className="mt-4 grid gap-2.5">
          {HERO_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.label}
                onClick={() => handleCommand(prompt.cmd)}
                className="group flex items-center justify-between rounded-xl border border-violet-300/18 bg-white/[0.04] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-violet-500/12 hover:shadow-lg hover:shadow-violet-950/20"
              >
                <span className="flex items-center gap-3">
                  <span className="neon-primary flex h-9 w-9 items-center justify-center rounded-lg text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-white">{prompt.label}</span>
                    <span className="block text-xs text-indigo-200/60">Start a demo flow</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-indigo-200/50 transition group-hover:translate-x-1 group-hover:text-violet-200" />
              </button>
            );
          })}
        </div>

        <div className="mt-auto rounded-xl border border-violet-300/18 bg-white/[0.04] p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Native Kapruka tools</p>
              <p className="text-xs leading-5 text-indigo-200/60">Search, delivery, checkout, and tracking through MCP.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="theme-header mx-3 mt-3 flex h-[4.5rem] shrink-0 items-center justify-between rounded-2xl border border-violet-300/18 bg-slate-950/58 px-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="xl:hidden">
            <KaprukaLogo />
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-violet-300/20 bg-white/[0.04] px-2 py-1 text-xs font-bold text-indigo-200/70 shadow-sm md:flex xl:flex">
            {[
              ['discover', 'Discover'],
              ['cart', 'Cart'],
              ['delivery', 'Delivery'],
              ['pay', 'Pay'],
            ].map(([key, label], idx) => (
              <React.Fragment key={key}>
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${checkoutStep === key ? 'neon-primary text-white shadow-sm' : ''}`}>
                  {checkoutStep === key ? <Check className="h-3 w-3" /> : <span className="text-indigo-200/45">{idx + 1}</span>}
                  {label}
                </span>
                {idx < 3 && <ChevronRight className="h-3 w-3 text-indigo-200/30" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="theme-toggle focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-violet-300/20 bg-white/[0.04] text-indigo-100 shadow-sm transition hover:border-violet-300/50 hover:text-white"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleCommand('Show me all Kapruka shopping categories')}
              className="focus-ring hidden items-center gap-2 rounded-full border border-violet-300/20 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-indigo-100 shadow-sm transition hover:border-violet-300/50 hover:text-white sm:flex"
            >
              <Search className="h-4 w-4" />
              Explore
            </button>
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={`focus-ring relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold shadow-sm transition ${
                isCartPopping
                  ? 'neon-primary scale-105 text-white'
                  : 'border border-violet-300/20 bg-white/[0.04] text-indigo-100 hover:border-violet-300/50'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] text-white ring-2 ring-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col">
            <div ref={chatContainerRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`flex max-w-[94%] items-start gap-3 ${
                      message.sender === 'user'
                        ? 'flex-row-reverse sm:max-w-[72%]'
                        : message.type === 'products'
                          ? 'sm:max-w-[96%]'
                          : 'sm:max-w-[82%]'
                    }`}
                  >
                    {message.sender === 'user' ? <UserAvatar /> : <BotAvatar />}

                    <div className={`min-w-0 ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                      <div
                        className={`chat-glass rounded-2xl px-5 py-4 ${
                          message.sender === 'user'
                            ? 'user-message rounded-tr-md text-white'
                            : message.type === 'error'
                              ? 'rounded-tl-md border-rose-400/40 bg-rose-500/10 text-rose-50'
                              : 'rounded-tl-md text-indigo-100'
                        }`}
                      >
                        <div className={`space-y-2 select-text ${message.sender === 'user' ? '[&_p]:text-white [&_strong]:text-white' : ''}`}>
                          {renderFormattedMessage(message.text)}
                        </div>
                      </div>

                      {message.type === 'products' && message.products && (
                        <ProductCarousel
                          products={message.products}
                          onAddToCart={(item) => {
                            addToCart({ ...item, currency: 'LKR' });
                            setIsCartOpen(true);
                          }}
                        />
                      )}

                      {message.type === 'categories' && message.categories && (
                        <div className="grid w-full gap-3 rounded-2xl border border-violet-300/18 bg-slate-950/65 p-4 shadow-sm sm:grid-cols-2">
                          {message.categories.slice(0, 8).map((category) => (
                            <button
                              key={category.name}
                              onClick={() => handleCommand(`Show me ${category.name}`)}
                              className="rounded-xl border border-violet-300/18 bg-white/[0.04] p-3 text-left transition hover:border-violet-300/50 hover:bg-violet-500/10"
                            >
                              <span className="block text-sm font-black text-white">{category.name}</span>
                              {category.children && (
                                <span className="mt-1 block truncate text-xs text-indigo-200/60">
                                  {category.children.slice(0, 3).map((child) => child.name).join(', ')}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="px-1 text-[10px] font-semibold text-indigo-200/45">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-xl items-start gap-3">
                    <BotAvatar />
                    <div className="chat-glass rounded-2xl rounded-tl-md px-5 py-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                        <WandSparkles className="h-4 w-4 animate-pulse" />
                        Agent thinking
                      </div>
                      <div className="space-y-2.5">
                        {LOADING_STEPS.map((step, index) => (
                          <div key={step} className="flex items-center gap-2 text-sm font-semibold text-indigo-100/75">
                            <span
                              className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.75)]"
                              style={{ animation: `loadingPulse 1.4s ease-in-out ${index * 0.18}s infinite` }}
                            />
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !isLoading && (
                <div className="ml-12 grid max-w-5xl gap-4 md:grid-cols-3 xl:max-w-4xl 2xl:max-w-5xl">
                  {DISCOVERY_SHORTCUTS.map((shortcut) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.title}
                        onClick={() => handleCommand(shortcut.cmd)}
                        className="glass-card group rounded-2xl p-4 text-left transition hover:-translate-y-1"
                      >
                        <span className="neon-primary mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="block text-sm font-black text-white">{shortcut.title}</span>
                        <span className="mt-2 block text-xs leading-5 text-indigo-100/65">{shortcut.body}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <footer className="theme-footer mx-3 mb-3 shrink-0 rounded-2xl border border-violet-300/18 bg-slate-950/50 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-6 lg:px-10">
              <div className="-mx-2 mb-1 flex gap-2 overflow-x-auto px-2 pb-3 pt-2">
                {getContextSuggestions().map((suggestion) => (
                  <button
                    key={suggestion.label}
                    onClick={() => handleCommand(suggestion.cmd)}
                    className="suggestion-chip focus-ring shrink-0 rounded-full px-3.5 py-2 text-xs font-bold text-indigo-100 transition"
                  >
                    <span className="mr-1.5">{getSuggestionIcon(suggestion.label)}</span>
                    {suggestion.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCommand(inputText);
                }}
                className="ai-input-glass flex items-center gap-3 rounded-2xl p-2"
              >
                <button
                  type="button"
                  onClick={() => handleCommand('Show me Kapruka AI shopping tools')}
                  className="focus-ring neon-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                  title="AI shopping tools"
                >
                  <Sparkles className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="Ask Kapruka AI..."
                  className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-white outline-none placeholder:text-indigo-200/45"
                />

                {isListening && (
                  <button
                    type="button"
                    onClick={handleToggleLang}
                    className="hidden rounded-full bg-violet-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-violet-100 sm:block"
                  >
                    {recognitionLang === 'si-LK' ? 'Sinhala' : 'English'}
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button type="button" className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-indigo-200/60 transition hover:bg-white/10 hover:text-white" title="Attach product photo">
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`focus-ring flex h-10 w-10 items-center justify-center rounded-full transition ${
                      isListening ? 'bg-violet-500/20 text-violet-100' : 'text-indigo-200/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak message'}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    className="focus-ring neon-primary flex h-10 w-10 items-center justify-center rounded-full text-white transition disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                    title="Send"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </footer>
          </main>

          <aside className="relative my-3 mr-3 hidden w-[18rem] shrink-0 overflow-hidden rounded-2xl xl:block 2xl:w-[23rem]">
            <CategoryTicker onCategorySelect={handleCommand} />
          </aside>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-30 flex justify-end transition ${
          isCartOpen ? 'bg-[rgba(5,7,18,0.72)] opacity-100 backdrop-blur-[14px]' : 'pointer-events-none opacity-0'
        }`}
      >
        {isCartOpen && <div className="absolute inset-0 cursor-pointer" onClick={() => setIsCartOpen(false)} />}
        <div
          className={`theme-cart-shell relative h-full w-[90%] max-w-md border-l border-violet-300/18 bg-[#070b1a] shadow-2xl transition duration-300 ${
            isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <CartSidebar isPersistent isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

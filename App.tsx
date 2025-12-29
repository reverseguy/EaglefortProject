
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User as UserIcon, LogOut, ChevronLeft, Trash2, Shield, Ghost, Zap, Hand, Activity, Eye, Bot, Plus, Minus, Send, ArrowRight } from 'lucide-react';
import { Product, User, Order, CartItem } from './types';
import { PRODUCTS } from './constants';
import { GoogleGenAI } from '@google/genai';

// --- Contexts ---
interface StoreContextType {
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  addToCart: (product: Product) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  login: (email: string, name: string) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// --- Components ---

const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-[#0b0c10]">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: 'radial-gradient(circle, #00d2ff 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }}>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-[#00d2ff]/5"></div>
    </div>
  );
};

const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input')) setIsHovering(true);
      else setIsHovering(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
    };
  }, []);

  return (
    <div className="hidden md:block pointer-events-none z-[9999]">
      <div className={`fixed w-2 h-2 bg-[#00d2ff] rounded-full shadow-[0_0_10px_#00d2ff] transition-transform duration-200 ${isHovering ? 'scale-150' : ''}`}
           style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}></div>
      <div className={`fixed border border-[#00d2ff]/40 rounded-full transition-all duration-300 ease-out ${isHovering ? 'w-16 h-16 border-[#00d2ff]' : 'w-10 h-10'}`}
           style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}></div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { cart, user } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed top-0 left-0 w-full px-6 md:px-12 py-8 flex justify-between items-center z-50 backdrop-blur-xl border-b border-white/5 bg-black/40">
        <Link to="/" className="text-2xl font-bold tracking-[0.2em] text-white oswald uppercase flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00d2ff] cyber-clip"></div>
          Eagle Fort
        </Link>
        <div className="flex items-center gap-8">
          <button onClick={() => setIsSearchOpen(true)} className="hover:text-[#00d2ff] transition-colors hidden md:block">
            <Search size={20} />
          </button>
          <button onClick={() => navigate('/cart')} className="relative group flex items-center gap-2">
            <ShoppingBag size={22} className="group-hover:text-[#00d2ff] transition-colors" />
            <span className="oswald text-xs hidden lg:block uppercase tracking-widest mt-1">Loadout</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-[#00d2ff] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="hover:text-[#00d2ff] transition-colors flex items-center gap-2">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center justify-center px-6 backdrop-blur-3xl">
          <button onClick={() => setIsSearchOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={32} /></button>
          <div className="w-full max-w-2xl">
            <h2 className="oswald text-xs uppercase tracking-[0.4em] text-[#00d2ff] mb-4">Neural Search Alpha</h2>
            <div className="relative">
              <input 
                autoFocus 
                type="text" 
                placeholder="ENTER SEQUENCE..." 
                className="w-full bg-transparent border-b-2 border-[#00d2ff]/30 text-4xl oswald uppercase outline-none focus:border-[#00d2ff] transition-colors py-4"
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-[#00d2ff]/30" size={32} />
            </div>
            <div className="mt-8 flex gap-4 flex-wrap">
              {['Outerwear', 'Footwear', 'Limited', 'Archived'].map(tag => (
                <button key={tag} className="text-xs oswald border border-white/10 px-4 py-2 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-all">#{tag.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-[#00d2ff] transition-colors">
          <X size={40} />
        </button>
        <div className="h-full flex flex-col justify-center items-center gap-12 text-center">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="oswald text-6xl md:text-8xl hover:text-[#00d2ff] transition-all uppercase tracking-tighter hover:skew-x-2">Index</Link>
          <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="oswald text-6xl md:text-8xl hover:text-[#00d2ff] transition-all uppercase tracking-tighter hover:skew-x-2">Drops</Link>
          <Link to={user ? "/account" : "/auth"} onClick={() => setIsMenuOpen(false)} className="oswald text-6xl md:text-8xl hover:text-[#00d2ff] transition-all uppercase tracking-tighter hover:skew-x-2">
            {user ? "Identity" : "Decrypt"}
          </Link>
          <div className="mt-12 w-full max-w-sm px-6">
            <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-5 bg-[#00d2ff] text-black font-bold oswald text-xl cyber-clip hover:bg-white transition-colors tracking-widest">
              INITIALIZE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

const IconMapper: React.FC<{ name: string; size?: number }> = ({ name, size = 24 }) => {
  switch (name) {
    case 'Shield': return <Shield size={size} />;
    case 'Ghost': return <Ghost size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Hand': return <Hand size={size} />;
    case 'Activity': return <Activity size={size} />;
    case 'Eye': return <Eye size={size} />;
    default: return <Shield size={size} />;
  }
};

// --- Pages ---

const Home: React.FC = () => {
  return (
    <div className="pt-32">
      {/* Hero */}
      <section className="min-h-screen px-6 md:px-12 flex flex-col justify-center items-start relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-[#00d2ff]/10 -z-10"></div>
        <div className="absolute top-1/2 left-1/4 w-px h-full bg-[#00d2ff]/10 -z-10"></div>
        <h1 className="text-[14vw] leading-[0.85] oswald uppercase font-bold text-white tracking-tighter glitch-text">
          Eagle <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #00d2ff' }}>Fort</span>
        </h1>
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center gap-8">
          <p className="max-w-md text-white/50 mono text-sm leading-relaxed uppercase tracking-widest">
            High-performance modular gear for the urban operative. Designed in the void, forged for the sprawl.
          </p>
          <Link to="/shop" className="group px-10 py-5 bg-[#00d2ff] text-black oswald font-bold tracking-[0.3em] cyber-clip hover:bg-white transition-all flex items-center gap-4">
            ENTER ARMORY <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-40 bg-white/5 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
             <div className="absolute -top-10 -left-10 text-[10rem] oswald text-white/5 font-bold select-none">01</div>
             <h2 className="oswald text-6xl uppercase tracking-tighter mb-8 leading-none">The Core <br /> Protocol</h2>
             <p className="text-xl text-white/60 leading-relaxed font-light italic">
               "We believe style is a defensive layer. In an age of total surveillance, anonymity is the ultimate luxury."
             </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-black/40 border border-white/10 cyber-clip">
              <Zap className="text-[#00d2ff] mb-4" />
              <h4 className="oswald text-xl uppercase mb-2">Neural Link</h4>
              <p className="text-xs text-white/40 mono uppercase">Adaptive fit technology</p>
            </div>
            <div className="p-8 bg-black/40 border border-white/10 cyber-clip mt-12">
              <Shield className="text-[#00d2ff] mb-4" />
              <h4 className="oswald text-xl uppercase mb-2">Ghost Fabric</h4>
              <p className="text-xs text-white/40 mono uppercase">Infrared signal jamming</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Drops Slider (Simplified Grid) */}
      <section className="py-32 px-6 md:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="text-[#00d2ff] oswald text-xs uppercase tracking-[0.5em] mb-2 block">Available Stock</span>
            <h2 className="oswald text-6xl uppercase tracking-tighter">Current Phase</h2>
          </div>
          <Link to="/shop" className="oswald text-[#00d2ff] hover:text-white transition-colors uppercase tracking-[0.3em] flex items-center gap-2">Explore All <ChevronLeft className="rotate-180" size={16} /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRODUCTS.slice(0, 4).map(product => (
            <Link key={product.id} to={`/product/${product.id}`} className="group relative block cyber-border p-8 bg-black/20 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
              <div className="absolute top-6 right-6 z-10 bg-[#00d2ff] text-black text-[9px] font-bold px-3 py-1 uppercase mono">{product.tag}</div>
              <div className="h-64 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 relative z-10">
                <IconMapper name={product.icon} size={80} />
              </div>
              <div className="relative z-10 mt-6">
                <h3 className="oswald text-2xl uppercase tracking-tight">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#00d2ff] font-bold oswald text-lg">${product.price}</span>
                  <span className="text-white/20 mono text-[10px] uppercase">{product.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const Shop: React.FC = () => {
  const { addToCart } = useStore();
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];

  const filtered = filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="pt-40 px-6 md:px-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
             <h1 className="oswald text-7xl uppercase tracking-tighter mb-4">Neural Grid</h1>
             <p className="text-white/40 mono text-xs uppercase tracking-[0.4em]">FILTERING MODULE ACTIVE // ALL SYSTEMS GO</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`px-8 py-3 oswald uppercase tracking-widest text-[10px] border transition-all cyber-clip ${filter === cat ? 'bg-[#00d2ff] text-black border-[#00d2ff]' : 'border-white/10 hover:border-white/30 text-white/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <div key={product.id} className="group relative flex flex-col bg-white/5 p-8 rounded-sm border border-white/5 hover:border-[#00d2ff]/40 transition-all hover:-translate-y-2">
              <Link to={`/product/${product.id}`} className="flex-1">
                <div className="relative h-72 flex items-center justify-center bg-black/40 mb-8 overflow-hidden cyber-clip">
                  <div className="absolute top-4 right-4 bg-[#00d2ff] text-black text-[9px] font-bold px-2 py-1 uppercase mono z-20">{product.tag}</div>
                  <div className="text-white/5 group-hover:text-[#00d2ff]/20 transition-colors">
                    <IconMapper name={product.icon} size={100} />
                  </div>
                </div>
                <h3 className="oswald text-3xl uppercase mb-2 tracking-tight group-hover:text-[#00d2ff] transition-colors">{product.name}</h3>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[#00d2ff] oswald text-xl font-bold">${product.price.toFixed(2)}</p>
                  <span className="text-[10px] text-white/30 mono">REF: {product.id}</span>
                </div>
              </Link>
              <button 
                onClick={() => addToCart(product)}
                className="w-full py-4 bg-white/5 hover:bg-[#00d2ff] hover:text-black transition-all font-bold oswald uppercase tracking-widest text-sm border border-white/10 hover:border-transparent"
              >
                Add to Loadout
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { id } = useParams(); // FIXED: Using useParams correctly
  const product = PRODUCTS.find(p => p.id === id);
  const { addToCart } = useStore();
  const [size, setSize] = useState('M');
  const navigate = useNavigate();

  if (!product) return (
    <div className="pt-60 text-center">
      <h2 className="oswald text-4xl mb-8">PRODUCT DE-REZZED</h2>
      <button onClick={() => navigate('/shop')} className="oswald text-[#00d2ff] border border-[#00d2ff] px-8 py-3 uppercase tracking-widest hover:bg-[#00d2ff] hover:text-black transition-all">Return to shop</button>
    </div>
  );

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 uppercase oswald text-xs tracking-widest">
        <ChevronLeft size={16} /> Back to grid
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="aspect-[4/5] bg-black/40 border border-white/10 flex items-center justify-center relative cyber-clip group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00d2ff]/5 to-transparent"></div>
          <IconMapper name={product.icon} size={200} />
          <div className="absolute bottom-10 left-10 p-6 bg-black/60 backdrop-blur-xl border border-white/10 cyber-clip">
            <span className="oswald text-[10px] tracking-[0.4em] text-[#00d2ff] block mb-1">UNIT IDENTIFIER</span>
            <div className="text-2xl font-bold oswald tracking-widest">{product.id}</div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-[#00d2ff]/10 text-[#00d2ff] mono text-[10px] font-bold border border-[#00d2ff]/20 uppercase">GEN-5 PROTOCOL</span>
            <span className="text-white/30 mono text-[10px] uppercase">Category: {product.category}</span>
          </div>
          <h1 className="oswald text-8xl uppercase mb-8 leading-[0.9] tracking-tighter glitch-text">{product.name}</h1>
          <div className="text-5xl oswald text-[#00d2ff] mb-12 shadow-[0_0_30px_rgba(0,210,255,0.1)] inline-block w-fit">${product.price.toFixed(2)}</div>
          
          <div className="p-8 bg-white/5 border border-white/10 rounded-sm mb-12">
            <p className="text-white/60 text-lg leading-relaxed font-light">{product.description}</p>
          </div>

          <div className="mb-12">
            <h4 className="oswald uppercase tracking-[0.4em] text-xs text-white/40 mb-6">Configuration (Alpha-Set)</h4>
            <div className="flex gap-4">
              {['S', 'M', 'L', 'XL', '2XL'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setSize(s)}
                  className={`w-16 h-16 flex items-center justify-center border oswald text-lg transition-all ${size === s ? 'bg-[#00d2ff] text-black border-[#00d2ff] scale-110 shadow-[0_0_20px_rgba(0,210,255,0.4)]' : 'border-white/10 hover:border-[#00d2ff] hover:text-[#00d2ff]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => addToCart(product)} className="flex-1 py-6 bg-[#00d2ff] text-black font-bold oswald text-xl uppercase tracking-widest cyber-clip hover:bg-white transition-all">
              Initialize Loading
            </button>
            <button className="flex-1 py-6 border border-white/10 hover:border-[#00d2ff] font-bold oswald text-xl uppercase tracking-widest transition-all text-white/60 hover:text-white">
              Save To Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } = useStore();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="pt-40 px-6 md:px-12 max-w-5xl mx-auto pb-20 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <h1 className="oswald text-7xl uppercase tracking-tighter">Current Loadout</h1>
          <p className="text-[#00d2ff] mono text-xs uppercase tracking-[0.4em] mt-2">Active items in your operational buffer</p>
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-red-400 hover:text-red-500 text-xs oswald uppercase tracking-widest flex items-center gap-2 border border-red-400/20 px-4 py-2 hover:bg-red-400/5 transition-all">
            <Trash2 size={14} /> Clear Buffer
          </button>
        )}
      </div>

      <div className="space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-white/10 bg-white/5 rounded-sm">
            <Bot size={64} className="mx-auto text-white/10 mb-8" />
            <p className="text-white/40 oswald text-2xl uppercase tracking-widest mb-12">No gear detected in system.</p>
            <Link to="/shop" className="oswald text-[#00d2ff] border border-[#00d2ff] px-10 py-4 uppercase tracking-[0.3em] hover:bg-[#00d2ff] hover:text-black transition-all inline-block">← Re-arm here</Link>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-black/40 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-24 h-24 bg-white/5 rounded-sm flex items-center justify-center shrink-0 border border-white/10">
                <IconMapper name={item.icon} size={40} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="oswald text-3xl uppercase group-hover:text-[#00d2ff] transition-colors">{item.name}</h3>
                <p className="text-white/30 mono text-xs uppercase tracking-widest">SPEC: {item.id} // CONFIG: STANDARD</p>
              </div>
              <div className="flex items-center gap-6 border border-white/10 px-4 py-2 bg-black/60">
                 <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-[#00d2ff] transition-colors"><Minus size={18}/></button>
                 <span className="oswald text-xl w-6 text-center">{item.quantity}</span>
                 <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-[#00d2ff] transition-colors"><Plus size={18}/></button>
              </div>
              <div className="text-right flex flex-col items-center sm:items-end gap-2">
                <div className="oswald text-2xl text-white">${(item.price * item.quantity).toFixed(2)}</div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 transition-colors uppercase oswald text-[10px] tracking-widest">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-8 bg-white/5 border border-white/10">
             <h4 className="oswald text-xs uppercase tracking-[0.5em] text-[#00d2ff] mb-6">Operational Notes</h4>
             <textarea className="w-full bg-transparent border border-white/10 p-4 h-32 outline-none focus:border-[#00d2ff] transition-colors mono text-xs uppercase text-white/40" placeholder="ENTER MISSION SPECIFIC DELIVERY INSTRUCTIONS..."></textarea>
          </div>
          <div className="p-8 bg-[#00d2ff]/10 border border-[#00d2ff]/30 backdrop-blur-3xl">
            <div className="flex justify-between items-center mb-12">
              <span className="oswald text-2xl uppercase tracking-widest">Total Credits</span>
              <span className="oswald text-5xl text-[#00d2ff] shadow-[0_0_40px_rgba(0,210,255,0.2)]">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full py-6 bg-[#00d2ff] text-black font-bold oswald text-2xl uppercase tracking-widest cyber-clip hover:bg-white transition-all shadow-xl"
            >
              Confirm Deployment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Auth / Account (Simplified for now) ---

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login('agent@eaglefort.net', 'OPERATIVE');
    navigate('/account');
  };

  return (
    <div className="pt-60 px-6 flex justify-center items-center">
      <div className="w-full max-w-md p-12 bg-black/60 border border-white/10 cyber-clip relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00d2ff]/5 -rotate-45 translate-x-12 -translate-y-12"></div>
        <h1 className="oswald text-5xl uppercase mb-12 tracking-tighter text-center">
          {isLogin ? "Authenticate" : "Apply Access"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="space-y-2">
             <label className="block mono text-[10px] uppercase text-[#00d2ff] tracking-widest">Comms Interface</label>
             <input type="email" required className="w-full bg-white/5 border border-white/10 px-6 py-4 outline-none focus:border-[#00d2ff] transition-all" placeholder="AGENT_NAME@FORT.NET" />
           </div>
           <div className="space-y-2">
             <label className="block mono text-[10px] uppercase text-[#00d2ff] tracking-widest">Neural Encryption</label>
             <input type="password" required className="w-full bg-white/5 border border-white/10 px-6 py-4 outline-none focus:border-[#00d2ff] transition-all" placeholder="********" />
           </div>
           <button className="w-full py-5 bg-[#00d2ff] text-black oswald font-bold text-xl uppercase tracking-[0.2em] cyber-clip hover:bg-white transition-all mt-4">
             Authorize Session
           </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-center w-full text-white/30 hover:text-white transition-colors mono text-[10px] uppercase tracking-widest">
           {isLogin ? "Request new operative status" : "Return to login protocol"}
        </button>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user, logout, orders } = useStore();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/auth'); }, [user]);
  if (!user) return null;

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-20">
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-8">
             <div className="p-10 bg-white/5 border border-white/10 cyber-clip text-center">
                <div className="w-24 h-24 bg-[#00d2ff] text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,210,255,0.4)]">
                   <UserIcon size={40} />
                </div>
                <h2 className="oswald text-3xl uppercase">{user.name}</h2>
                <p className="mono text-[10px] text-white/30 uppercase mt-1 tracking-widest">Status: CLEARANCE_LEVEL_5</p>
                <button onClick={logout} className="mt-8 text-red-500/50 hover:text-red-500 oswald uppercase text-xs tracking-widest flex items-center gap-2 mx-auto transition-colors">
                   <LogOut size={14} /> Terminate
                </button>
             </div>
             <div className="p-6 bg-black/40 border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[10px] mono text-white/40">
                   <span>CREDITS</span>
                   <span className="text-[#00d2ff]">8,420 ¤</span>
                </div>
                <div className="flex justify-between items-center text-[10px] mono text-white/40">
                   <span>DROPS ACQUIRED</span>
                   <span className="text-[#00d2ff]">{orders.length}</span>
                </div>
             </div>
          </div>
          <div className="lg:col-span-3">
             <h3 className="oswald text-5xl uppercase mb-12 tracking-tighter">Mission History</h3>
             <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="p-8 bg-white/5 border border-white/10 hover:border-[#00d2ff]/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h4 className="oswald text-2xl mb-1 uppercase tracking-widest">PHASE_{order.id}</h4>
                      <p className="text-white/30 mono text-xs mb-4 uppercase">{order.items.join(' // ')}</p>
                      <span className="px-3 py-1 bg-white/10 text-white/60 mono text-[9px] uppercase">{order.status}</span>
                    </div>
                    <div className="text-right">
                       <div className="oswald text-3xl text-[#00d2ff] mb-1">${order.total}</div>
                       <div className="text-[10px] text-white/20 uppercase mono tracking-widest">{order.date}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const { cart, clearCart } = useStore();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinish = () => {
    alert("ORDER BROADCASTED... AWAITING DRONE DISPATCH.");
    clearCart();
    navigate('/account');
  };

  return (
    <div className="pt-40 px-6 max-w-4xl mx-auto pb-20">
       <h1 className="oswald text-6xl uppercase mb-16 tracking-tighter text-center">Final Validation</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
             <div className="p-8 bg-white/5 border border-white/10">
                <h3 className="oswald text-xl uppercase mb-6 text-[#00d2ff]">Deployment Zone</h3>
                <input type="text" placeholder="FULL IDENTIFIER" className="w-full bg-white/5 border border-white/10 p-4 mb-4 outline-none focus:border-[#00d2ff] transition-all" />
                <input type="text" placeholder="DROP COORDS (ADDRESS)" className="w-full bg-white/5 border border-white/10 p-4 outline-none focus:border-[#00d2ff] transition-all" />
             </div>
             <div className="p-8 bg-white/5 border border-white/10">
                <h3 className="oswald text-xl uppercase mb-6 text-[#00d2ff]">Payment Protocol</h3>
                <input type="text" placeholder="CREDIT CHIP ID" className="w-full bg-white/5 border border-white/10 p-4 mb-4 outline-none focus:border-[#00d2ff] transition-all" />
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="EXP" className="bg-white/5 border border-white/10 p-4 outline-none focus:border-[#00d2ff] transition-all" />
                   <input type="text" placeholder="SEC_KEY" className="bg-white/5 border border-white/10 p-4 outline-none focus:border-[#00d2ff] transition-all" />
                </div>
             </div>
          </div>
          <div className="p-8 bg-[#00d2ff]/5 border border-[#00d2ff]/20 flex flex-col h-fit">
             <h3 className="oswald text-xl uppercase mb-8 border-b border-white/10 pb-4">Cargo Summary</h3>
             <div className="space-y-4 flex-1 mb-12">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm mono text-white/60">
                     <span>{item.name} x{item.quantity}</span>
                     <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
             </div>
             <div className="flex justify-between items-end mb-12">
                <span className="oswald text-xl uppercase">Final Cost</span>
                <span className="oswald text-4xl text-[#00d2ff]">${total.toFixed(2)}</span>
             </div>
             <button onClick={handleFinish} className="w-full py-5 bg-[#00d2ff] text-black oswald font-bold text-xl uppercase tracking-widest cyber-clip hover:bg-white transition-all">
                Execute Transaction
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Store Provider Implementation ---

const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ef_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ef_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ef_orders');
    return saved ? JSON.parse(saved) : [
      { id: 'AC-1092', items: ['Cyber Jacket V1'], total: 120, status: 'SHIPPED', date: '2025-01-15' },
      { id: 'AC-3301', items: ['Neon Kicks', 'Tac Gloves'], total: 195, status: 'DELIVERED', date: '2024-12-02' }
    ];
  });

  useEffect(() => localStorage.setItem('ef_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('ef_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('ef_orders', JSON.stringify(orders)), [orders]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);
  const login = (email: string, name: string) => setUser({ email, name, joinDate: new Date().toLocaleDateString() });
  const logout = () => setUser(null);

  return (
    <StoreContext.Provider value={{ cart, user, orders, addToCart, updateQuantity, removeFromCart, clearCart, login, logout }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- Neural Style Assistant (Gemini) ---

const StyleAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat]);

  const askAI = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setChat(prev => [...prev, {role: 'user', text: userMsg}]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the Neural Style Intelligence of "Eagle Fort", an elite cyberpunk techwear brand.
          Available Gear: ${PRODUCTS.map(p => p.name).join(', ')}.
          Tone: Futuristic, tactical, concise, elite, helpful. Use tech jargon occasionally (e.g., de-rez, uplink, protocol, shell, phase).
          User Question: ${userMsg}`,
        config: { temperature: 0.9, topP: 0.95 }
      });
      setChat(prev => [...prev, {role: 'ai', text: response.text || 'System noise detected. Retry uplink.'}]);
    } catch (err) {
      setChat(prev => [...prev, {role: 'ai', text: "Signal interference. Check your neural interface (API Key)."}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500]">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[500px] bg-black/80 backdrop-blur-3xl border border-[#00d2ff]/40 rounded-sm flex flex-col shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent"></div>
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#00d2ff]/5">
            <div className="flex items-center gap-3 oswald uppercase text-sm font-bold text-[#00d2ff]">
              <div className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping"></div>
              Neural Interface v.0.4
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {chat.length === 0 && (
              <div className="text-center py-12">
                 <Bot size={40} className="mx-auto text-white/10 mb-4" />
                 <p className="text-white/30 mono text-[10px] uppercase leading-relaxed tracking-widest">Awaiting tactical inquiry... <br/> Request style analysis or gear compatibility.</p>
              </div>
            )}
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-white/5 border border-white/10 text-white/80' : 'bg-[#00d2ff]/10 border border-[#00d2ff]/20 text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[#00d2ff] mono text-[10px] animate-pulse">DECRYPTING RESPONSE...</div>}
          </div>
          <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
            <input 
              type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="SEND_SIGNAL..."
              className="flex-1 bg-black/60 border border-white/10 px-4 py-3 text-xs mono uppercase outline-none focus:border-[#00d2ff] transition-all"
              onKeyDown={e => e.key === 'Enter' && askAI()}
            />
            <button onClick={askAI} className="bg-[#00d2ff] text-black px-4 flex items-center justify-center hover:bg-white transition-all"><Send size={16} /></button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 bg-black border border-[#00d2ff]/50 text-[#00d2ff] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,210,255,0.3)] hover:scale-110 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#00d2ff]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <Bot size={36} className="relative z-10" />
        </button>
      )}
    </div>
  );
};

// --- Footer ---

const Footer: React.FC = () => {
  return (
    <footer className="py-40 bg-black border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
        <div className="lg:col-span-2">
           <h3 className="oswald text-7xl uppercase mb-8 tracking-tighter">Stay Wired</h3>
           <p className="text-white/40 mb-12 max-w-sm mono text-xs uppercase tracking-widest leading-loose">Join the encrypted frequency for experimental drop alerts and neural updates.</p>
           <div className="flex gap-2">
              <input type="email" placeholder="COMM_ADDR" className="flex-1 bg-white/5 border border-white/10 px-6 py-4 outline-none focus:border-[#00d2ff] transition-all mono text-xs uppercase" />
              <button className="px-10 py-4 bg-white/10 hover:bg-[#00d2ff] hover:text-black transition-all oswald uppercase font-bold tracking-widest text-sm cyber-clip">Uplink</button>
           </div>
        </div>
        <div className="space-y-6">
           <h4 className="oswald uppercase tracking-[0.4em] text-xs text-[#00d2ff]">Navigation</h4>
           <div className="flex flex-col gap-4 text-white/30 oswald uppercase text-lg">
              <Link to="/shop" className="hover:text-white transition-colors">Armory</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Neural Sync</Link>
              <a href="#" className="hover:text-white transition-colors">Visual Archives</a>
              <a href="#" className="hover:text-white transition-colors">Operational Manual</a>
           </div>
        </div>
        <div className="space-y-6">
           <h4 className="oswald uppercase tracking-[0.4em] text-xs text-[#00d2ff]">Connectivity</h4>
           <div className="flex flex-col gap-4 text-white/30 oswald uppercase text-lg">
              <a href="#" className="hover:text-white transition-colors">Grid_Link: EF-99</a>
              <a href="#" className="hover:text-white transition-colors">Term: 0042</a>
              <a href="#" className="hover:text-white transition-colors">Freq: 440hz</a>
           </div>
        </div>
      </div>
      <div className="mt-40 border-t border-white/5 pt-12 text-center text-[10px] mono text-white/10 uppercase tracking-[0.5em] px-6">
         © 2025 EAGLE FORT // NEURAL TAILORING // PROTOCOL 7.3 // BUILT IN THE VOID
      </div>
    </footer>
  );
};

// --- Main App Wrapper ---

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <ParticleBackground />
        <CustomCursor />
        <Navbar />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
        <StyleAssistant />
        <Footer />
      </Router>
    </StoreProvider>
  );
}

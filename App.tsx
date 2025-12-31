import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, X, User as UserIcon, LogOut, Trash2, Shield, Ghost, Zap, Activity, Bot, Plus, Minus, Send, ArrowRight, Heart, Box, Globe, Loader2, Mail, CheckCircle, AlertTriangle, Search, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Product, User, Order, CartItem } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { GoogleGenAI } from '@google/genai';

// --- Mock Backend Service ---
class MockBackend {
  static getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`ef_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  static setStorage(key: string, data: any) {
    localStorage.setItem(`ef_${key}`, JSON.stringify(data));
  }

  static async login(email: string, pass: string): Promise<User> {
    await new Promise(r => setTimeout(r, 800));
    const users = this.getStorage<User[]>('registry', []);
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) throw new Error("Invalid credentials provided.");
    return user;
  }

  static async signup(email: string, name: string, pass: string): Promise<User> {
    await new Promise(r => setTimeout(r, 1000));
    const users = this.getStorage<User[]>('registry', []);
    if (users.find(u => u.email === email)) throw new Error("User already exists.");
    
    const newUser: User = { 
      email, 
      name, 
      password: pass, 
      joinDate: new Date().toLocaleDateString(), 
      wishlist: [], 
      isAdmin: false 
    };
    
    users.push(newUser);
    this.setStorage('registry', users);
    return newUser;
  }

  static async googleAuth(): Promise<User> {
    await new Promise(r => setTimeout(r, 1500));
    const email = "operative.guest@gmail.com";
    const users = this.getStorage<User[]>('registry', []);
    let user = users.find(u => u.email === email);
    
    if (!user) {
      user = { 
        email, 
        name: "Google Operative", 
        joinDate: new Date().toLocaleDateString(), 
        wishlist: [], 
        isAdmin: false 
      };
      users.push(user);
      this.setStorage('registry', users);
    }
    return user;
  }

  static async createOrder(userId: string, cart: CartItem[]): Promise<Order> {
    await new Promise(r => setTimeout(r, 1200));
    const orders = this.getStorage<Order[]>('orders', []);
    const newOrder: Order = {
      id: `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId,
      items: cart.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      status: 'PROCESSING',
      date: new Date().toLocaleString(),
      paymentMethod: 'ENCRYPTED_NEURAL_LINK'
    };
    orders.unshift(newOrder);
    this.setStorage('orders', orders);
    return newOrder;
  }
}

// --- Contexts ---
interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  wishlist: string[];
  userOrders: Order[];
  theme: 'high' | 'desaturated';
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  addToCart: (product: Product) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (productId: string) => void;
  handleLogin: (email: string, pass: string) => Promise<void>;
  handleSignup: (email: string, name: string, pass: string) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  logout: () => void;
  placeOrder: () => Promise<void>;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// --- Store Provider ---
const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(() => MockBackend.getStorage('products', INITIAL_PRODUCTS));
  const [user, setUser] = useState<User | null>(() => MockBackend.getStorage('session', null));
  const [cart, setCart] = useState<CartItem[]>(() => MockBackend.getStorage('cart', []));
  const [orders, setOrders] = useState<Order[]>(() => MockBackend.getStorage('orders', []));
  const [theme, setTheme] = useState<'high' | 'desaturated'>(() => MockBackend.getStorage('theme', 'high'));
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    MockBackend.setStorage('session', user);
    MockBackend.setStorage('cart', cart);
    MockBackend.setStorage('theme', theme);
  }, [user, cart, theme]);

  const wishlist = useMemo(() => user?.wishlist || [], [user]);
  const userOrders = useMemo(() => orders.filter(o => o.userId === user?.email), [orders, user]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const toggleWishlist = (id: string) => {
    if (!user) return;
    const newWish = user.wishlist.includes(id) ? user.wishlist.filter(w => w !== id) : [...user.wishlist, id];
    const updatedUser = { ...user, wishlist: newWish };
    setUser(updatedUser);
    const users = MockBackend.getStorage<User[]>('registry', []);
    MockBackend.setStorage('registry', users.map(u => u.email === user.email ? updatedUser : u));
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await MockBackend.login(email, pass);
      setUser(u);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, name: string, pass: string) => {
    setLoading(true);
    try {
      const u = await MockBackend.signup(email, name, pass);
      setUser(u);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const u = await MockBackend.googleAuth();
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!user || cart.length === 0) return;
    setLoading(true);
    try {
      const newOrder = await MockBackend.createOrder(user.email, cart);
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreContext.Provider value={{ 
      products, cart, user, wishlist, userOrders, theme, loading, setLoading, searchQuery, setSearchQuery,
      addToCart, updateQuantity, removeFromCart, toggleWishlist, handleLogin, handleSignup, handleGoogleLogin,
      logout: () => setUser(null), placeOrder, toggleTheme: () => setTheme(prev => prev === 'high' ? 'desaturated' : 'high'),
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- UI Components ---

const Navbar: React.FC = () => {
  const { user, cart, wishlist, theme, toggleTheme, searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (pathname !== '/shop' && val.length > 0) {
      navigate('/shop');
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-50 backdrop-blur-xl border-b border-white/5 bg-black/40">
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white oswald uppercase flex items-center gap-3 group">
          <div className="w-8 h-8 bg-neon-blue cyber-clip shadow-neon group-hover:rotate-90 transition-transform duration-500"></div>
          Eagle Fort
        </Link>
        
        <nav className="hidden xl:flex items-center gap-8">
          <Link to="/" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Home</Link>
          <Link to="/shop" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/shop' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Shop</Link>
        </nav>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-neon-blue transition-colors" size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="SEARCH THE ARMORY..."
            className="w-full bg-white/5 border border-white/10 pl-12 pr-10 py-2.5 oswald text-[10px] tracking-widest outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all placeholder:text-white/20"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="hidden sm:flex hover:text-neon-blue p-2">
          {theme === 'high' ? <Activity size={18} /> : <Zap size={18} />}
        </button>
        
        <button onClick={() => navigate('/wishlist')} className="relative p-2">
          <Heart size={20} className={wishlist.length > 0 ? "fill-neon-blue text-neon-blue" : ""} />
        </button>

        <button onClick={() => navigate('/cart')} className="relative p-2">
          <ShoppingBag size={20} />
          {cart.length > 0 && <span className="absolute top-0 right-0 bg-neon-blue text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
        </button>

        {user ? (
          <button onClick={() => navigate('/account')} className="flex items-center gap-2 hover:text-neon-blue transition-colors oswald uppercase text-[11px] tracking-[0.2em] bg-neon-blue text-black px-4 py-2 cyber-clip font-bold">
            <UserIcon size={14} /> Account
          </button>
        ) : (
          <button onClick={() => navigate('/auth')} className="flex items-center gap-2 hover:text-neon-blue transition-colors oswald uppercase text-[11px] tracking-[0.2em] border border-white/10 px-4 py-2">
            <UserIcon size={14} /> Login
          </button>
        )}
      </div>
    </header>
  );
};

const IconMapper: React.FC<{ name: string; size?: number }> = ({ name, size = 24 }) => {
  switch (name) {
    case 'Shield': return <Shield size={size} />;
    case 'Zap': return <Zap size={size} />;
    case 'Activity': return <Activity size={size} />;
    case 'Ghost': return <Ghost size={size} />;
    default: return <Box size={size} />;
  }
};

const Home: React.FC = () => {
  const { products } = useStore();
  return (
    <div className="pt-24">
      <section className="min-h-[85vh] px-6 md:px-12 flex flex-col justify-center items-start relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle,var(--neon-blue)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-[12vw] md:text-[8vw] leading-[0.85] oswald uppercase font-bold text-white tracking-tighter glitch-text">Eagle Fort <br /> <span className="text-neon-blue">Neural Wear</span></h1>
          <p className="max-w-md text-white/60 mono text-xs md:text-sm leading-relaxed uppercase tracking-[0.2em]">High-performance Techwear for the urban operative. Secure your manifest today.</p>
          <Link to="/shop" className="px-10 py-5 bg-neon-blue text-black oswald font-bold tracking-[0.2em] cyber-clip shadow-neon flex items-center gap-3 hover:bg-white transition-all">
            ACCESS CATALOG <ArrowRight size={20} />
          </Link>
        </div>
      </section>
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="oswald text-4xl uppercase mb-12 border-b border-white/10 pb-4 tracking-tighter">Current Drops</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="group bg-white/5 border border-white/10 p-6 cyber-clip hover:border-neon-blue/40 transition-all flex flex-col">
      <div className="aspect-square bg-black/40 mb-6 flex items-center justify-center relative overflow-hidden">
        <div className="group-hover:scale-125 transition-transform duration-700 opacity-40 group-hover:opacity-100 text-neon-blue">
          <IconMapper name={product.icon} size={64} />
        </div>
        <div className="absolute top-2 left-2 bg-neon-blue text-black oswald font-bold text-[8px] px-2 py-0.5 uppercase">{product.tag}</div>
      </div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="oswald text-lg uppercase tracking-wider">{product.name}</h3>
        <button onClick={() => toggleWishlist(product.id)} className={`transition-colors ${isWishlisted ? 'text-neon-blue' : 'text-white/20 hover:text-white'}`}>
          <Heart size={18} className={isWishlisted ? "fill-neon-blue" : ""} />
        </button>
      </div>
      <div className="oswald text-xl text-neon-blue font-bold mb-4">${product.price}</div>
      <button onClick={() => addToCart(product)} className="w-full py-3 bg-white/5 border border-white/10 oswald uppercase text-xs tracking-widest hover:bg-neon-blue hover:text-black transition-all">
        Add to Cart
      </button>
    </div>
  );
};

const Shop: React.FC = () => {
  const { products, searchQuery } = useStore();
  
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="oswald text-6xl uppercase tracking-tighter glitch-text">The Armory</h1>
          {searchQuery && (
            <p className="mono text-[10px] uppercase text-neon-blue mt-2 tracking-widest">
              Filtering by: "{searchQuery}" — {filteredProducts.length} Results
            </p>
          )}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-40 border border-dashed border-white/10 cyber-clip">
          <Box className="mx-auto text-white/10 mb-6" size={64} />
          <h2 className="oswald text-2xl uppercase text-white/30">No inventory matches your query</h2>
          <p className="mono text-[10px] uppercase text-white/20 mt-2">Adjust your search parameters and try again.</p>
        </div>
      )}
    </div>
  );
};

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, placeOrder, loading } = useStore();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="pt-40 text-center py-60">
      <h2 className="oswald text-4xl text-white/20 uppercase mb-8">Manifest Empty</h2>
      <Link to="/shop" className="px-8 py-3 bg-neon-blue text-black oswald uppercase font-bold shadow-neon">Return to Shop</Link>
    </div>
  );

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <h1 className="oswald text-6xl uppercase tracking-tighter mb-12">Manifest</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/5 p-6 flex items-center gap-6">
              <div className="w-16 h-16 bg-black flex items-center justify-center shrink-0 border border-white/10"><IconMapper name={item.icon} size={24} /></div>
              <div className="flex-1">
                <h3 className="oswald text-xl uppercase">{item.name}</h3>
                <div className="oswald text-neon-blue font-bold">${item.price}</div>
              </div>
              <div className="flex items-center gap-4 border border-white/10 px-3 py-1">
                <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14}/></button>
                <span className="oswald font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14}/></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
        <div className="bg-white/5 p-8 cyber-clip border border-white/10 h-fit space-y-6">
          <div className="oswald text-2xl uppercase border-b border-white/10 pb-4">Order Summary</div>
          <div className="flex justify-between oswald text-xl">
            <span className="text-white/40">TOTAL CREDITS</span>
            <span className="text-neon-blue">${total}</span>
          </div>
          <button 
            disabled={loading}
            onClick={() => placeOrder().then(() => navigate('/account'))} 
            className="w-full py-4 bg-neon-blue text-black oswald font-bold uppercase shadow-neon hover:bg-white transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Secure Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const { handleLogin, handleSignup, handleGoogleLogin, user, loading, setLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/account'); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      await handleLogin(email, password);
    } else if (authMode === 'signup') {
      await handleSignup(email, name, password);
    } else {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      setForgotSuccess(true);
      setLoading(false);
    }
  };

  if (forgotSuccess) {
    return (
      <div className="pt-40 px-6 max-w-lg mx-auto pb-40 text-center">
        <div className="bg-white/5 border border-white/10 p-12 cyber-clip">
          <CheckCircle className="mx-auto text-neon-blue mb-6" size={64} />
          <h1 className="oswald text-4xl uppercase mb-4">Uplink Sent</h1>
          <p className="text-white/40 mono text-xs uppercase tracking-widest leading-loose mb-10">A neural reset link has been dispatched to your uplink (email). Check your incoming transmissions.</p>
          <button onClick={() => setForgotSuccess(false) || setAuthMode('login')} className="w-full py-4 bg-neon-blue text-black oswald font-bold uppercase tracking-widest">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 md:px-12 max-lg mx-auto pb-40">
      <div className="bg-white/5 border border-white/10 p-12 cyber-clip relative backdrop-blur-3xl shadow-neon">
        <h1 className="oswald text-5xl uppercase mb-10 tracking-tighter glitch-text text-center">
          {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Join Us' : 'Reset'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {authMode === 'signup' && (
            <div className="space-y-2">
              <label className="oswald uppercase text-[10px] tracking-[0.2em] text-white/40">Full Name</label>
              <input required placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="oswald uppercase text-[10px] tracking-[0.2em] text-white/40">Email Address</label>
            <input required type="email" placeholder="email@eaglefort.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
          </div>
          
          {authMode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="oswald uppercase text-[10px] tracking-[0.2em] text-white/40">Password</label>
                {authMode === 'login' && (
                  <button type="button" onClick={() => setAuthMode('forgot')} className="oswald uppercase text-[9px] text-neon-blue/60 hover:text-neon-blue">Forgot?</button>
                )}
              </div>
              <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
            </div>
          )}
          
          <button disabled={loading} className="w-full py-6 bg-neon-blue text-black oswald font-bold text-xl uppercase tracking-widest shadow-neon hover:bg-white transition-all flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" /> : authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Register' : 'Send Link'}
          </button>
        </form>

        {authMode !== 'forgot' && (
          <>
            <div className="relative my-10 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative px-4 bg-[#0b0c10] text-[10px] oswald text-white/20 uppercase tracking-[0.3em]">OR</span>
            </div>

            <button disabled={loading} onClick={handleGoogleLogin} className="w-full py-4 border border-white/10 flex items-center justify-center gap-3 oswald text-[12px] uppercase tracking-widest hover:bg-white/5 transition-all group">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} className="text-white group-hover:text-neon-blue" />}
              Continue with Google
            </button>
          </>
        )}
        
        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-white/30 oswald uppercase text-[11px] tracking-[0.2em] hover:text-neon-blue transition-colors group">
            {authMode === 'login' ? "New here? Register Now" : "Existing operative? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user, logout, userOrders } = useStore();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/auth" />;

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PROCESSING': return <Clock className="text-neon-blue animate-pulse" size={16} />;
      case 'SHIPPED': return <Truck className="text-neon-blue" size={16} />;
      case 'DELIVERED': return <CheckCircle2 className="text-green-500" size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PROCESSING': return 'text-neon-blue border-neon-blue/20 bg-neon-blue/5';
      case 'SHIPPED': return 'text-neon-blue border-neon-blue/40 bg-neon-blue/10';
      case 'DELIVERED': return 'text-green-500 border-green-500/20 bg-green-500/5';
      default: return 'text-white/40 border-white/10';
    }
  };

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <h1 className="oswald text-6xl uppercase tracking-tighter glitch-text">Operative Profile</h1>
          <p className="text-white/40 mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {user.name} // UPLINK ACTIVE // JOINED: {user.joinDate}
          </p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-red-500 oswald uppercase text-xs border border-red-500/20 px-6 py-3 hover:bg-red-500 hover:text-white transition-all cyber-clip font-bold group">
          <LogOut size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="oswald text-3xl uppercase tracking-widest">Mission Logs</h2>
            <div className="mono text-[10px] uppercase text-white/20">{userOrders.length} ENTRIES FOUND</div>
          </div>
          
          {userOrders.length > 0 ? (
            <div className="space-y-6">
              {userOrders.map(order => (
                <div key={order.id} className="bg-white/5 border border-white/10 cyber-clip relative overflow-hidden group hover:border-neon-blue/40 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-neon-blue/10 transition-all"></div>
                  
                  <div className="p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="oswald text-2xl uppercase tracking-wider text-neon-blue group-hover:glitch-text">{order.id}</div>
                          <div className={`oswald text-[9px] uppercase border px-2 py-0.5 flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </div>
                        <div className="mono text-[10px] text-white/30 flex items-center gap-2 uppercase">
                          <Clock size={10} /> TRANSMISSION DATE: {order.date}
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <div className="oswald text-3xl font-bold text-white tracking-tighter">${order.total.toLocaleString()}</div>
                        <div className="mono text-[8px] text-white/20 uppercase tracking-[0.2em]">{order.paymentMethod}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-4 oswald text-[10px] uppercase text-white/20 border-b border-white/5 pb-2">
                        <div className="col-span-2">ASSET NAME</div>
                        <div className="text-center">QUANTITY</div>
                        <div className="text-right">CREDITS</div>
                      </div>
                      {order.items.map((item, i) => (
                        <div key={i} className="grid grid-cols-4 mono text-[11px] uppercase text-white/60 items-center group/item">
                          <div className="col-span-2 flex items-center gap-2">
                            <span className="w-1 h-1 bg-neon-blue/40"></span>
                            {item.name}
                          </div>
                          <div className="text-center text-white/40">x{item.quantity}</div>
                          <div className="text-right text-white font-bold group-hover/item:text-neon-blue transition-colors">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                      <div className="mono text-[9px] text-white/20 uppercase">SECURE DIGITAL MANIFEST // TRACE ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                      <button className="oswald text-[10px] uppercase text-neon-blue hover:text-white transition-colors flex items-center gap-2 group/btn">
                        UPLINK RECEIPT <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 cyber-clip flex flex-col items-center">
              <Box className="text-white/5 mb-6 animate-pulse" size={80} />
              <h2 className="oswald text-3xl uppercase text-white/20 mb-2">Registry Empty</h2>
              <p className="mono text-[10px] uppercase text-white/10 tracking-[0.2em] max-w-xs mx-auto mb-8">No transaction logs were found in your operative history. You are currently unauthorized to view archived missions.</p>
              <Link to="/shop" className="px-8 py-3 bg-neon-blue text-black oswald uppercase font-bold text-xs shadow-neon cyber-clip hover:bg-white transition-all">
                ACCESS ARMORY
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="p-8 bg-white/5 border border-white/10 cyber-clip relative group">
              <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none"></div>
              <h3 className="oswald text-xl uppercase text-neon-blue mb-8 flex items-center gap-3">
                <Shield size={20} className="group-hover:rotate-12 transition-transform" /> 
                Neural Signature
              </h3>
              <div className="space-y-6 mono text-[10px] uppercase text-white/60">
                <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                  <span className="text-[8px] text-white/20 flex items-center gap-2">
                    <Mail size={10} /> PRIMARY UPLINK
                  </span>
                  <span className="text-white text-xs truncate">{user.email}</span>
                </div>
                <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                  <span className="text-[8px] text-white/20 flex items-center gap-2">
                    <Zap size={10} /> AUTHENTICATION STATUS
                  </span>
                  <span className="text-neon-blue text-xs flex items-center gap-2">
                    <CheckCircle2 size={12} /> VERIFIED OPERATIVE
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[8px] text-white/20 flex items-center gap-2">
                    <Shield size={10} /> ACCESS CLEARANCE
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs">{user.isAdmin ? 'LEVEL 5 ADMIN' : 'LEVEL 1 OPERATIVE'}</span>
                    {!user.isAdmin && <AlertTriangle size={14} className="text-yellow-500/50" />}
                  </div>
                </div>
              </div>
           </div>

           <div className="p-8 bg-neon-blue/5 border border-neon-blue/20 cyber-clip">
              <h3 className="oswald text-xl uppercase text-neon-blue mb-4">Neural Feedback</h3>
              <p className="mono text-[10px] text-white/40 leading-relaxed uppercase mb-6">Your recent activity has been synchronized with the Eagle Fort central hive mind. Wear the future, Operative.</p>
              <div className="h-2 w-full bg-black border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-neon-blue w-[75%] animate-pulse shadow-neon"></div>
              </div>
              <div className="mt-2 flex justify-between mono text-[8px] text-white/20 uppercase">
                <span>SYNC PROGRESS</span>
                <span>75%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="py-24 bg-black border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
      <div>
         <h3 className="oswald text-4xl uppercase mb-6 tracking-tighter glitch-text">Stay Wired</h3>
         <p className="text-white/40 mb-8 max-w-sm mono text-[10px] uppercase tracking-[0.3em] leading-loose">The premier source for high-performance urban gear.</p>
         <div className="flex gap-2 max-w-sm">
            <input placeholder="EMAIL ADDRESS" className="flex-1 bg-white/5 border border-white/10 px-4 py-3 oswald uppercase text-[11px] text-white outline-none focus:border-neon-blue" />
            <button className="px-6 py-3 bg-neon-blue text-black oswald uppercase font-bold text-[11px] cyber-clip shadow-neon">Sync</button>
         </div>
      </div>
      <div className="space-y-6">
         <h4 className="oswald uppercase tracking-[0.3em] text-[10px] text-neon-blue">Navigation</h4>
         <div className="flex flex-col gap-3 text-white/30 oswald uppercase text-sm tracking-widest">
            <Link to="/shop" className="hover:text-white transition-colors">Catalog</Link>
            <Link to="/cart" className="hover:text-white transition-colors">Manifest</Link>
         </div>
      </div>
      <div className="space-y-6">
         <h4 className="oswald uppercase tracking-[0.3em] text-[10px] text-neon-blue">Support</h4>
         <div className="flex flex-col gap-3 text-white/30 oswald uppercase text-sm tracking-widest">
            <Link to="/account" className="hover:text-white transition-colors">Profile</Link>
            <Link to="/" className="hover:text-white transition-colors">Security</Link>
         </div>
      </div>
    </div>
    <div className="mt-24 text-center text-[8px] mono text-white/10 uppercase tracking-[0.5em]">© 2025 EAGLE FORT COMPANY</div>
  </footer>
);

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <Navbar />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/account" element={<Account />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/wishlist" element={<Shop />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </StoreProvider>
  );
}

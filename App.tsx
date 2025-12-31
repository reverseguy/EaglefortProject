
import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, X, User as UserIcon, LogOut, Trash2, Shield, Ghost, Zap, Activity, Bot, Plus, Minus, Send, ArrowRight, Heart, Box, Globe, Loader2, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { Product, User, Order, CartItem } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { GoogleGenAI } from '@google/genai';

// --- Mock Backend Service ---
// This simulates a real backend API and database layer
class MockBackend {
  static getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`ef_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  static setStorage(key: string, data: any) {
    localStorage.setItem(`ef_${key}`, JSON.stringify(data));
  }

  static async login(email: string, pass: string): Promise<User> {
    await new Promise(r => setTimeout(r, 800)); // Simulate latency
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
  // Expose setLoading to allow manual loading state control in components
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
      products, cart, user, wishlist, userOrders, theme, loading, setLoading,
      addToCart, updateQuantity, removeFromCart, toggleWishlist, handleLogin, handleSignup, handleGoogleLogin,
      logout: () => setUser(null), placeOrder, toggleTheme: () => setTheme(prev => prev === 'high' ? 'desaturated' : 'high'),
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- UI Components ---

const Navbar: React.FC = () => {
  const { user, cart, wishlist, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-50 backdrop-blur-xl border-b border-white/5 bg-black/40">
      <Link to="/" className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white oswald uppercase flex items-center gap-3 group">
        <div className="w-8 h-8 bg-neon-blue cyber-clip shadow-neon group-hover:rotate-90 transition-transform duration-500"></div>
        Eagle Fort
      </Link>
      
      <nav className="hidden lg:flex items-center gap-8">
        <Link to="/" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Home</Link>
        <Link to="/shop" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/shop' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Shop</Link>
      </nav>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="hidden sm:flex hover:text-neon-blue p-2">
          {theme === 'high' ? <Moon size={18} /> : <Sun size={18} />}
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
  const { products } = useStore();
  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <h1 className="oswald text-6xl uppercase tracking-tighter mb-12 glitch-text">The Armory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
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
  // Destructured setLoading from useStore context
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
    <div className="pt-40 px-6 md:px-12 max-w-lg mx-auto pb-40">
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

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <h1 className="oswald text-6xl uppercase tracking-tighter glitch-text">Operative Profile</h1>
          <p className="text-white/40 mono text-xs uppercase tracking-widest">{user.name} // JOINED: {user.joinDate}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-red-500 oswald uppercase text-xs border border-red-500/20 px-6 py-3 hover:bg-red-500 hover:text-white transition-all cyber-clip font-bold">
          <LogOut size={14}/> Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="oswald text-3xl uppercase tracking-widest border-b border-white/10 pb-4">Transaction Logs</h2>
          {userOrders.length > 0 ? userOrders.map(order => (
            <div key={order.id} className="bg-white/5 border border-white/10 p-8 cyber-clip">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <div className="oswald text-2xl uppercase tracking-wider text-neon-blue">{order.id}</div>
                  <div className="mono text-[10px] text-white/30">{order.date}</div>
                </div>
                <div className="sm:text-right">
                  <div className="oswald text-[10px] uppercase border border-neon-blue/20 px-3 py-1 mb-2 text-neon-blue inline-block">{order.status}</div>
                  <div className="oswald text-2xl font-bold text-white">${order.total}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item, i) => (
                  <span key={i} className="bg-white/5 border border-white/5 px-3 py-1 mono text-[9px] uppercase text-white/60">{item.name} (x{item.quantity})</span>
                ))}
              </div>
            </div>
          )) : <div className="text-center py-20 text-white/10 oswald text-2xl uppercase border border-dashed border-white/10">No logs found</div>}
        </div>
        <div className="space-y-8">
           <div className="p-8 bg-white/5 border border-white/10 cyber-clip">
              <h3 className="oswald text-xl uppercase text-neon-blue mb-6 flex items-center gap-2"><Shield size={18} /> Credentials</h3>
              <div className="space-y-4 mono text-[10px] uppercase text-white/60">
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[8px] text-white/20">EMAIL UPLINK</span>
                  <span className="text-white">{user.email}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                  <span className="text-[8px] text-white/20">SECURITY CLEARANCE</span>
                  <span className="text-neon-blue">{user.isAdmin ? 'LEVEL 5 ADMIN' : 'FIELD OPERATIVE'}</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Moon: React.FC<{ size?: number }> = ({ size = 24 }) => <Activity size={size} />;
const Sun: React.FC<{ size?: number }> = ({ size = 24 }) => <Zap size={size} />;

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

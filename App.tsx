
import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User as UserIcon, LogOut, ChevronLeft, Trash2, Shield, Ghost, Zap, Hand, Activity, Eye, Bot, Plus, Minus, Send, ArrowRight, CheckCircle2, AlertCircle, Radio, Navigation, Package, Heart, CreditCard, Lock, Loader2, MapPin, Mail, Phone, Sun, Moon, Truck, ShieldCheck, ZapIcon, Globe, LayoutDashboard, Edit3, Settings, Database, TrendingUp, RefreshCw, Users, Megaphone, BarChart3, Box, Terminal, MessageSquare, Filter, ArrowUpDown } from 'lucide-react';
import { Product, User, Order, CartItem, Review, AuditLog } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { GoogleGenAI } from '@google/genai';

// --- Contexts ---
interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  wishlist: string[];
  userOrders: Order[];
  allOrders: Order[];
  allUsers: User[];
  auditLogs: AuditLog[];
  subscribers: string[];
  reviews: Review[];
  theme: 'high' | 'desaturated';
  announcement: string;
  addToCart: (product: Product) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  login: (email: string, password: string) => boolean;
  signup: (email: string, name: string, password: string) => boolean;
  logout: () => void;
  placeOrder: (paymentDetails: any) => Promise<void>;
  toggleTheme: () => void;
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  subscribeNewsletter: (email: string) => void;
  // Admin functions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  deleteUser: (email: string) => void;
  setAnnouncement: (text: string) => void;
  deleteReview: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// --- Components ---

const AnnouncementBar: React.FC = () => {
  const { announcement } = useStore();
  if (!announcement) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-[100] bg-neon-blue text-black h-8 flex items-center justify-center overflow-hidden">
      <div className="whitespace-nowrap animate-marquee flex items-center gap-12 oswald font-bold text-[10px] uppercase tracking-[0.4em]">
        <span>{announcement}</span>
        <span>{announcement}</span>
        <span>{announcement}</span>
        <span>{announcement}</span>
      </div>
    </div>
  );
};

const ParticleBackground: React.FC = () => (
  <div className="fixed inset-0 -z-10 pointer-events-none bg-deep-bg">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, var(--neon-blue) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-[var(--neon-blue)]/5"></div>
    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--neon-blue)]/20 blur-sm"></div>
  </div>
);

const Navbar: React.FC = () => {
  const { cart, user, wishlist, theme, toggleTheme, products, announcement } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, products]);

  return (
    <>
      <header className={`fixed ${announcement ? 'top-8' : 'top-0'} left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-50 backdrop-blur-xl border-b border-white/5 bg-black/40 transition-all`}>
        <Link to="/" className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white oswald uppercase flex items-center gap-3 group">
          <div className="w-8 h-8 bg-neon-blue cyber-clip shadow-[0_0_15px_var(--accent-glow)] group-hover:rotate-90 transition-transform duration-500"></div>
          Eagle Fort
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Home</Link>
          <Link to="/shop" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/shop' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Shop</Link>
          <Link to="/about" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/about' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>About</Link>
          <Link to="/contact" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors ${pathname === '/contact' ? 'text-neon-blue' : 'hover:text-neon-blue'}`}>Contact</Link>
          {user?.isAdmin && <Link to="/admin" className={`oswald uppercase text-[11px] tracking-[0.3em] transition-colors font-bold ${pathname.startsWith('/admin') ? 'text-neon-blue underline underline-offset-4' : 'text-red-500 hover:text-white'}`}>Admin Panel</Link>}
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={toggleTheme} className="hidden sm:flex hover:text-neon-blue transition-colors items-center justify-center p-2 rounded-full border border-white/5 hover:border-neon-blue/40">
            {theme === 'high' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <button onClick={() => setIsSearchOpen(true)} className="hover:text-neon-blue transition-colors p-2"><Search size={18} /></button>
          
          <button onClick={() => navigate('/wishlist')} className="relative p-2">
            <Heart size={18} className={wishlist.length > 0 ? "fill-neon-blue text-neon-blue" : "hover:text-neon-blue transition-colors"} />
            {wishlist.length > 0 && <span className="absolute top-1 right-1 bg-neon-blue text-black text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{wishlist.length}</span>}
          </button>
          
          <button onClick={() => navigate('/cart')} className="relative p-2">
            <ShoppingBag size={20} className="hover:text-neon-blue transition-colors" />
            {cart.length > 0 && <span className="absolute top-1 right-0 bg-neon-blue text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </button>
          
          <button onClick={() => setIsMenuOpen(true)} className="hover:text-neon-blue transition-colors lg:hidden p-2"><Menu size={22} /></button>

          <button onClick={() => navigate(user ? '/account' : '/auth')} className="hidden lg:flex items-center gap-2 hover:text-neon-blue transition-colors oswald uppercase text-[11px] tracking-[0.2em] border border-white/10 px-4 py-2 ml-4">
             <UserIcon size={14} />
             {user ? "Account" : "Login"}
          </button>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center justify-start pt-32 px-6 backdrop-blur-3xl overflow-y-auto">
          <button onClick={() => setIsSearchOpen(false)} className="fixed top-8 right-8 text-white/40 hover:text-white transition-all"><X size={32} /></button>
          <div className="w-full max-w-4xl">
            <div className="relative mb-12">
              <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gear..." className="w-full bg-transparent border-b-2 border-white/10 text-3xl md:text-5xl oswald uppercase outline-none focus:border-neon-blue transition-colors py-4 text-white" />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20" size={32} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
              {searchResults.length > 0 ? searchResults.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} onClick={() => setIsSearchOpen(false)} className="flex gap-4 p-4 bg-white/5 border border-white/5 hover:border-neon-blue transition-all group">
                  <div className="w-16 h-16 bg-black/40 flex items-center justify-center shrink-0 border border-white/5"><IconMapper name={p.icon} size={24} /></div>
                  <div>
                    <h4 className="oswald text-lg uppercase group-hover:text-neon-blue">{p.name}</h4>
                    <p className="text-white/40 mono text-[9px] uppercase">{p.category}</p>
                    <div className="mt-1 text-neon-blue oswald font-bold">${p.price}</div>
                  </div>
                </Link>
              )) : searchQuery && <p className="text-white/30 oswald uppercase tracking-widest text-center col-span-2">No matching items found</p>}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] transition-transform duration-700 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-neon-blue transition-colors"><X size={40} /></button>
        <div className="h-full flex flex-col justify-center items-center gap-6 text-center p-6">
          <Link to="/" className="oswald text-5xl hover:text-neon-blue transition-all uppercase tracking-tighter">Home</Link>
          <Link to="/shop" className="oswald text-5xl hover:text-neon-blue transition-all uppercase tracking-tighter">Shop</Link>
          <Link to="/about" className="oswald text-5xl hover:text-neon-blue transition-all uppercase tracking-tighter">About Us</Link>
          <Link to="/contact" className="oswald text-5xl hover:text-neon-blue transition-all uppercase tracking-tighter">Contact</Link>
          <div className="w-32 h-px bg-white/10 my-4"></div>
          {user?.isAdmin && <Link to="/admin" className="oswald text-3xl text-red-500 hover:text-white transition-all uppercase">Admin Command</Link>}
          <Link to="/wishlist" className="oswald text-3xl text-white/60 hover:text-neon-blue transition-all uppercase">Wishlist</Link>
          <Link to={user ? "/account" : "/auth"} className="oswald text-3xl text-white/60 hover:text-neon-blue transition-all uppercase">{user ? "Account" : "Login"}</Link>
        </div>
      </div>
    </>
  );
};

const IconMapper: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 24, className }) => {
  switch (name) {
    case 'Shield': return <Shield size={size} className={className} />;
    case 'Ghost': return <Ghost size={size} className={className} />;
    case 'Zap': return <Zap size={size} className={className} />;
    case 'Hand': return <Hand size={size} className={className} />;
    case 'Activity': return <Activity size={size} className={className} />;
    case 'Eye': return <Eye size={size} className={className} />;
    case 'Terminal': return <Terminal size={size} className={className} />;
    default: return <Shield size={size} className={className} />;
  }
};

const MissionTracker: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const stages = [
    { key: 'INIT', label: 'Received', icon: Radio },
    { key: 'ENCRYPT', label: 'Processing', icon: Shield },
    { key: 'TRANSIT', label: 'Transit', icon: Navigation },
    { key: 'DEPLOY', label: 'Delivered', icon: Package },
  ];
  const activeIndex = status === 'PROCESSING' ? 1 : status === 'SHIPPED' ? 2 : status === 'DELIVERED' ? 3 : 0;
  return (
    <div className="mt-4 w-full">
      <div className="relative flex justify-between items-center px-1">
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 -z-10"></div>
        <div className="absolute top-1/2 left-0 h-px bg-neon-blue shadow-[0_0_8px_var(--accent-glow)] -translate-y-1/2 -z-10 transition-all duration-1000 ease-out" style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}></div>
        {stages.map((stage, idx) => {
          const isActive = idx <= activeIndex;
          return (
            <div key={stage.key} className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500 ${isActive ? 'bg-black border-neon-blue text-neon-blue shadow-[0_0_10px_var(--accent-glow)]' : 'bg-[#0b0c10] border-white/5 text-white/10'}`}>
                <stage.icon size={10} />
              </div>
              <span className={`mt-2 mono text-[6px] uppercase tracking-widest ${isActive ? 'text-neon-blue' : 'text-white/10'}`}>{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Admin Panel Component ---

const AdminPanel: React.FC = () => {
  const { products, allOrders, allUsers, auditLogs, subscribers, reviews, addProduct, updateProduct, deleteProduct, updateOrderStatus, deleteUser, setAnnouncement, announcement, deleteReview, user } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'users' | 'intel' | 'audit'>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (!user?.isAdmin) navigate('/'); }, [user]);

  const stats = useMemo(() => ({
    revenue: allOrders.reduce((sum, o) => sum + o.total, 0),
    orders: allOrders.length,
    operatives: allUsers.length,
    activeGear: products.length
  }), [allOrders, allUsers, products]);

  if (!user?.isAdmin) return null;

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-40 space-y-1">
            <h1 className="oswald text-4xl uppercase mb-8 glitch-text">Mission Control</h1>
            {[
              { id: 'dashboard', label: 'Intelligence', icon: LayoutDashboard },
              { id: 'inventory', label: 'Gear Registry', icon: Database },
              { id: 'orders', label: 'Deployments', icon: Package },
              { id: 'users', label: 'Operatives', icon: Users },
              { id: 'intel', label: 'Broadcasts', icon: Megaphone },
              { id: 'audit', label: 'System Logs', icon: Terminal },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full text-left p-4 oswald uppercase tracking-widest flex items-center gap-3 border transition-all ${activeTab === tab.id ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_var(--accent-glow)]' : 'bg-white/5 border-white/5 hover:border-white/20 text-white/50'}`}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[600px] bg-white/5 border border-white/5 p-8 cyber-clip backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 blur-3xl -z-10"></div>
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Neural Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: TrendingUp },
                  { label: 'Active Missions', value: stats.orders, icon: Radio },
                  { label: 'Total Operatives', value: stats.operatives, icon: Users },
                  { label: 'Asset Count', value: stats.activeGear, icon: Box },
                ].map((s, i) => (
                  <div key={i} className="bg-black/40 border border-white/10 p-6 cyber-clip">
                    <s.icon className="text-neon-blue mb-4" size={20} />
                    <div className="text-white/40 oswald text-[10px] uppercase tracking-[0.3em] mb-1">{s.label}</div>
                    <div className="oswald text-3xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-black/20 p-8 border border-white/10 backdrop-blur-md">
                 <h3 className="oswald text-xl uppercase mb-6 flex items-center gap-3 text-neon-blue"><BarChart3 size={20}/> Signal Analysis</h3>
                 <div className="h-48 flex items-end gap-3 px-4 border-b border-white/10 pb-4">
                    {[30, 45, 25, 60, 40, 80, 55, 90, 65, 40].map((h, i) => (
                      <div key={i} className="flex-1 bg-neon-blue/10 border-t border-neon-blue/40 hover:bg-neon-blue transition-all group relative cursor-pointer" style={{ height: `${h}%` }}>
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-neon-blue px-2 py-1 mono text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">DATA_{i}</div>
                      </div>
                    ))}
                 </div>
                 <p className="mt-4 text-white/40 mono text-[9px] uppercase tracking-widest">Global Traffic & Transaction Vectors // REAL_TIME</p>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center">
                <h3 className="oswald text-3xl uppercase tracking-widest">Asset Registry</h3>
                <button onClick={() => setIsAdding(true)} className="px-6 py-2 bg-neon-blue text-black oswald font-bold uppercase tracking-widest hover:bg-white transition-all text-xs">
                  + REGISTER ASSET
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {products.map(p => (
                  <div key={p.id} className="bg-black/40 border border-white/5 p-4 flex items-center gap-6 group hover:border-neon-blue/40 transition-all">
                    <div className="w-12 h-12 bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-neon-blue/10"><IconMapper name={p.icon} size={20} /></div>
                    <div className="flex-1">
                      <div className="oswald text-lg uppercase tracking-wider">{p.name}</div>
                      <div className="mono text-[8px] text-white/20 uppercase tracking-[0.2em]">{p.id} // {p.category}</div>
                    </div>
                    <div className="oswald text-xl font-bold text-neon-blue">${p.price}</div>
                    <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingProduct(p)} className="p-2 hover:text-white transition-colors"><Edit3 size={16}/></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h3 className="oswald text-3xl uppercase tracking-widest">System Audit Terminal</h3>
              <div className="bg-black border border-white/10 p-6 font-mono text-[10px] space-y-2 h-[500px] overflow-y-auto custom-scrollbar uppercase">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex gap-4">
                    <span className="text-neon-blue">[{log.timestamp}]</span>
                    <span className="text-white/40">[{log.user}]</span>
                    <span className="text-white">{log.action}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-white/20 italic">No logs initialized...</p>}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h3 className="oswald text-3xl uppercase tracking-widest">Operative Logs</h3>
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.email} className="bg-black/40 border border-white/5 p-4 flex items-center gap-6 justify-between group hover:border-white/20">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 flex items-center justify-center border ${u.isAdmin ? 'border-red-500/30 text-red-500' : 'border-white/10 text-white/40'}`}>
                          <UserIcon size={18} />
                       </div>
                       <div>
                          <div className="oswald text-lg uppercase">{u.name}</div>
                          <div className="mono text-[8px] text-white/20 uppercase">{u.email} // Joined: {u.joinDate}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       {u.isAdmin && <span className="oswald text-[10px] text-red-500 border border-red-500/30 px-2 py-0.5">OVERSEER</span>}
                       {!u.isAdmin && <span className="oswald text-[10px] text-white/40 px-2 py-0.5">OPERATIVE</span>}
                       {u.email !== 'admin@eaglefort.co' && (
                         <button onClick={() => deleteUser(u.email)} className="text-white/10 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'intel' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 bg-black/40 border border-white/10 cyber-clip">
                  <h3 className="oswald text-xl uppercase mb-6 text-neon-blue">Site-Wide Broadcast</h3>
                  <textarea 
                    value={announcement} 
                    onChange={e => setAnnouncement(e.target.value)}
                    placeholder="Enter broadcast message..." 
                    className="w-full h-32 bg-black border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-xs resize-none mb-4"
                  />
                  <button className="w-full py-3 bg-neon-blue text-black oswald font-bold uppercase tracking-widest hover:bg-white transition-all text-xs">Deploy Update</button>
                </div>
                <div className="p-8 bg-black/40 border border-white/10 cyber-clip">
                  <h3 className="oswald text-xl uppercase mb-6 text-neon-blue">Neural Subscribers</h3>
                  <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar pr-2">
                    {subscribers.map(sub => (
                      <div key={sub} className="flex justify-between items-center border-b border-white/5 py-2 mono text-[10px] text-white/60">
                         <span>{sub}</span>
                         <span className="text-neon-blue">ACTIVE</span>
                      </div>
                    ))}
                    {subscribers.length === 0 && <p className="text-white/20 italic">No subscribers linked.</p>}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-black/40 border border-white/10 cyber-clip">
                <h3 className="oswald text-xl uppercase mb-6 text-neon-blue">Field Intelligence (Reviews)</h3>
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-white/5 p-4 border border-white/5 flex justify-between items-start group">
                      <div>
                        <div className="oswald text-sm uppercase tracking-wider">{rev.userName} // {rev.productId}</div>
                        <div className="text-white/40 mono text-[9px] mb-2">{rev.date}</div>
                        <p className="text-white/80 oswald uppercase text-xs">{rev.comment}</p>
                      </div>
                      <button onClick={() => deleteReview(rev.id)} className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h3 className="oswald text-3xl uppercase tracking-widest">Deployment Registry</h3>
              <div className="space-y-3">
                {allOrders.map(o => (
                  <div key={o.id} className="bg-black/40 border border-white/5 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-neon-blue/20 transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="oswald text-xl uppercase tracking-widest">MISSION #{o.id}</span>
                        <span className={`px-2 py-0.5 mono text-[7px] uppercase font-bold border ${o.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : o.status === 'SHIPPED' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'}`}>{o.status}</span>
                      </div>
                      <p className="text-white/20 mono text-[8px] uppercase">{o.userId} // {o.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="oswald text-xl font-bold text-neon-blue">${o.total}</div>
                      <select 
                        value={o.status} 
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as Order['status'])}
                        className="bg-black border border-white/10 text-[10px] oswald uppercase p-2 outline-none focus:border-neon-blue text-white"
                      >
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {(isAdding || editingProduct) && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
          <div className="bg-deep-bg border border-white/10 p-10 max-w-xl w-full cyber-clip relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="oswald text-4xl uppercase mb-8">{editingProduct ? 'Update Asset' : 'New Asset Registration'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                id: editingProduct?.id || `EF-${Math.floor(1000 + Math.random() * 9000)}`,
                name: fd.get('name') as string,
                price: parseFloat(fd.get('price') as string),
                category: fd.get('category') as string,
                description: fd.get('description') as string,
                tag: fd.get('tag') as string || 'NEW',
                icon: fd.get('icon') as string || 'Shield',
                image: ''
              };
              editingProduct ? updateProduct(data) : addProduct(data);
              setIsAdding(false); setEditingProduct(null);
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input required name="name" defaultValue={editingProduct?.name} placeholder="ASSET NAME" className="bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-sm" />
                <input required name="price" type="number" defaultValue={editingProduct?.price} placeholder="PRICE (CRED)" className="bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-sm" />
              </div>
              <input required name="category" defaultValue={editingProduct?.category} placeholder="SECTOR (Outerwear, Footwear...)" className="w-full bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-sm" />
              <textarea required name="description" defaultValue={editingProduct?.description} rows={3} placeholder="TACTICAL SPECIFICATIONS" className="w-full bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-sm resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <select name="icon" defaultValue={editingProduct?.icon} className="bg-black border border-white/10 p-4 text-white oswald uppercase text-sm outline-none focus:border-neon-blue">
                  <option value="Shield">Shield</option>
                  <option value="Ghost">Ghost</option>
                  <option value="Zap">Zap</option>
                  <option value="Hand">Hand</option>
                  <option value="Activity">Activity</option>
                  <option value="Eye">Eye</option>
                </select>
                <input name="tag" defaultValue={editingProduct?.tag} placeholder="TAG (ELITE, NEW, HOT)" className="bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-sm" />
              </div>
              <button className="w-full py-5 bg-neon-blue text-black oswald font-bold text-xl uppercase tracking-widest shadow-[0_0_20px_var(--accent-glow)] hover:bg-white transition-all">
                {editingProduct ? 'INITIALIZE UPDATE' : 'DEPLOY TO ARMORY'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Page Components ---

const Home: React.FC = () => {
  const { products } = useStore();
  const featured = products.slice(0, 4);
  const navigate = useNavigate();

  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="min-h-[90vh] px-6 md:px-12 flex flex-col justify-center items-start relative overflow-hidden">
        <div className="scanline"></div>
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-[12vw] leading-[0.85] oswald uppercase font-bold text-white tracking-tighter glitch-text mb-6">Eagle <br /> <span className="text-transparent" style={{ WebkitTextStroke: '1.5px var(--neon-blue)' }}>Fort</span></h1>
          <p className="max-w-md text-white/60 mono text-xs md:text-sm leading-relaxed uppercase tracking-[0.2em] mb-10">High-performance gear for the modern urban operative. Blending anonymity with high utility.<br /><span className="text-neon-blue">ESTABLISHED 2025 // TOKYO // BERLIN</span></p>
          <div className="flex flex-wrap gap-4">
            <Link to="/shop" className="group px-8 py-4 bg-neon-blue text-black oswald font-bold tracking-[0.2em] cyber-clip hover:bg-white transition-all flex items-center gap-3 shadow-[0_0_20px_var(--accent-glow)] text-sm">SHOP THE ARMORY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></Link>
            <Link to="/about" className="px-8 py-4 border border-white/10 hover:border-neon-blue text-white oswald font-bold tracking-[0.2em] transition-all text-sm">OUR MISSION</Link>
          </div>
        </div>
        <div className="absolute right-[-10%] bottom-0 text-[30vw] font-black text-white/[0.02] select-none pointer-events-none uppercase oswald">FORT</div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-neon-blue mono text-[10px] uppercase tracking-[0.4em] mb-2 block">Curated Gear</span>
            <h2 className="oswald text-5xl md:text-6xl uppercase tracking-tighter">New Arrivals</h2>
          </div>
          <Link to="/shop" className="oswald text-neon-blue uppercase tracking-widest text-xs hover:text-white transition-colors flex items-center gap-2 mb-2">View Full Catalog <ChevronLeft className="rotate-180" size={16} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-24 bg-white/5 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto md:mx-0"><ShieldCheck size={24} /></div>
              <h3 className="oswald text-xl uppercase tracking-widest">Tactical Grade</h3>
              <p className="text-white/40 text-xs leading-relaxed uppercase mono">Reinforced materials built for durability and long-range wear.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto md:mx-0"><Truck size={24} /></div>
              <h3 className="oswald text-xl uppercase tracking-widest">Rapid Drop</h3>
              <p className="text-white/40 text-xs leading-relaxed uppercase mono">Global express logistics. Stealth delivery to your sector.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto md:mx-0"><ZapIcon size={24} /></div>
              <h3 className="oswald text-xl uppercase tracking-widest">Neural Link</h3>
              <p className="text-white/40 text-xs leading-relaxed uppercase mono">AI-integrated inventory tracking and support protocols.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto md:mx-0"><Globe size={24} /></div>
              <h3 className="oswald text-xl uppercase tracking-widest">Zero Boundary</h3>
              <p className="text-white/40 text-xs leading-relaxed uppercase mono">Operating across all major city hubs and sprawl sectors.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  
  return (
    <div className="group relative flex flex-col bg-white/5 border border-white/5 hover:border-neon-blue/40 transition-all">
      <Link to={`/product/${product.id}`} className="block relative aspect-square bg-black/40 overflow-hidden">
        <div className="flex items-center justify-center h-full group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100">
          <IconMapper name={product.icon} size={64} />
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-neon-blue text-black text-[9px] font-bold px-2 py-0.5 oswald uppercase tracking-tighter">{product.tag}</span>
        </div>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button onClick={(e) => { e.preventDefault(); addToCart(product); }} className="bg-neon-blue p-3 text-black rounded-full hover:bg-white transition-colors shadow-neon" title="Add to Cart">
             <ShoppingBag size={20} />
          </button>
          <button onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }} className={`p-3 border rounded-full transition-all ${wishlist.includes(product.id) ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/10 border-white/20 hover:bg-white hover:text-black'}`} title="Add to Wishlist">
             <Heart size={20} className={wishlist.includes(product.id) ? "fill-red-500" : ""} />
          </button>
        </div>
      </Link>
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="oswald text-xl uppercase group-hover:text-neon-blue transition-colors truncate pr-2">{product.name}</h3>
          <span className="text-neon-blue oswald font-bold">${product.price}</span>
        </div>
        <p className="text-white/30 mono text-[9px] uppercase tracking-widest">{product.category}</p>
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  const { products } = useStore();
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name');
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
  const processedProducts = useMemo(() => {
    let filtered = filter === 'All' ? [...products] : products.filter(p => p.category === filter);
    return filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [filter, sortBy, products]);

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="oswald text-6xl uppercase tracking-tighter mb-4 glitch-text">The Armory</h1>
          <p className="text-white/40 mono text-[10px] uppercase tracking-[0.4em]">DEPLOYMENT SECTORS // SORT GEAR</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end w-full md:w-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 oswald text-[10px] uppercase tracking-widest border transition-all whitespace-nowrap ${filter === c ? 'bg-neon-blue text-black border-neon-blue shadow-neon' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 text-white/40">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent oswald text-[10px] uppercase tracking-widest outline-none">
              <option value="name">SORT BY NAME</option>
              <option value="price-asc">CREDIT LOW-HIGH</option>
              <option value="price-desc">CREDIT HIGH-LOW</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {processedProducts.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { products, addToCart, toggleWishlist, wishlist, reviews, addReview, user } = useStore();
  const product = products.find(p => p.id === id);
  const productReviews = reviews.filter(r => r.productId === id);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  if (!product) return <Navigate to="/shop" />;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Identify yourself to leave intelligence.");
    addReview({ productId: product.id, userId: user.email, userName: user.name, rating, comment: reviewText });
    setReviewText('');
  };

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        <div className="aspect-square bg-black/40 border border-white/10 flex items-center justify-center cyber-clip overflow-hidden group relative">
          <div className="opacity-40 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000"><IconMapper name={product.icon} size={200} /></div>
          <div className="absolute top-8 left-8 border-l-2 border-neon-blue pl-4">
             <div className="oswald text-4xl font-bold text-neon-blue">${product.price}</div>
             <div className="mono text-[8px] text-white/40 tracking-widest">UNIT CREDIT</div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-neon-blue text-black text-[10px] font-bold px-3 py-1 oswald uppercase tracking-tighter shadow-neon">{product.tag}</span>
            <span className="text-white/40 mono text-[9px] uppercase tracking-[0.2em]">{product.id}</span>
          </div>
          <h1 className="oswald text-6xl md:text-8xl uppercase mb-6 tracking-tighter leading-none glitch-text">{product.name}</h1>
          <p className="text-white/60 mono text-[11px] leading-loose uppercase mb-12 p-6 border-l-2 border-neon-blue bg-white/5 backdrop-blur-md">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button onClick={() => addToCart(product)} className="flex-1 py-6 bg-neon-blue text-black oswald font-bold text-xl uppercase tracking-widest shadow-neon hover:bg-white transition-all flex items-center justify-center gap-3">
              <ShoppingBag size={24} /> Add to Manifest
            </button>
            <button onClick={() => toggleWishlist(product.id)} className={`px-10 py-6 border transition-all flex items-center justify-center ${wishlist.includes(product.id) ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/20 hover:border-white'}`}>
              <Heart size={24} className={wishlist.includes(product.id) ? "fill-red-500" : ""} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/5 border border-white/10">
                <div className="text-neon-blue oswald text-xl mb-1">TACTICAL</div>
                <div className="mono text-[9px] text-white/30 tracking-widest uppercase">GRADE_LEVEL</div>
             </div>
             <div className="p-4 bg-white/5 border border-white/10">
                <div className="text-neon-blue oswald text-xl mb-1">ENCRYPTED</div>
                <div className="mono text-[9px] text-white/30 tracking-widest uppercase">SHIPMENT_TYPE</div>
             </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-4xl mx-auto">
        <h3 className="oswald text-4xl uppercase tracking-widest mb-12 border-b border-white/10 pb-4 flex items-center gap-4"><MessageSquare className="text-neon-blue" /> Field Intel</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-6">
              {productReviews.length > 0 ? productReviews.map(rev => (
                <div key={rev.id} className="bg-white/5 p-6 border border-white/5 cyber-clip">
                  <div className="flex justify-between items-center mb-4">
                    <span className="oswald text-xs tracking-widest text-neon-blue">{rev.userName}</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-3 h-1 ${i < rev.rating ? 'bg-neon-blue shadow-neon' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-white/70 oswald uppercase text-xs leading-relaxed">{rev.comment}</p>
                </div>
              )) : <p className="text-white/20 oswald uppercase tracking-widest">No intelligence gathered for this asset.</p>}
           </div>

           <div className="bg-black/40 border border-white/10 p-8 cyber-clip h-fit">
              <h4 className="oswald text-xl uppercase mb-6 text-neon-blue">Submit Intelligence</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                 <div>
                    <label className="text-[10px] mono text-white/30 block mb-2 uppercase">Compatibility Rating (1-5)</label>
                    <div className="flex gap-2">
                       {[1,2,3,4,5].map(v => (
                         <button key={v} type="button" onClick={() => setRating(v)} className={`flex-1 h-2 transition-all ${rating >= v ? 'bg-neon-blue shadow-neon' : 'bg-white/10'}`}></button>
                       ))}
                    </div>
                 </div>
                 <textarea 
                  required 
                  value={reviewText} 
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="LOG YOUR REPORT..." 
                  className="w-full h-32 bg-black border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-xs resize-none"
                 />
                 <button className="w-full py-4 bg-neon-blue text-black oswald font-bold uppercase tracking-widest hover:bg-white transition-all text-xs shadow-neon">Transmit Intel</button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Store Provider Implementation ---

const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = JSON.parse(localStorage.getItem('ef_registry') || '[]');
    if (!saved.find((u: User) => u.email === 'admin@eaglefort.co')) {
      saved.push({ email: 'admin@eaglefort.co', name: 'Command Admin', password: 'admin', joinDate: '01/01/2025', wishlist: [], isAdmin: true });
    }
    return saved;
  });
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ef_products') || JSON.stringify(INITIAL_PRODUCTS)));
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('ef_cart') || '[]'));
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('ef_active_session') || 'null'));
  const [allOrders, setAllOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('ef_global_logs') || '[]'));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => JSON.parse(localStorage.getItem('ef_audit_logs') || '[]'));
  const [subscribers, setSubscribers] = useState<string[]>(() => JSON.parse(localStorage.getItem('ef_subscribers') || '[]'));
  const [reviews, setReviews] = useState<Review[]>(() => JSON.parse(localStorage.getItem('ef_reviews') || '[]'));
  const [theme, setTheme] = useState<'high' | 'desaturated'>(() => (localStorage.getItem('ef_theme') as any) || 'high');
  const [announcement, setAnnouncementState] = useState(() => localStorage.getItem('ef_announcement') || 'NEURAL DROP LIVE // ACCESS THE ARMORY NOW');

  useEffect(() => localStorage.setItem('ef_registry', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('ef_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('ef_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('ef_active_session', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('ef_global_logs', JSON.stringify(allOrders)), [allOrders]);
  useEffect(() => localStorage.setItem('ef_audit_logs', JSON.stringify(auditLogs)), [auditLogs]);
  useEffect(() => localStorage.setItem('ef_subscribers', JSON.stringify(subscribers)), [subscribers]);
  useEffect(() => localStorage.setItem('ef_reviews', JSON.stringify(reviews)), [reviews]);
  useEffect(() => localStorage.setItem('ef_announcement', announcement), [announcement]);
  
  useEffect(() => {
    localStorage.setItem('ef_theme', theme);
    if (theme === 'desaturated') document.documentElement.classList.add('theme-desaturated');
    else document.documentElement.classList.remove('theme-desaturated');
  }, [theme]);

  const addAudit = (action: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: new Date().toLocaleTimeString(),
      user: user?.email || 'SYSTEM'
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const wishlist = useMemo(() => user?.wishlist || [], [user]);
  const userOrders = useMemo(() => user ? allOrders.filter(o => o.userId === user.email) : [], [allOrders, user]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);
  
  const signup = (email: string, name: string, password: string) => {
    if (allUsers.find(u => u.email === email)) return false;
    const newUser: User = { email, name, password, joinDate: new Date().toLocaleDateString(), wishlist: [], isAdmin: email === 'admin@eaglefort.co' };
    setAllUsers([...allUsers, newUser]);
    setUser(newUser);
    addAudit(`Registered new operative: ${email}`);
    return true;
  };

  const login = (email: string, password: string) => {
    const found = allUsers.find(u => u.email === email && u.password === password);
    if (found) { setUser(found); addAudit(`Uplink authorized: ${email}`); return true; }
    addAudit(`Uplink failed: ${email}`);
    return false;
  };

  const subscribeNewsletter = (email: string) => {
    if (!subscribers.includes(email)) {
       setSubscribers(prev => [...prev, email]);
       addAudit(`New neural subscriber: ${email}`);
       alert("Neural Link Synced.");
    }
  };

  const addReview = (rev: Omit<Review, 'id' | 'date'>) => {
    const newRev: Review = { ...rev, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString() };
    setReviews(prev => [newRev, ...prev]);
    addAudit(`Intel submission: ${rev.productId} by ${rev.userId}`);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'high' ? 'desaturated' : 'high');
    addAudit(`Theme modulated to ${theme === 'high' ? 'desaturated' : 'high'}`);
  };

  const placeOrder = async () => {
    if (!user) return;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      userId: user.email,
      items: cart.map(i => `${i.name} (x${i.quantity})`),
      total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      status: 'PROCESSING',
      date: new Date().toLocaleDateString(),
      paymentMethod: 'SIGNAL_TRANSFER'
    };
    setAllOrders([newOrder, ...allOrders]);
    addAudit(`Deployment initiated: Order ${newOrder.id}`);
    clearCart();
  };

  const toggleWishlist = (productId: string) => {
    if (!user) return;
    const isSaved = user.wishlist.includes(productId);
    const newWishlist = isSaved ? user.wishlist.filter(id => id !== productId) : [...user.wishlist, productId];
    const updatedUser = { ...user, wishlist: newWishlist };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.email === user.email ? updatedUser : u));
    addAudit(`${isSaved ? 'Removed' : 'Saved'} gear to loadout: ${productId}`);
  };

  // Admin Controls
  const addProduct = (p: Product) => { setProducts([...products, p]); addAudit(`Registered asset: ${p.id}`); };
  const updateProduct = (p: Product) => { setProducts(products.map(item => item.id === p.id ? p : item)); addAudit(`Updated asset: ${p.id}`); };
  const deleteProduct = (id: string) => { setProducts(products.filter(p => p.id !== id)); addAudit(`Decommissioned asset: ${id}`); };
  const updateOrderStatus = (id: string, s: Order['status']) => { setAllOrders(allOrders.map(o => o.id === id ? { ...o, status: s } : o)); addAudit(`Deployment status update: ${id} to ${s}`); };
  const deleteUser = (email: string) => { setAllUsers(allUsers.filter(u => u.email !== email)); addAudit(`Terminated operative session: ${email}`); };
  const setAnnouncement = (text: string) => { setAnnouncementState(text); addAudit(`Global broadcast updated`); };
  const deleteReview = (id: string) => { setReviews(prev => prev.filter(r => r.id !== id)); addAudit(`Intel purged: ${id}`); };

  return (
    <StoreContext.Provider value={{ 
      products, cart, user, wishlist, userOrders, allOrders, allUsers, auditLogs, subscribers, reviews, theme, announcement,
      addToCart, updateQuantity, removeFromCart, clearCart, toggleWishlist, login, signup, addReview, subscribeNewsletter,
      logout: () => { setUser(null); addAudit(`Uplink terminated`); }, placeOrder, toggleTheme, addProduct, updateProduct, 
      deleteProduct, updateOrderStatus, deleteUser, setAnnouncement, deleteReview
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- Neural Assistant ---

const StyleAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chat]);

  const askAI = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setPrompt('');
    setChat(prev => [...prev, {role: 'user', text: userMsg}]);
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'You are "FORT-AI", the tactical support assistant for Eagle Fort Company. Tone: Professional, futuristic, crisp. Help with sizing, gear compatibility, or mission status.',
        }
      });
      setChat(prev => [...prev, {role: 'ai', text: response.text || 'Interface error.'}]);
    } catch { setChat(prev => [...prev, {role: 'ai', text: "Signal interference. Try again later."}]); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500]">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[450px] bg-black/80 backdrop-blur-3xl border border-[var(--neon-blue)]/30 flex flex-col shadow-2xl animate-in fade-in duration-500 cyber-clip">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[var(--neon-blue)]/5">
            <div className="flex items-center gap-2 oswald uppercase text-xs font-bold text-neon-blue"><Bot size={16} className="animate-pulse" /> FORT-AI Support</div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white"><X size={18} /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            <div className="bg-neon-blue/10 border border-neon-blue/20 p-3 text-[11px] text-white">READY FOR INPUT. HOW CAN I ASSIST YOUR MISSION?</div>
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-[11px] ${msg.role === 'user' ? 'bg-white/5 border border-white/10' : 'bg-neon-blue/10 border border-neon-blue/20 text-white shadow-neon'}`}>{msg.text}</div>
              </div>
            ))}
            {loading && <div className="text-neon-blue mono text-[9px] animate-pulse uppercase tracking-[0.2em]">DECODING SIGNAL...</div>}
          </div>
          <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="QUERY COMMAND..." className="flex-1 bg-black/60 border border-white/5 px-4 py-3 text-[11px] mono uppercase text-white outline-none focus:border-neon-blue/50" onKeyDown={e => e.key === 'Enter' && askAI()} />
            <button onClick={askAI} className="bg-neon-blue text-black px-4 hover:bg-white transition-all shadow-neon"><Send size={14} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-black border border-neon-blue/40 text-neon-blue rounded-full flex items-center justify-center shadow-neon hover:scale-105 active:scale-95 transition-all"><Bot size={28} /></button>
      )}
    </div>
  );
};

const Footer: React.FC = () => {
  const { subscribeNewsletter } = useStore();
  const [email, setEmail] = useState('');

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { subscribeNewsletter(email); setEmail(''); }
  };

  return (
    <footer className="py-24 bg-black border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-24">
        <div className="lg:col-span-1">
           <h3 className="oswald text-4xl md:text-5xl uppercase mb-6 tracking-tighter glitch-text">Stay Wired</h3>
           <p className="text-white/40 mb-8 max-w-sm mono text-[10px] uppercase tracking-[0.3em] leading-loose">The premier source for high-performance urban gear. Operating at the edge of the sprawl since 2025.</p>
           <form onSubmit={handleSync} className="flex gap-2 max-w-sm">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL ADDRESS" className="flex-1 bg-white/5 border border-white/10 px-4 py-3 oswald uppercase text-[11px] text-white outline-none focus:border-neon-blue" />
              <button className="px-6 py-3 bg-white/10 hover:bg-neon-blue hover:text-black transition-all oswald uppercase font-bold tracking-widest text-[11px] cyber-clip shadow-neon">Sync</button>
           </form>
        </div>
        <div className="space-y-6">
           <h4 className="oswald uppercase tracking-[0.3em] text-[10px] text-neon-blue">Navigation</h4>
           <div className="flex flex-col gap-3 text-white/30 oswald uppercase text-sm tracking-widest">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/shop" className="hover:text-white transition-colors">Catalog</Link>
              <Link to="/about" className="hover:text-white transition-colors">Our Ethos</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact Hub</Link>
           </div>
        </div>
        <div className="space-y-6">
           <h4 className="oswald uppercase tracking-[0.3em] text-[10px] text-neon-blue">Operative Portal</h4>
           <div className="flex flex-col gap-3 text-white/30 oswald uppercase text-sm tracking-widest">
              <Link to="/auth" className="hover:text-white transition-colors">Identify / Join</Link>
              <Link to="/account" className="hover:text-white transition-colors">Neural Records</Link>
              <Link to="/wishlist" className="hover:text-white transition-colors">Saved Loadout</Link>
              <Link to="/cart" className="hover:text-white transition-colors">Active Manifest</Link>
           </div>
        </div>
      </div>
      <div className="mt-24 border-t border-white/5 pt-8 text-center text-[8px] mono text-white/10 uppercase tracking-[0.5em]">© 2025 EAGLE FORT COMPANY // GLOBAL STEALTH LOGISTICS</div>
    </footer>
  );
};

const About: React.FC = () => (
  <div className="pt-40 px-6 md:px-12 max-w-4xl mx-auto pb-20">
    <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-12 glitch-text">Our Ethos</h1>
    <div className="space-y-8 text-white/60 leading-relaxed uppercase mono text-sm">
      <p>Eagle Fort was born in the shadows of the neo-sprawl. We recognize that in a world of total surveillance, anonymity and utility are the only true currencies.</p>
      <div className="p-8 bg-white/5 border border-white/10 border-l-4 border-l-neon-blue backdrop-blur-xl cyber-clip">
        <h3 className="text-neon-blue oswald text-2xl mb-4">Tactical Protocol 001</h3>
        <p>To provide high-performance techwear that bridges the gap between urban fashion and survival hardware.</p>
      </div>
      <p>Every piece in our catalog is rigorously tested in high-density urban environments. From signal-blocking fabrics to reinforced modular attachments, our gear is built for those who operate on the edge of the grid.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <div className="bg-white/5 p-6 border border-white/5 cyber-clip">
          <div className="text-neon-blue oswald text-4xl mb-2">2025</div>
          <div className="text-[10px] tracking-widest text-white/40 uppercase">FOUNDED</div>
        </div>
        <div className="bg-white/5 p-6 border border-white/5 cyber-clip">
          <div className="text-neon-blue oswald text-4xl mb-2">12+</div>
          <div className="text-[10px] tracking-widest text-white/40 uppercase">GLOBAL HUBS</div>
        </div>
        <div className="bg-white/5 p-6 border border-white/5 cyber-clip">
          <div className="text-neon-blue oswald text-4xl mb-2">∞</div>
          <div className="text-[10px] tracking-widest text-white/40 uppercase">DURABILITY</div>
        </div>
      </div>
    </div>
  </div>
);

const Contact: React.FC = () => (
  <div className="pt-40 px-6 md:px-12 max-w-4xl mx-auto pb-20">
    <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-12 glitch-text">Contact Hub</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-8">
        <p className="text-white/40 uppercase mono text-[10px] leading-loose tracking-[0.2em]">TRANSMIT QUERIES VIA SECURE UPLINK OR VISIT A PHYSICAL STATION IN SECTOR 7.</p>
        <div className="space-y-6">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-blue transition-colors"><Mail className="text-neon-blue" size={20} /></div>
            <div>
              <div className="oswald uppercase text-[9px] tracking-widest text-white/40">Encryption Key</div>
              <div className="oswald uppercase text-lg">ops@eaglefort.co</div>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-blue transition-colors"><Phone className="text-neon-blue" size={20} /></div>
            <div>
              <div className="oswald uppercase text-[9px] tracking-widest text-white/40">Frequency</div>
              <div className="oswald uppercase text-lg">+1 (555) NEON-FORT</div>
            </div>
          </div>
        </div>
      </div>
      <form className="space-y-4 bg-white/5 p-10 border border-white/10 cyber-clip">
        <input placeholder="OPERATIVE IDENTIFIER" className="w-full bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
        <input placeholder="SECURE CHANNEL" className="w-full bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
        <textarea placeholder="MESSAGE SEQUENCE" rows={4} className="w-full bg-black/40 border border-white/10 p-4 outline-none focus:border-neon-blue text-white oswald uppercase text-xs resize-none" />
        <button className="w-full py-5 bg-neon-blue text-black oswald font-bold uppercase tracking-widest hover:bg-white transition-all shadow-neon">Broadcast Signal</button>
      </form>
    </div>
  </div>
);

const Wishlist: React.FC = () => {
  const { products, wishlist } = useStore();
  const list = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-12 glitch-text">Saved Gear</h1>
      {list.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-40 bg-white/5 border border-dashed border-white/10 cyber-clip">
          <p className="oswald text-white/20 uppercase tracking-[0.5em] text-2xl mb-8">LOADOUT EMPTY</p>
          <Link to="/shop" className="text-neon-blue oswald uppercase tracking-widest border border-neon-blue px-8 py-3 hover:bg-neon-blue hover:text-black transition-all">Go to Armory</Link>
        </div>
      )}
    </div>
  );
};

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto text-center py-40 border border-white/5 bg-white/5 cyber-clip">
        <h1 className="oswald text-6xl uppercase tracking-tighter mb-8 text-white/20">Manifest Empty</h1>
        <Link to="/shop" className="text-neon-blue oswald uppercase tracking-widest border border-neon-blue px-10 py-4 hover:bg-neon-blue hover:text-black transition-all">Open Armory</Link>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-12 glitch-text">Your Manifest</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/5 p-6 flex gap-6 items-center hover:border-neon-blue/20 transition-all cyber-clip">
              <div className="w-20 h-20 bg-black flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                <IconMapper name={item.icon} size={32} />
              </div>
              <div className="flex-1">
                <h3 className="oswald text-2xl uppercase mb-1">{item.name}</h3>
                <div className="oswald text-neon-blue font-bold">${item.price}</div>
              </div>
              <div className="flex items-center gap-4 bg-black/60 border border-white/10 px-4 py-2">
                <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-neon-blue transition-colors"><Minus size={16} /></button>
                <span className="oswald text-xl font-bold min-w-[20px] text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-neon-blue transition-colors"><Plus size={16} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-white/10 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 p-10 flex flex-col h-fit cyber-clip backdrop-blur-xl shadow-neon">
          <h3 className="oswald text-3xl uppercase mb-8 border-b border-white/10 pb-4 tracking-widest">Strategic Total</h3>
          <div className="space-y-4 mb-10">
            <div className="flex justify-between text-white/30 mono text-[10px] uppercase">
              <span>Assets Value</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-white/30 mono text-[10px] uppercase">
              <span>Logistics (Express)</span>
              <span className="text-neon-blue">ENCRYPTED/FREE</span>
            </div>
            <div className="flex justify-between text-4xl oswald uppercase font-bold text-neon-blue pt-6 border-t border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <span>Final Cred</span>
              <span>${total}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="w-full py-6 bg-neon-blue text-black oswald font-bold text-2xl uppercase tracking-widest shadow-neon hover:bg-white transition-all">
            Secure Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, signup, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/account'); }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      if (!login(email, password)) alert("ACCESS DENIED: Credentials Invalid");
    } else {
      if (!signup(email, name, password)) alert("IDENTIFIER TAKEN");
    }
  };

  return (
    <div className="pt-40 px-6 md:px-12 max-w-lg mx-auto pb-40">
      <div className="bg-white/5 border border-white/10 p-12 cyber-clip relative backdrop-blur-3xl shadow-neon">
        <h1 className="oswald text-5xl md:text-6xl uppercase mb-10 tracking-tighter glitch-text">{isLogin ? 'Identity' : 'Enlist'}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <input required placeholder="OPERATIVE IDENTIFIER" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
          )}
          <input required type="email" placeholder="SECURE CHANNEL (EMAIL)" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
          <input required type="password" placeholder="ACCESS KEY (PASSWORD)" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
          <button className="w-full py-6 bg-neon-blue text-black oswald font-bold text-xl uppercase tracking-widest shadow-neon hover:bg-white transition-all">
            {isLogin ? 'EXECUTE UPLINK' : 'INITIATE REGISTRY'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-white/30 oswald uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">
          {isLogin ? 'No identity registered? Click to Enlist' : 'Existing operative? Request Uplink'}
        </button>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user, logout, userOrders } = useStore();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/auth'); }, [user]);
  if (!user) return null;

  return (
    <div className="pt-40 px-6 md:px-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
        <div>
          <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-2 glitch-text">Records</h1>
          <p className="text-white/40 mono text-[10px] uppercase tracking-[0.5em]">{user.name} // AUTH_LEVEL: {user.isAdmin ? '5 (OVERSEER)' : '1 (OPERATIVE)'}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 px-8 py-3 border border-red-500/30 text-red-500 oswald uppercase text-xs tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all cyber-clip">
          <LogOut size={16} /> TERMINATE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 p-10 cyber-clip relative overflow-hidden backdrop-blur-md">
            <h3 className="oswald text-2xl uppercase mb-8 text-neon-blue tracking-widest">Neural Link Details</h3>
            <div className="space-y-6 mono text-[10px] uppercase tracking-[0.3em]">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-white/20">Uplink ID</span>
                <span className="text-white/80">{user.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-white/20">Registry Date</span>
                <span className="text-white/80">{user.joinDate}</span>
              </div>
            </div>
          </div>
          {user.isAdmin && (
            <Link to="/admin" className="block p-10 bg-red-500/10 border border-red-500/30 text-red-500 text-center oswald uppercase tracking-[0.5em] hover:bg-red-500 hover:text-white transition-all cyber-clip shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              MISSION CONTROL ACCESS
            </Link>
          )}
        </div>

        <div className="lg:col-span-2 space-y-12">
          <h3 className="oswald text-4xl uppercase tracking-widest border-b border-white/10 pb-4">Mission Logs</h3>
          <div className="space-y-8">
            {userOrders.map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 p-10 relative overflow-hidden hover:border-neon-blue/20 transition-all cyber-clip">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <div className="oswald text-3xl uppercase mb-1 tracking-wider">Mission #{order.id}</div>
                    <div className="mono text-[10px] text-white/20 uppercase tracking-[0.3em]">{order.date} // {order.paymentMethod}</div>
                  </div>
                  <div className="oswald text-4xl font-bold text-neon-blue shadow-neon">${order.total}</div>
                </div>
                <div className="flex flex-wrap gap-2 mb-10">
                  {order.items.map((item, i) => (
                    <span key={i} className="bg-white/5 border border-white/10 px-4 py-1 mono text-[9px] uppercase text-white/50">{item}</span>
                  ))}
                </div>
                <MissionTracker status={order.status} />
              </div>
            ))}
            {userOrders.length === 0 && (
              <div className="text-center py-32 bg-white/5 border border-dashed border-white/10 cyber-clip">
                <p className="oswald text-white/10 uppercase tracking-[0.6em] text-xl">NO MISSIONS RECORDED</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const { cart, placeOrder, user } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
    if (cart.length === 0 && !success) navigate('/shop');
  }, [user, cart, success]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 2500));
    await placeOrder({});
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="pt-40 px-6 md:px-12 max-w-2xl mx-auto text-center py-40 bg-white/5 border border-white/10 cyber-clip shadow-neon">
        <div className="w-24 h-24 bg-neon-blue/20 border border-neon-blue rounded-full flex items-center justify-center text-neon-blue mx-auto mb-10 shadow-neon animate-pulse">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-6 glitch-text">UPLINK SYNC</h1>
        <p className="text-white/40 mono text-[11px] uppercase tracking-[0.3em] mb-12 leading-loose">Deployment protocols initiated. Mission tracking data broadcasting to your neural link now.</p>
        <button onClick={() => navigate('/account')} className="px-12 py-5 bg-neon-blue text-black oswald font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-neon">VIEW MISSION LOGS</button>
      </div>
    );
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="pt-40 px-6 md:px-12 max-w-5xl mx-auto pb-40">
      <h1 className="oswald text-6xl md:text-8xl uppercase tracking-tighter mb-16 glitch-text">Authorization</h1>
      <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div className="space-y-12">
          <h3 className="oswald text-3xl uppercase tracking-widest border-b border-white/10 pb-4 text-white/50">Drop Sector</h3>
          <div className="space-y-6">
            <input required placeholder="STREET COORDS" className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="HUB / CITY" className="bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
              <input required placeholder="POSTAL KEY" className="bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
            </div>
            <input required placeholder="GLOBAL GRID (COUNTRY)" className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
          </div>
        </div>
        <div className="space-y-12">
          <h3 className="oswald text-3xl uppercase tracking-widest border-b border-white/10 pb-4 text-white/50">Neural Cred</h3>
          <div className="bg-white/5 border border-white/10 p-10 cyber-clip space-y-8 backdrop-blur-xl shadow-neon">
            <div className="flex items-center gap-4 text-neon-blue">
               <CreditCard size={32} />
               <span className="oswald text-xl uppercase tracking-[0.3em]">SECURE SYNC</span>
            </div>
            <div className="space-y-4">
              <input required placeholder="CARD SEQUENCE" className="w-full bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="EXP CYCLE" className="bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
                <input required placeholder="PIN / CVV" className="bg-black/40 border border-white/10 p-5 outline-none focus:border-neon-blue text-white oswald uppercase text-xs" />
              </div>
            </div>
            <div className="pt-10 border-t border-white/10">
              <div className="flex justify-between text-4xl oswald uppercase font-bold text-neon-blue mb-10">
                <span>Value</span>
                <span>${total}</span>
              </div>
              <button disabled={loading} className="w-full py-6 bg-neon-blue text-black oswald font-bold text-2xl uppercase tracking-[0.4em] shadow-neon hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? <Loader2 size={32} className="animate-spin" /> : <><Lock size={24}/> AUTHORIZE</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <AnnouncementBar />
        <ParticleBackground />
        <Navbar />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <StyleAssistant />
        <Footer />
      </Router>
    </StoreProvider>
  );
}

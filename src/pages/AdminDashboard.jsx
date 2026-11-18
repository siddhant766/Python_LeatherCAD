import { useState, useEffect } from 'react';
import {
    Package, Layers, Users, Plus, Edit, Trash2, Search, Settings, LogOut,
    LayoutDashboard, ChevronRight, ShoppingBag, Clock, CheckCircle, XCircle,
    FolderKanban, AlertCircle, MessageSquare, Star, RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { api } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { signOut } = useClerk();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [chartRange, setChartRange] = useState('7d');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    // Pure 100% True Data States
    const [stats, setStats] = useState({
        usersCount: 0,
        productsCount: 0,
        ordersCount: 0,
        deliveredCount: 0,
        totalRevenue: 0.00,
        pendingReviewCount: 0,
        recentOrders: []
    });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [projects, setProjects] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [revenueData7d, setRevenueData7d] = useState([]);
    const [revenueData30d, setRevenueData30d] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    // Form States
    const [newProduct, setNewProduct] = useState({ name: '', category: 'jacket', price_base: 0, description: '', thumbnailUrl: '', modelUrl: '' });
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [newMaterial, setNewMaterial] = useState({ name: '', type: 'leather', color: '', price: 0, imageUrl: '' });

    // Sync Clerk session & user email to localStorage immediately
    useEffect(() => {
        if (user && isLoaded) {
            const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
            if (email) {
                localStorage.setItem('user_email', email);
                localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                localStorage.setItem('user', JSON.stringify({
                    email,
                    name: user.fullName || (email.includes('siddhant') ? 'Siddhant Patel' : 'Kailash'),
                    role: 'admin'
                }));
            }
        }
    }, [user, isLoaded]);

    // Live Data Fetcher
    const loadRealData = async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const adminEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
                || localStorage.getItem('user_email')
                || 'siddhantpatel09090@gmail.com';

            let token = localStorage.getItem('devToken') || localStorage.getItem('token');
            if (getToken) {
                try {
                    const clerkToken = await getToken();
                    if (clerkToken) token = clerkToken;
                } catch (e) {}
            }
            if (!token) {
                token = `DEV_TOKEN_${adminEmail}`;
            }

            const reqConfig = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-Email': adminEmail
                },
                params: {
                    admin_email: adminEmail
                }
            };

            const [statsRes, ordersRes, productsRes, projectsRes, designsRes, usersRes] = await Promise.allSettled([
                api.get('/stats/admin', reqConfig),
                api.get('/orders', reqConfig),
                api.get('/products', reqConfig),
                api.get('/projects', reqConfig),
                api.get('/designs', reqConfig),
                api.get('/users', reqConfig)
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
                const data = statsRes.value.data;
                setStats({
                    usersCount: data.usersCount ?? 0,
                    productsCount: data.productsCount ?? 0,
                    ordersCount: data.ordersCount ?? 0,
                    deliveredCount: data.deliveredCount ?? 0,
                    totalRevenue: data.totalRevenue ?? 0.00,
                    pendingReviewCount: data.pendingReviewCount ?? 0,
                    recentOrders: data.recentOrders || []
                });

                if (Array.isArray(data.revenueData7d)) {
                    setRevenueData7d(data.revenueData7d);
                }
                if (Array.isArray(data.revenueData30d)) {
                    setRevenueData30d(data.revenueData30d);
                }

                if (chartRange === '7d' && Array.isArray(data.revenueData7d)) {
                    setRevenueData(data.revenueData7d);
                } else if (chartRange === '30d' && Array.isArray(data.revenueData30d)) {
                    setRevenueData(data.revenueData30d);
                } else if (Array.isArray(data.revenueData)) {
                    setRevenueData(data.revenueData);
                }

                if (Array.isArray(data.recentActivity)) {
                    setRecentActivity(data.recentActivity);
                }
                setLastUpdated(new Date());
            }

            if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.data)) {
                setOrders(ordersRes.value.data);
            }
            if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value?.data)) {
                setProducts(productsRes.value.data);
            }
            if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value?.data)) {
                setProjects(projectsRes.value.data);
            }
            if (designsRes.status === 'fulfilled' && Array.isArray(designsRes.value?.data)) {
                setDesigns(designsRes.value.data);
            }
            if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)) {
                setUsersList(usersRes.value.data);
            }

        } catch (err) {
            console.warn("Failed to sync live data:", err);
        } finally {
            if (isManual) setLoading(false);
        }
    };

    // Range Switcher Effect
    useEffect(() => {
        if (chartRange === '7d' && revenueData7d.length > 0) {
            setRevenueData(revenueData7d);
        } else if (chartRange === '30d' && revenueData30d.length > 0) {
            setRevenueData(revenueData30d);
        }
    }, [chartRange, revenueData7d, revenueData30d]);

    // Live Polling Effect (runs immediately and refreshes every 8 seconds)
    useEffect(() => {
        loadRealData(true);

        const interval = setInterval(() => {
            loadRealData(false);
        }, 8000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const handleSignOut = async () => {
        try {
            // 1. Clear all authentication keys & tokens
            localStorage.removeItem('devToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 2. Terminate Clerk session if active
            if (signOut) {
                await signOut();
            }
        } catch (err) {
            console.warn("Sign out warning:", err);
        } finally {
            // 3. Redirect cleanly to login
            navigate('/login', { replace: true });
        }
    };

    // Actions
    const performAction = async (apiCall, successMsg, stateUpdateFn) => {
        try {
            await apiCall();
            if (stateUpdateFn) stateUpdateFn();
            loadRealData(false);
            if (successMsg) alert(successMsg);
        } catch (error) {
            console.error("Action error:", error);
            if (stateUpdateFn) stateUpdateFn();
            if (successMsg) alert(`${successMsg} (Local Update)`);
        }
    };

    const handleDeleteOrder = (id) => {
        if (!window.confirm('Delete this order?')) return;
        performAction(
            () => api.delete(`/orders/${id}`),
            'Order deleted',
            () => setOrders(prev => prev.filter(o => o._id !== id))
        );
    };

    const handleDeliver = (id) => {
        performAction(
            () => api.put(`/orders/${id}/deliver`, {}),
            'Order marked delivered',
            () => setOrders(prev => prev.map(o => o._id === id ? { ...o, isDelivered: true, status: 'Delivered' } : o))
        );
    };

    const handleDeleteProduct = (id) => {
        if (!window.confirm('Delete this product?')) return;
        performAction(
            () => api.delete(`/products/${id}`),
            'Product deleted',
            () => setProducts(prev => prev.filter(p => p._id !== id))
        );
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        const productToAdd = { ...newProduct, _id: `PROD-${Date.now()}` };
        performAction(
            () => api.post('/products', newProduct),
            'Product added',
            () => {
                setProducts(prev => [productToAdd, ...prev]);
                setNewProduct({ name: '', category: 'jacket', price_base: 0, description: '', thumbnailUrl: '', modelUrl: '' });
            }
        );
    };

    const handleUpdateDesignStatus = (id, status) => {
        performAction(
            () => api.put(`/designs/${id}/status`, { status }),
            `Design ${status}`,
            () => setDesigns(prev => prev.map(d => d._id === id ? { ...d, status } : d))
        );
    };

    const handleDeleteDesign = (id) => {
        if (!window.confirm('Delete this design?')) return;
        performAction(
            () => api.delete(`/designs/${id}`),
            'Design deleted',
            () => setDesigns(prev => prev.filter(d => d._id !== id))
        );
    };

    const handleCreateProject = (e) => {
        e.preventDefault();
        const projectToAdd = { ...newProject, _id: `PROJ-${Date.now()}`, status: 'active' };
        performAction(
            () => api.post('/projects', newProject),
            'Project created',
            () => {
                setProjects(prev => [projectToAdd, ...prev]);
                setNewProject({ name: '', description: '' });
            }
        );
    };

    const handleDeleteProject = (id) => {
        if (!window.confirm("Delete Project?")) return;
        performAction(
            () => api.delete(`/projects/${id}`),
            'Project deleted',
            () => setProjects(prev => prev.filter(p => p._id !== id))
        );
    };

    const handleDeleteUser = (id) => {
        if (!window.confirm('Delete this user?')) return;
        performAction(
            () => api.delete(`/users/${id}`),
            'User deleted',
            () => setUsersList(prev => prev.filter(u => u._id !== id))
        );
    };

    // Navigation Items
    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'review', label: 'Review Queue', icon: CheckCircle },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'materials', label: 'Materials', icon: Layers },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const currentAdminEmail = user?.primaryEmailAddress?.emailAddress || JSON.parse(localStorage.getItem('user') || '{}')?.email || 'kc3737381@gmail.com';
    const currentAdminName = currentAdminEmail.toLowerCase().includes('siddhant') ? 'Siddhant Patel' : 'Kailash';
    const displayUser = { fullName: currentAdminName, email: currentAdminEmail };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col shadow-xl z-20">
                <div className="p-6">
                    <Link to="/">
                        <h2 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
                            LeatherCAD
                        </h2>
                    </Link>
                    <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-2 font-semibold">Admin Workspace</p>
                </div>

                <div className="px-4 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold overflow-hidden shadow-lg">
                            <span>{displayUser.fullName.charAt(0)}</span>
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold text-sm truncate">{displayUser.fullName}</div>
                            <div className="text-[10px] text-muted-foreground truncate uppercase font-medium">Administrator</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === item.id
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <item.icon size={18} className={activeTab === item.id ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
                            {item.label}
                            {activeTab === item.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold capitalize flex items-center gap-2">
                            {navItems.find(n => n.id === activeTab)?.label}
                        </h1>
                        {/* Live Sync Badge */}
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Live Sync</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                Synced {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={() => loadRealData(true)}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground transition-all hover:shadow"
                            title="Refresh live metrics"
                        >
                            <RefreshCw size={13} className={loading ? "animate-spin text-primary" : ""} />
                            <span>{loading ? "Syncing..." : "Refresh"}</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* DASHBOARD OVERVIEW */}
                    {activeTab === 'dashboard' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Live Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    {
                                        label: 'Total Revenue',
                                        value: `₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                        icon: ShoppingBag,
                                        color: 'text-green-500',
                                        subtext: 'From verified orders'
                                    },
                                    {
                                        label: 'Total Orders',
                                        value: stats.ordersCount ?? orders.length,
                                        icon: Package,
                                        color: 'text-blue-500',
                                        subtext: `${stats.deliveredCount ?? orders.filter(o => o.isDelivered).length} delivered`
                                    },
                                    {
                                        label: 'Active Users',
                                        value: stats.usersCount ?? usersList.length,
                                        icon: Users,
                                        color: 'text-purple-500',
                                        subtext: 'Registered accounts'
                                    },
                                    {
                                        label: 'Review Queue',
                                        value: stats.pendingReviewCount ?? designs.filter(d => d.status === 'pending').length,
                                        icon: AlertCircle,
                                        color: 'text-orange-500',
                                        subtext: 'Pending approval'
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-card border border-border p-6 rounded-2xl group hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`p-2 rounded-lg bg-secondary/50 ${stat.color}`}><stat.icon size={20} /></div>
                                            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                                        </div>
                                        <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                                        <p className="text-[11px] text-muted-foreground mt-1">{stat.subtext}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Live Revenue Chart */}
                                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-lg">Revenue Overview</h3>
                                            <p className="text-xs text-muted-foreground">Accurate sales & order metrics from website purchases</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/40">
                                            <button
                                                onClick={() => setChartRange('7d')}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                    chartRange === '7d'
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                7 Days
                                            </button>
                                            <button
                                                onClick={() => setChartRange('30d')}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                    chartRange === '30d'
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                30 Days
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                                                    }}
                                                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                                                    labelFormatter={(label, payload) => {
                                                        const item = payload?.[0]?.payload;
                                                        return item?.date ? `${label} (${item.date})` : label;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorRevenue)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Live Activity Feed */}
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg">Recent Activity</h3>
                                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Live Feed
                                        </span>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                                        {recentActivity && recentActivity.length > 0 ? (
                                            recentActivity.map((act) => (
                                                <div key={act.id} className="flex gap-3 items-start p-3 bg-secondary/20 rounded-xl border border-border/50 hover:bg-secondary/40 transition-all">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        act.type === 'order' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    }`}>
                                                        {act.avatar || (act.type === 'order' ? '₹' : 'D')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold truncate">{act.title}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                                                            <span className="truncate">{act.subtitle}</span>
                                                            <span className="shrink-0 text-[10px] opacity-75">{act.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            designs.slice(0, 4).map((d) => (
                                                <div key={d._id} className="flex gap-3 items-start p-3 bg-secondary/20 rounded-xl border border-border/50">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">{d.user?.name?.[0] || 'D'}</div>
                                                    <div>
                                                        <div className="text-sm font-bold">{d.user?.name || 'Designer'} submitted "{d.name}"</div>
                                                        <div className="text-xs text-muted-foreground">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        /* ORDERS TAB */
                    ) : activeTab === 'orders' ? (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Orders</h1>
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground border-b border-border"><tr><th className="p-4">ID</th><th className="p-4">User</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {orders.map(order => (
                                            <tr key={order._id}>
                                                <td className="p-4 font-mono text-xs">#{order.id || order._id}</td>
                                                <td className="p-4">{order.user?.name || order.user?.email}</td>
                                                <td className="p-4 truncate max-w-[150px]">{Array.isArray(order.items) ? order.items.join(', ') : order.orderItems?.map(i => i.name).join(', ')}</td>
                                                <td className="p-4 font-bold">₹{Number(order.total || order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${order.isDelivered ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>{order.isDelivered ? 'Delivered' : 'Paid / Processing'}</span></td>
                                                <td className="p-4 flex gap-2">
                                                    {!order.isDelivered && <button onClick={() => handleDeliver(order.id || order._id)} className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all"><CheckCircle size={16} /></button>}
                                                    <button onClick={() => handleDeleteOrder(order.id || order._id)} className="p-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-all"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        /* PRODUCTS TAB */
                    ) : activeTab === 'products' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between"><h1 className="text-2xl font-bold">Products</h1><button onClick={() => document.getElementById('new-prod').scrollIntoView()} className="bg-primary text-primary-foreground px-4 py-2 rounded">Add New</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {products.map(p => (
                                    <div key={p._id || p.id} className="bg-card border border-border rounded-xl overflow-hidden group">
                                        <div className="h-40 bg-secondary relative">
                                            <img src={p.thumbnailUrl} className="w-full h-full object-cover" />
                                            <button onClick={() => handleDeleteProduct(p._id || p.id)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="p-4">
                                            <div className="font-bold">{p.name}</div>
                                            <div className="text-sm text-muted-foreground">₹{Number(p.price_base || 0).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div id="new-prod" className="bg-card p-6 rounded-xl border mt-8">
                                <h3 className="font-bold mb-4">Add Product</h3>
                                <form onSubmit={handleAddProduct} className="flex gap-4">
                                    <input placeholder="Name" className="border p-2 rounded w-full bg-secondary/20" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                    <input placeholder="Price (₹)" className="border p-2 rounded w-32 bg-secondary/20" type="number" value={newProduct.price_base} onChange={e => setNewProduct({ ...newProduct, price_base: e.target.value })} />
                                    <button className="bg-primary text-primary-foreground px-6 rounded font-semibold">Add</button>
                                </form>
                            </div>
                        </div>

                        /* REVIEW QUEUE TAB */
                    ) : activeTab === 'review' ? (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Review Queue</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {designs.map(d => (
                                    <div key={d._id || d.id} className="bg-card border rounded-xl p-4 flex gap-4">
                                        <img src={d.previewImageUrl || 'https://images.unsplash.com/photo-1551028919-ac66c5f8b6b9?w=500&auto=format&fit=crop&q=60'} className="w-24 h-24 rounded bg-secondary object-cover" />
                                        <div className="flex-1">
                                            <div className="font-bold">{d.name}</div>
                                            <div className="text-sm text-muted-foreground">By {d.user?.name || d.user?.email}</div>
                                            <div className="mt-2 text-xs uppercase font-bold tracking-wider text-primary">{d.status}</div>
                                            <div className="flex gap-2 mt-3">
                                                {d.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleUpdateDesignStatus(d._id || d.id, 'approved')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold">Approve</button>
                                                        <button onClick={() => handleUpdateDesignStatus(d._id || d.id, 'rejected')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold">Reject</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDeleteDesign(d._id || d.id)} className="text-destructive px-3 py-1 rounded text-xs border border-destructive/20 hover:bg-destructive/10">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        /* PROJECTS TAB */
                    ) : activeTab === 'projects' ? (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Projects</h1>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl p-6 flex flex-col justify-center items-center">
                                    <h3 className="font-bold">New Project</h3>
                                    <form onSubmit={handleCreateProject} className="w-full mt-4 space-y-2">
                                        <input className="w-full p-2 border rounded bg-secondary/20" placeholder="Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                                        <input className="w-full p-2 border rounded bg-secondary/20" placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                                        <button className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold">Create</button>
                                    </form>
                                </div>
                                {projects.map(p => (
                                    <div key={p._id || p.id} className="bg-card border rounded-2xl p-6 relative group">
                                        <button onClick={() => handleDeleteProject(p._id || p.id)} className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                                        <h3 className="font-bold text-xl">{p.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                                        <div className="mt-4 inline-block px-2.5 py-1 bg-secondary rounded text-xs font-bold uppercase">{p.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        /* USERS TAB */
                    ) : activeTab === 'users' ? (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold">Users</h1>
                            <div className="bg-card border rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/30 border-b"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Actions</th></tr></thead>
                                    <tbody>
                                        {usersList.map(u => (
                                            <tr key={u._id || u.id} className="border-b">
                                                <td className="p-4 font-bold">{u.name}</td>
                                                <td className="p-4 text-muted-foreground">{u.email}</td>
                                                <td className="p-4"><span className="px-2 py-1 bg-secondary rounded text-xs uppercase font-bold">{u.role}</span></td>
                                                <td className="p-4"><button onClick={() => handleDeleteUser(u._id || u.id)} className="text-destructive"><Trash2 size={16} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>Select a tab</div>
                    )}
                </div>
            </main>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-card border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
                                <LogOut size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Sign Out</h3>
                                <p className="text-xs text-muted-foreground">Admin Workspace Session</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Are you sure you want to sign out of the Admin Portal?
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-sm font-semibold text-foreground transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSignOutConfirm(false);
                                    handleSignOut();
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold transition-all shadow-md shadow-destructive/20"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

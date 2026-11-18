import { useState, useEffect, useRef } from 'react';
import Product3DViewer from '../components/customizer/Product3DViewer';
import {
    ArrowLeft,
    Share2,
    Save,
    ShoppingCart,
    Layers,
    Palette,
    Sparkles,
    Loader2,
    Shield,
    Send,
    Minimize2,
    X,
    Check,
    Tag,
    Edit3,
    MessageSquare,
    IndianRupee,
    CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/CartStore';
import { useAuth } from '@clerk/clerk-react';

const DEFAULT_INR_PRICES = {
    bag: 4999,
    jacket: 14999,
    boots: 5999,
    wallet: 1499,
    belt: 1899
};

export default function Customizer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const addItem = useCartStore(state => state.addItem);
    const productFromUrl = searchParams.get('product') || 'bag';

    const captureRef = useRef(null);
    const chatEndRef = useRef(null);

    const [selectedProduct, setSelectedProduct] = useState(productFromUrl);
    const [activePart, setActivePart] = useState('body');

    // Designer Editable Selling Price in INR (₹)
    const [customPrice, setCustomPrice] = useState(DEFAULT_INR_PRICES[productFromUrl] || 4999);

    // Update state when URL changes
    useEffect(() => {
        if (searchParams.get('product')) {
            const p = searchParams.get('product');
            setSelectedProduct(p);
            setActivePart('body'); // Reset part selection
            setCustomPrice(DEFAULT_INR_PRICES[p] || 4999);
        }
    }, [searchParams]);

    const [config, setConfig] = useState({
        body: '#8B4513',
        handle: '#654321',
        sleeves: '#8B4513',
        hardware: '#FFD700',
        sole: '#1a1a1a',
        interior: '#D2B48C',
        strap: '#8B4513',
        buckle: '#FFD700'
    });

    // AI State (Sidebar quick input)
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPreviewConfig, setAiPreviewConfig] = useState(null);

    // Gemini Chat Assistant State (Bottom-right floating widget)
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [appliedMessageId, setAppliedMessageId] = useState(null);
    const [chatMessages, setChatMessages] = useState([
        {
            id: 'welcome',
            sender: 'gemini',
            reply: `Namaste! I'm your Gemini AI Leather Artisan. Describe your design vision, ask for bespoke color palettes, or let me recommend luxury leather finishes and INR retail prices for your ${selectedProduct}.`,
            config: null,
            suggestedPrice: null,
            time: 'Just now'
        }
    ]);

    // Auto-scroll chat to bottom
    const scrollToBottom = () => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [chatMessages, isChatOpen]);

    // Handle sending message to Gemini AI Assistant
    const handleSendGeminiPrompt = async (promptText) => {
        const text = (promptText || chatInput).trim();
        if (!text || isChatLoading) return;

        const userMsg = {
            id: `usr_${Date.now()}`,
            sender: 'user',
            reply: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatLoading(true);
        if (!isChatOpen) setIsChatOpen(true);

        try {
            const token = await getToken();
            const response = await axios.post(`${API_BASE}/ai/generate-design`, {
                prompt: text,
                productType: selectedProduct
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const data = response.data || {};
            const geminiMsg = {
                id: `gem_${Date.now()}`,
                sender: 'gemini',
                reply: data.reply || `I have formulated a tailored artisan design for your ${selectedProduct} inspired by "${text}".`,
                config: data.config || null,
                suggestedPrice: data.suggestedPrice || null,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setChatMessages(prev => [...prev, geminiMsg]);

            // Also update sidebar preview if triggered from sidebar
            if (data.config) {
                setAiPreviewConfig(data.config);
            }
        } catch (error) {
            console.error("Gemini AI error:", error);
            const fallbackMsg = {
                id: `gem_${Date.now()}`,
                sender: 'gemini',
                reply: `Here is a signature handcrafted palette for your ${selectedProduct}. Full-grain Tuscan leather with matching accents.`,
                config: {
                    body: '#8B4513',
                    handle: '#5C4033',
                    sleeves: '#8B4513',
                    sole: '#3D2B1F',
                    hardware: '#FFD700',
                    interior: '#D2B48C',
                    strap: '#8B4513',
                    buckle: '#FFD700'
                },
                suggestedPrice: DEFAULT_INR_PRICES[selectedProduct] || 4999,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsChatLoading(false);
            setIsGenerating(false);
        }
    };

    // Sidebar AI generator triggers the unified Gemini flow
    const handleSidebarAIGenerate = () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        handleSendGeminiPrompt(aiPrompt);
        setAiPrompt('');
    };

    const [productId, setProductId] = useState(null);

    useEffect(() => {
        const fetchProductId = async () => {
            try {
                const response = await axios.get(`${API_BASE}/products`);
                const product = response.data.find(p => p.category === selectedProduct || p.name.toLowerCase().includes(selectedProduct));
                if (product) {
                    setProductId(product._id);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            }
        };
        fetchProductId();
    }, [selectedProduct]);

    const handleSave = async () => {
        try {
            if (!productId) {
                alert("Error: Product definition not found in database. Cannot save.");
                return;
            }

            const name = prompt("Enter a name for your design:", `My Custom ${selectedProduct}`);
            if (!name) return;

            const token = await getToken();
            if (!token) {
                alert("Please login to save designs.");
                navigate('/login');
                return;
            }

            await axios.post(`${API_BASE}/designs`, {
                product: productId,
                name,
                configuration: config,
                price: Number(customPrice),
                isPublic: false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Design saved successfully!");
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save design.");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    // UI State
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, [selectedProduct]);

    // Dynamic Parts Configuration
    const PRODUCT_PARTS = {
        bag: ['body', 'handle', 'hardware'],
        jacket: ['body', 'sleeves', 'hardware'],
        boots: ['body', 'sole', 'hardware'],
        wallet: ['body', 'interior', 'hardware'],
        belt: ['strap', 'buckle', 'hardware']
    };

    const currentParts = PRODUCT_PARTS[selectedProduct] || PRODUCT_PARTS['bag'];

    const colors = [
        { name: 'Saddle Brown', value: '#8B4513' },
        { name: 'Classic Black', value: '#1a1a1a' },
        { name: 'Deep Burgundy', value: '#4A0404' },
        { name: 'Navy Blue', value: '#000080' },
        { name: 'Forest Green', value: '#228B22' },
        { name: 'Tan', value: '#D2B48C' },
        { name: 'Cognac', value: '#9A463D' },
        { name: 'Cream', value: '#FFFDD0' },
    ];

    const hardwareColors = [
        { name: 'Gold', value: '#FFD700' },
        { name: 'Silver', value: '#C0C0C0' },
        { name: 'Rose Gold', value: '#B76E79' },
        { name: 'Gunmetal', value: '#2C3539' },
    ];

    const handleColorChange = (color) => {
        setConfig(prev => ({ ...prev, [activePart]: color }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-2 capitalize">Loading {selectedProduct}...</h2>
                    <p className="text-gray-600">Preparing your 3D experience...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col md:flex-row bg-white relative overflow-hidden font-sans">
            {/* Left Sidebar - Controls */}
            <div className="w-full md:w-96 bg-gray-50 border-r border-gray-200 flex flex-col z-10 shadow-xl overflow-hidden shrink-0">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
                    <Link to="/catalog" className="text-gray-500 hover:text-black transition-colors" title="Back to Catalog">
                        <ArrowLeft size={24} />
                    </Link>
                    <Link to="/" className="flex items-center gap-2">
                        <Shield className="text-[#D4AF37]" size={28} />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#AA8822]">
                            LeatherCAD
                        </span>
                    </Link>
                    <div className="w-6"></div>
                </div>

                {/* AI Design Generator (Quick Left Input) */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles size={14} /> Smart Designer
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSidebarAIGenerate();
                            }}
                            placeholder="e.g. 'Vintage Tuscan brown bag'"
                            className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleSidebarAIGenerate}
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                            title="Generate with Gemini"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        </button>
                    </div>

                    {/* AI Preview Box */}
                    {aiPreviewConfig && (
                        <div className="mt-3 bg-white border border-purple-100 rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">AI Suggestion Preview</h4>
                            <div className="flex gap-2 mb-3">
                                {Object.entries(aiPreviewConfig).slice(0, 4).map(([key, color]) => (
                                    <div key={key} className="flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color }} />
                                        <span className="text-[10px] text-gray-500 capitalize mt-1">{key}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setConfig(prev => ({ ...prev, ...aiPreviewConfig }));
                                        setAiPreviewConfig(null);
                                    }}
                                    className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded hover:bg-purple-700 font-medium"
                                >
                                    Apply Design
                                </button>
                                <button
                                    onClick={() => setAiPreviewConfig(null)}
                                    className="flex-1 bg-gray-100 text-gray-600 text-xs py-1.5 rounded hover:bg-gray-200"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Configuration Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Product Switcher */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers size={16} /> Product Type
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['bag', 'jacket', 'boots', 'wallet', 'belt'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSelectedProduct(type);
                                        const newParts = PRODUCT_PARTS[type] || PRODUCT_PARTS['bag'];
                                        setActivePart(newParts[0]);
                                        setCustomPrice(DEFAULT_INR_PRICES[type] || 4999);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${selectedProduct === type
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Part Selector */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers size={16} /> Select Part
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            {currentParts.map(part => (
                                <button
                                    key={part}
                                    onClick={() => setActivePart(part)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all border ${activePart === part
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    {part}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Palette size={16} /> Choose Material
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {(activePart === 'hardware' ? hardwareColors : colors).map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => handleColorChange(color.value)}
                                    className={`group relative w-full aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${config[activePart] === color.value ? 'ring-2 ring-black ring-offset-2 scale-110' : ''
                                        }`}
                                    title={color.name}
                                >
                                    <span
                                        className="absolute inset-0 rounded-full border border-black/10 shadow-inner"
                                        style={{ backgroundColor: color.value }}
                                    />
                                    {config[activePart] === color.value && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-sm text-gray-500 font-medium">
                            Selected: <span className="font-bold text-black">{
                                (activePart === 'hardware' ? hardwareColors : colors)
                                    .find(c => c.value === config[activePart])?.name || 'Custom'
                            }</span>
                        </p>
                    </div>
                </div>

                {/* Bottom Actions - Designer Editable Selling Price in INR */}
                <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex-1 mr-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                <Tag size={13} className="text-[#D4AF37]" />
                                <span>Selling Price (INR)</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 focus-within:bg-white border border-gray-300 focus-within:border-black rounded-xl px-3 py-1.5 transition-all shadow-inner">
                                <span className="text-xl font-bold text-gray-700">₹</span>
                                <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-transparent font-bold text-2xl text-black focus:outline-none"
                                    title="Designer editable selling price"
                                />
                                <Edit3 size={15} className="text-gray-400 hover:text-black cursor-pointer shrink-0" />
                            </div>
                            <span className="text-[11px] text-gray-400 block mt-1">Designer-controlled retail rate</span>
                        </div>

                        <button
                            onClick={() => {
                                addItem({
                                    id: Date.now().toString(),
                                    name: `Custom ${selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)}`,
                                    price: Number(customPrice) || DEFAULT_INR_PRICES[selectedProduct] || 4999,
                                    image: captureRef.current ? captureRef.current() : `/assets/${selectedProduct}.jpg`,
                                    config: config,
                                    productType: selectedProduct
                                });
                                navigate('/checkout');
                            }}
                            className="bg-black text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 shrink-0"
                        >
                            <ShoppingCart size={18} />
                            Add to Cart
                        </button>
                    </div>

                    <div className="flex justify-center gap-6 pt-2 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black font-medium transition-colors"
                        >
                            <Save size={18} /> Save Design
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black font-medium transition-colors"
                        >
                            <Share2 size={18} /> Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side - 3D Viewer Canvas */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-white">
                {/* Product Title Overlay */}
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                    <h1 className="text-3xl font-bold text-black tracking-tight drop-shadow-sm capitalize">{selectedProduct}</h1>
                    <p className="text-gray-500 font-medium">Interactive 3D Configurator</p>
                </div>

                {/* Viewer Controls Overlay */}
                <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                    <button
                        onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
                        className="p-3 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-full text-black hover:bg-gray-100 transition-colors"
                        title="Zoom In"
                    >
                        <span className="font-bold text-lg">+</span>
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                        className="p-3 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-full text-black hover:bg-gray-100 transition-colors"
                        title="Zoom Out"
                    >
                        <span className="font-bold text-lg">-</span>
                    </button>
                </div>

                {/* 3D WebGL Viewer */}
                <Product3DViewer
                    productType={selectedProduct}
                    config={config}
                    zoom={zoom}
                    onPartClick={setActivePart}
                    captureRef={captureRef}
                />

                {/* ======================================================== */}
                {/* GEMINI CHAT ASSISTANT WIDGET (BOTTOM-RIGHT)             */}
                {/* ======================================================== */}
                {isChatOpen ? (
                    <div className="fixed bottom-6 right-6 z-30 w-[410px] max-w-[calc(100vw-2rem)] h-[540px] bg-white/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Widget Header */}
                        <div className="bg-gradient-to-r from-gray-950 via-neutral-900 to-black text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-[#D4AF37] flex items-center justify-center text-white shadow-md">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 font-bold text-sm">
                                        <span>Gemini AI Artisan</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Design Advisor & INR Pricing Hand</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                    title="Minimize Assistant"
                                >
                                    <Minimize2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Theme Inspiration Chips */}
                        <div className="bg-purple-50/70 border-b border-purple-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider shrink-0">Inspiration:</span>
                            {["Vintage Tuscan", "Cyberpunk Neon", "Stealth Black", "Royal Burgundy"].map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => handleSendGeminiPrompt(theme)}
                                    disabled={isChatLoading}
                                    className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-900 hover:border-purple-400 hover:bg-purple-50 font-medium transition-all shadow-2xs hover:shadow-xs"
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>

                        {/* Response Area / Conversation Log */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/70 custom-scrollbar">
                            {chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-sm ${msg.sender === 'user'
                                            ? 'bg-black text-white rounded-br-xs'
                                            : 'bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs'
                                            }`}
                                    >
                                        {/* Sender Badge */}
                                        {msg.sender === 'gemini' && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 mb-1.5">
                                                <Sparkles size={12} />
                                                <span>Gemini Response</span>
                                            </div>
                                        )}

                                        {/* Text Reply */}
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.reply}</p>

                                        {/* Config Preview Swatches & Apply Button */}
                                        {msg.config && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                                    Artisan Color Palette:
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {Object.entries(msg.config).map(([part, hex]) => (
                                                        <div key={part} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                            <span
                                                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                                                style={{ backgroundColor: hex }}
                                                            />
                                                            <span className="text-[10px] text-gray-600 font-medium capitalize">{part}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setConfig(prev => ({ ...prev, ...msg.config }));
                                                        setAppliedMessageId(msg.id);
                                                    }}
                                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    {appliedMessageId === msg.id ? (
                                                        <>
                                                            <CheckCircle2 size={14} className="text-emerald-300" />
                                                            Applied to 3D Model
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={14} />
                                                            Apply to 3D Model
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Suggested Price in INR & One-Click Price Set */}
                                        {msg.suggestedPrice && (
                                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <div className="text-xs font-semibold text-gray-700">
                                                    Suggested: <span className="font-bold text-black">₹{msg.suggestedPrice.toLocaleString('en-IN')}</span>
                                                </div>
                                                <button
                                                    onClick={() => setCustomPrice(msg.suggestedPrice)}
                                                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Set as designer selling price"
                                                >
                                                    <Tag size={11} />
                                                    Set My Price
                                                </button>
                                            </div>
                                        )}

                                        <div className="text-[10px] text-gray-400 text-right mt-1.5 opacity-70">
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading State */}
                            {isChatLoading && (
                                <div className="flex items-start">
                                    <div className="bg-white border border-purple-200 rounded-2xl rounded-bl-xs p-3.5 shadow-sm flex items-center gap-2.5">
                                        <Loader2 size={16} className="text-purple-600 animate-spin" />
                                        <span className="text-xs text-gray-600 font-medium">Gemini is crafting luxury suggestions...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendGeminiPrompt();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Describe styling or ask advice..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0"
                                    title="Send Message"
                                >
                                    {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Minimized Floating Pill Button at Bottom-Right */
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 bg-gradient-to-r from-gray-950 via-purple-950 to-black text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-all border border-[#D4AF37]/50 group"
                    >
                        <div className="relative">
                            <Sparkles size={18} className="text-[#D4AF37] animate-pulse" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-black" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#D4AF37]">
                                Gemini AI Artisan
                            </div>
                            <div className="text-[10px] text-gray-300">Chat, Palette & Price</div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

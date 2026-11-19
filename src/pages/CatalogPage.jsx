import { useState } from 'react';
import { Search, Filter, ShoppingBag, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/CartStore';
import { useRole } from '../hooks/useRole';

const products = [
    { id: 1, name: "The Classic Biker", price: 14999, category: "Jackets", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600", tag: "Best Seller", type: "jacket" },
    { id: 2, name: "Weekend Duffel", price: 7999, category: "Bags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600", tag: "New", type: "bag" },
    { id: 3, name: "Cheng Chelsea", price: 6499, category: "Shoes", image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=600", type: "boots" },
    { id: 4, name: "Heritage Belt", price: 1899, category: "Accessories", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&q=80&w=600", type: "belt" },
    { id: 5, name: "Slim Wallet", price: 1299, category: "Accessories", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600", type: "wallet" },
    { id: 6, name: "Dean Bike Jacket", price: 16499, category: "Jackets", image: "/dean_jacket.png", type: "jacket" },
    { id: 7, name: "Oxford Boots", price: 6999, category: "Shoes", image: "https://images.unsplash.com/photo-1542841791-1925b02a2bbb?auto=format&fit=crop&q=80&w=600", type: "boots" },
    { id: 8, name: "Light Messenger", price: 5499, category: "Bags", image: "/light_messenger.png", type: "bag" },
    { id: 9, name: "Racer Jacket", price: 15999, category: "Jackets", image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&q=80&w=600", type: "jacket" },
    { id: 10, name: "Travel Tote", price: 6999, category: "Bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600", type: "bag" },
    { id: 11, name: "Work Boots", price: 5999, category: "Shoes", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600", type: "boots" },
    { id: 12, name: "Braided Belt", price: 1999, category: "Accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600", type: "belt" },
    { id: 13, name: "Card Holder", price: 899, category: "Accessories", image: "https://images.unsplash.com/photo-1554981983-4ee4aeb2e62b?auto=format&fit=crop&q=80&w=600", type: "wallet" },
    { id: 14, name: "Bomber Jacket", price: 13999, category: "Jackets", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600", type: "jacket" },
    { id: 15, name: "White Backpack", price: 7499, category: "Bags", image: "/white_backpack.png", type: "bag" },
];

export default function CatalogPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(true);
    const addItem = useCartStore(state => state.addItem);
    const toggleCart = useCartStore(state => state.toggleCart);
    const isOpen = useCartStore(state => state.isOpen);
    const { canCustomize } = useRole();

    const handleAddToCart = (product, e) => {
        e.preventDefault();
        e.stopPropagation();

        const cartItem = {
            id: `prod-${product.id}`,
            name: product.name,
            product: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            config: {
                colorName: "Standard",
                leatherType: "Classic"
            }
        };
        addItem(cartItem);
        if (!isOpen) toggleCart();
    };

    // Filter logic
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div
            className={`min-h-screen font-sans transition-colors duration-300 ${
                isDarkMode ? 'bg-[#0b0c0f] text-[#ededed]' : 'bg-[#faf7f7] text-[#1a1718]'
            }`}
        >
            {/* Minimalist Editorial Header */}
            <header
                className={`py-14 md:py-18 relative transition-colors duration-300 border-b ${
                    isDarkMode
                        ? 'bg-[#0f1115] border-[#1b1e26]'
                        : 'bg-[#fcf9f9] border-[#ede2e3]'
                }`}
            >
                {/* Ultra-Minimal Top-Rightmost Theme Toggle */}
                <div className="absolute top-5 right-5 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        aria-label="Toggle Theme"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border ${
                            isDarkMode
                                ? 'bg-[#151820] text-gray-300 border-[#232733] hover:text-white hover:border-gray-500 hover:bg-[#1a1e28]'
                                : 'bg-white text-[#5c494c] border-[#e8dedf] hover:text-[#1a1718] hover:border-[#1a1718]/40 hover:bg-[#f5eded]'
                        }`}
                    >
                        {isDarkMode ? (
                            <>
                                <Sun size={13} className="text-[#dfad45]" />
                                <span className="text-[11px]">Light</span>
                            </>
                        ) : (
                            <>
                                <Moon size={13} className="text-[#8a1e2b]" />
                                <span className="text-[11px]">Dark</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Minimal Header Content */}
                <div className="container mx-auto px-6 text-center max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-3">
                        Designed for Life
                    </h1>
                    <p
                        className={`text-sm md:text-base font-normal leading-relaxed mx-auto max-w-xl ${
                            isDarkMode ? 'text-[#8b919d]' : 'text-[#736466]'
                        }`}
                    >
                        Hand-crafted luxury leather goods, tailored to your exact aesthetic. Customize any piece in 3D.
                    </p>
                </div>
            </header>

            {/* Filter Bar & Search */}
            <div className="container mx-auto px-4 sm:px-6 py-7 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Minimal Category Tabs */}
                <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                    {["All", "Jackets", "Bags", "Shoes", "Accessories"].map(cat => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 shrink-0 border ${
                                    isSelected
                                        ? (isDarkMode
                                            ? 'bg-white text-[#0b0c0f] border-white font-semibold'
                                            : 'bg-[#1a1718] text-white border-[#1a1718] font-semibold')
                                        : (isDarkMode
                                            ? 'bg-transparent text-[#8b919d] border-transparent hover:text-white hover:bg-white/5'
                                            : 'bg-transparent text-[#736466] border-transparent hover:text-[#1a1718] hover:bg-black/5')
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Minimal Search Input */}
                <div className="relative w-full md:w-64">
                    <Search
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                            isDarkMode ? 'text-gray-500' : 'text-[#9c8a8d]'
                        }`}
                        size={15}
                    />
                    <input
                        type="text"
                        placeholder="Search collection..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full rounded-full py-2 pl-9 pr-4 text-xs transition-colors duration-200 focus:outline-none border ${
                            isDarkMode
                                ? 'bg-[#12141a] border-[#222530] text-[#ededed] placeholder-gray-500 focus:border-[#dfad45]'
                                : 'bg-white border-[#e5dcdd] text-[#1a1718] placeholder-[#9c8a8d] focus:border-[#8a1e2b]'
                        }`}
                    />
                </div>
            </div>

            {/* Symmetrical Product Grid */}
            <div className="container mx-auto px-4 sm:px-6 pb-20">
                <div
                    className={`grid gap-5 md:gap-6 transition-all duration-300 ${
                        isOpen
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}
                >
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className={`group h-full flex flex-col justify-between rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg ${
                                isDarkMode
                                    ? 'bg-[#12141a] border-[#1f222c] hover:border-[#2f3442]'
                                    : 'bg-white border-[#ebdada] hover:border-[#c5b4b6]'
                            }`}
                        >
                            {/* Card Image Container */}
                            <div className="relative h-72 w-full overflow-hidden bg-neutral-900/5 shrink-0">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover transform group-hover:scale-104 transition-transform duration-500 ease-out"
                                    onError={(e) => {
                                        e.target.src = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600";
                                    }}
                                />

                                {/* Minimal Tag Badge */}
                                {product.tag && (
                                    <span
                                        className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase border backdrop-blur-md ${
                                            isDarkMode
                                                ? 'bg-black/60 text-[#dfad45] border-[#dfad45]/20'
                                                : 'bg-white/80 text-[#8a1e2b] border-[#8a1e2b]/20'
                                        }`}
                                    >
                                        {product.tag}
                                    </span>
                                )}

                                {/* Hover Overlay Actions */}
                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
                                    <button
                                        onClick={(e) => handleAddToCart(product, e)}
                                        className="bg-white text-[#12141a] p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md hover:bg-[#dfad45]"
                                        title="Add to Cart"
                                        aria-label="Add to Cart"
                                    >
                                        <ShoppingBag size={16} />
                                    </button>
                                    {canCustomize && (
                                        <Link
                                            to={`/customizer?product=${product.type || 'jacket'}`}
                                            className="bg-white text-[#12141a] p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md hover:bg-[#dfad45]"
                                            title="Customize in 3D"
                                            aria-label="Customize in 3D"
                                        >
                                            <Filter size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    {/* Category & Price Row */}
                                    <div className="flex items-center justify-between mb-1 min-h-[18px]">
                                        <span
                                            className={`text-[10px] font-semibold uppercase tracking-widest ${
                                                isDarkMode ? 'text-[#8b919d]' : 'text-[#736466]'
                                            }`}
                                        >
                                            {product.category}
                                        </span>
                                        <span
                                            className={`text-sm font-semibold tracking-tight ${
                                                isDarkMode ? 'text-[#ededed]' : 'text-[#1a1718]'
                                            }`}
                                        >
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {/* Product Title (1 line clamp for symmetry) */}
                                    <h3
                                        className={`text-base font-medium tracking-tight line-clamp-1 ${
                                            isDarkMode ? 'text-white' : 'text-[#1a1718]'
                                        }`}
                                        title={product.name}
                                    >
                                        {product.name}
                                    </h3>
                                </div>

                                {/* Premium Button with Left-to-Right Dark Transition */}
                                <button
                                    onClick={(e) => handleAddToCart(product, e)}
                                    className="relative w-full overflow-hidden mt-3.5 py-2.5 px-3 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-sm group bg-[#dfad45] text-[#12141a] border border-[#dfad45]/40"
                                >
                                    {/* Left to Right Dark Fill Transition */}
                                    <span className="absolute inset-0 w-0 bg-[#0e1014] transition-all duration-400 ease-out group-hover:w-full"></span>

                                    {/* Button Content */}
                                    <span className="relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-200 group-hover:text-[#dfad45]">
                                        <ShoppingBag size={14} className="transition-transform duration-200 group-hover:scale-105" />
                                        <span>Add to Cart</span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No products match your search or filter.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

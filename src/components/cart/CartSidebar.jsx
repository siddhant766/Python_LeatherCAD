import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/button';
import { useCartStore } from '../../store/CartStore';

export function CartSidebar() {
    const navigate = useNavigate();
    const isOpen = useCartStore(state => state.isOpen);
    const items = useCartStore(state => state.items);
    const toggleCart = useCartStore(state => state.toggleCart);
    const removeItem = useCartStore(state => state.removeItem);
    const updateQuantity = useCartStore(state => state.updateQuantity);

    if (!isOpen) return null;

    const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <aside
            aria-label="Shopping Cart"
            className="fixed top-0 right-0 bottom-0 z-50 w-full md:w-[400px] lg:w-[448px] bg-card/95 backdrop-blur-xl border-l border-border shadow-[-12px_0_35px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-right duration-300"
        >
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShoppingBag size={20} className="text-primary" />
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                        {totalCount}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleCart} className="rounded-full hover:bg-secondary">
                    <X size={20} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-3">
                        <ShoppingBag size={36} className="opacity-40" />
                        <p className="font-medium">Your cart is empty.</p>
                        <p className="text-xs text-muted-foreground">Select products from the catalog to add them.</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors">
                            <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-xs text-muted-foreground overflow-hidden shrink-0">
                                <img src={item.image} alt={item.product || item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="truncate">
                                        <h3 className="font-semibold text-sm truncate">{item.product || item.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {item.config?.colorName ? `${item.config.colorName}, ${item.config.leatherType}` : 'Standard Edition'}
                                        </p>
                                    </div>
                                    <p className="font-bold text-sm shrink-0">${(item.price || 0) * (item.quantity || 1)}</p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2 border border-border rounded-lg bg-card px-1 py-0.5">
                                        <button
                                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => updateQuantity(item.id, -1)}
                                            title="Decrease quantity"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="text-xs font-semibold w-5 text-center">{item.quantity || 1}</span>
                                        <button
                                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => updateQuantity(item.id, 1)}
                                            title="Increase quantity"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                    <button
                                        className="text-destructive/80 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                        onClick={() => removeItem(item.id)}
                                        title="Remove item"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-border bg-card">
                <div className="flex justify-between mb-4 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                </div>
                <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => {
                        toggleCart();
                        navigate('/checkout');
                    }}
                >
                    Proceed to Checkout
                </Button>
            </div>
        </aside>
    );
}

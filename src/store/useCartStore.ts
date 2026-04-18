import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, MenuItemVariant, Addon } from '../types';

export interface CartItem {
  id: string; // unique id for each cart entry (item + variant + addons combo)
  menuItem: MenuItem;
  variant: MenuItemVariant | null;
  selectedAddons: Addon[];
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const items = get().items;
        const id = `${newItem.menuItem.id}-${newItem.variant?.id || 'base'}-${newItem.selectedAddons.map(a => a.id).sort().join(',')}`;
        
        const existingItemIndex = items.findIndex(item => item.id === id);
        
        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...items, { ...newItem, id }] });
        }
      },
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
        ).filter(item => item.quantity > 0)
      })),
      clearCart: () => set({ items: [] }),
      
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      get subtotal() {
        return get().items.reduce((sum, item) => {
          const itemPrice = item.menuItem.discount_price || item.menuItem.price;
          const variantPrice = item.variant?.price_modifier || 0;
          const addonsPrice = item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0);
          return sum + (itemPrice + variantPrice + addonsPrice) * item.quantity;
        }, 0);
      }
    }),
    {
      name: 'mr-krab-cart',
    }
  )
);

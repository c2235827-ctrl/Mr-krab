import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '../types';

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const id = newItem.menuItem.id;
          const existingIndex = state.items.findIndex(item => item.id === id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + newItem.quantity };
            return { items: updated };
          }
          return { items: [...state.items, { ...newItem, id }] };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter(item => item.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items
          .map(item => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
          .filter(item => item.quantity > 0)
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'beef-box-cart' }
  )
);

// Computed selectors — use these instead of store properties
export const getSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => {
    const itemPrice = item.menuItem.discount_price || item.menuItem.price;
    return sum + itemPrice * item.quantity;
  }, 0);

export const getTotalItems = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartStore {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      decrementItem: (id) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (!existing) return state;
          if (existing.quantity <= 1) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            ),
          };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),
      applyPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
      removePromo: () => set({ promoCode: null, promoDiscount: 0 }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "overberg-cart" }
  )
);

interface LocationStore {
  area: string;
  setArea: (area: string) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      area: "Struisbaai",
      setArea: (area) => set({ area }),
    }),
    { name: "overberg-location" }
  )
);

interface ToastStore {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    setTimeout(() => set({ message: null }), 2500);
  },
  hide: () => set({ message: null }),
}));

// Wallet store
export interface WalletTransaction {
  id: string;
  type: "topup" | "payment" | "refund" | "cashback" | "referral";
  amount: number;
  description: string;
  date: string;
}

interface WalletStore {
  balance: number;
  transactions: WalletTransaction[];
  topUp: (amount: number) => void;
  pay: (amount: number, description: string) => void;
  addCashback: (amount: number, description: string) => void;
  addReferralBonus: (amount: number) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 250,
      transactions: [
        { id: "w1", type: "topup", amount: 500, description: "EFT Top-up", date: "2026-04-27" },
        { id: "w2", type: "payment", amount: -199, description: "Harbour Café order", date: "2026-04-26" },
        { id: "w3", type: "cashback", amount: 20, description: "5% cashback on food", date: "2026-04-26" },
        { id: "w4", type: "referral", amount: 50, description: "Referral bonus — Pieter joined", date: "2026-04-24" },
        { id: "w5", type: "payment", amount: -68, description: "GoRide to L'Agulhas", date: "2026-04-23" },
        { id: "w6", type: "topup", amount: 200, description: "SnapScan Top-up", date: "2026-04-20" },
        { id: "w7", type: "payment", amount: -312, description: "Pick n Pay groceries", date: "2026-04-19" },
        { id: "w8", type: "cashback", amount: 15, description: "5% cashback on groceries", date: "2026-04-19" },
      ],
      topUp: (amount) =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `w-${Date.now()}`,
              type: "topup",
              amount,
              description: "Wallet Top-up",
              date: new Date().toISOString().split("T")[0],
            },
            ...state.transactions,
          ],
        })),
      pay: (amount, description) =>
        set((state) => ({
          balance: state.balance - amount,
          transactions: [
            {
              id: `w-${Date.now()}`,
              type: "payment",
              amount: -amount,
              description,
              date: new Date().toISOString().split("T")[0],
            },
            ...state.transactions,
          ],
        })),
      addCashback: (amount, description) =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `w-${Date.now()}`,
              type: "cashback",
              amount,
              description,
              date: new Date().toISOString().split("T")[0],
            },
            ...state.transactions,
          ],
        })),
      addReferralBonus: (amount) =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `w-${Date.now()}`,
              type: "referral",
              amount,
              description: "Referral bonus",
              date: new Date().toISOString().split("T")[0],
            },
            ...state.transactions,
          ],
        })),
    }),
    { name: "overberg-wallet" }
  )
);

// Favorites store
interface FavoritesStore {
  restaurantIds: string[];
  experienceIds: string[];
  stayIds: string[];
  toggleRestaurant: (id: string) => void;
  toggleExperience: (id: string) => void;
  toggleStay: (id: string) => void;
  isRestaurantFav: (id: string) => boolean;
  isExperienceFav: (id: string) => boolean;
  isStayFav: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      restaurantIds: ["harbour-cafe", "fish-and-more"],
      experienceIds: ["sea-adventures", "dog-walker"],
      stayIds: ["chateau-marine"],
      toggleRestaurant: (id) =>
        set((state) => ({
          restaurantIds: state.restaurantIds.includes(id)
            ? state.restaurantIds.filter((x) => x !== id)
            : [...state.restaurantIds, id],
        })),
      toggleExperience: (id) =>
        set((state) => ({
          experienceIds: state.experienceIds.includes(id)
            ? state.experienceIds.filter((x) => x !== id)
            : [...state.experienceIds, id],
        })),
      toggleStay: (id) =>
        set((state) => ({
          stayIds: state.stayIds.includes(id)
            ? state.stayIds.filter((x) => x !== id)
            : [...state.stayIds, id],
        })),
      isRestaurantFav: (id) => get().restaurantIds.includes(id),
      isExperienceFav: (id) => get().experienceIds.includes(id),
      isStayFav: (id) => get().stayIds.includes(id),
    }),
    { name: "overberg-favorites" }
  )
);

// Loyalty store
export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

interface LoyaltyStore {
  points: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  addPoints: (amount: number) => void;
  getTierProgress: () => { current: LoyaltyTier; next: LoyaltyTier | null; progress: number; pointsToNext: number };
}

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  Bronze: 0,
  Silver: 2000,
  Gold: 5000,
  Platinum: 10000,
};

function getTierFromPoints(pts: number): LoyaltyTier {
  if (pts >= 10000) return "Platinum";
  if (pts >= 5000) return "Gold";
  if (pts >= 2000) return "Silver";
  return "Bronze";
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      points: 3240,
      tier: "Silver" as LoyaltyTier,
      lifetimePoints: 3240,
      addPoints: (amount) =>
        set((state) => {
          const newLifetime = state.lifetimePoints + amount;
          return {
            points: state.points + amount,
            lifetimePoints: newLifetime,
            tier: getTierFromPoints(newLifetime),
          };
        }),
      getTierProgress: () => {
        const { lifetimePoints } = get();
        const tier = getTierFromPoints(lifetimePoints);
        const tiers: LoyaltyTier[] = ["Bronze", "Silver", "Gold", "Platinum"];
        const idx = tiers.indexOf(tier);
        const next = idx < tiers.length - 1 ? tiers[idx + 1] : null;
        const currentThreshold = TIER_THRESHOLDS[tier];
        const nextThreshold = next ? TIER_THRESHOLDS[next] : TIER_THRESHOLDS[tier];
        const progress = next
          ? (lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)
          : 1;
        const pointsToNext = next ? nextThreshold - lifetimePoints : 0;
        return { current: tier, next, progress: Math.min(progress, 1), pointsToNext };
      },
    }),
    { name: "overberg-loyalty" }
  )
);

// Address store
export interface SavedAddress {
  id: string;
  label: string;
  emoji: string;
  address: string;
  isDefault: boolean;
}

interface AddressStore {
  addresses: SavedAddress[];
  addAddress: (addr: Omit<SavedAddress, "id">) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getDefault: () => SavedAddress | undefined;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [
        { id: "a1", label: "Home", emoji: "🏠", address: "Marine 127, Struisbaai", isDefault: true },
        { id: "a2", label: "Work", emoji: "💼", address: "14 Main Road, Bredasdorp", isDefault: false },
        { id: "a3", label: "Beach House", emoji: "🏖️", address: "8 Seafront Drive, L'Agulhas", isDefault: false },
      ],
      addAddress: (addr) =>
        set((state) => ({
          addresses: [...state.addresses, { ...addr, id: `a-${Date.now()}` }],
        })),
      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),
      setDefault: (id) =>
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        })),
      getDefault: () => get().addresses.find((a) => a.isDefault),
    }),
    { name: "overberg-addresses" }
  )
);

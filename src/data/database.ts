import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db: SQLite.SQLiteDatabase | null = null;
let dbOpenPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;
let dbInitPromise: Promise<void> | null = null;
let isDbInitialized = false;
let useAsyncStorageFallback = Platform.OS === 'web';

type AuthListener = (user: User | null) => void;
const authListeners: Set<AuthListener> = new Set();

export const subscribeAuthChanged = (listener: AuthListener): (() => void) => {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
};

export const notifyAuthChanged = async (): Promise<void> => {
  const user = await getCurrentUser();
  authListeners.forEach((listener) => listener(user));
};

export type Category = {
  id: number;
  name: string;
  img?: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  img: string;
  categoryId: number;
  description?: string;
  rating?: number;
  soldCount?: number;
  stock?: number;
  isDeleted?: number;
};

export type UserRole = 'superadmin' | 'admin' | 'user';

export type User = {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  role: UserRole | string;
  isBlocked?: number | boolean;
};

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  img: string;
  quantity: number;
};

export type OrderItem = {
  productId: number;
  productName: string;
  price: number;
  img: string;
  quantity: number;
};

export type Order = {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

// Order status workflow used by every screen (English labels only)
export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Shipping',
  'Delivered',
  'Cancelled',
] as const;

export const isAdminRole = (role?: string | null): boolean =>
  role === 'admin' || role === 'superadmin';

export const isSuperAdminRole = (role?: string | null): boolean =>
  role === 'superadmin';

// Preset fashion images (Shirts, Pants, Shoes, Sandals) for quick selection
export const PRESET_IMAGES = [
  {
    label: 'Shirt',
    value: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
  },
  {
    label: 'T-Shirt',
    value: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
  },
  {
    label: 'Polo',
    value: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&q=80',
  },
  {
    label: 'Jacket',
    value: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
  },
  {
    label: 'Hoodie',
    value: 'https://images.unsplash.com/photo-1556821840-3a3f95609a7?w=500&q=80',
  },
  {
    label: 'Jeans',
    value: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
  },
  {
    label: 'Khaki Pants',
    value: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80',
  },
  {
    label: 'Shorts',
    value: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
  },
  {
    label: 'Sneakers',
    value: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  },
  {
    label: 'Sandals',
    value: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&q=80',
  },
];

// Sample categories of TuTu Store (8 fashion categories)
const initialCategories: Category[] = [
  {
    id: 1,
    name: 'Shirts & Polos',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&q=80',
  },
  {
    id: 2,
    name: 'T-Shirts & Tanktops',
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80',
  },
  {
    id: 3,
    name: 'Jackets & Hoodies',
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80',
  },
  {
    id: 4,
    name: 'Jeans & Denim',
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&q=80',
  },
  {
    id: 5,
    name: 'Khaki & Trousers',
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=80',
  },
  {
    id: 6,
    name: 'Shorts & Joggers',
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&q=80',
  },
  {
    id: 7,
    name: 'Sneakers & Sport Shoes',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  },
  {
    id: 8,
    name: 'Sandals & Slip-ons',
    img: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80',
  },
];

// Sample products (28 items) with sale price, stock and soft delete flag
const initialProducts: Product[] = [
  // --- Category 1: Shirts & Polos ---
  {
    id: 1,
    name: 'Oxford Slimfit Shirt',
    price: 250000,
    salePrice: 199000,
    stock: 40,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
    categoryId: 1,
    description:
      'Premium 100% cotton Oxford shirt from TuTu Store. Breathable, wrinkle resistant and cut in a modern slimfit silhouette.',
    rating: 4.9,
    soldCount: 420,
    isDeleted: 0,
  },
  {
    id: 2,
    name: 'Premium Pique Polo Shirt',
    price: 295000,
    salePrice: 235000,
    stock: 25,
    img: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&q=80',
    categoryId: 1,
    description:
      'Pique polo with 4-way stretch fabric and a sharp ribbed collar. Perfect for the office or a weekend walk.',
    rating: 4.8,
    soldCount: 310,
    isDeleted: 0,
  },
  {
    id: 3,
    name: 'Summer Linen Short Sleeve Shirt',
    price: 220000,
    stock: 32,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
    categoryId: 1,
    description:
      'Lightweight linen shirt with a soft touch and breathable weave, styled with a young Korean-inspired look.',
    rating: 4.7,
    soldCount: 195,
    isDeleted: 0,
  },
  {
    id: 4,
    name: 'Striped Office Shirt',
    price: 275000,
    stock: 18,
    img: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80',
    categoryId: 1,
    description:
      'Long sleeve striped shirt in bamboo fiber fabric, antibacterial and shape retentive all day long.',
    rating: 4.9,
    soldCount: 260,
    isDeleted: 0,
  },

  // --- Category 2: T-Shirts & Tanktops ---
  {
    id: 5,
    name: 'Basic Cotton T-Shirt Unisex',
    price: 165000,
    salePrice: 129000,
    stock: 60,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    categoryId: 2,
    description:
      'Relaxed crew neck t-shirt in 250gsm two-way cotton. Highly absorbent, no pilling and keeps its shape.',
    rating: 4.8,
    soldCount: 680,
    isDeleted: 0,
  },
  {
    id: 6,
    name: 'Oversize Streetwear T-Shirt',
    price: 195000,
    stock: 45,
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80',
    categoryId: 2,
    description:
      'Drop shoulder oversize tee in a cool streetwear style with 4-way stretch cotton.',
    rating: 4.9,
    soldCount: 530,
    isDeleted: 0,
  },
  {
    id: 7,
    name: 'Dry-Fit Sports T-Shirt',
    price: 145000,
    stock: 55,
    img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80',
    categoryId: 2,
    description:
      'Ultra light Dry-Fit mesh sports tee that dries fast while running or training.',
    rating: 4.7,
    soldCount: 410,
    isDeleted: 0,
  },
  {
    id: 8,
    name: 'Stretch Gym Tanktop',
    price: 120000,
    stock: 38,
    img: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&q=80',
    categoryId: 2,
    description:
      'Sporty tanktop in cool touch fabric, designed for gym sessions and outdoor activities.',
    rating: 4.8,
    soldCount: 345,
    isDeleted: 0,
  },

  // --- Category 3: Jackets & Hoodies ---
  {
    id: 9,
    name: 'Biker Leather Jacket',
    price: 1250000,
    salePrice: 990000,
    stock: 8,
    img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    categoryId: 3,
    description:
      'Bold biker leather jacket with a smooth silk lining that blocks wind and keeps you warm.',
    rating: 4.9,
    soldCount: 165,
    isDeleted: 0,
  },
  {
    id: 10,
    name: 'Oversize Fleece Hoodie',
    price: 340000,
    stock: 0,
    img: 'https://images.unsplash.com/photo-1556821840-3a3f95609a7?w=500&q=80',
    categoryId: 3,
    description:
      'Warm heavyweight fleece hoodie with a double layer hood and a roomy kangaroo pocket.',
    rating: 4.8,
    soldCount: 620,
    isDeleted: 0,
  },
  {
    id: 11,
    name: 'Two-Layer UV Protection Windbreaker',
    price: 275000,
    stock: 22,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80',
    categoryId: 3,
    description:
      'Light two-layer water repellent windbreaker with UPF50+ protection, easy to fold and carry.',
    rating: 4.8,
    soldCount: 740,
    isDeleted: 0,
  },
  {
    id: 12,
    name: 'Khaki Bomber Jacket',
    price: 450000,
    stock: 14,
    img: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=500&q=80',
    categoryId: 3,
    description:
      'Khaki bomber jacket with ribbed collar and cuffs, smooth metal zipper and a handy sleeve pocket.',
    rating: 4.9,
    soldCount: 290,
    isDeleted: 0,
  },

  // --- Category 4: Jeans & Denim ---
  {
    id: 13,
    name: 'Slimfit Stretch Jeans',
    price: 420000,
    salePrice: 349000,
    stock: 30,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
    categoryId: 4,
    description:
      'Indigo stretch denim jeans that keep their shape and do not fade after machine washing.',
    rating: 4.8,
    soldCount: 390,
    isDeleted: 0,
  },
  {
    id: 14,
    name: 'Straight Leg Jeans',
    price: 460000,
    stock: 26,
    img: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&q=80',
    categoryId: 4,
    description:
      'Classic straight leg jeans in durable heavy denim that flatters every body shape.',
    rating: 4.9,
    soldCount: 315,
    isDeleted: 0,
  },
  {
    id: 15,
    name: 'Basic Black Jeans',
    price: 395000,
    stock: 0,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80',
    categoryId: 4,
    description:
      'Solid black jeans that pair easily with shirts, tees and sneakers for school or work.',
    rating: 4.7,
    soldCount: 440,
    isDeleted: 0,
  },

  // --- Category 5: Khaki & Trousers ---
  {
    id: 16,
    name: 'Wrinkle-Free Khaki Trousers',
    price: 350000,
    stock: 34,
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80',
    categoryId: 5,
    description:
      'Straight leg khaki trousers in soft cotton spandex, comfortable for a full working day.',
    rating: 4.8,
    soldCount: 460,
    isDeleted: 0,
  },
  {
    id: 17,
    name: 'Sidetab Dress Trousers',
    price: 480000,
    stock: 16,
    img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80',
    categoryId: 5,
    description:
      'Tailored dress trousers with adjustable sidetabs and a sharp front crease.',
    rating: 4.9,
    soldCount: 280,
    isDeleted: 0,
  },
  {
    id: 18,
    name: 'Cargo Pocket Khaki Pants',
    price: 370000,
    stock: 21,
    img: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=500&q=80',
    categoryId: 5,
    description:
      'Streetwear cargo pants with dual side pockets and slightly stretchy heavy khaki fabric.',
    rating: 4.8,
    soldCount: 335,
    isDeleted: 0,
  },

  // --- Category 6: Shorts & Joggers ---
  {
    id: 19,
    name: 'Summer Khaki Shorts',
    price: 185000,
    stock: 48,
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
    categoryId: 6,
    description:
      'Above the knee casual shorts with elastic waist and drawstring, great for beach trips.',
    rating: 4.7,
    soldCount: 510,
    isDeleted: 0,
  },
  {
    id: 20,
    name: 'Cuffed Fleece Joggers',
    price: 260000,
    stock: 29,
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&q=80',
    categoryId: 6,
    description:
      '4-way stretch fleece joggers with cuffed ankles that pair perfectly with sneakers.',
    rating: 4.8,
    soldCount: 395,
    isDeleted: 0,
  },
  {
    id: 21,
    name: 'Two-Layer Running Shorts',
    price: 140000,
    stock: 52,
    img: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=500&q=80',
    categoryId: 6,
    description:
      'Ultra light running shorts with a zip pocket that keeps your phone safe while training.',
    rating: 4.8,
    soldCount: 615,
    isDeleted: 0,
  },

  // --- Category 7: Sneakers & Sport Shoes ---
  {
    id: 22,
    name: 'Retro Red Sport Sneakers',
    price: 1100000,
    salePrice: 890000,
    stock: 12,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    categoryId: 7,
    description:
      'Unisex sport sneakers with an air cushioned non-slip sole, ultra light and perfect for running.',
    rating: 4.9,
    soldCount: 540,
    isDeleted: 0,
  },
  {
    id: 23,
    name: 'Classic White Minimalist Sneakers',
    price: 650000,
    stock: 24,
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
    categoryId: 7,
    description:
      'Microfiber white sneakers that pair with jeans, trousers or shorts, built on a solid rubber sole.',
    rating: 4.8,
    soldCount: 490,
    isDeleted: 0,
  },
  {
    id: 24,
    name: 'UltraBoost Pro Running Shoes',
    price: 1450000,
    stock: 9,
    img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80',
    categoryId: 7,
    description:
      'Professional running shoes with Primeknit upper and an energy return midsole.',
    rating: 5.0,
    soldCount: 275,
    isDeleted: 0,
  },
  {
    id: 25,
    name: 'High-Top Sport Sneakers',
    price: 790000,
    stock: 17,
    img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80',
    categoryId: 7,
    description:
      'High-top sneakers with a bold color mix and soft ankle padding for extra support.',
    rating: 4.9,
    soldCount: 320,
    isDeleted: 0,
  },

  // --- Category 8: Sandals & Slip-ons ---
  {
    id: 26,
    name: 'Canvas Slip-On Shoes',
    price: 380000,
    salePrice: 299000,
    stock: 20,
    img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80',
    categoryId: 8,
    description:
      'Durable canvas slip-ons without laces, quick to put on for students and office workers.',
    rating: 4.7,
    soldCount: 360,
    isDeleted: 0,
  },
  {
    id: 27,
    name: 'Comfort EVA Slide Sandals',
    price: 150000,
    salePrice: 99000,
    stock: 0,
    img: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&q=80',
    categoryId: 8,
    description:
      'Single strap EVA sandals, ultra light, waterproof and slip resistant.',
    rating: 4.9,
    soldCount: 890,
    isDeleted: 0,
  },
  {
    id: 28,
    name: 'Hiking Strap Sandals',
    price: 245000,
    stock: 23,
    img: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=500&q=80',
    categoryId: 8,
    description:
      'Sturdy strap sandals with adjustable hook and loop closure and a grippy rubber sole.',
    rating: 4.8,
    soldCount: 640,
    isDeleted: 0,
  },
];

// Sample orders so Order History and Admin Orders have data on first launch
const initialOrders: Order[] = [
  {
    id: 1001,
    userId: 3,
    customerName: 'Ngo Minh Tu',
    phone: '0988666888',
    address: '68 Dien Bien Phu, Thanh Khe, Da Nang',
    note: 'Please deliver during office hours',
    paymentMethod: 'Cash on Delivery (COD)',
    totalAmount: 670000,
    status: 'Pending',
    createdAt: '09/11/2026 14:20',
    items: [
      {
        productId: 1,
        productName: 'Oxford Slimfit Shirt',
        price: 250000,
        img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
        quantity: 1,
      },
      {
        productId: 13,
        productName: 'Slimfit Stretch Jeans',
        price: 420000,
        img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
        quantity: 1,
      },
    ],
  },
  {
    id: 1002,
    userId: 3,
    customerName: 'Ngo Minh Tu',
    phone: '0988666888',
    address: '68 Dien Bien Phu, Thanh Khe, Da Nang',
    note: 'Call 15 minutes before delivery',
    paymentMethod: 'Bank Transfer',
    totalAmount: 1100000,
    status: 'Shipping',
    createdAt: '10/11/2026 08:15',
    items: [
      {
        productId: 22,
        productName: 'Retro Red Sport Sneakers',
        price: 1100000,
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        quantity: 1,
      },
    ],
  },
];

// Seeded accounts: 1 super admin, 1 admin, 1 normal user
const initialUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: '123',
    fullName: 'TuTu Super Admin',
    email: 'admin.tutu@gmail.com',
    phone: '0988111222',
    address: '123 Nguyen Van Linh, Hai Chau, Da Nang',
    role: 'superadmin',
  },
  {
    id: 2,
    username: 'minhtu_admin',
    password: '123',
    fullName: 'TuTu Admin',
    email: 'minhtu.admin@gmail.com',
    phone: '0988222333',
    address: '45 Le Duan, Hai Chau, Da Nang',
    role: 'admin',
  },
  {
    id: 3,
    username: 'ngominh_tu',
    password: '123',
    fullName: 'Ngo Minh Tu',
    email: 'ngominhtu@gmail.com',
    phone: '0988666888',
    address: '68 Dien Bien Phu, Thanh Khe, Da Nang',
    role: 'user',
  },
];

const ASYNC_KEYS = {
  CATEGORIES: '@tutu_categories_v5',
  PRODUCTS: '@tutu_products_v5',
  USERS: '@tutu_users_v5',
  CURRENT_USER: '@tutu_current_user_v5',
  CART: '@tutu_cart_v5',
  CART_GUEST: '@tutu_cart_guest_v5',
  CART_USER_PREFIX: '@tutu_cart_user_v5_',
  ORDERS: '@tutu_orders_v5',
};

// ==================== DATABASE INITIALIZATION ====================
const getDb = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (useAsyncStorageFallback) return null;
  if (db) return db;
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = (async () => {
    try {
      const openedDb = await SQLite.openDatabaseAsync('tutuStore_v5.db');
      await openedDb.execAsync('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
      db = openedDb;
      return db;
    } catch (err) {
      console.warn('[getDb] Cannot open native SQLite, switching to AsyncStorage:', err);
      useAsyncStorageFallback = true;
      db = null;
      return null;
    } finally {
      dbOpenPromise = null;
    }
  })();

  return dbOpenPromise;
};

const seedAsyncStorageIfNeeded = async (): Promise<void> => {
  const existingCats = await AsyncStorage.getItem(ASYNC_KEYS.CATEGORIES);
  if (!existingCats) {
    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(initialCategories));
  }

  const existingProds = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
  if (!existingProds) {
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(initialProducts));
  }

  const existingUsers = await AsyncStorage.getItem(ASYNC_KEYS.USERS);
  if (!existingUsers) {
    await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(initialUsers));
  }

  const existingOrders = await AsyncStorage.getItem(ASYNC_KEYS.ORDERS);
  if (!existingOrders) {
    await AsyncStorage.setItem(ASYNC_KEYS.ORDERS, JSON.stringify(initialOrders));
  }
};

export const initDatabase = async (onSuccess?: () => void): Promise<void> => {
  if (isDbInitialized) {
    onSuccess?.();
    return;
  }

  if (dbInitPromise) {
    try {
      await dbInitPromise;
    } finally {
      onSuccess?.();
    }
    return;
  }

  dbInitPromise = (async () => {
    try {
      const database = await getDb();

      if (database) {
        await database.execAsync(`
          PRAGMA busy_timeout = 5000;
          PRAGMA foreign_keys = ON;
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            img TEXT
          );
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            salePrice REAL,
            img TEXT,
            categoryId INTEGER,
            description TEXT,
            rating REAL DEFAULT 4.0,
            soldCount INTEGER DEFAULT 0,
            stock INTEGER DEFAULT 0,
            isDeleted INTEGER DEFAULT 0,
            FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullName TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            role TEXT DEFAULT 'user',
            isBlocked INTEGER DEFAULT 0
          );
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            customerName TEXT,
            phone TEXT,
            address TEXT,
            note TEXT,
            paymentMethod TEXT,
            totalAmount REAL,
            status TEXT,
            createdAt TEXT,
            itemsJson TEXT
          );
        `);

        // Safe upgrades for databases created by older versions
        const alterColumns = [
          'ALTER TABLE products ADD COLUMN salePrice REAL;',
          'ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;',
          'ALTER TABLE products ADD COLUMN isDeleted INTEGER DEFAULT 0;',
          'ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0;',
        ];
        for (const sql of alterColumns) {
          try {
            await database.execAsync(sql);
          } catch (_) {}
        }

        for (const cat of initialCategories) {
          await database.runAsync(
            'INSERT OR IGNORE INTO categories (id, name, img) VALUES (?, ?, ?)',
            [cat.id, cat.name, cat.img || '']
          );
        }

        for (const prod of initialProducts) {
          await database.runAsync(
            `INSERT OR IGNORE INTO products (id, name, price, salePrice, img, categoryId, description, rating, soldCount, stock, isDeleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              prod.id,
              prod.name,
              prod.price,
              prod.salePrice ?? null,
              prod.img,
              prod.categoryId,
              prod.description || '',
              prod.rating || 4.0,
              prod.soldCount || 0,
              prod.stock ?? 0,
              prod.isDeleted ?? 0,
            ]
          );
        }

        for (const u of initialUsers) {
          await database.runAsync(
            `INSERT INTO users (username, password, fullName, email, phone, address, role)
             SELECT ?, ?, ?, ?, ?, ?, ?
             WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)`,
            [
              u.username,
              u.password,
              u.fullName,
              u.email || '',
              u.phone || '',
              u.address || '',
              u.role,
              u.username,
            ]
          );
        }

        for (const ord of initialOrders) {
          await database.runAsync(
            `INSERT OR IGNORE INTO orders (id, userId, customerName, phone, address, note, paymentMethod, totalAmount, status, createdAt, itemsJson)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ord.id,
              ord.userId,
              ord.customerName,
              ord.phone,
              ord.address,
              ord.note || '',
              ord.paymentMethod,
              ord.totalAmount,
              ord.status,
              ord.createdAt,
              JSON.stringify(ord.items),
            ]
          );
        }
      } else {
        await seedAsyncStorageIfNeeded();
      }
      isDbInitialized = true;
    } catch (error) {
      // If native SQLite is locked, fall back to AsyncStorage silently
      console.warn('[initDatabase] Falling back to AsyncStorage:', error);
      useAsyncStorageFallback = true;
      db = null;
      try {
        await seedAsyncStorageIfNeeded();
        isDbInitialized = true;
      } catch (_) {}
    } finally {
      dbInitPromise = null;
    }
  })();

  try {
    await dbInitPromise;
  } finally {
    onSuccess?.();
  }
};

const normalizeProduct = (row: Product): Product => ({
  ...row,
  salePrice: row.salePrice === null || row.salePrice === undefined ? null : Number(row.salePrice),
  stock: row.stock === null || row.stock === undefined ? 0 : Number(row.stock),
  isDeleted: Number(row.isDeleted ?? 0),
});

// ==================== 1. CATEGORY MANAGEMENT ====================
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    await initDatabase();
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<Category>('SELECT * FROM categories ORDER BY id ASC');
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.CATEGORIES);
    return json ? JSON.parse(json) : initialCategories;
  } catch (error) {
    console.warn('[fetchCategories] AsyncStorage fallback:', error);
    const json = await AsyncStorage.getItem(ASYNC_KEYS.CATEGORIES);
    return json ? JSON.parse(json) : initialCategories;
  }
};

export const addCategory = async (name: string, img?: string): Promise<boolean> => {
  try {
    const cleanName = name.trim();
    const cleanImg = img?.trim() || PRESET_IMAGES[0].value;
    const database = await getDb();

    if (database) {
      await database.runAsync('INSERT INTO categories (name, img) VALUES (?, ?)', [
        cleanName,
        cleanImg,
      ]);
      return true;
    }

    const cats = await fetchCategories();
    const nextId = cats.length > 0 ? Math.max(...cats.map((c) => c.id)) + 1 : 1;
    const updated = [...cats, { id: nextId, name: cleanName, img: cleanImg }];
    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[addCategory] Error:', error);
    return false;
  }
};

export const updateCategory = async (
  id: number,
  name: string,
  img?: string
): Promise<boolean> => {
  try {
    const cleanName = name.trim();
    const cleanImg = img?.trim() || PRESET_IMAGES[0].value;
    const database = await getDb();

    if (database) {
      await database.runAsync('UPDATE categories SET name = ?, img = ? WHERE id = ?', [
        cleanName,
        cleanImg,
        id,
      ]);
      return true;
    }

    const cats = await fetchCategories();
    const updated = cats.map((c) =>
      c.id === id ? { ...c, name: cleanName, img: cleanImg } : c
    );
    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateCategory] Error:', error);
    return false;
  }
};

// Cascade delete: deleting a category also removes every product inside it
export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    await initDatabase();
    const database = await getDb();
    if (database) {
      await database.runAsync('DELETE FROM products WHERE categoryId = ?', [id]);
      await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      return true;
    }

    const cats = await fetchCategories();
    const prods = await fetchAllProducts();
    const filteredCats = cats.filter((c) => c.id !== id);
    const filteredProds = prods.filter((p) => p.categoryId !== id);

    await AsyncStorage.setItem(ASYNC_KEYS.CATEGORIES, JSON.stringify(filteredCats));
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(filteredProds));
    return true;
  } catch (error) {
    console.error('[deleteCategory] Error:', error);
    return false;
  }
};

// ==================== 2. PRODUCT MANAGEMENT ====================
// Admin view: every row, including soft deleted ones
export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    await initDatabase();
    const database = await getDb();
    if (database) {
      const rows = await database.getAllAsync<Product>('SELECT * FROM products ORDER BY id DESC');
      return rows.map(normalizeProduct);
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
    const list: Product[] = json ? JSON.parse(json) : initialProducts;
    return list.map(normalizeProduct);
  } catch (error) {
    console.warn('[fetchAllProducts] AsyncStorage fallback:', error);
    const json = await AsyncStorage.getItem(ASYNC_KEYS.PRODUCTS);
    const list: Product[] = json ? JSON.parse(json) : initialProducts;
    return list.map(normalizeProduct);
  }
};

// Storefront view: soft deleted products are hidden
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    await initDatabase();
    const database = await getDb();
    if (database) {
      const rows = await database.getAllAsync<Product>(
        'SELECT * FROM products WHERE isDeleted = 0 ORDER BY id DESC'
      );
      return rows.map(normalizeProduct);
    }
    const all = await fetchAllProducts();
    return all.filter((p) => Number(p.isDeleted ?? 0) === 0);
  } catch (error) {
    console.warn('[fetchProducts] AsyncStorage fallback:', error);
    const all = await fetchAllProducts();
    return all.filter((p) => Number(p.isDeleted ?? 0) === 0);
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const prods = await fetchAllProducts();
    return prods.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('[getProductById] Error:', error);
    return null;
  }
};

export const fetchProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  try {
    const prods = await fetchProducts();
    if (categoryId === 0) return prods;
    return prods.filter((p) => p.categoryId === categoryId);
  } catch (error) {
    console.error('[fetchProductsByCategory] Error:', error);
    return [];
  }
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  try {
    const trimmed = keyword.trim().toLowerCase();
    const prods = await fetchProducts();
    if (!trimmed) return prods;
    return prods.filter((p) => p.name.toLowerCase().includes(trimmed));
  } catch (error) {
    console.error('[searchProducts] Error:', error);
    return [];
  }
};

export const getSaleProducts = async (): Promise<Product[]> => {
  try {
    const prods = await fetchProducts();
    return prods.filter(
      (p) =>
        p.salePrice !== null &&
        p.salePrice !== undefined &&
        Number(p.salePrice) > 0 &&
        Number(p.salePrice) < Number(p.price) &&
        Number(p.isDeleted ?? 0) === 0
    );
  } catch (error) {
    console.error('[getSaleProducts] Error:', error);
    return [];
  }
};

// Random suggestions: exclude cart products, only in stock and not deleted
export const getRecommendedProducts = async (
  excludeIds: number[] = [],
  limit: number = 8
): Promise<Product[]> => {
  try {
    const prods = await fetchProducts();
    const excluded = new Set(excludeIds);
    const pool = prods.filter(
      (p) => !excluded.has(p.id) && Number(p.stock ?? 0) > 0 && Number(p.isDeleted ?? 0) === 0
    );
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error('[getRecommendedProducts] Error:', error);
    return [];
  }
};

export const addProduct = async (payload: {
  name: string;
  price: number;
  salePrice?: number | null;
  stock?: number;
  img: string;
  categoryId: number;
  description?: string;
}): Promise<boolean> => {
  try {
    const database = await getDb();
    const cleanImg = payload.img.trim() || PRESET_IMAGES[0].value;
    const desc =
      payload.description?.trim() || 'Genuine product distributed by TuTu Store.';
    const salePrice =
      payload.salePrice !== null &&
      payload.salePrice !== undefined &&
      Number(payload.salePrice) > 0 &&
      Number(payload.salePrice) < Number(payload.price)
        ? Number(payload.salePrice)
        : null;
    const stock = Math.max(0, Number(payload.stock ?? 0));

    if (database) {
      await database.runAsync(
        `INSERT INTO products (name, price, salePrice, img, categoryId, description, rating, soldCount, stock, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [payload.name.trim(), payload.price, salePrice, cleanImg, payload.categoryId, desc, 4.5, 0, stock, 0]
      );
      return true;
    }

    const prods = await fetchAllProducts();
    const nextId = prods.length > 0 ? Math.max(...prods.map((p) => p.id)) + 1 : 1;
    const newProd: Product = {
      id: nextId,
      name: payload.name.trim(),
      price: payload.price,
      salePrice,
      img: cleanImg,
      categoryId: payload.categoryId,
      description: desc,
      rating: 4.5,
      soldCount: 0,
      stock,
      isDeleted: 0,
    };
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify([newProd, ...prods]));
    return true;
  } catch (error) {
    console.error('[addProduct] Error:', error);
    return false;
  }
};

export const updateProduct = async (
  id: number,
  payload: {
    name: string;
    price: number;
    salePrice?: number | null;
    stock?: number;
    img: string;
    categoryId: number;
    description?: string;
  }
): Promise<boolean> => {
  try {
    const database = await getDb();
    const cleanImg = payload.img.trim() || PRESET_IMAGES[0].value;
    const desc =
      payload.description?.trim() || 'Genuine product distributed by TuTu Store.';
    const salePrice =
      payload.salePrice !== null &&
      payload.salePrice !== undefined &&
      Number(payload.salePrice) > 0 &&
      Number(payload.salePrice) < Number(payload.price)
        ? Number(payload.salePrice)
        : null;
    const stock = Math.max(0, Number(payload.stock ?? 0));

    if (database) {
      await database.runAsync(
        `UPDATE products SET name = ?, price = ?, salePrice = ?, img = ?, categoryId = ?, description = ?, stock = ?
         WHERE id = ?`,
        [payload.name.trim(), payload.price, salePrice, cleanImg, payload.categoryId, desc, stock, id]
      );
      return true;
    }

    const prods = await fetchAllProducts();
    const updated = prods.map((p) =>
      p.id === id
        ? {
          ...p,
          name: payload.name.trim(),
          price: payload.price,
          salePrice,
          img: cleanImg,
          categoryId: payload.categoryId,
          description: desc,
          stock,
        }
        : p
    );
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateProduct] Error:', error);
    return false;
  }
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
      return true;
    }

    const prods = await fetchAllProducts();
    const filtered = prods.filter((p) => p.id !== id);
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[deleteProduct] Error:', error);
    return false;
  }
};

// Soft delete: keep the row but hide it from the storefront
export const softDeleteProduct = async (productId: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE products SET isDeleted = 1 WHERE id = ?', [productId]);
      return true;
    }
    const prods = await fetchAllProducts();
    const updated = prods.map((p) =>
      p.id === productId ? { ...p, isDeleted: 1 } : p
    );
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[softDeleteProduct] Error:', error);
    return false;
  }
};

export const restoreProduct = async (productId: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE products SET isDeleted = 0 WHERE id = ?', [productId]);
      return true;
    }
    const prods = await fetchAllProducts();
    const updated = prods.map((p) =>
      p.id === productId ? { ...p, isDeleted: 0 } : p
    );
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[restoreProduct] Error:', error);
    return false;
  }
};

export const updateProductStock = async (
  productId: number,
  newStock: number
): Promise<boolean> => {
  try {
    const safeStock = Math.max(0, Math.floor(newStock));
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE products SET stock = ? WHERE id = ?', [
        safeStock,
        productId,
      ]);
      return true;
    }
    const prods = await fetchAllProducts();
    const updated = prods.map((p) =>
      p.id === productId ? { ...p, stock: safeStock } : p
    );
    await AsyncStorage.setItem(ASYNC_KEYS.PRODUCTS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateProductStock] Error:', error);
    return false;
  }
};

export const deductStock = async (
  productId: number,
  quantity: number
): Promise<{ success: boolean; message?: string }> => {
  try {
    const prods = await fetchAllProducts();
    const prod = prods.find((p) => p.id === productId);
    if (!prod) {
      return { success: false, message: 'Product not found.' };
    }
    const currentStock = Number(prod.stock ?? 0);
    if (currentStock < quantity) {
      return { success: false, message: `Insufficient stock for ${prod.name}` };
    }
    const ok = await updateProductStock(productId, currentStock - quantity);
    return ok
      ? { success: true }
      : { success: false, message: `Could not update stock for ${prod.name}` };
  } catch (error) {
    console.error('[deductStock] Error:', error);
    return { success: false, message: 'Could not update stock.' };
  }
};

// ==================== 3. USER MANAGEMENT & AUTH ====================
export const fetchUsers = async (): Promise<User[]> => {
  try {
    await initDatabase();
    const database = await getDb();
    if (database) {
      return await database.getAllAsync<User>('SELECT * FROM users ORDER BY id ASC');
    }
    const json = await AsyncStorage.getItem(ASYNC_KEYS.USERS);
    return json ? JSON.parse(json) : initialUsers;
  } catch (error) {
    console.warn('[fetchUsers] AsyncStorage fallback:', error);
    const json = await AsyncStorage.getItem(ASYNC_KEYS.USERS);
    return json ? JSON.parse(json) : initialUsers;
  }
};

export const registerUser = async (payload: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const cleanUsername = payload.username.trim().toLowerCase();
    const users = await fetchUsers();

    const existed = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (existed) {
      return {
        success: false,
        message: 'This username already exists. Please choose another one.',
      };
    }

    const cleanEmail = payload.email?.trim().toLowerCase() || '';
    if (cleanEmail) {
      const emailExisted = users.some(
        (u) => (u.email || '').trim().toLowerCase() === cleanEmail
      );
      if (emailExisted) {
        return {
          success: false,
          message: 'This email is already registered. Please use another email.',
        };
      }
    }

    const database = await getDb();
    if (database) {
      const result = await database.runAsync(
        'INSERT INTO users (username, password, fullName, email, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          cleanUsername,
          payload.password,
          payload.fullName.trim(),
          payload.email?.trim() || '',
          payload.phone?.trim() || '',
          payload.address?.trim() || '',
          'user',
        ]
      );
      const newUser: User = {
        id: result.lastInsertRowId,
        username: cleanUsername,
        password: payload.password,
        fullName: payload.fullName.trim(),
        email: payload.email?.trim() || '',
        phone: payload.phone?.trim() || '',
        address: payload.address?.trim() || '',
        role: 'user',
      };
      return {
        success: true,
        message: 'Account registered successfully.',
        user: newUser,
      };
    }

    const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: nextId,
      username: cleanUsername,
      password: payload.password,
      fullName: payload.fullName.trim(),
      email: payload.email?.trim() || '',
      phone: payload.phone?.trim() || '',
      address: payload.address?.trim() || '',
      role: 'user',
    };
    users.push(newUser);
    await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(users));
    return {
      success: true,
      message: 'Account registered successfully.',
      user: newUser,
    };
  } catch (error) {
    console.error('[registerUser] Error:', error);
    return { success: false, message: 'Could not save the account. Please try again.' };
  }
};

export const loginUser = async (
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const users = await fetchUsers();
    const foundUser = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUsername ||
          (u.email || '').trim().toLowerCase() === cleanUsername) &&
        u.password === password
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'Incorrect username or password. Please check again.',
      };
    }

    if (foundUser.isBlocked === 1 || foundUser.isBlocked === true) {
      return {
        success: false,
        message:
          'Your account has been blocked by the administrator. Please contact TuTu Store for support.',
      };
    }

    await AsyncStorage.setItem(ASYNC_KEYS.CURRENT_USER, JSON.stringify(foundUser));

    // Sync the guest cart into the user cart right after signing in
    if (!isAdminRole(foundUser.role)) {
      await syncGuestCartToUserCart(foundUser.id);
    }

    return {
      success: true,
      message: 'Signed in successfully.',
      user: foundUser,
    };
  } catch (error) {
    console.error('[loginUser] Error:', error);
    return { success: false, message: 'Could not verify the account. Please try again.' };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const json = await AsyncStorage.getItem(ASYNC_KEYS.CURRENT_USER);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ASYNC_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('[logoutUser] Error:', error);
  }
};

// Admin tool: change a user role (superadmin / admin / user)
export const updateUserRole = async (
  userId: number,
  newRole: UserRole
): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
    } else {
      const users = await fetchUsers();
      const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updated));
    }

    const current = await getCurrentUser();
    if (current && current.id === userId) {
      await AsyncStorage.setItem(
        ASYNC_KEYS.CURRENT_USER,
        JSON.stringify({ ...current, role: newRole })
      );
    }
    return true;
  } catch (error) {
    console.error('[updateUserRole] Error:', error);
    return false;
  }
};

// Admin tool: block / unblock an account
export const toggleBlockUser = async (
  userId: number,
  blockStatus: boolean
): Promise<boolean> => {
  try {
    const blockedInt = blockStatus ? 1 : 0;
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE users SET isBlocked = ? WHERE id = ?', [
        blockedInt,
        userId,
      ]);
    } else {
      const users = await fetchUsers();
      const updated = users.map((u) =>
        u.id === userId ? { ...u, isBlocked: blockedInt } : u
      );
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updated));
    }

    const current = await getCurrentUser();
    if (current && current.id === userId && blockStatus) {
      await logoutUser();
    }
    return true;
  } catch (error) {
    console.error('[toggleBlockUser] Error:', error);
    return false;
  }
};

// Super admin tool: permanently remove an account
export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('DELETE FROM users WHERE id = ?', [userId]);
      return true;
    }

    const users = await fetchUsers();
    const filtered = users.filter((u) => u.id !== userId);
    await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[deleteUser] Error:', error);
    return false;
  }
};

export const updateUserProfile = async (
  userId: number,
  payload: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    password?: string;
  }
): Promise<{ success: boolean; user?: User }> => {
  try {
    const users = await fetchUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false };

    const newPassword =
      payload.password && payload.password.trim().length > 0
        ? payload.password.trim()
        : target.password;

    const updatedUser: User = {
      ...target,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      password: newPassword,
    };

    const database = await getDb();
    if (database) {
      await database.runAsync(
        'UPDATE users SET fullName = ?, email = ?, phone = ?, address = ?, password = ? WHERE id = ?',
        [
          updatedUser.fullName,
          updatedUser.email || '',
          updatedUser.phone || '',
          updatedUser.address || '',
          updatedUser.password,
          userId,
        ]
      );
    } else {
      const updatedList = users.map((u) => (u.id === userId ? updatedUser : u));
      await AsyncStorage.setItem(ASYNC_KEYS.USERS, JSON.stringify(updatedList));
    }

    await AsyncStorage.setItem(ASYNC_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('[updateUserProfile] Error:', error);
    return { success: false };
  }
};

// ==================== 4. CART & GUEST -> USER SYNC ====================
const getActiveCartKey = async (): Promise<string> => {
  const current = await getCurrentUser();
  if (current && current.id > 0) {
    return `${ASYNC_KEYS.CART_USER_PREFIX}${current.id}`;
  }
  return ASYNC_KEYS.CART_GUEST;
};

export const syncGuestCartToUserCart = async (userId: number): Promise<void> => {
  try {
    const guestJson = await AsyncStorage.getItem(ASYNC_KEYS.CART_GUEST);
    const guestItems: CartItem[] = guestJson ? JSON.parse(guestJson) : [];
    if (guestItems.length === 0) return;

    const userCartKey = `${ASYNC_KEYS.CART_USER_PREFIX}${userId}`;
    const userJson = await AsyncStorage.getItem(userCartKey);
    const userItems: CartItem[] = userJson ? JSON.parse(userJson) : [];

    for (const gItem of guestItems) {
      const existingIndex = userItems.findIndex(
        (uItem) => uItem.productId === gItem.productId
      );
      if (existingIndex >= 0) {
        userItems[existingIndex].quantity += gItem.quantity;
      } else {
        userItems.push({ ...gItem });
      }
    }

    await AsyncStorage.setItem(userCartKey, JSON.stringify(userItems));
    await AsyncStorage.removeItem(ASYNC_KEYS.CART_GUEST);
  } catch (error) {
    console.error('[syncGuestCartToUserCart] Cart sync failed:', error);
  }
};

export const fetchCartItems = async (): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('[fetchCartItems] Error:', error);
    return [];
  }
};

export const addToCart = async (
  product: Product,
  quantity: number = 1
): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    const existingIndex = items.findIndex((item) => item.productId === product.id);
    const unitPrice =
      product.salePrice !== null &&
      product.salePrice !== undefined &&
      Number(product.salePrice) > 0 &&
      Number(product.salePrice) < Number(product.price)
        ? Number(product.salePrice)
        : product.price;

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      items[existingIndex].price = unitPrice;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        price: unitPrice,
        img: product.img,
        quantity,
      });
    }

    await AsyncStorage.setItem(key, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('[addToCart] Error:', error);
    return [];
  }
};

export const updateCartItemQuantity = async (
  productId: number,
  quantity: number
): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    let updated: CartItem[];
    if (quantity <= 0) {
      updated = items.filter((item) => item.productId !== productId);
    } else {
      updated = items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    }
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[updateCartItemQuantity] Error:', error);
    return [];
  }
};

export const removeFromCart = async (productId: number): Promise<CartItem[]> => {
  try {
    const key = await getActiveCartKey();
    const items = await fetchCartItems();
    const updated = items.filter((item) => item.productId !== productId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[removeFromCart] Error:', error);
    return [];
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    const key = await getActiveCartKey();
    await AsyncStorage.setItem(key, JSON.stringify([]));
  } catch (error) {
    console.error('[clearCart] Error:', error);
  }
};

// ==================== 5. ORDERS & PURCHASE HISTORY ====================
export const fetchOrders = async (userId?: number): Promise<Order[]> => {
  try {
    await initDatabase();
    const database = await getDb();
    let allOrders: Order[] = [];

    if (database) {
      const rows = await database.getAllAsync<{
        id: number;
        userId: number;
        customerName: string;
        phone: string;
        address: string;
        note: string;
        paymentMethod: string;
        totalAmount: number;
        status: string;
        createdAt: string;
        itemsJson: string;
      }>('SELECT * FROM orders ORDER BY id DESC');

      allOrders = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        customerName: r.customerName,
        phone: r.phone,
        address: r.address,
        note: r.note,
        paymentMethod: r.paymentMethod,
        totalAmount: r.totalAmount,
        status: r.status,
        createdAt: r.createdAt,
        items: r.itemsJson ? JSON.parse(r.itemsJson) : [],
      }));
    } else {
      const json = await AsyncStorage.getItem(ASYNC_KEYS.ORDERS);
      allOrders = json ? JSON.parse(json) : [];
    }

    if (userId !== undefined) {
      return allOrders.filter((o) => o.userId === userId);
    }
    return allOrders;
  } catch (error) {
    console.error('[fetchOrders] Error:', error);
    return [];
  }
};

// Place an order: validates stock, deducts stock and persists the order
export const createOrder = async (payload: {
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  items: OrderItem[];
}): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }

    const allProducts = await fetchAllProducts();
    for (const item of payload.items) {
      const prod = allProducts.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, message: `Product not found: ${item.productName}` };
      }
      if (Number(prod.stock ?? 0) < item.quantity) {
        return { success: false, message: `Insufficient stock for ${prod.name}` };
      }
    }

    for (const item of payload.items) {
      const deduct = await deductStock(item.productId, item.quantity);
      if (!deduct.success) {
        return { success: false, message: deduct.message };
      }
    }

    const totalAmount = payload.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const createdAt = new Date().toLocaleString('en-GB');
    const status = 'Pending';
    const itemsJson = JSON.stringify(payload.items);

    const database = await getDb();
    if (database) {
      const res = await database.runAsync(
        `INSERT INTO orders (userId, customerName, phone, address, note, paymentMethod, totalAmount, status, createdAt, itemsJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.userId,
          payload.customerName.trim(),
          payload.phone.trim(),
          payload.address.trim(),
          payload.note?.trim() || '',
          payload.paymentMethod,
          totalAmount,
          status,
          createdAt,
          itemsJson,
        ]
      );
      const newOrder: Order = {
        id: res.lastInsertRowId,
        userId: payload.userId,
        customerName: payload.customerName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        note: payload.note?.trim() || '',
        paymentMethod: payload.paymentMethod,
        totalAmount,
        status,
        createdAt,
        items: payload.items,
      };
      await clearCart();
      return { success: true, order: newOrder };
    }

    const existing = await fetchOrders();
    const nextId =
      existing.length > 0 ? Math.max(...existing.map((o) => o.id)) + 1 : 1001;
    const newOrder: Order = {
      id: nextId,
      userId: payload.userId,
      customerName: payload.customerName.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      note: payload.note?.trim() || '',
      paymentMethod: payload.paymentMethod,
      totalAmount,
      status,
      createdAt,
      items: payload.items,
    };
    await AsyncStorage.setItem(
      ASYNC_KEYS.ORDERS,
      JSON.stringify([newOrder, ...existing])
    );
    await clearCart();
    return { success: true, order: newOrder };
  } catch (error) {
    console.error('[createOrder] Error:', error);
    return { success: false, message: 'Could not save your order. Please try again.' };
  }
};

export const placeOrder = createOrder;

export const updateOrderStatus = async (
  orderId: number,
  newStatus: string
): Promise<boolean> => {
  try {
    const database = await getDb();
    if (database) {
      await database.runAsync('UPDATE orders SET status = ? WHERE id = ?', [
        newStatus,
        orderId,
      ]);
      return true;
    }

    const existing = await fetchOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    await AsyncStorage.setItem(ASYNC_KEYS.ORDERS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[updateOrderStatus] Error:', error);
    return false;
  }
};

// ==================== 6. HELPERS & ALIASES ====================
export const getProductImageSource = (img?: string) => {
  if (!img || img.startsWith('local:')) {
    return require('../../assets/images/hinh1.jpg');
  }
  return { uri: img };
};

export const searchAndFilterProducts = async (
  keyword: string,
  categoryId?: number,
  minPrice?: number,
  maxPrice?: number
): Promise<Product[]> => {
  const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
  const catMap = new Map<number, string>();
  cats.forEach((c) => catMap.set(c.id, c.name.toLowerCase()));

  const kw = keyword.trim().toLowerCase();
  return prods.filter((p) => {
    const matchCat = categoryId === undefined || p.categoryId === categoryId;
    const catName = catMap.get(p.categoryId) || '';
    const matchKw =
      !kw ||
      p.name.toLowerCase().includes(kw) ||
      catName.includes(kw) ||
      (p.description || '').toLowerCase().includes(kw);
    const effectivePrice =
      p.salePrice !== null && p.salePrice !== undefined && Number(p.salePrice) > 0
        ? Number(p.salePrice)
        : p.price;
    const matchMin =
      minPrice === undefined || isNaN(minPrice) || effectivePrice >= minPrice;
    const matchMax =
      maxPrice === undefined || isNaN(maxPrice) || effectivePrice <= maxPrice;
    return matchCat && matchKw && matchMin && matchMax;
  });
};

export const getCartItemCount = async (): Promise<number> => {
  const items = await fetchCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const insertCategory = addCategory;

export const insertProduct = async (
  name: string,
  price: number,
  img: string,
  description: string,
  categoryId: number,
  _soldCount: number = 0
): Promise<boolean> => {
  return addProduct({ name, price, img, categoryId, description });
};

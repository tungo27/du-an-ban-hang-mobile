import { Product } from '../data/database';

export type BottomTabParamList = {
  UserHomeTab: undefined;
  ProductsTab: { categoryId?: number } | undefined;
  AccountTab: undefined;
  AdminHomeTab: undefined;
  SignupTab: undefined;
  LoginTab: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof BottomTabParamList } | undefined;
  // Màn hình người dùng (Buổi 13 & 14)
  Products: { categoryId?: number } | undefined;
  ProductDetail: { product?: Product; productId?: number };
  Cart: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  Profile: undefined;
  Login: { redirectTo?: 'Checkout' | 'Cart' } | undefined;
  Register: undefined;
  // Màn hình quản trị Admin (Buổi 14)
  AdminHome: undefined;
  AdminUsers: undefined;
  AdminCategories: undefined;
  AdminProducts:
    | { categoryId?: number; categoryName?: string; openAddModal?: boolean }
    | undefined;
  AdminOrders: undefined;
};

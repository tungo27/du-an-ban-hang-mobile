import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/types/navigation';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminCategoriesScreen from './src/screens/AdminCategoriesScreen';
import AdminProductsScreen from './src/screens/AdminProductsScreen';
import AdminOrdersScreen from './src/screens/AdminOrdersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerStyle: { backgroundColor: '#1E3A8A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 15 },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={{ title: 'Sản phẩm - Ngô Minh Tú Store' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Chi tiết sản phẩm' }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'Giỏ hàng của bạn' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout & Đặt hàng' }}
          />
          <Stack.Screen
            name="OrderHistory"
            component={OrderHistoryScreen}
            options={{ title: 'Lịch sử mua hàng' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Cập nhật thông tin cá nhân' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Đăng nhập' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Đăng ký tài khoản' }}
          />
          <Stack.Screen
            name="AdminHome"
            component={AdminHomeScreen}
            options={{ title: 'Trang chủ Quản trị - Ngô Minh Tú' }}
          />
          <Stack.Screen
            name="AdminUsers"
            component={AdminUsersScreen}
            options={{ title: 'Quản trị User' }}
          />
          <Stack.Screen
            name="AdminCategories"
            component={AdminCategoriesScreen}
            options={{ title: 'Quản trị Loại sản phẩm' }}
          />
          <Stack.Screen
            name="AdminProducts"
            component={AdminProductsScreen}
            options={{ title: 'Quản trị Sản phẩm' }}
          />
          <Stack.Screen
            name="AdminOrders"
            component={AdminOrdersScreen}
            options={{ title: 'Quản trị Đơn hàng' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

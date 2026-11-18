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
            options={{ title: 'Products - TuTu Store' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'My Cart' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <Stack.Screen
            name="OrderHistory"
            component={OrderHistoryScreen}
            options={{ title: 'Order History' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Sign Up' }}
          />
          <Stack.Screen
            name="AdminHome"
            component={AdminHomeScreen}
            options={{ title: 'Admin Dashboard' }}
          />
          <Stack.Screen
            name="AdminUsers"
            component={AdminUsersScreen}
            options={{ title: 'User Management' }}
          />
          <Stack.Screen
            name="AdminCategories"
            component={AdminCategoriesScreen}
            options={{ title: 'Category Management' }}
          />
          <Stack.Screen
            name="AdminProducts"
            component={AdminProductsScreen}
            options={{ title: 'Product Management' }}
          />
          <Stack.Screen
            name="AdminOrders"
            component={AdminOrdersScreen}
            options={{ title: 'Order Management' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

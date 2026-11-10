import React, { useState, useCallback, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AccountScreen from '../screens/AccountScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import { getCurrentUser, User } from '../data/database';
import { showAlert } from '../utils/alertHelper';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type AuthListener = (user: User | null) => void;
const authListeners: Set<AuthListener> = new Set();

export const notifyAuthChanged = async () => {
  const user = await getCurrentUser();
  authListeners.forEach((listener) => listener(user));
};

const BottomTabNavigator: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const syncUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    syncUser();
    const listener: AuthListener = (user) => {
      setCurrentUser(user);
    };
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  }, [syncUser]);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#CBD5E1',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'UserHomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AdminHomeTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'SignupTab') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'LoginTab') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
      screenListeners={{
        state: () => {
          syncUser();
        },
      }}
    >
      {isAdmin ? (
        <>
          <Tab.Screen
            name="UserHomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Home User' }}
          />
          <Tab.Screen
            name="AdminHomeTab"
            component={AdminHomeScreen}
            options={{ tabBarLabel: 'Home Admin' }}
            listeners={({ navigation }) => ({
              tabPress: async (e) => {
                const latestUser = await getCurrentUser();
                if (!latestUser || latestUser.role !== 'admin') {
                  e.preventDefault();
                  showAlert(
                    'Truy cập bị từ chối (RBAC)',
                    'Chỉ tài khoản Quản trị viên (Admin) mới được phép truy cập Trang chủ Quản trị!',
                    () => {
                      navigation.navigate('UserHomeTab');
                    }
                  );
                }
              },
            })}
          />
          <Tab.Screen
            name="SignupTab"
            component={RegisterScreen}
            options={{ tabBarLabel: 'Signup' }}
          />
          <Tab.Screen
            name="LoginTab"
            component={LoginScreen}
            options={{ tabBarLabel: 'Login' }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="UserHomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Homepage' }}
          />
          <Tab.Screen
            name="ProductsTab"
            component={ProductsScreen}
            options={{ tabBarLabel: 'Sản phẩm' }}
          />
          <Tab.Screen
            name="AccountTab"
            component={AccountScreen}
            options={{ tabBarLabel: 'Cá nhân' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

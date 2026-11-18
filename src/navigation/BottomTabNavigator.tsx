import React, { useState, useCallback, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AccountScreen from '../screens/AccountScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import {
  getCurrentUser,
  subscribeAuthChanged,
  notifyAuthChanged,
  isAdminRole,
  User,
} from '../data/database';
import { showAlert } from '../utils/alertHelper';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export { notifyAuthChanged };

const BottomTabNavigator: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const insets = useSafeAreaInsets();
  // Keep the tab labels above the iPhone home indicator.
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  const syncUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    syncUser();
    const unsubscribe = subscribeAuthChanged((user) => {
      setCurrentUser(user);
    });
    return () => {
      unsubscribe();
    };
  }, [syncUser]);

  const isAdmin = isAdminRole(currentUser?.role);

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
          height: 64 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset + 4 : 10,
          paddingTop: 8,
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
      {!currentUser ? (
        <>
          <Tab.Screen
            name="UserHomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Home' }}
          />
          <Tab.Screen
            name="ProductsTab"
            component={ProductsScreen}
            options={{ tabBarLabel: 'Products' }}
          />
          <Tab.Screen
            name="SignupTab"
            component={RegisterScreen}
            options={{ tabBarLabel: 'Sign Up' }}
          />
          <Tab.Screen
            name="LoginTab"
            component={LoginScreen}
            options={{ tabBarLabel: 'Sign In' }}
          />
        </>
      ) : isAdmin ? (
        <>
          <Tab.Screen
            name="UserHomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Store' }}
          />
          <Tab.Screen
            name="ProductsTab"
            component={ProductsScreen}
            options={{ tabBarLabel: 'Products' }}
          />
          <Tab.Screen
            name="AdminHomeTab"
            component={AdminHomeScreen}
            options={{ tabBarLabel: 'Dashboard' }}
            listeners={({ navigation }) => ({
              tabPress: async (e) => {
                const latestUser = await getCurrentUser();
                if (!isAdminRole(latestUser?.role)) {
                  e.preventDefault();
                  showAlert(
                    'Access Denied (RBAC)',
                    'Only an administrator account can open the Admin Dashboard.',
                    () => {
                      navigation.navigate('UserHomeTab');
                    }
                  );
                }
              },
            })}
          />
          <Tab.Screen
            name="AccountTab"
            component={AccountScreen}
            options={{ tabBarLabel: 'Account' }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="UserHomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Home' }}
          />
          <Tab.Screen
            name="ProductsTab"
            component={ProductsScreen}
            options={{ tabBarLabel: 'Products' }}
          />
          <Tab.Screen
            name="AccountTab"
            component={AccountScreen}
            options={{ tabBarLabel: 'Account' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

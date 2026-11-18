import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  getCartItemCount,
  getCurrentUser,
  isAdminRole,
  subscribeAuthChanged,
} from '../data/database';

const getLeafRouteName = (state: any): string | undefined => {
  if (!state || !Array.isArray(state.routes) || state.routes.length === 0) {
    return undefined;
  }
  const index =
    typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return undefined;
  if (route.state) {
    return getLeafRouteName(route.state) ?? route.name;
  }
  return route.name;
};

/**
 * Floating cart bubble that stays on top of every screen.
 * It is hidden only on the Account tab (and for admin accounts that cannot shop).
 */
const FloatingCartButton: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const routeName = useNavigationState((state) => getLeafRouteName(state));

  const refresh = useCallback(async () => {
    try {
      const [count, user] = await Promise.all([
        getCartItemCount(),
        getCurrentUser(),
      ]);
      setCartCount(count);
      setIsAdmin(isAdminRole(user?.role));
    } catch (error) {
      console.error('[FloatingCartButton] Error:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, routeName]);

  useEffect(() => {
    const unsubscribe = subscribeAuthChanged(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const hidden = routeName === 'AccountTab' || isAdmin;
  if (hidden) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.cartBubble,
        {
          bottom:
            insets.bottom > 0 ? insets.bottom + 74 : 86,
        },
      ]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Cart')}
      accessibilityLabel="Open cart"
    >
      <Ionicons name="cart" size={24} color="#FFFFFF" />
      <Text style={styles.bubbleLabel}>Cart</Text>
      {cartCount > 0 && (
        <Text style={styles.countBadge}>
          {cartCount > 99 ? '99+' : cartCount}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartBubble: {
    position: 'absolute',
    right: 16,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  bubbleLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 1,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
});

export default FloatingCartButton;

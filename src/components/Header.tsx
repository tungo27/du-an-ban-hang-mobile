import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  getCurrentUser,
  logoutUser,
  getCartItemCount,
  notifyAuthChanged,
  isAdminRole,
  isSuperAdminRole,
  User,
} from '../data/database';
import { showConfirm, showAlert } from '../utils/alertHelper';

interface HeaderProps {
  onUserChanged?: (user: User | null) => void;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ onUserChanged, subtitle }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  const loadHeaderData = useCallback(async () => {
    try {
      const [user, count] = await Promise.all([
        getCurrentUser(),
        getCartItemCount(),
      ]);
      setCurrentUser(user);
      setCartCount(count);
      if (onUserChanged) {
        onUserChanged(user);
      }
    } catch (error) {
      console.error('Could not load header data:', error);
    }
  }, [onUserChanged]);

  useFocusEffect(
    useCallback(() => {
      loadHeaderData();
    }, [loadHeaderData])
  );

  const handleLogout = () => {
    showConfirm(
      'Sign Out',
      'Do you really want to sign out of TuTu Store?',
      async () => {
        await logoutUser();
        await notifyAuthChanged();
        setCurrentUser(null);
        if (onUserChanged) {
          onUserChanged(null);
        }
        showAlert('Signed Out', 'You have signed out successfully.', () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        });
      }
    );
  };

  const isAdmin = isAdminRole(currentUser?.role);
  const isSuperAdmin = isSuperAdminRole(currentUser?.role);

  const topSafePadding =
    insets.top > 0
      ? insets.top + 8
      : Platform.OS === 'android'
        ? (StatusBar.currentHeight || 24) + 10
        : 14;

  return (
    <View style={[styles.headerContainer, { paddingTop: topSafePadding }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MainTabs', {
              screen: isAdmin ? 'AdminHomeTab' : 'UserHomeTab',
            })
          }
          activeOpacity={0.8}
          style={styles.brandBox}
        >
          <View style={styles.brandRow}>
            <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
            <Text style={styles.storeTitle}>TUTU STORE</Text>
          </View>
          <Text style={styles.storeSubtitle} numberOfLines={1}>
            {subtitle || (isAdmin ? 'Management Console' : 'Fashion & Footwear')}
          </Text>
        </TouchableOpacity>

        {!isAdmin && (
          <TouchableOpacity
            style={styles.cartBadgeButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
            <Text style={styles.cartBadgeText}>Cart ({cartCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.userRow}>
        {currentUser ? (
          <View style={styles.loggedInContainer}>
            <View style={styles.userInfoBox}>
              <View style={styles.identityBox}>
                <View
                  style={[
                    styles.roleBadge,
                    isSuperAdmin
                      ? styles.roleSuperAdmin
                      : isAdmin
                        ? styles.roleAdmin
                        : styles.roleUser,
                  ]}
                >
                  <Ionicons
                    name={
                      isSuperAdmin
                        ? 'shield-checkmark'
                        : isAdmin
                          ? 'shield-half'
                          : 'person-outline'
                    }
                    size={11}
                    color="#FFFFFF"
                  />
                  <Text style={styles.roleBadgeText}>
                    {isSuperAdmin ? 'SUPER ADMIN' : isAdmin ? 'ADMIN' : 'CUSTOMER'}
                  </Text>
                </View>
                <Text style={styles.usernameSubText} numberOfLines={1}>
                  @{currentUser.username}
                </Text>
              </View>
            </View>

            <View style={styles.userActionsRow}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={12} color="#FFFFFF" />
                <Text style={styles.actionText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestContainer}>
            <View style={styles.guestTextBox}>
              <Ionicons name="information-circle-outline" size={14} color="#334155" />
              <Text style={styles.guestText}>
                Guest mode — your cart syncs after you sign in.
              </Text>
            </View>
            <View style={styles.guestButtons}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('MainTabs', { screen: 'LoginTab' })}
              >
                <Ionicons name="log-in-outline" size={12} color="#FFFFFF" />
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signupBtn}
                onPress={() => navigation.navigate('MainTabs', { screen: 'SignupTab' })}
              >
                <Ionicons name="person-add-outline" size={12} color="#2563EB" />
                <Text style={styles.signupBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1D4ED8',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandBox: {
    flex: 1,
    marginRight: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  storeSubtitle: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
  },
  cartBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userRow: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  loggedInContainer: {
    flexDirection: 'column',
  },
  userInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  identityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleSuperAdmin: {
    backgroundColor: '#B91C1C',
  },
  roleAdmin: {
    backgroundColor: '#7C3AED',
  },
  roleUser: {
    backgroundColor: '#2563EB',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  usernameSubText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  userActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  ordersActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  guestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  guestTextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 180,
  },
  guestText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  guestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  signupBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Header;

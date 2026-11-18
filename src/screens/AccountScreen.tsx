import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  getCurrentUser,
  logoutUser,
  getCartItemCount,
  fetchOrders,
  notifyAuthChanged,
  isAdminRole,
  isSuperAdminRole,
  User,
} from '../data/database';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
import { showAlert, showConfirm } from '../utils/alertHelper';

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadAccountData = useCallback(async () => {
    const [user, count] = await Promise.all([
      getCurrentUser(),
      getCartItemCount(),
    ]);
    setCurrentUser(user);
    setCartCount(count);
    setHeaderKey((prev) => prev + 1);

    if (user && isAdminRole(user.role)) {
      const orders = await fetchOrders();
      setOrderCount(orders.length);
    } else if (user) {
      const orders = await fetchOrders(user.id);
      setOrderCount(orders.length);
    } else {
      setOrderCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccountData();
    }, [loadAccountData])
  );

  const handleLogout = () => {
    showConfirm(
      'Sign Out',
      'Do you really want to sign out of TuTu Store?',
      async () => {
        await logoutUser();
        await notifyAuthChanged();
        setCurrentUser(null);
        setHeaderKey((prev) => prev + 1);
        showAlert('Signed Out', 'You have signed out successfully.', () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        });
      }
    );
  };

  const isAdmin = isAdminRole(currentUser?.role);
  const isSuperAdmin = isSuperAdminRole(currentUser?.role);

  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : isAdmin
      ? 'Admin'
      : 'Customer';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Header
        key={headerKey}
        subtitle="Your account & quick actions"
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.content}>
        {currentUser ? (
          <View style={styles.profileCard}>
            <View
              style={[
                styles.avatarCircle,
                isSuperAdmin
                  ? styles.avatarSuper
                  : isAdmin
                    ? styles.avatarAdmin
                    : null,
              ]}
            >
              <Text style={styles.avatarLetter}>
                {currentUser.fullName
                  ? currentUser.fullName.charAt(0).toUpperCase()
                  : 'T'}
              </Text>
            </View>

            <Text style={styles.userName}>{currentUser.fullName}</Text>
            <Text style={styles.userHandle}>@{currentUser.username}</Text>

            <View
              style={[
                styles.roleBadge,
                isSuperAdmin
                  ? styles.roleBadgeSuper
                  : isAdmin
                    ? styles.roleBadgeAdmin
                    : styles.roleBadgeUser,
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
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={15} color="#64748B" />
                <Text style={styles.infoValue}>
                  {currentUser.email || 'No email yet'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={15} color="#64748B" />
                <Text style={styles.infoValue}>
                  {currentUser.phone || 'No phone yet'}
                </Text>
              </View>
            </View>

            <View style={styles.actionGroup}>
              {isAdmin ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.dashboardBtn]}
                    onPress={() =>
                      navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
                    }
                  >
                    <Ionicons name="speedometer-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Admin Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.ordersBtn]}
                    onPress={() => navigation.navigate('AdminOrders')}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      All Orders ({orderCount})
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cartBtn]}
                    onPress={() => navigation.navigate('Cart')}
                  >
                    <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      My Cart ({cartCount} items)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.ordersBtn]}
                    onPress={() => navigation.navigate('OrderHistory')}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      My Orders ({orderCount})
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, styles.profileEditBtn]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconBox}>
              <Ionicons name="person-circle-outline" size={44} color="#2563EB" />
            </View>
            <Text style={styles.guestTitle}>Welcome to TuTu Store</Text>
            <Text style={styles.guestSub}>
              Sign in or create an account to manage your profile, follow your
              orders and check out faster.
            </Text>

            <View style={styles.authBtnRow}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                <Text style={styles.registerBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.guestCartLink}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={14} color="#1D4ED8" />
              <Text style={styles.guestCartLinkText}>
                View temporary cart ({cartCount} items)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 14,
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarAdmin: {
    backgroundColor: '#7C3AED',
  },
  avatarSuper: {
    backgroundColor: '#B91C1C',
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  userHandle: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 14,
  },
  roleBadgeSuper: {
    backgroundColor: '#B91C1C',
  },
  roleBadgeAdmin: {
    backgroundColor: '#7C3AED',
  },
  roleBadgeUser: {
    backgroundColor: '#2563EB',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  actionGroup: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cartBtn: {
    backgroundColor: '#D97706',
  },
  ordersBtn: {
    backgroundColor: '#059669',
  },
  profileEditBtn: {
    backgroundColor: '#2563EB',
  },
  dashboardBtn: {
    backgroundColor: '#7C3AED',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  loginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  registerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guestCartLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  guestCartLinkText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default AccountScreen;

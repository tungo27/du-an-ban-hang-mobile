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
  initDatabase,
  fetchUsers,
  fetchCategories,
  fetchProducts,
  fetchOrders,
  getCurrentUser,
  isAdminRole,
  isSuperAdminRole,
  User,
} from '../data/database';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [userCount, setUserCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadStatsAndCheckAuth = useCallback(async () => {
    setCheckingAuth(true);
    await initDatabase();
    const user = await getCurrentUser();
    setCurrentUser(user);
    setHeaderKey((prev) => prev + 1);

    if (!isAdminRole(user?.role)) {
      setCheckingAuth(false);
      showAlert(
        'Access Denied (RBAC)',
        'This area is restricted to administrators. Please sign in with an admin account.',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    const [users, cats, prods, orders] = await Promise.all([
      fetchUsers(),
      fetchCategories(),
      fetchProducts(),
      fetchOrders(),
    ]);
    setUserCount(users.length);
    setCategoryCount(cats.length);
    setProductCount(prods.length);
    setOrderCount(orders.length);
    setCheckingAuth(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadStatsAndCheckAuth();
    }, [loadStatsAndCheckAuth])
  );

  if (!checkingAuth && !isAdminRole(currentUser?.role)) {
    return (
      <View style={styles.container}>
        <Header
          key={headerKey}
          subtitle="RBAC Protected Area - TuTu Store"
          onUserChanged={(u) => setCurrentUser(u)}
        />
        <View style={styles.deniedCard}>
          <Ionicons name="lock-closed-outline" size={36} color="#DC2626" />
          <Text style={styles.deniedTitle}>ACCESS DENIED (403 FORBIDDEN)</Text>
          <Text style={styles.deniedDesc}>
            You are signed in as a guest or customer. Only accounts with the
            ADMIN or SUPER ADMIN role can open the management console.
          </Text>
          <View style={styles.deniedBtnRow}>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'UserHomeTab' })}
            >
              <Ionicons name="storefront-outline" size={13} color="#FFFFFF" />
              <Text style={styles.deniedBtnText}>Back to Store</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goLoginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={13} color="#FFFFFF" />
              <Text style={styles.deniedBtnText}>Admin Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isSuperAdmin = isSuperAdminRole(currentUser?.role);

  return (
    <ScrollView style={styles.container}>
      <Header
        key={headerKey}
        subtitle="ADMIN DASHBOARD - TUTU STORE"
        onUserChanged={(u) => {
          setCurrentUser(u);
          if (!isAdminRole(u?.role)) {
            navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
          }
        }}
      />

      <View style={styles.bannerBox}>
        <View style={styles.rbacBadge}>
          <Ionicons
            name={isSuperAdmin ? 'shield-checkmark' : 'shield-half'}
            size={12}
            color="#166534"
          />
          <Text style={styles.rbacText}>
            {isSuperAdmin ? 'SUPER ADMIN ACCESS' : 'ADMIN ACCESS'} —{' '}
            {currentUser?.fullName}
          </Text>
        </View>
        <Text style={styles.bannerTitle}>MANAGEMENT DASHBOARD</Text>
        <Text style={styles.bannerDesc}>
          Welcome back, {currentUser?.fullName || 'Admin'}. Manage users,
          categories, products and orders from one place.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#1D4ED8" />
            <Text style={styles.statNumber}>{userCount}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="albums-outline" size={16} color="#1D4ED8" />
            <Text style={styles.statNumber}>{categoryCount}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="pricetags-outline" size={16} color="#1D4ED8" />
            <Text style={styles.statNumber}>{productCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="receipt-outline" size={16} color="#1D4ED8" />
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionHeading}>MANAGEMENT TOOLS</Text>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardUsers]}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconBox, styles.iconBlue]}>
            <Ionicons name="people-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>USER MANAGEMENT</Text>
            <Text style={styles.menuSub}>
              {isSuperAdmin
                ? 'View accounts, change roles, block and delete users.'
                : 'View accounts and block customer accounts.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardCategories]}
          onPress={() => navigation.navigate('AdminCategories')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconBox, styles.iconGreen]}>
            <Ionicons name="albums-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>CATEGORY MANAGEMENT</Text>
            <Text style={styles.menuSub}>
              View, add, edit and delete categories. Add products directly to a
              category.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardProducts]}
          onPress={() => navigation.navigate('AdminProducts', {})}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconBox, styles.iconPurple]}>
            <Ionicons name="pricetags-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>PRODUCT MANAGEMENT</Text>
            <Text style={styles.menuSub}>
              Manage stock, sale prices, soft delete and restore products.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardOrders]}
          onPress={() => navigation.navigate('AdminOrders')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconBox, styles.iconAmber]}>
            <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>ORDER MANAGEMENT</Text>
            <Text style={styles.menuSub}>
              Review all system orders, filter by status and update progress.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  deniedCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  deniedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  deniedDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  deniedBtnRow: { flexDirection: 'row', gap: 10 },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#64748B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deniedBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  bannerBox: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rbacBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rbacText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  bannerDesc: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statItem: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  menuSection: { paddingHorizontal: 12, paddingBottom: 28 },
  sectionHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  menuCardUsers: { borderColor: '#93C5FD' },
  menuCardCategories: { borderColor: '#86EFAC' },
  menuCardProducts: { borderColor: '#C4B5FD' },
  menuCardOrders: { borderColor: '#FCD34D' },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBlue: { backgroundColor: '#2563EB' },
  iconGreen: { backgroundColor: '#16A34A' },
  iconPurple: { backgroundColor: '#7C3AED' },
  iconAmber: { backgroundColor: '#D97706' },
  menuContent: { flex: 1, marginRight: 8 },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  menuSub: { fontSize: 12, color: '#475569', lineHeight: 17 },
});

export default AdminHomeScreen;

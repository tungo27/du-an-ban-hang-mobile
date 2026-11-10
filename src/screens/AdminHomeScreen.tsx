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
import { RootStackParamList } from '../types/navigation';
import {
  initDatabase,
  fetchUsers,
  fetchCategories,
  fetchProducts,
  fetchOrders,
  getCurrentUser,
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

    if (!user || user.role !== 'admin') {
      setCheckingAuth(false);
      showAlert(
        'Truy cập bị từ chối (RBAC)',
        'Khu vực này chỉ dành riêng cho Quản trị viên (Admin). Vui lòng đăng nhập bằng tài khoản Admin!',
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

  // Chốt chặn RBAC: Không render nội dung quản trị nếu không phải Admin
  if (!checkingAuth && (!currentUser || currentUser.role !== 'admin')) {
    return (
      <View style={styles.container}>
        <Header
          key={headerKey}
          subtitle="Khu vực bảo mật RBAC - Ngô Minh Tú Store"
          onUserChanged={(u) => setCurrentUser(u)}
        />
        <View style={styles.deniedCard}>
          <Text style={styles.deniedTitle}>
            TRUY CẬP BỊ TỪ CHỐI (403 FORBIDDEN - RBAC)
          </Text>
          <Text style={styles.deniedDesc}>
            Bạn đang ở chế độ Khách hàng hoặc Tài khoản thường. Chỉ tài khoản có vai trò QUẢN TRỊ VIÊN (ADMIN) mới được phép truy cập Trang chủ Quản trị.
          </Text>
          <View style={styles.deniedBtnRow}>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'UserHomeTab' })
              }
            >
              <Text style={styles.backHomeBtnText}>VỀ TRANG KHÁCH HÀNG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goLoginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.goLoginBtnText}>ĐĂNG NHẬP ADMIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header
        key={headerKey}
        subtitle="TRANG CHỦ QUẢN TRỊ ADMIN - NGÔ MINH TÚ STORE"
        onUserChanged={(u) => {
          setCurrentUser(u);
          if (!u || u.role !== 'admin') {
            navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
          }
        }}
      />

      <View style={styles.bannerBox}>
        <View style={styles.rbacVerifiedBadge}>
          <Text style={styles.rbacVerifiedText}>
            RBAC VERIFIED: QUYỀN QUẢN TRỊ VIÊN ({currentUser?.fullName})
          </Text>
        </View>
        <Text style={styles.bannerTitle}>
          BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN (ADMIN DASHBOARD)
        </Text>
        <Text style={styles.bannerDesc}>
          Chào mừng Quản trị viên Ngô Minh Tú! Chọn các chức năng bên dưới để quản lý User, Loại sản phẩm và Sản phẩm trong CSDL.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userCount}</Text>
            <Text style={styles.statLabel}>Tài khoản</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categoryCount}</Text>
            <Text style={styles.statLabel}>Loại SP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{productCount}</Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionHeading}>
          CÁC CHỨC NĂNG QUẢN TRỊ CHÍNH (BÀI TẬP 14)
        </Text>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardUsers]}
          onPress={() => navigation.navigate('AdminUsers')}
          activeOpacity={0.85}
        >
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>01</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>QUẢN LÝ USER</Text>
            <Text style={styles.menuSub}>
              Xem danh sách tài khoản ({userCount} users), cập nhật vai trò (Admin / User) và chặn / mở chặn người dùng.
            </Text>
          </View>
          <View style={styles.goBtn}>
            <Text style={styles.goBtnText}>Mở</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardCategories]}
          onPress={() => navigation.navigate('AdminCategories')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuBadge, styles.badgeGreen]}>
            <Text style={styles.menuBadgeText}>02</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>QUẢN LÝ LOẠI SẢN PHẨM</Text>
            <Text style={styles.menuSub}>
              Xem, thêm, sửa, xóa loại sản phẩm ({categoryCount} loại) + Thêm sản phẩm trực tiếp cho loại tương ứng.
            </Text>
          </View>
          <View style={[styles.goBtn, styles.badgeGreen]}>
            <Text style={styles.goBtnText}>Mở</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardProducts]}
          onPress={() => navigation.navigate('AdminProducts', {})}
          activeOpacity={0.85}
        >
          <View style={[styles.menuBadge, styles.badgePurple]}>
            <Text style={styles.menuBadgeText}>03</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>QUẢN LÝ SẢN PHẨM</Text>
            <Text style={styles.menuSub}>
              Xem, lọc theo loại, thêm mới, chỉnh sửa, xóa sản phẩm ({productCount} sản phẩm) kèm chọn hình ảnh.
            </Text>
          </View>
          <View style={[styles.goBtn, styles.badgePurple]}>
            <Text style={styles.goBtnText}>Mở</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardOrders]}
          onPress={() => navigation.navigate('AdminOrders')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuBadge, styles.badgeAmber]}>
            <Text style={styles.menuBadgeText}>04</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>QUẢN TRỊ ĐƠN HÀNG</Text>
            <Text style={styles.menuSub}>
              Xem danh sách đơn hàng ({orderCount} đơn), lọc theo trạng thái và cập nhật tình trạng xử lý đơn hàng.
            </Text>
          </View>
          <View style={[styles.goBtn, styles.badgeAmber]}>
            <Text style={styles.goBtnText}>Mở</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  deniedBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backHomeBtn: {
    backgroundColor: '#64748B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  goLoginBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goLoginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerBox: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rbacVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rbacVerifiedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  },
  statLabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
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
  menuCardUsers: {
    borderColor: '#93C5FD',
  },
  menuCardCategories: {
    borderColor: '#86EFAC',
  },
  menuCardProducts: {
    borderColor: '#C4B5FD',
  },
  menuCardOrders: {
    borderColor: '#FCD34D',
  },
  menuBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeGreen: {
    backgroundColor: '#16A34A',
  },
  badgePurple: {
    backgroundColor: '#7C3AED',
  },
  badgeAmber: {
    backgroundColor: '#D97706',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  menuContent: {
    flex: 1,
    marginRight: 10,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  menuSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  goBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default AdminHomeScreen;

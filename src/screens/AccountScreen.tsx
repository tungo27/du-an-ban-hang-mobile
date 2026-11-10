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
  getCurrentUser,
  logoutUser,
  getCartItemCount,
  fetchOrders,
  User,
} from '../data/database';
import { notifyAuthChanged } from '../navigation/BottomTabNavigator';
import Header from '../components/Header';
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

    if (user) {
      const orders = await fetchOrders(user.id);
      setOrderCount(orders.length);
    } else {
      const guestOrders = await fetchOrders(0);
      setOrderCount(guestOrders.length);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccountData();
    }, [loadAccountData])
  );

  const handleLogout = () => {
    showConfirm(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất tài khoản khỏi Ngô Minh Tú Store?',
      async () => {
        await logoutUser();
        await notifyAuthChanged();
        setCurrentUser(null);
        setHeaderKey((prev) => prev + 1);
        showAlert('Đã đăng xuất', 'Đã đăng xuất tài khoản thành công!');
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Header
        key={headerKey}
        subtitle="Trang Cá nhân & Tiện ích Mua sắm - Ngô Minh Tú Store"
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.content}>
        {currentUser ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {currentUser.fullName
                  ? currentUser.fullName.charAt(0).toUpperCase()
                  : 'T'}
              </Text>
            </View>
            <Text style={styles.userName}>{currentUser.fullName}</Text>
            <Text style={styles.userSub}>Tên đăng nhập: @{currentUser.username}</Text>
            {currentUser.email ? (
              <Text style={styles.userInfoLine}>Email: {currentUser.email}</Text>
            ) : null}
            {currentUser.phone ? (
              <Text style={styles.userInfoLine}>SĐT: {currentUser.phone}</Text>
            ) : null}
            {currentUser.address ? (
              <Text style={styles.userInfoLine}>Địa chỉ: {currentUser.address}</Text>
            ) : null}

            <View
              style={[
                styles.roleBadge,
                currentUser.role === 'admin' && styles.roleBadgeAdmin,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  currentUser.role === 'admin' && styles.roleBadgeTextAdmin,
                ]}
              >
                {currentUser.role === 'admin'
                  ? 'Vai trò: Quản trị viên (Admin)'
                  : 'Vai trò: Khách hàng thành viên'}
              </Text>
            </View>

            <View style={styles.loggedActionGroup}>
              {currentUser.role !== 'admin' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cartBtn]}
                    onPress={() => navigation.navigate('Cart')}
                  >
                    <Text style={styles.actionBtnText}>
                      GIỎ HÀNG CỦA TÔI ({cartCount} sản phẩm)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.orderBtn]}
                    onPress={() => navigation.navigate('OrderHistory')}
                  >
                    <Text style={styles.actionBtnText}>
                      ĐƠN MUA / LỊCH SỬ MUA HÀNG ({orderCount} đơn)
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, styles.profileEditBtn]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.actionBtnText}>
                  CẬP NHẬT THÔNG TIN CÁ NHÂN
                </Text>
              </TouchableOpacity>

              {currentUser.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.adminPanelBtn]}
                  onPress={() =>
                    navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
                  }
                >
                  <Text style={styles.actionBtnText}>
                    VÀO TRANG CHỦ QUẢN TRỊ (ADMIN)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.logoutBtnText}>ĐĂNG XUẤT TÀI KHOẢN</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>
              CHÀO MỪNG ĐẾN VỚI NGÔ MINH TÚ STORE
            </Text>
            <Text style={styles.guestSub}>
              Bạn hiện chưa đăng nhập. Vui lòng chọn Đăng nhập hoặc Đăng ký tài khoản (ví dụ: Ngô Minh Tú - ngominh_tu) để quản lý thông tin cá nhân và theo dõi đơn mua!
            </Text>

            <View style={styles.authBtnRow}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}
              >
                <Text style={styles.registerBtnText}>ĐĂNG KÝ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.guestQuickLinks}>
              <TouchableOpacity
                style={styles.guestCartLink}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.guestCartLinkText}>
                  Xem Giỏ hàng tạm thời ({cartCount} sản phẩm)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>
            THÔNG TIN SINH VIÊN & CỬA HÀNG
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên sinh viên:</Text>
            <Text style={styles.infoValue}>Ngô Minh Tú</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên ứng dụng:</Text>
            <Text style={styles.infoValue}>Ngô Minh Tú Store (btvnBuoi14)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cơ sở dữ liệu:</Text>
            <Text style={styles.infoValue}>SQLite (minhTuStore_b14.db)</Text>
          </View>
        </View>
      </View>
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
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
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
  userSub: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  userInfoLine: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeAdmin: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  roleBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleBadgeTextAdmin: {
    color: '#DC2626',
  },
  loggedActionGroup: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartBtn: {
    backgroundColor: '#D97706',
  },
  orderBtn: {
    backgroundColor: '#059669',
  },
  profileEditBtn: {
    backgroundColor: '#2563EB',
  },
  adminPanelBtn: {
    backgroundColor: '#7C3AED',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 16,
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
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  registerBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  guestQuickLinks: {
    width: '100%',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  guestCartLink: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  guestCartLinkText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
});

export default AccountScreen;

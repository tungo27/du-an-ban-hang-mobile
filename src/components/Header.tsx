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
  User,
} from '../data/database';
import { notifyAuthChanged } from '../navigation/BottomTabNavigator';
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
      console.error('Lỗi tải dữ liệu Header:', error);
    }
  }, [onUserChanged]);

  useFocusEffect(
    useCallback(() => {
      loadHeaderData();
    }, [loadHeaderData])
  );

  const handleLogout = () => {
    showConfirm(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi Ngô Minh Tú Store?',
      async () => {
        await logoutUser();
        await notifyAuthChanged();
        setCurrentUser(null);
        if (onUserChanged) {
          onUserChanged(null);
        }
        showAlert('Đã đăng xuất', 'Bạn đã đăng xuất thành công.', () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        });
      }
    );
  };

  const isAdmin = currentUser?.role === 'admin';
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
          <Text style={styles.storeTitle}>NGÔ MINH TÚ STORE</Text>
          <Text style={styles.storeSubtitle}>
            {subtitle ||
              (isAdmin
                ? 'Hệ thống Quản trị viên - Ngô Minh Tú'
                : 'Mua sắm trực tuyến - Ngô Minh Tú Store')}
          </Text>
        </TouchableOpacity>

        {/* Khi đăng nhập Admin thì ẩn Giỏ hàng vì Admin chỉ quản lý hệ thống */}
        {!isAdmin && (
          <TouchableOpacity
            style={styles.cartBadgeButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
            <Text style={styles.cartBadgeText}>Giỏ ({cartCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.userRow}>
        {currentUser ? (
          <View style={styles.loggedInContainer}>
            <View style={styles.userInfoBox}>
              <Text style={styles.greetingText} numberOfLines={1}>
                Xin chào,{' '}
                <Text style={styles.userNameHighlight}>
                  {currentUser.fullName}
                </Text>
              </Text>
              <View style={styles.roleAndEmailRow}>
                <View
                  style={[
                    styles.roleBadge,
                    isAdmin ? styles.roleAdmin : styles.roleUser,
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {isAdmin ? 'QUẢN TRỊ VIÊN' : 'KHÁCH HÀNG'}
                  </Text>
                </View>
                <Text style={styles.usernameSubText}>
                  @{currentUser.username}
                </Text>
              </View>
            </View>

            <View style={styles.userActionsRow}>
              {isAdmin ? (
                <TouchableOpacity
                  style={styles.adminActionBtn}
                  onPress={() =>
                    navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
                  }
                >
                  <Text style={styles.adminActionText}>Trang chủ Quản trị</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.profileActionBtn}
                    onPress={() => navigation.navigate('Profile')}
                  >
                    <Text style={styles.profileActionText}>Cập nhật TT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ordersActionBtn}
                    onPress={() => navigation.navigate('OrderHistory')}
                  >
                    <Text style={styles.ordersActionText}>Đơn mua</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guestContainer}>
            <Text style={styles.guestText}>
              Chế độ Khách hàng (Giỏ hàng sẽ tự động đồng bộ khi Đăng nhập)
            </Text>
            <View style={styles.guestButtons}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signupBtn}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.signupBtnText}>Đăng ký</Text>
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
  greetingText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  userNameHighlight: {
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  roleAndEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: '#DC2626',
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
    fontSize: 11,
    color: '#475569',
    marginLeft: 4,
  },
  userActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  adminActionBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  adminActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  profileActionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  profileActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  ordersActionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  ordersActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  guestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  guestText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    fontWeight: '600',
  },
  guestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  loginBtn: {
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

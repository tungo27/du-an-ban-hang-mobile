import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  initDatabase,
  loginUser,
  getCurrentUser,
  User,
} from '../data/database';
import Header from '../components/Header';
import { notifyAuthChanged } from '../navigation/BottomTabNavigator';
import { showAlert } from '../utils/alertHelper';

type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LoginRouteProp>();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      initDatabase().then(async () => {
        const u = await getCurrentUser();
        setLoggedUser(u);
      });
    }, [])
  );

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
      return;
    }

    const res = await loginUser(username.trim(), password.trim());
    if (!res.success || !res.user) {
      showAlert('Đăng nhập thất bại', res.message);
      return;
    }

    const user = res.user;
    setLoggedUser(user);
    setHeaderKey((prev) => prev + 1);
    await notifyAuthChanged();

    if (user.role === 'admin') {
      showAlert(
        'Đăng nhập Quản trị thành công',
        `Xin chào Quản trị viên ${user.fullName}! Đang chuyển đến Trang chủ Quản trị...`,
        () => {
          navigation.navigate('MainTabs', { screen: 'AdminHomeTab' });
        }
      );
    } else {
      const redirectTarget =
        route.params && 'redirectTo' in route.params
          ? route.params.redirectTo
          : undefined;

      showAlert(
        'Đăng nhập & Đồng bộ Giỏ hàng thành công',
        `Chào mừng khách hàng ${user.fullName}! Giỏ hàng của bạn đã được đồng bộ.`,
        () => {
          if (redirectTarget === 'Checkout') {
            navigation.navigate('Checkout');
          } else {
            navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
          }
        }
      );
    }
  };

  const fillQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          key={headerKey}
          onUserChanged={(u) => setLoggedUser(u)}
          subtitle="Đăng nhập hệ thống Ngô Minh Tú Store"
        />

        <View style={styles.formCard}>
          <Text style={styles.title}>ĐĂNG NHẬP TÀI KHOẢN</Text>
          <Text style={styles.subtitle}>
            Khi đăng nhập khách hàng, các sản phẩm trong giỏ hàng lúc chưa đăng nhập (Guest) sẽ tự động đồng bộ vào tài khoản của bạn.
          </Text>

          {loggedUser && (
            <View style={styles.activeSessionBanner}>
              <Text style={styles.activeSessionTitle}>
                ĐANG ĐĂNG NHẬP: {loggedUser.fullName} ({loggedUser.role.toUpperCase()})
              </Text>
              <View style={styles.activeSessionButtons}>
                {loggedUser.role === 'admin' ? (
                  <TouchableOpacity
                    style={styles.goToAdminBtn}
                    onPress={() =>
                      navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
                    }
                  >
                    <Text style={styles.goToAdminBtnText}>
                      Vào Trang chủ Quản trị
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.goToUserBtn}
                    onPress={() =>
                      navigation.navigate('MainTabs', { screen: 'UserHomeTab' })
                    }
                  >
                    <Text style={styles.goToUserBtnText}>Vào Trang chủ User</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.goToProfileBtn}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <Text style={styles.goToProfileBtnText}>Cập nhật thông tin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>Tên đăng nhập hoặc Email</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: ngominh_tu, admin hoặc ngominhtu@gmail.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu (mẫu: 123)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
          </TouchableOpacity>

          <View style={styles.sampleSection}>
            <Text style={styles.sampleTitle}>
              CHỌN NHANH TÀI KHOẢN MẪU TRONG CSDL (NGÔ MINH TÚ):
            </Text>
            <View style={styles.sampleRow}>
              <TouchableOpacity
                style={[styles.sampleChip, styles.sampleChipAdmin]}
                onPress={() => fillQuickAccount('admin', '123')}
              >
                <Text style={styles.sampleChipText}>Admin 1: admin / 123</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sampleChip, styles.sampleChipAdmin]}
                onPress={() => fillQuickAccount('minhtu_admin', '123')}
              >
                <Text style={styles.sampleChipText}>
                  Admin 2: minhtu_admin / 123
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sampleChip}
                onPress={() => fillQuickAccount('ngominh_tu', '123')}
              >
                <Text style={styles.sampleChipTextUser}>
                  User: ngominh_tu / 123
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Chưa có tài khoản?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'SignupTab' })}
            >
              <Text style={styles.switchLink}>Đăng ký tài khoản mới</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 14,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  activeSessionBanner: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 14,
  },
  activeSessionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  activeSessionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goToAdminBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  goToAdminBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goToUserBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  goToUserBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goToProfileBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  goToProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sampleSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sampleTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  sampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sampleChipAdmin: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  sampleChipTextUser: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  switchText: {
    fontSize: 13,
    color: '#64748B',
  },
  switchLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
  },
});

export default LoginScreen;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  getCurrentUser,
  updateUserProfile,
  User,
} from '../data/database';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadUser = useCallback(async () => {
    const current = await getCurrentUser();
    setUser(current);
    if (current) {
      setFullName(current.fullName);
      setEmail(current.email || '');
      setPhone(current.phone || '');
      setAddress(current.address || '');
      setNewPassword('');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!fullName.trim() || !email.trim()) {
      showAlert('Thiếu thông tin', 'Họ và tên và Email không được để trống!');
      return;
    }

    const res = await updateUserProfile(user.id, {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      password: newPassword.trim() ? newPassword.trim() : undefined,
    });

    if (!res.success) {
      showAlert('Lỗi cập nhật', 'Không thể cập nhật thông tin người dùng.');
      return;
    }

    setHeaderKey((prev) => prev + 1);
    await loadUser();
    showAlert(
      'Cập nhật thành công',
      'Đã lưu thông tin cá nhân mới vào CSDL Ngô Minh Tú Store!'
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Header subtitle="Cập nhật thông tin cá nhân" />
        <View style={styles.notLoggedBox}>
          <Text style={styles.notLoggedTitle}>
            Bạn chưa đăng nhập tài khoản
          </Text>
          <Text style={styles.notLoggedSub}>
            Vui lòng đăng nhập tài khoản (ví dụ: ngominh_tu / 123) để xem và cập nhật thông tin cá nhân.
          </Text>
          <TouchableOpacity
            style={styles.goLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.goLoginText}>ĐẾN TRANG ĐĂNG NHẬP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          subtitle="Cập nhật thông tin người dùng"
          onUserChanged={(u) => setUser(u)}
        />

        <View style={styles.card}>
          <Text style={styles.title}>THÔNG TIN CÁ NHÂN NGƯỜI DÙNG</Text>
          <Text style={styles.metaInfo}>
            Username: @{user.username} | Vai trò: {user.role.toUpperCase()}
          </Text>

          <Text style={styles.label}>Họ và tên (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: ngominhtu@gmail.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: 0988123456 (Ngô Minh Tú)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Địa chỉ mặc định</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: Hải Châu, Đà Nẵng - Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>
            Đổi mật khẩu mới (Để trống nếu giữ nguyên mật khẩu cũ)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
            <Text style={styles.saveBtnText}>LƯU CẬP NHẬT THÔNG TIN</Text>
          </TouchableOpacity>
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
    paddingBottom: 130,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 14,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  metaInfo: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notLoggedBox: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notLoggedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  notLoggedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  goLoginBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
  },
  goLoginText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default ProfileScreen;

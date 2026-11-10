import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { registerUser } from '../data/database';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      showAlert(
        'Thiếu thông tin',
        'Vui lòng nhập đầy đủ Họ tên, Username, Email và Mật khẩu!'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert(
        'Email không hợp lệ',
        'Vui lòng nhập đúng định dạng Email (ví dụ: ngominhtu@gmail.com)!'
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Lỗi mật khẩu', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    const res = await registerUser({
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || '0905123456',
      address: address.trim() || 'Đà Nẵng - Ngô Minh Tú Store',
    });

    if (!res.success) {
      showAlert('Đăng ký thất bại', res.message);
      return;
    }

    showAlert('Đăng ký thành công', res.message, () => {
      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
      setConfirmPassword('');
      navigation.navigate('Login');
    });
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
        <Header subtitle="Đăng ký thành viên Ngô Minh Tú Store" />

        <View style={styles.formCard}>
          <Text style={styles.title}>ĐĂNG KÝ TÀI KHOẢN MỚI</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản khách hàng tại Ngô Minh Tú Store để mua sắm và theo dõi đơn hàng.
          </Text>

          <Text style={styles.label}>Họ và tên (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Tên đăng nhập (Username) (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: ngominh_tu_02"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Email (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: ngominhtu@gmail.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
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

          <Text style={styles.label}>Địa chỉ nhận hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: Ngô Minh Tú - Hải Châu, Đà Nẵng"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Mật khẩu (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu cho tài khoản Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Xác nhận mật khẩu (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <Text style={styles.registerBtnText}>HOÀN TẤT ĐĂNG KÝ</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Đã có tài khoản?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.switchLink}>Đăng nhập tại đây</Text>
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
    paddingBottom: 130,
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
  registerBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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

export default RegisterScreen;

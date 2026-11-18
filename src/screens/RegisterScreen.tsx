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
import { Ionicons } from '@expo/vector-icons';
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
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      showAlert(
        'Missing Information',
        'Please fill in your full name, username, email and password.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert(
        'Invalid Email',
        'Please enter a valid email address (e.g. ngominhtu@gmail.com).'
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'The confirmation password does not match.');
      return;
    }

    const res = await registerUser({
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || '0905123456',
      address: address.trim() || 'Da Nang - TuTu Store',
    });

    if (!res.success) {
      showAlert('Registration Failed', res.message);
      return;
    }

    showAlert('Registration Successful', res.message, () => {
      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
      setConfirmPassword('');
      navigation.navigate('MainTabs', { screen: 'LoginTab' });
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
        <Header subtitle="Create your TuTu Store account" />

        <View style={styles.formCard}>
          <View style={styles.titleRow}>
            <Ionicons name="person-add-outline" size={20} color="#1E3A8A" />
            <Text style={styles.title}>SIGN UP</Text>
          </View>
          <Text style={styles.subtitle}>
            Create a customer account to shop and track your orders at TuTu Store.
          </Text>

          <Text style={styles.label}>Full name (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ngo Minh Tu"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Username (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ngominh_tu_02"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Email (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ngominhtu@gmail.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0988123456 (Ngo Minh Tu)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Delivery address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ngo Minh Tu - Hai Chau, Da Nang"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Password (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password for Ngo Minh Tu"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm password (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
            <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'LoginTab' })}
            >
              <Text style={styles.switchLink}>Sign in here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 130 },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 14,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 6, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 6,
  },
  registerBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  switchText: { fontSize: 13, color: '#64748B' },
  switchLink: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },
});

export default RegisterScreen;

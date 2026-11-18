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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  initDatabase,
  loginUser,
  getCurrentUser,
  notifyAuthChanged,
  isAdminRole,
  User,
} from '../data/database';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LoginRouteProp>();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      initDatabase().then(async () => {
        setLoggedUser(await getCurrentUser());
      });
    }, [])
  );

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Missing Information', 'Please enter your username/email and password.');
      return;
    }

    const res = await loginUser(username.trim(), password.trim());
    if (!res.success || !res.user) {
      showAlert('Sign In Failed', res.message);
      return;
    }

    const user = res.user;
    setLoggedUser(user);
    setHeaderKey((prev) => prev + 1);
    await notifyAuthChanged();

    if (isAdminRole(user.role)) {
      showAlert(
        'Admin Sign In Successful',
        `Welcome, ${user.fullName}. Redirecting to the management dashboard...`,
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
        'Signed In',
        `Welcome, ${user.fullName}. Your cart has been synced.`,
        () => {
          if (redirectTarget === 'Checkout') {
            navigation.navigate('Checkout');
          } else if (redirectTarget === 'Cart') {
            navigation.navigate('Cart');
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

  const quickAccounts = [
    { username: 'admin', label: 'Super Admin', icon: 'shield-checkmark' as const },
    { username: 'minhtu_admin', label: 'Admin', icon: 'shield-half' as const },
    { username: 'ngominh_tu', label: 'Customer', icon: 'person-outline' as const },
  ];

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
          subtitle="Sign in to TuTu Store"
        />

        <View style={styles.formCard}>
          <View style={styles.titleRow}>
            <Ionicons name="log-in-outline" size={20} color="#1E3A8A" />
            <Text style={styles.title}>SIGN IN</Text>
          </View>
          <Text style={styles.subtitle}>
            Guest cart items are synced into your account automatically after signing in.
          </Text>

          {loggedUser && (
            <View style={styles.activeSessionBanner}>
              <View style={styles.sessionTitleRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#166534" />
                <Text style={styles.activeSessionTitle}>
                  SIGNED IN: {loggedUser.fullName} ({String(loggedUser.role).toUpperCase()})
                </Text>
              </View>
              <View style={styles.activeSessionButtons}>
                <TouchableOpacity
                  style={isAdminRole(loggedUser.role) ? styles.goToAdminBtn : styles.goToUserBtn}
                  onPress={() =>
                    navigation.navigate('MainTabs', {
                      screen: isAdminRole(loggedUser.role) ? 'AdminHomeTab' : 'UserHomeTab',
                    })
                  }
                >
                  <Ionicons
                    name={isAdminRole(loggedUser.role) ? 'speedometer-outline' : 'home-outline'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.sessionBtnText}>
                    {isAdminRole(loggedUser.role) ? 'Dashboard' : 'Home'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.goToProfileBtn}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <Ionicons name="person-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.sessionBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.label}>Username or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ngominh_tu, minhtu_admin or ngominhtu@gmail.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password (sample: 123)"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
            <Text style={styles.loginBtnText}>SIGN IN</Text>
          </TouchableOpacity>

          <View style={styles.sampleSection}>
            <Text style={styles.sampleTitle}>QUICK SAMPLE ACCOUNTS (PASSWORD: 123)</Text>
            <View style={styles.sampleRow}>
              {quickAccounts.map((account) => (
                <TouchableOpacity
                  key={account.username}
                  style={styles.sampleChip}
                  onPress={() => fillQuickAccount(account.username, '123')}
                >
                  <Ionicons name={account.icon} size={12} color="#2563EB" />
                  <Text style={styles.sampleChipText}>
                    {account.label}: {account.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>No account yet?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'SignupTab' })}
            >
              <Text style={styles.switchLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
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
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 6, marginBottom: 14, lineHeight: 18 },
  activeSessionBanner: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 14,
  },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  activeSessionTitle: { flex: 1, fontSize: 12, fontWeight: 'bold', color: '#166534' },
  activeSessionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goToAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  goToUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  goToProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  sessionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
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
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#1E293B',
  },
  eyeBtn: { paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 4,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
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
  sampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sampleChipText: { fontSize: 11, fontWeight: 'bold', color: '#2563EB' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  switchText: { fontSize: 13, color: '#64748B' },
  switchLink: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },
});

export default LoginScreen;

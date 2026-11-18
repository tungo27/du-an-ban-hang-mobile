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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { getCurrentUser, updateUserProfile, User } from '../data/database';
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
      showAlert('Missing Information', 'Full name and email cannot be empty.');
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
      showAlert('Update Failed', 'Could not update your profile. Please try again.');
      return;
    }

    setHeaderKey((prev) => prev + 1);
    await loadUser();
    showAlert('Profile Updated', 'Your profile has been saved to TuTu Store.');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Header subtitle="Edit Profile" />
        <View style={styles.notLoggedBox}>
          <Ionicons name="person-circle-outline" size={38} color="#94A3B8" />
          <Text style={styles.notLoggedTitle}>You are not signed in</Text>
          <Text style={styles.notLoggedSub}>
            Please sign in (e.g. ngominh_tu / 123) to view and update your profile.
          </Text>
          <TouchableOpacity
            style={styles.goLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={14} color="#FFFFFF" />
            <Text style={styles.goLoginText}>Go to Sign In</Text>
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
          subtitle="Edit Profile"
          onUserChanged={(u) => setUser(u)}
        />

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="create-outline" size={18} color="#1E3A8A" />
            <Text style={styles.title}>PERSONAL INFORMATION</Text>
          </View>
          <Text style={styles.metaInfo}>
            @{user.username} | Role: {String(user.role).toUpperCase()}
          </Text>

          <Text style={styles.label}>Full name (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ngo Minh Tu"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
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

          <Text style={styles.label}>Default address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hai Chau, Da Nang - Ngo Minh Tu"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>New password (leave blank to keep current)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a new password if you want to change it"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
            <Ionicons name="save-outline" size={15} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 130 },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 14,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1E3A8A' },
  metaInfo: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    fontWeight: '600',
  },
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
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
    marginTop: 8,
    marginBottom: 8,
  },
  notLoggedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  goLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
  },
  goLoginText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});

export default ProfileScreen;

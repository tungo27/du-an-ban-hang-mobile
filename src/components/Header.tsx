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
import { getCurrentUser, isAdminRole, User } from '../data/database';

interface HeaderProps {
  onUserChanged?: (user: User | null) => void;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ onUserChanged, subtitle }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const loadHeaderData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setIsAdmin(isAdminRole(user?.role));
      if (onUserChanged) {
        onUserChanged(user);
      }
    } catch (error) {
      console.error('Could not load header data:', error);
    }
  }, [onUserChanged]);

  useFocusEffect(
    useCallback(() => {
      loadHeaderData();
    }, [loadHeaderData])
  );

  const topSafePadding =
    insets.top > 0
      ? insets.top + 8
      : Platform.OS === 'android'
        ? (StatusBar.currentHeight || 24) + 10
        : 14;

  return (
    <View style={[styles.headerContainer, { paddingTop: topSafePadding }]}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('MainTabs', {
            screen: isAdmin ? 'AdminHomeTab' : 'UserHomeTab',
          })
        }
        activeOpacity={0.8}
        style={styles.brandBox}
      >
        <View style={styles.brandRow}>
          <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
          <Text style={styles.storeTitle}>TUTU STORE</Text>
        </View>
        <Text style={styles.storeSubtitle} numberOfLines={1}>
          {subtitle || (isAdmin ? 'Management Console' : 'Fashion & Footwear')}
        </Text>
      </TouchableOpacity>
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
  brandBox: {
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});

export default Header;

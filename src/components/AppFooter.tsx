import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CONTACT_ROWS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { icon: 'storefront-outline', label: 'TuTu Store - Fashion & Footwear' },
  { icon: 'location-outline', label: '123 Nguyen Trai Street, District 1, Ho Chi Minh City' },
  { icon: 'call-outline', label: 'Hotline: 1900 6868' },
  { icon: 'mail-outline', label: 'support@tutustore.vn' },
  { icon: 'person-outline', label: 'Project owner: Ngô Minh Tú' },
];

const AppFooter: React.FC = () => {
  return (
    <View style={styles.footer}>
      <View style={styles.brandRow}>
        <Ionicons name="storefront" size={18} color="#FFFFFF" />
        <Text style={styles.brandName}>TUTU STORE</Text>
      </View>
      <Text style={styles.tagline}>
        Genuine fashion & footwear, picked for your everyday style.
      </Text>

      <View style={styles.divider} />

      {CONTACT_ROWS.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <Ionicons name={row.icon} size={14} color="#93C5FD" />
          <Text style={styles.infoText}>{row.label}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.copyright}>
        © 2026 TuTu Store - All rights reserved.
      </Text>
      <Text style={styles.credit}>Designed & developed by Ngô Minh Tú.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#1E3A8A',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 18,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#1D4ED8',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#DBEAFE',
    lineHeight: 17,
  },
  copyright: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  credit: {
    fontSize: 11,
    color: '#BFDBFE',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AppFooter;

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
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCartItems,
  getCurrentUser,
  createOrder,
  getCartItemKey,
  getProductImageSource,
  isAdminRole,
  OWNER_ADDRESS,
  OWNER_PHONE,
  CartItem,
  User,
} from '../data/database';
import {
  clearCheckoutSelection,
  getCheckoutSelection,
} from '../data/checkoutSelection';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

const PAYMENT_METHODS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'Cash on Delivery (COD)', icon: 'cash-outline' },
  { label: 'Bank Transfer (TuTu Store)', icon: 'card-outline' },
  { label: 'E-Wallet (MoMo / VNPAY)', icon: 'wallet-outline' },
];

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PAYMENT_METHODS[0].label
  );

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchCartItems(), getCurrentUser()]).then(([items, user]) => {
        if (!user) {
          showAlert(
            'Sign In Required',
            'Only signed-in customers can check out. Please sign in to sync your cart and place an order.',
            () => {
              navigation.navigate('Login', { redirectTo: 'Checkout' });
            }
          );
          return;
        }
        if (isAdminRole(user.role)) {
          showAlert(
            'Administrator Account',
            'Admin accounts cannot place orders. Please use a customer account.',
            () => {
              navigation.navigate('MainTabs', { screen: 'AdminHomeTab' });
            }
          );
          return;
        }
        const selectedKeys = getCheckoutSelection();
        const chosenItems =
          selectedKeys && selectedKeys.length > 0
            ? items.filter((item) => selectedKeys.includes(getCartItemKey(item)))
            : items;

        setCartItems(chosenItems.length > 0 ? chosenItems : items);
        setCurrentUser(user);
        setRecipientName((prev) => prev || user.fullName);
        setRecipientPhone((prev) => prev || user.phone || OWNER_PHONE);
        setRecipientAddress(
          (prev) => prev || user.address || OWNER_ADDRESS
        );
      });
    }, [navigation])
  );

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      showAlert('Not Signed In', 'Please sign in before placing your order.', () => {
        navigation.navigate('Login', { redirectTo: 'Checkout' });
      });
      return;
    }

    if (cartItems.length === 0) {
      showAlert('Your cart is empty', 'There are no products to order.');
      return;
    }

    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !recipientAddress.trim()
    ) {
      showAlert(
        'Missing Delivery Details',
        'Please fill in the recipient name, phone number and delivery address.'
      );
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    const result = await createOrder({
      userId: currentUser.id,
      customerName: recipientName.trim(),
      phone: recipientPhone.trim(),
      address: recipientAddress.trim(),
      note: note.trim(),
      paymentMethod,
      items: cartItems,
    });
    setSubmitting(false);

    if (!result.success) {
      showAlert(
        'Order Failed',
        result.message || 'Could not save your order. Please try again.'
      );
      return;
    }

    showAlert(
      'Order Placed',
      `Your order #${result.order?.id ?? ''} at TuTu Store was created successfully.`,
      () => {
        navigation.navigate('OrderHistory');
      }
    );
  };

  if (!currentUser || isAdminRole(currentUser.role)) {
    return (
      <View style={styles.container}>
        <Header subtitle="Checkout & Order Confirmation" />
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
        <Header subtitle="Checkout & Order Confirmation" />

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>1. DELIVERY DETAILS</Text>
          </View>

          <Text style={styles.label}>Recipient name (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            value={recipientName}
            onChangeText={setRecipientName}
          />

          <Text style={styles.label}>Phone number (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0988666888 (Ngô Minh Tú)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
          />

          <Text style={styles.label}>Delivery address (*)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. 99 Tô Hiến Thành, Đà Nẵng (Ngô Minh Tú)"
            placeholderTextColor="#94A3B8"
            multiline
            value={recipientAddress}
            onChangeText={setRecipientAddress}
          />

          <Text style={styles.label}>Order note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Delivery instructions for the shop..."
            placeholderTextColor="#94A3B8"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={18} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>2. PAYMENT METHOD</Text>
          </View>
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method.label;
            return (
              <TouchableOpacity
                key={method.label}
                style={[styles.methodOption, active && styles.methodOptionActive]}
                onPress={() => setPaymentMethod(method.label)}
              >
                <Ionicons
                  name={method.icon}
                  size={18}
                  color={active ? '#1D4ED8' : '#64748B'}
                />
                <Text style={[styles.methodText, active && styles.methodTextActive]}>
                  {method.label}
                </Text>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={active ? '#2563EB' : '#CBD5E1'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-check-outline" size={18} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>
              3. ITEMS IN YOUR ORDER ({cartItems.length})
            </Text>
          </View>
          {cartItems.map((item) => (
            <View
              key={`${item.productId}-${item.size || 'NOSIZE'}`}
              style={styles.summaryItemCard}
            >
              <Image
                source={getProductImageSource(item.img)}
                style={styles.summaryItemImage}
                resizeMode="cover"
              />
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                {!!item.size && (
                  <Text style={styles.summaryItemSize}>Size: {item.size}</Text>
                )}
                <Text style={styles.summaryItemSub}>
                  {formatPrice(item.price)} x{item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ORDER TOTAL:</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.placeOrderBtn, submitting && styles.placeOrderBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={submitting}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
            <Text style={styles.placeOrderBtnText}>
              {submitting ? 'PLACING ORDER...' : 'CONFIRM & PLACE ORDER'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
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
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  methodOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  methodTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  summaryItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  summaryItemInfo: { flex: 1 },
  summaryItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  summaryItemSize: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryItemSub: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  summaryItemPrice: { fontSize: 13, fontWeight: 'bold', color: '#DC2626' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  totalAmount: { fontSize: 19, fontWeight: 'bold', color: '#DC2626' },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 8,
  },
  placeOrderBtnDisabled: { backgroundColor: '#F87171' },
  placeOrderBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});

export default CheckoutScreen;

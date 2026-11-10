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
  fetchCartItems,
  getCurrentUser,
  createOrder,
  CartItem,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    'Thanh toán khi nhận hàng (COD)'
  );

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchCartItems(), getCurrentUser()]).then(([items, user]) => {
        if (!user) {
          showAlert(
            'Yêu cầu đăng nhập',
            'Chỉ người dùng đã đăng nhập mới được phép thực hiện Checkout. Vui lòng đăng nhập để đồng bộ giỏ hàng và đặt hàng!',
            () => {
              navigation.navigate('Login', { redirectTo: 'Checkout' });
            }
          );
          return;
        }
        if (user.role === 'admin') {
          showAlert(
            'Chế độ Quản trị viên',
            'Tài khoản Admin không thực hiện đặt mua hàng!',
            () => {
              navigation.navigate('MainTabs', { screen: 'AdminHomeTab' });
            }
          );
          return;
        }
        setCartItems(items);
        setCurrentUser(user);
        setRecipientName((prev) => prev || user.fullName);
        setRecipientPhone((prev) => prev || user.phone || '0988123456');
        setRecipientAddress(
          (prev) => prev || user.address || 'Hải Châu, Đà Nẵng - Ngô Minh Tú'
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
      showAlert(
        'Chưa đăng nhập',
        'Vui lòng đăng nhập tài khoản trước khi xác nhận đặt hàng!',
        () => {
          navigation.navigate('Login', { redirectTo: 'Checkout' });
        }
      );
      return;
    }

    if (cartItems.length === 0) {
      showAlert('Giỏ hàng trống', 'Không có sản phẩm nào để đặt hàng!');
      return;
    }

    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !recipientAddress.trim()
    ) {
      showAlert(
        'Thiếu thông tin giao hàng',
        'Vui lòng điền đầy đủ Họ tên người nhận, Số điện thoại và Địa chỉ nhận hàng!'
      );
      return;
    }

    const result = await createOrder({
      userId: currentUser.id,
      customerName: recipientName.trim(),
      phone: recipientPhone.trim(),
      address: recipientAddress.trim(),
      paymentMethod,
      items: cartItems,
    });

    if (!result.success) {
      showAlert('Lỗi đặt hàng', 'Không thể lưu đơn hàng vào CSDL.');
      return;
    }

    showAlert(
      'Đặt hàng thành công',
      'Đơn hàng tại Ngô Minh Tú Store đã được tạo thành công!',
      () => {
        navigation.navigate('OrderHistory');
      }
    );
  };

  if (!currentUser || currentUser.role === 'admin') {
    return (
      <View style={styles.container}>
        <Header subtitle="Checkout & Đặt hàng" />
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
        <Header subtitle="Checkout & Xác nhận Đặt hàng" />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. THÔNG TIN NGƯỜI NHẬN HÀNG</Text>

          <Text style={styles.label}>Họ và tên người nhận (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Ngô Minh Tú"
            placeholderTextColor="#94A3B8"
            value={recipientName}
            onChangeText={setRecipientName}
          />

          <Text style={styles.label}>Số điện thoại liên hệ (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: 0988123456 (Ngô Minh Tú)"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
          />

          <Text style={styles.label}>Địa chỉ giao hàng chi tiết (*)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="vd: Số 123 Nguyễn Văn Linh, Đà Nẵng (Ngô Minh Tú)"
            placeholderTextColor="#94A3B8"
            multiline
            value={recipientAddress}
            onChangeText={setRecipientAddress}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. PHƯƠNG THỨC THANH TOÁN</Text>
          {[
            'Thanh toán khi nhận hàng (COD)',
            'Chuyển khoản Ngân hàng (Ngô Minh Tú Store)',
            'Ví điện tử MoMo / VNPAY',
          ].map((method) => {
            const active = paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[styles.methodOption, active && styles.methodOptionActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[styles.methodText, active && styles.methodTextActive]}
                >
                  {active ? '[ĐÃ CHỌN] ' : '[ ] '}
                  {method}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            3. TÓM TẮT ĐƠN HÀNG ({cartItems.length} MÓN)
          </Text>
          {cartItems.map((item) => (
            <View key={item.productId} style={styles.summaryRow}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.productName} (x{item.quantity})
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TỔNG CỘNG THANH TOÁN:</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          </View>

          <TouchableOpacity
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.placeOrderBtnText}>
              XÁC NHẬN ĐẶT HÀNG NGAY
            </Text>
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
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
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
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    marginRight: 10,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  placeOrderBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCartItems,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getProductImageSource,
  getCurrentUser,
  CartItem,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showConfirm, showAlert } from '../utils/alertHelper';

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadCart = useCallback(async () => {
    const [data, user] = await Promise.all([
      fetchCartItems(),
      getCurrentUser(),
    ]);
    setItems(data);
    setCurrentUser(user);
    setHeaderKey((prev) => prev + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  // Nếu là Admin thì không cho sử dụng giỏ hàng
  if (currentUser?.role === 'admin') {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="Giỏ hàng (Bị vô hiệu với Admin)" />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            Tài khoản Admin không sử dụng Giỏ hàng
          </Text>
          <Text style={styles.emptySub}>
            Quản trị viên chỉ thực hiện quản lý User, Loại sản phẩm và Sản phẩm theo yêu cầu đề bài.
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
            }
          >
            <Text style={styles.shopNowText}>VỀ TRANG CHỦ QUẢN TRỊ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleUpdateQty = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      showConfirm(
        'Xóa sản phẩm',
        `Bạn muốn xóa "${item.productName}" khỏi giỏ hàng?`,
        async () => {
          await removeFromCart(item.productId);
          loadCart();
        }
      );
      return;
    }
    await updateCartItemQuantity(item.productId, newQty);
    loadCart();
  };

  const handleRemoveItem = (item: CartItem) => {
    showConfirm(
      'Xóa khỏi giỏ hàng',
      `Xác nhận xóa "${item.productName}" khỏi giỏ hàng?`,
      async () => {
        await removeFromCart(item.productId);
        loadCart();
      }
    );
  };

  const handleClearAll = () => {
    showConfirm(
      'Làm trống giỏ hàng',
      'Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ hàng?',
      async () => {
        await clearCart();
        loadCart();
      }
    );
  };

  // Ràng buộc: Chỉ khi đã đăng nhập thì mới cho phép thực hiện Checkout
  const handleProceedCheckout = () => {
    if (!currentUser) {
      showConfirm(
        'Yêu cầu Đăng nhập để Checkout',
        'Bạn cần đăng nhập tài khoản khách hàng để tiến hành Checkout đặt hàng. Giỏ hàng hiện tại của bạn sẽ được tự động đồng bộ (sync) vào tài khoản ngay khi đăng nhập! Chuyển đến trang Đăng nhập ngay?',
        () => {
          navigation.navigate('Login', { redirectTo: 'Checkout' });
        }
      );
      return;
    }

    if (currentUser.role === 'admin') {
      showAlert(
        'Không thể đặt hàng',
        'Tài khoản Quản trị viên (Admin) không thực hiện mua hàng!'
      );
      return;
    }

    navigation.navigate('Checkout');
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId.toString()}
        ListHeaderComponent={
          <View>
            <Header
              key={headerKey}
              subtitle="Xem & Cập nhật Giỏ hàng"
              onUserChanged={(u) => setCurrentUser(u)}
            />
            {!currentUser && items.length > 0 && (
              <View style={styles.guestSyncBanner}>
                <Text style={styles.guestSyncText}>
                  Bạn đang dùng Giỏ hàng tạm (Guest). Khi bạn Đăng nhập, toàn bộ {items.length} mặt hàng này sẽ tự động đồng bộ vào tài khoản của bạn!
                </Text>
              </View>
            )}
            <View style={styles.topBar}>
              <Text style={styles.title}>
                GIỎ HÀNG CỦA BẠN ({items.length} mặt hàng)
              </Text>
              {items.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={handleClearAll}
                >
                  <Text style={styles.clearAllText}>Xóa tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <Image
              source={getProductImageSource(item.img)}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.itemSubtotal}>
                Thành tiền: {formatPrice(item.price * item.quantity)}
              </Text>

              <View style={styles.controlsRow}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleUpdateQty(item, -1)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleUpdateQty(item, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveItem(item)}
                >
                  <Text style={styles.deleteBtnText}>Xóa món</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              Giỏ hàng của bạn đang trống
            </Text>
            <Text style={styles.emptySub}>
              Hãy quay lại Ngô Minh Tú Store để chọn sản phẩm yêu thích nhé!
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'UserHomeTab' })
              }
            >
              <Text style={styles.shopNowText}>TIẾP TỤC MUA SẮM</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footerBar}>
          <View>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleProceedCheckout}
          >
            <Text style={styles.checkoutBtnText}>
              {currentUser ? 'TIẾN HÀNH CHECKOUT' : 'ĐĂNG NHẬP ĐỂ CHECKOUT'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 100,
  },
  guestSyncBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  guestSyncText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  clearAllBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearAllText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemImage: {
    width: 85,
    height: 85,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  shopNowBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  checkoutBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CartScreen;

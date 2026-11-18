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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCartItems,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getProductImageSource,
  getCurrentUser,
  getRecommendedProducts,
  addToCart,
  isAdminRole,
  CartItem,
  Product,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
import ProductCard from '../components/ProductCard';
import { showConfirm, showAlert } from '../utils/alertHelper';

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<CartItem[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadCart = useCallback(async () => {
    const [data, user] = await Promise.all([
      fetchCartItems(),
      getCurrentUser(),
    ]);
    setItems(data);
    setCurrentUser(user);
    const recs = await getRecommendedProducts(
      data.map((item) => item.productId),
      8
    );
    setRecommended(recs);
    setHeaderKey((prev) => prev + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const isAdmin = isAdminRole(currentUser?.role);

  if (isAdmin) {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="Cart is disabled for administrators" />
        <View style={styles.emptyBox}>
          <Ionicons name="lock-closed-outline" size={34} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Admin accounts cannot shop</Text>
          <Text style={styles.emptySub}>
            Administrators only manage users, categories, products and orders.
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
            }
          >
            <Ionicons name="speedometer-outline" size={14} color="#FFFFFF" />
            <Text style={styles.shopNowText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleUpdateQty = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      showConfirm(
        'Remove Item',
        `Remove "${item.productName}" from your cart?`,
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
      'Remove from Cart',
      `Are you sure you want to remove "${item.productName}"?`,
      async () => {
        await removeFromCart(item.productId);
        loadCart();
      }
    );
  };

  const handleClearAll = () => {
    showConfirm(
      'Clear Cart',
      'Do you want to remove every item from your cart?',
      async () => {
        await clearCart();
        loadCart();
      }
    );
  };

  const handleProceedCheckout = () => {
    if (!currentUser) {
      showConfirm(
        'Sign In Required',
        'You need to sign in before checking out. Your current cart will be synced to your account automatically after signing in. Go to Sign In now?',
        () => {
          navigation.navigate('Login', { redirectTo: 'Checkout' });
        }
      );
      return;
    }

    if (isAdminRole(currentUser.role)) {
      showAlert(
        'Action Not Allowed',
        'Administrator accounts cannot place orders.'
      );
      return;
    }

    navigation.navigate('Checkout');
  };

  const handleAddRecommended = async (product: Product) => {
    if (Number(product.stock ?? 0) <= 0) {
      showAlert('Out of Stock', `"${product.name}" is currently out of stock.`);
      return;
    }
    await addToCart(product, 1);
    await loadCart();
    showAlert(
      'Added to Cart',
      `"${product.name}" has been added to your cart.`
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const renderRecommendations = () => {
    if (recommended.length === 0) return null;
    return (
      <View style={styles.recSection}>
        <View style={styles.recHeader}>
          <Ionicons name="sparkles-outline" size={16} color="#D97706" />
          <Text style={styles.recTitle}>
            {items.length === 0 ? 'RECOMMENDED FOR YOU' : 'YOU MAY ALSO LIKE'}
          </Text>
        </View>
        <View style={styles.recGrid}>
          {recommended.map((prod) => (
            <View key={prod.id} style={styles.recCell}>
              <ProductCard
                product={prod}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: prod.id })
                }
                onAddToCart={handleAddRecommended}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId.toString()}
        ListHeaderComponent={
          <View>
            <Header
              key={headerKey}
              subtitle="Review your cart before checkout"
              onUserChanged={(u) => setCurrentUser(u)}
            />
            {!currentUser && items.length > 0 && (
              <View style={styles.guestSyncBanner}>
                <Ionicons name="information-circle-outline" size={14} color="#92400E" />
                <Text style={styles.guestSyncText}>
                  You are using a temporary guest cart. Sign in and these items
                  will be synced to your account automatically.
                </Text>
              </View>
            )}
            <View style={styles.topBar}>
              <Text style={styles.title}>
                MY CART ({items.length} {items.length === 1 ? 'item' : 'items'})
              </Text>
              {items.length > 0 && (
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={handleClearAll}
                >
                  <Ionicons name="trash-bin-outline" size={12} color="#DC2626" />
                  <Text style={styles.clearAllText}>Clear all</Text>
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
                Subtotal: {formatPrice(item.price * item.quantity)}
              </Text>

              <View style={styles.controlsRow}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleUpdateQty(item, -1)}
                  >
                    <Ionicons name="remove" size={15} color="#1E293B" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleUpdateQty(item, 1)}
                  >
                    <Ionicons name="add" size={15} color="#1E293B" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveItem(item)}
                >
                  <Ionicons name="trash-outline" size={12} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cart-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>
              Browse TuTu Store and add your favourite fashion items.
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'UserHomeTab' })
              }
            >
              <Ionicons name="storefront-outline" size={14} color="#FFFFFF" />
              <Text style={styles.shopNowText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <>
            {renderRecommendations()}
            <AppFooter />
          </>
        }
      />

      {items.length > 0 && (
        <View style={styles.footerBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleProceedCheckout}
          >
            <Ionicons name="card-outline" size={14} color="#FFFFFF" />
            <Text style={styles.checkoutBtnText}>
              {currentUser ? 'Checkout' : 'Sign In to Checkout'}
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
    paddingBottom: 110,
  },
  guestSyncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  guestSyncText: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  recSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  recGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
  },
  recCell: {
    width: '50%',
  },
});

export default CartScreen;

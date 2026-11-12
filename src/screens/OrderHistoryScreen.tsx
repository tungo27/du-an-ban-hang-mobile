import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchOrders,
  getCurrentUser,
  getProductImageSource,
  getProductById,
  Order,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  const loadOrders = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUserId(user?.id);
    setIsAdminUser(user?.role === 'admin');
    if (user) {
      if (user.role === 'admin' && filterMode === 'all') {
        const allOrders = await fetchOrders();
        setOrders(allOrders);
      } else {
        const userOrders = await fetchOrders(user.id);
        setOrders(userOrders);
      }
    } else {
      const guestOrders = await fetchOrders(0);
      setOrders(guestOrders);
    }
  }, [filterMode]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleOpenProduct = async (productId: number) => {
    const product = await getProductById(productId);
    if (product) {
      navigation.navigate('ProductDetail', { product });
    } else {
      navigation.navigate('Products', {});
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Header subtitle="Lịch sử mua hàng tại Ngô Minh Tú Store" />
            <View style={styles.headerBar}>
              <Text style={styles.title}>
                LỊCH SỬ ĐƠN HÀNG CỦA BẠN ({orders.length})
              </Text>
              {currentUserId !== undefined && isAdminUser && (
                <View style={styles.filterGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterBtn,
                      filterMode === 'my' && styles.filterBtnActive,
                    ]}
                    onPress={() => setFilterMode('my')}
                  >
                    <Text
                      style={[
                        styles.filterBtnText,
                        filterMode === 'my' && styles.filterBtnTextActive,
                      ]}
                    >
                      Đơn của tôi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterBtn,
                      filterMode === 'all' && styles.filterBtnActive,
                    ]}
                    onPress={() => setFilterMode('all')}
                  >
                    <Text
                      style={[
                        styles.filterBtnText,
                        filterMode === 'all' && styles.filterBtnTextActive,
                      ]}
                    >
                      Tất cả (Admin)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <View style={styles.orderCard}>
              <View style={styles.shopHeaderRow}>
                <View style={styles.shopBadgeRow}>
                  <View style={styles.mallBadge}>
                    <Text style={styles.mallBadgeText}>Yêu thích+</Text>
                  </View>
                  <Text style={styles.shopNameText}>Ngô Minh Tú Store</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.orderTopRow}>
                <Text style={styles.orderId}>MÃ ĐƠN HÀNG: #{item.id}</Text>
                <Text style={styles.orderDate}>{item.createdAt}</Text>
              </View>

              <View style={styles.divider} />
              <Text style={styles.itemsHeader}>
                Sản phẩm trong đơn hàng ({(item.items || []).length} sản phẩm):
              </Text>
              {(item.items || []).map((prod, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.shopeeItemCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenProduct(prod.productId)}
                >
                  <Image
                    source={getProductImageSource(prod.img)}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {prod.productName}
                    </Text>
                    <Text style={styles.itemVariantText}>
                      Phân loại: Chính hãng - Ngô Minh Tú Store
                    </Text>
                    <View style={styles.itemPriceQtyRow}>
                      <Text style={styles.unitPriceText}>
                        Đơn giá: {formatPrice(prod.price)}
                      </Text>
                      <Text style={styles.itemQtyBadge}>x{prod.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      Thành tiền: {formatPrice(prod.price * prod.quantity)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />
              <View style={styles.receiverBox}>
                <Text style={styles.metaText}>
                  Người nhận: {item.customerName} - SĐT: {item.phone}
                </Text>
                <Text style={styles.metaText}>
                  Địa chỉ giao: {item.address}
                </Text>
                <Text style={styles.metaText}>
                  Thanh toán: {item.paymentMethod}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tổng số tiền ({(item.items || []).reduce((s, i) => s + i.quantity, 0)} sản phẩm):
                </Text>
                <Text style={styles.totalValue}>
                  {formatPrice(item.totalAmount)}
                </Text>
              </View>

              <View style={styles.orderFooterActions}>
                <TouchableOpacity
                  style={styles.rebuyBtn}
                  onPress={() => {
                    const first = (item.items || [])[0];
                    if (first) {
                      handleOpenProduct(first.productId);
                    }
                  }}
                >
                  <Text style={styles.rebuyBtnText}>Xem sản phẩm / Mua lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySub}>
              Hãy thêm sản phẩm vào giỏ hàng và tiến hành Checkout để tạo đơn hàng mới!
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'UserHomeTab' })
              }
            >
              <Text style={styles.shopBtnText}>MUA SẮM NGAY</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 24,
  },
  headerBar: {
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
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#2563EB',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mallBadge: {
    backgroundColor: '#EE4D2D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mallBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shopNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  receiverBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  itemsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  shopeeItemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  itemDetailBox: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  itemVariantText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  itemPriceQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  unitPriceText: {
    fontSize: 12,
    color: '#475569',
  },
  itemQtyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EE4D2D',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  orderFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  rebuyBtn: {
    backgroundColor: '#EE4D2D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rebuyBtnText: {
    color: '#FFFFFF',
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
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  shopBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default OrderHistoryScreen;

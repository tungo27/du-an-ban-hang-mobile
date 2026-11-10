import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchOrders,
  getCurrentUser,
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
              <View style={styles.orderTopRow}>
                <Text style={styles.orderId}>MÃ ĐƠN: #{item.id}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.metaText}>Ngày đặt: {item.createdAt}</Text>
              <Text style={styles.metaText}>
                Người nhận: {item.customerName} - SĐT: {item.phone}
              </Text>
              <Text style={styles.metaText}>
                Địa chỉ: {item.address}
              </Text>
              <Text style={styles.metaText}>
                Thanh toán: {item.paymentMethod}
              </Text>

              <View style={styles.divider} />
              <Text style={styles.itemsHeader}>Danh sách sản phẩm đã mua:</Text>
              {(item.items || []).map((prod, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    - {prod.productName} (x{prod.quantity})
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(prod.price * prod.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng tiền đơn hàng:</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(item.totalAmount)}
                </Text>
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
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
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
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
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

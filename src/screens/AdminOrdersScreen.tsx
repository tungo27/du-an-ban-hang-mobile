import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchOrders,
  updateOrderStatus,
  getCurrentUser,
  getProductImageSource,
  Order,
  User,
} from '../data/database';
import Header from '../components/Header';
import { formatPrice } from '../utils/formatPrice';
import { showAlert, showConfirm } from '../utils/alertHelper';

const ORDER_STATUS_LIST = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao hàng',
  'Đã giao thành công',
  'Đã hủy',
];

const getStatusBadgeColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('chờ')) return '#D97706';
  if (s.includes('hủy')) return '#DC2626';
  if (s.includes('thành công')) return '#16A34A';
  if (s.includes('giao')) return '#7C3AED';
  return '#2563EB';
};

const AdminOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Tất cả');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadOrdersData = useCallback(async () => {
    const curr = await getCurrentUser();
    setCurrentUser(curr);
    setHeaderKey((prev) => prev + 1);

    if (!curr || curr.role !== 'admin') {
      showAlert(
        'Truy cập bị từ chối (RBAC)',
        'Chỉ Quản trị viên (Admin) mới có quyền Quản trị đơn hàng!',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    const allOrders = await fetchOrders();
    setOrders(allOrders);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadOrdersData();
    }, [loadOrdersData])
  );

  const handleChangeOrderStatus = (order: Order, nextStatus: string) => {
    if (order.status === nextStatus) return;

    showConfirm(
      'Cập nhật tình trạng đơn hàng',
      `Bạn muốn đổi tình trạng đơn hàng #${order.id} của khách hàng "${order.customerName}" từ "${order.status}" sang "${nextStatus}"?`,
      async () => {
        const ok = await updateOrderStatus(order.id, nextStatus);
        if (ok) {
          await loadOrdersData();
          showAlert(
            'Cập nhật thành công',
            `Đơn hàng #${order.id} đã được chuyển sang trạng thái: "${nextStatus}".`
          );
        } else {
          showAlert('Lỗi', 'Không thể cập nhật tình trạng đơn hàng.');
        }
      }
    );
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="Bảo mật RBAC - Quản trị Đơn hàng" />
      </View>
    );
  }

  const filteredOrders =
    selectedStatusFilter === 'Tất cả'
      ? orders
      : orders.filter((o) =>
          o.status.toLowerCase().includes(selectedStatusFilter.toLowerCase())
        );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Header
              key={headerKey}
              subtitle="Quản trị Đơn hàng (Xem & Cập nhật tình trạng)"
            />

            <View style={styles.topSummaryCard}>
              <Text style={styles.title}>
                QUẢN TRỊ ĐƠN HÀNG ({filteredOrders.length} / {orders.length} ĐƠN)
              </Text>
              <Text style={styles.subTitle}>
                Admin xem danh sách tất cả đơn hàng của khách hàng và cập nhật tình trạng xử lý đơn hàng theo thời gian thực.
              </Text>

              <View style={styles.filterRow}>
                {['Tất cả', ...ORDER_STATUS_LIST].map((st) => {
                  const active = selectedStatusFilter === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedStatusFilter(st)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;
          const badgeColor = getStatusBadgeColor(item.status);

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeaderRow}>
                <View style={styles.orderTitleBox}>
                  <Text style={styles.orderIdText}>ĐƠN HÀNG #{item.id}</Text>
                  <Text style={styles.orderDateText}>
                    Ngày đặt: {item.createdAt}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: badgeColor }]}
                >
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.customerBox}>
                <Text style={styles.customerName}>
                  Khách hàng: {item.customerName} (User ID: #{item.userId})
                </Text>
                <Text style={styles.customerInfo}>SĐT: {item.phone}</Text>
                <Text style={styles.customerInfo}>
                  Địa chỉ giao: {item.address}
                </Text>
                <Text style={styles.customerInfo}>
                  Thanh toán: {item.paymentMethod}
                </Text>
                {item.note ? (
                  <Text style={styles.customerInfo}>Ghi chú: {item.note}</Text>
                ) : null}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.itemCountText}>
                  Số mặt hàng: {item.items.length} SP
                </Text>
                <Text style={styles.totalPriceText}>
                  Tổng tiền: {formatPrice(item.totalAmount)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailToggleBtn}
                onPress={() =>
                  setExpandedOrderId(isExpanded ? null : item.id)
                }
              >
                <Text style={styles.detailToggleText}>
                  {isExpanded
                    ? 'Thu gọn chi tiết sản phẩm'
                    : `Xem chi tiết ${item.items.length} sản phẩm trong đơn`}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.itemsContainer}>
                  {item.items.map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Image
                        source={getProductImageSource(prod.img)}
                        style={styles.itemThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.itemInfoCol}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {prod.productName}
                        </Text>
                        <Text style={styles.itemSub}>
                          {formatPrice(prod.price)} x {prod.quantity} ={' '}
                          {formatPrice(prod.price * prod.quantity)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.updateSection}>
                <Text style={styles.updateLabel}>
                  CẬP NHẬT TÌNH TRẠNG ĐƠN HÀNG:
                </Text>
                <View style={styles.statusBtnGroup}>
                  {ORDER_STATUS_LIST.map((st) => {
                    const isCurrent = item.status === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusOptionBtn,
                          isCurrent && {
                            backgroundColor: getStatusBadgeColor(st),
                            borderColor: getStatusBadgeColor(st),
                          },
                        ]}
                        onPress={() => handleChangeOrderStatus(item, st)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            isCurrent && styles.statusOptionTextActive,
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Chưa có đơn hàng nào khớp trạng thái đang lọc.
            </Text>
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
    paddingBottom: 32,
  },
  topSummaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  orderDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  customerBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 3,
  },
  customerInfo: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  totalPriceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  detailToggleBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  detailToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  itemInfoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  updateSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  updateLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  statusBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default AdminOrdersScreen;

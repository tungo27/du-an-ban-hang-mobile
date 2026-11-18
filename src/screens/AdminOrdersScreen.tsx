import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchOrders,
  updateOrderStatus,
  getCurrentUser,
  getProductImageSource,
  isAdminRole,
  ORDER_STATUSES,
  Order,
  User,
} from '../data/database';
import Header from '../components/Header';
import { formatPrice } from '../utils/formatPrice';
import { showAlert, showConfirm } from '../utils/alertHelper';

type FilterValue = 'All' | (typeof ORDER_STATUSES)[number];

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'Pending':
      return { color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' as const };
    case 'Confirmed':
      return { color: '#2563EB', bg: '#DBEAFE', icon: 'checkmark-circle-outline' as const };
    case 'Shipping':
      return { color: '#7C3AED', bg: '#EDE9FE', icon: 'bicycle-outline' as const };
    case 'Delivered':
      return { color: '#059669', bg: '#DCFCE7', icon: 'cube-outline' as const };
    case 'Cancelled':
      return { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' as const };
    default:
      return { color: '#475569', bg: '#F1F5F9', icon: 'ellipse-outline' as const };
  }
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Pending: 'time-outline',
  Confirmed: 'checkmark-circle-outline',
  Shipping: 'bicycle-outline',
  Delivered: 'cube-outline',
  Cancelled: 'close-circle-outline',
};

const AdminOrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<FilterValue>('All');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [headerKey, setHeaderKey] = useState<number>(0);

  const loadOrdersData = useCallback(async () => {
    const curr = await getCurrentUser();
    setCurrentUser(curr);
    setHeaderKey((prev) => prev + 1);

    if (!isAdminRole(curr?.role)) {
      showAlert(
        'Access Denied (RBAC)',
        'Only administrators can manage customer orders.',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    setOrders(await fetchOrders());
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadOrdersData();
    }, [loadOrdersData])
  );

  const handleChangeOrderStatus = (order: Order, nextStatus: string) => {
    if (order.status === nextStatus) return;

    showConfirm(
      'Update Order Status',
      `Change order #${order.id} of "${order.customerName}" from "${order.status}" to "${nextStatus}"?`,
      async () => {
        const ok = await updateOrderStatus(order.id, nextStatus);
        if (ok) {
          await loadOrdersData();
          showAlert(
            'Status Updated',
            `Order #${order.id} is now "${nextStatus}".`
          );
        } else {
          showAlert('Update Failed', 'Could not update the order status.');
        }
      }
    );
  };

  if (!isAdminRole(currentUser?.role)) {
    return (
      <View style={styles.container}>
        <Header key={headerKey} subtitle="RBAC Security - Order Management" />
      </View>
    );
  }

  const filteredOrders =
    selectedStatusFilter === 'All'
      ? orders
      : orders.filter((o) => o.status === selectedStatusFilter);

  const filterOptions: FilterValue[] = ['All', ...ORDER_STATUSES];

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Header key={headerKey} subtitle="Order Management" />

            <View style={styles.topSummaryCard}>
              <View style={styles.titleRow}>
                <Ionicons name="receipt-outline" size={18} color="#1E3A8A" />
                <Text style={styles.title}>
                  ALL ORDERS ({filteredOrders.length} / {orders.length})
                </Text>
              </View>
              <Text style={styles.subTitle}>
                Review every customer order and update its processing status.
              </Text>

              <View style={styles.filterWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {filterOptions.map((st) => {
                    const active = selectedStatusFilter === st;
                    const icon =
                      st === 'All' ? 'apps-outline' : STATUS_ICONS[st] || 'ellipse-outline';
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setSelectedStatusFilter(st)}
                      >
                        <Ionicons
                          name={icon}
                          size={12}
                          color={active ? '#FFFFFF' : '#475569'}
                        />
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
                </ScrollView>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const meta = getStatusMeta(item.status);
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeaderRow}>
                <View style={styles.orderTitleBox}>
                  <Text style={styles.orderIdText}>ORDER #{item.id}</Text>
                  <Text style={styles.orderDateText}>Placed: {item.createdAt}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                  <Text style={[styles.statusBadgeText, { color: meta.color }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.customerBox}>
                <Text style={styles.customerName}>
                  Customer: {item.customerName} (User ID #{item.userId})
                </Text>
                <Text style={styles.customerInfo}>Phone: {item.phone}</Text>
                <Text style={styles.customerInfo}>Address: {item.address}</Text>
                <Text style={styles.customerInfo}>Payment: {item.paymentMethod}</Text>
                {item.note ? (
                  <Text style={styles.customerInfo}>Note: {item.note}</Text>
                ) : null}
              </View>

              <View style={styles.itemsContainer}>
                <Text style={styles.itemsSectionLabel}>
                  ITEMS IN THIS ORDER ({item.items.length})
                </Text>
                {item.items.map((prod, idx) => (
                  <View key={`${prod.productId}-${idx}`} style={styles.itemRow}>
                    <Image
                      source={getProductImageSource(prod.img)}
                      style={styles.itemThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {prod.productName}
                      </Text>
                      <Text style={styles.itemSub}>
                        {formatPrice(prod.price)} x{prod.quantity}
                      </Text>
                      <Text style={styles.itemSubtotalText}>
                        {formatPrice(prod.price * prod.quantity)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.itemCountText}>
                  Quantity: {item.items.reduce((s, i) => s + i.quantity, 0)}
                </Text>
                <Text style={styles.totalPriceText}>
                  Total: {formatPrice(item.totalAmount)}
                </Text>
              </View>

              <View style={styles.updateSection}>
                <Text style={styles.updateLabel}>UPDATE STATUS:</Text>
                <View style={styles.statusBtnGroup}>
                  {ORDER_STATUSES.map((st) => {
                    const isCurrent = item.status === st;
                    const stMeta = getStatusMeta(st);
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusOptionBtn,
                          isCurrent && {
                            backgroundColor: stMeta.color,
                            borderColor: stMeta.color,
                          },
                        ]}
                        onPress={() => handleChangeOrderStatus(item, st)}
                      >
                        <Ionicons
                          name={STATUS_ICONS[st] || 'ellipse-outline'}
                          size={11}
                          color={isCurrent ? '#FFFFFF' : '#475569'}
                        />
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
            <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>
              No orders match the selected status.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 32 },
  topSummaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  subTitle: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },
  filterWrapper: { marginTop: 10 },
  filterRow: { gap: 6, paddingRight: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
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
  orderTitleBox: { flex: 1, marginRight: 8 },
  orderIdText: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A' },
  orderDateText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
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
  customerInfo: { fontSize: 12, color: '#475569', marginTop: 2 },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginBottom: 10,
  },
  itemsSectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  itemInfoCol: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  itemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemSubtotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCountText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  totalPriceText: { fontSize: 15, fontWeight: 'bold', color: '#DC2626' },
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
  statusBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusOptionText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  statusOptionTextActive: { color: '#FFFFFF' },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: 8 },
});

export default AdminOrdersScreen;

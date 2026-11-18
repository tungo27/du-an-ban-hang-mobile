import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchOrders,
  getCurrentUser,
  getProductImageSource,
  isAdminRole,
  canCancelOrder,
  cancelOrder,
  ORDER_STATUSES,
  Order,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
import { showAlert, showConfirm } from '../utils/alertHelper';

type FilterValue = 'All' | (typeof ORDER_STATUSES)[number];

const FILTERS: { label: FilterValue; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', icon: 'apps-outline' },
  { label: 'Pending', icon: 'time-outline' },
  { label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { label: 'Shipping', icon: 'bicycle-outline' },
  { label: 'Delivered', icon: 'cube-outline' },
  { label: 'Cancelled', icon: 'close-circle-outline' },
];

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

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('All');

  const loadOrders = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      setOrders([]);
      return;
    }
    if (scope === 'all' && isAdminRole(user.role)) {
      setOrders(await fetchOrders());
    } else {
      setOrders(await fetchOrders(user.id));
    }
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders =
    statusFilter === 'All'
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const isAdmin = isAdminRole(currentUser?.role);

  const handleCancelOrder = (order: Order) => {
    if (!canCancelOrder(order.status)) {
      showAlert(
        'Cancellation Locked',
        `Order #${order.id} is already "${order.status}" and can no longer be cancelled.`
      );
      return;
    }

    showConfirm(
      'Cancel Order',
      `Cancel order #${order.id} (${formatPrice(order.totalAmount)})? Items will be returned to stock.`,
      async () => {
        const result = await cancelOrder(
          order.id,
          isAdmin ? undefined : currentUser?.id
        );
        if (result.success) {
          await loadOrders();
          showAlert('Order Cancelled', `Order #${order.id} has been cancelled.`);
        } else {
          showAlert('Cancellation Failed', result.message || 'Please try again.');
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Header subtitle="Your order history at TuTu Store" />

            <View style={styles.headerBar}>
              <View style={styles.titleRow}>
                <Ionicons name="receipt-outline" size={18} color="#1E3A8A" />
                <Text style={styles.title}>ORDER HISTORY ({filteredOrders.length})</Text>
              </View>
              {isAdmin && (
                <View style={styles.scopeRow}>
                  <TouchableOpacity
                    style={[styles.scopeBtn, scope === 'my' && styles.scopeBtnActive]}
                    onPress={() => setScope('my')}
                  >
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={scope === 'my' ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.scopeText,
                        scope === 'my' && styles.scopeTextActive,
                      ]}
                    >
                      My Orders
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive]}
                    onPress={() => setScope('all')}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={12}
                      color={scope === 'all' ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.scopeText,
                        scope === 'all' && styles.scopeTextActive,
                      ]}
                    >
                      All Orders
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.filterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {FILTERS.map((filter) => {
                  const active = statusFilter === filter.label;
                  return (
                    <TouchableOpacity
                      key={filter.label}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setStatusFilter(filter.label)}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={12}
                        color={active ? '#FFFFFF' : '#475569'}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const meta = getStatusMeta(item.status);
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeaderRow}>
                <View style={styles.orderTitleBox}>
                  <Text style={styles.orderId}>ORDER #{item.id}</Text>
                  <Text style={styles.orderDate}>{item.createdAt}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                  <Text style={[styles.statusText, { color: meta.color }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />
              <Text style={styles.itemsHeader}>
                {item.items.length} item(s) in this order
              </Text>
              {item.items.map((prod, idx) => (
                <TouchableOpacity
                  key={`${prod.productId}-${idx}`}
                  style={styles.itemCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      productId: prod.productId,
                    })
                  }
                >
                  <Image
                    source={getProductImageSource(prod.img)}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {prod.productName}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Unit price: {formatPrice(prod.price)} x{prod.quantity}
                    </Text>
                    <Text style={styles.itemSubtotal}>
                      Subtotal: {formatPrice(prod.price * prod.quantity)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />
              <View style={styles.receiverBox}>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Recipient: </Text>
                  {item.customerName} - {item.phone}
                </Text>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Address: </Text>
                  {item.address}
                </Text>
                <Text style={styles.metaText}>
                  <Text style={styles.metaLabel}>Payment: </Text>
                  {item.paymentMethod}
                </Text>
                {item.note ? (
                  <Text style={styles.metaText}>
                    <Text style={styles.metaLabel}>Note: </Text>
                    {item.note}
                  </Text>
                ) : null}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total ({item.items.reduce((s, i) => s + i.quantity, 0)} items)
                </Text>
                <Text style={styles.totalValue}>{formatPrice(item.totalAmount)}</Text>
              </View>

              <View style={styles.orderFooter}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => {
                    const first = item.items[0];
                    if (first) {
                      navigation.navigate('ProductDetail', {
                        productId: first.productId,
                      });
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={14} color="#2563EB" />
                  <Text style={styles.detailBtnText}>View Product</Text>
                </TouchableOpacity>
                {canCancelOrder(item.status) ? (
                  <TouchableOpacity
                    style={styles.cancelOrderBtn}
                    onPress={() => handleCancelOrder(item)}
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                ) : item.status === 'Shipping' ? (
                  <View style={styles.lockedNote}>
                    <Ionicons name="lock-closed-outline" size={12} color="#94A3B8" />
                    <Text style={styles.lockedNoteText}>
                      Shipping in progress - cannot cancel
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySub}>
              {statusFilter === 'All'
                ? 'Add products to your cart and check out to create your first order.'
                : `You have no orders with status "${statusFilter}".`}
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'UserHomeTab' })}
            >
              <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
              <Text style={styles.shopBtnText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 24 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  scopeRow: { flexDirection: 'row', gap: 6 },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  scopeBtnActive: { backgroundColor: '#1E3A8A' },
  scopeText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  scopeTextActive: { color: '#FFFFFF' },
  filterWrapper: { height: 46, marginTop: 8 },
  filterRow: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderTitleBox: { flex: 1, marginRight: 8 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#1E3A8A' },
  orderDate: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  itemsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemImage: {
    width: 62,
    height: 62,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  itemMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  receiverBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  metaText: { fontSize: 12, color: '#475569', marginBottom: 3 },
  metaLabel: { fontWeight: 'bold', color: '#334155' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  cancelOrderBtnText: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedNoteText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  detailBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563EB' },
  emptyBox: { padding: 36, alignItems: 'center' },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});

export default OrderHistoryScreen;

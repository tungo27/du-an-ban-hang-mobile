import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  searchAndFilterProducts,
  fetchOrders,
  getProductImageSource,
  addToCart,
  getCurrentUser,
  Category,
  Product,
  Order,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import { showAlert } from '../utils/alertHelper';

type ProductsRouteProp = RouteProp<RootStackParamList, 'Products'>;
type PricePreset = 'all' | 'under200' | '200to400' | 'above400' | 'custom';

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProductsRouteProp>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    route.params?.categoryId
  );
  const [keyword, setKeyword] = useState<string>('');
  const [minPriceText, setMinPriceText] = useState<string>('');
  const [maxPriceText, setMaxPriceText] = useState<string>('');
  const [pricePreset, setPricePreset] = useState<PricePreset>('all');
  const [headerKey, setHeaderKey] = useState<number>(0);

  const parsePrice = (val: string): number | undefined => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) return undefined;
    return Number(cleaned);
  };

  const loadProductsData = useCallback(
    async (
      kw: string,
      catId: number | undefined,
      minP?: number,
      maxP?: number
    ) => {
      const [cats, prods, user, allOrders] = await Promise.all([
        fetchCategories(),
        searchAndFilterProducts(kw, catId, minP, maxP),
        getCurrentUser(),
        fetchOrders(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setCurrentUser(user);
      setRecentOrders(allOrders.slice(0, 5));
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      const initialCat = route.params?.categoryId ?? selectedCategoryId;
      setSelectedCategoryId(initialCat);
      loadProductsData(
        keyword,
        initialCat,
        parsePrice(minPriceText),
        parsePrice(maxPriceText)
      );
      setHeaderKey((prev) => prev + 1);
    }, [
      route.params?.categoryId,
      loadProductsData,
      keyword,
      selectedCategoryId,
      minPriceText,
      maxPriceText,
    ])
  );

  const handleKeywordChange = async (text: string) => {
    setKeyword(text);
    const prods = await searchAndFilterProducts(
      text,
      selectedCategoryId,
      parsePrice(minPriceText),
      parsePrice(maxPriceText)
    );
    setProducts(prods);
  };

  const handleCategorySelect = async (catId: number | undefined) => {
    setSelectedCategoryId(catId);
    const prods = await searchAndFilterProducts(
      keyword,
      catId,
      parsePrice(minPriceText),
      parsePrice(maxPriceText)
    );
    setProducts(prods);
  };

  const handleSelectPricePreset = async (preset: PricePreset) => {
    setPricePreset(preset);
    let minVal = '';
    let maxVal = '';
    if (preset === 'under200') {
      maxVal = '200000';
    } else if (preset === '200to400') {
      minVal = '200000';
      maxVal = '400000';
    } else if (preset === 'above400') {
      minVal = '400000';
    }
    setMinPriceText(minVal);
    setMaxPriceText(maxVal);
    const prods = await searchAndFilterProducts(
      keyword,
      selectedCategoryId,
      parsePrice(minVal),
      parsePrice(maxVal)
    );
    setProducts(prods);
  };

  const handleApplyCustomPrice = async (minStr: string, maxStr: string) => {
    setPricePreset('custom');
    setMinPriceText(minStr);
    setMaxPriceText(maxStr);
    const prods = await searchAndFilterProducts(
      keyword,
      selectedCategoryId,
      parsePrice(minStr),
      parsePrice(maxStr)
    );
    setProducts(prods);
  };

  const handleResetFilters = async () => {
    setKeyword('');
    setSelectedCategoryId(undefined);
    setMinPriceText('');
    setMaxPriceText('');
    setPricePreset('all');
    const prods = await searchAndFilterProducts('', undefined, undefined, undefined);
    setProducts(prods);
  };

  const handleAddToCart = async (product: Product) => {
    if (currentUser?.role === 'admin') {
      return;
    }
    await addToCart(product, 1);
    setHeaderKey((prev) => prev + 1);
    showAlert(
      'Đã thêm vào giỏ',
      `Đã thêm "${product.name}" vào giỏ hàng Ngô Minh Tú Store!`
    );
  };

  const isAdmin = currentUser?.role === 'admin';

  const renderHeader = () => (
    <View>
      <Header
        key={headerKey}
        subtitle="Tìm kiếm theo danh mục & Lọc theo khoảng giá"
        onUserChanged={(u) => setCurrentUser(u)}
      />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên SP hoặc danh mục tại Ngô Minh Tú Store..."
          placeholderTextColor="#94A3B8"
          value={keyword}
          onChangeText={handleKeywordChange}
        />
        {keyword.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => handleKeywordChange('')}
          >
            <Text style={styles.clearBtnText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.catHeaderRow}>
        <Text style={styles.catHeaderTitle}>TÌM KIẾM THEO DANH MỤC</Text>
      </View>

      <CategorySelector
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={handleCategorySelect}
      />

      {/* BỘ LỌC THEO KHOẢNG GIÁ */}
      <View style={styles.priceFilterCard}>
        <View style={styles.priceFilterHeader}>
          <Text style={styles.priceFilterTitle}>LỌC SẢN PHẨM THEO KHOẢNG GIÁ</Text>
          {(keyword !== '' ||
            selectedCategoryId !== undefined ||
            minPriceText !== '' ||
            maxPriceText !== '') && (
            <TouchableOpacity onPress={handleResetFilters}>
              <Text style={styles.resetFilterText}>Đặt lại bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pricePresetRow}>
          <TouchableOpacity
            style={[
              styles.priceChip,
              pricePreset === 'all' && styles.priceChipActive,
            ]}
            onPress={() => handleSelectPricePreset('all')}
          >
            <Text
              style={[
                styles.priceChipText,
                pricePreset === 'all' && styles.priceChipTextActive,
              ]}
            >
              Tất cả giá
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceChip,
              pricePreset === 'under200' && styles.priceChipActive,
            ]}
            onPress={() => handleSelectPricePreset('under200')}
          >
            <Text
              style={[
                styles.priceChipText,
                pricePreset === 'under200' && styles.priceChipTextActive,
              ]}
            >
              Dưới 200k
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceChip,
              pricePreset === '200to400' && styles.priceChipActive,
            ]}
            onPress={() => handleSelectPricePreset('200to400')}
          >
            <Text
              style={[
                styles.priceChipText,
                pricePreset === '200to400' && styles.priceChipTextActive,
              ]}
            >
              200k - 400k
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceChip,
              pricePreset === 'above400' && styles.priceChipActive,
            ]}
            onPress={() => handleSelectPricePreset('above400')}
          >
            <Text
              style={[
                styles.priceChipText,
                pricePreset === 'above400' && styles.priceChipTextActive,
              ]}
            >
              Trên 400k
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customPriceRow}>
          <TextInput
            style={styles.priceInput}
            placeholder="Giá từ (vd: 150000)"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={minPriceText}
            onChangeText={(val) => handleApplyCustomPrice(val, maxPriceText)}
          />
          <Text style={styles.priceDash}>-</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Đến giá (vd: 500000)"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={maxPriceText}
            onChangeText={(val) => handleApplyCustomPrice(minPriceText, val)}
          />
        </View>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          Hiển thị {products.length} sản phẩm Áo Quần & Giày Dép
        </Text>
      </View>

      {/* KHỐI HÌNH ẢNH ĐƠN HÀNG TRÊN TRANG SẢN PHẨM (GIỐNG SHOPEE) */}
      {recentOrders.length > 0 && (
        <View style={styles.shopeeOrderSection}>
          <View style={styles.shopeeOrderHeader}>
            <View style={styles.shopeeTitleRow}>
              <View style={styles.shopeeMallTag}>
                <Text style={styles.shopeeMallTagText}>Shopee Style</Text>
              </View>
              <Text style={styles.shopeeOrderTitle}>
                HÌNH ẢNH ĐƠN HÀNG ĐÃ ĐẶT ({recentOrders.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(isAdmin ? 'AdminOrders' : 'OrderHistory')
              }
            >
              <Text style={styles.shopeeSeeOrdersText}>
                {isAdmin ? 'Quản trị đơn >' : 'Xem Đơn mua >'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopeeOrderScroll}
          >
            {recentOrders.map((ord) => {
              const firstItem = (ord.items || [])[0];
              return (
                <TouchableOpacity
                  key={ord.id}
                  style={styles.shopeeOrderCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate(isAdmin ? 'AdminOrders' : 'OrderHistory')
                  }
                >
                  <Image
                    source={getProductImageSource(firstItem?.img)}
                    style={styles.shopeeOrderThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.shopeeOrderInfo}>
                    <View style={styles.shopeeOrderTopLine}>
                      <Text style={styles.shopeeOrderCode}>Đơn #{ord.id}</Text>
                      <Text style={styles.shopeeOrderStatus}>{ord.status}</Text>
                    </View>
                    <Text style={styles.shopeeOrderProdName} numberOfLines={1}>
                      {firstItem ? firstItem.productName : 'Đơn hàng thời trang'}
                    </Text>
                    <Text style={styles.shopeeOrderMeta}>
                      {(ord.items || []).length} mặt hàng • Tổng:{' '}
                      <Text style={styles.shopeeOrderTotal}>
                        {formatPrice(ord.totalAmount)}
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetail', { product: item })
            }
            onAddToCart={isAdmin ? undefined : handleAddToCart}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Không có sản phẩm nào khớp bộ lọc.
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#1E293B',
  },
  clearBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  catHeaderRow: {
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  catHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  priceFilterCard: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceFilterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  pricePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  priceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  priceChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  priceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  priceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1E293B',
  },
  priceDash: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  resultText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  shopeeOrderSection: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  shopeeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopeeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopeeMallTag: {
    backgroundColor: '#EE4D2D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shopeeMallTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shopeeOrderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  shopeeSeeOrdersText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EE4D2D',
  },
  shopeeOrderScroll: {
    gap: 10,
    paddingRight: 4,
  },
  shopeeOrderCard: {
    width: 265,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  shopeeOrderThumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  shopeeOrderInfo: {
    flex: 1,
  },
  shopeeOrderTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  shopeeOrderCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  shopeeOrderStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  shopeeOrderProdName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  shopeeOrderMeta: {
    fontSize: 11,
    color: '#475569',
  },
  shopeeOrderTotal: {
    fontWeight: 'bold',
    color: '#EE4D2D',
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

export default ProductsScreen;

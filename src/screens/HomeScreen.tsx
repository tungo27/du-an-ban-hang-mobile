import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  initDatabase,
  fetchCategories,
  searchAndFilterProducts,
  addToCart,
  getCurrentUser,
  Category,
  Product,
  User,
} from '../data/database';
import Header from '../components/Header';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import { showAlert } from '../utils/alertHelper';

const BANNER_URL =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80';

type PricePreset = 'all' | 'under200' | '200to400' | 'above400' | 'custom';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [minPriceText, setMinPriceText] = useState<string>('');
  const [maxPriceText, setMaxPriceText] = useState<string>('');
  const [pricePreset, setPricePreset] = useState<PricePreset>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [headerRefreshKey, setHeaderRefreshKey] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bannerError, setBannerError] = useState<boolean>(false);

  const parsePrice = (val: string): number | undefined => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) return undefined;
    return Number(cleaned);
  };

  const loadData = useCallback(
    async (
      searchKw: string,
      catId: number | undefined,
      minP?: number,
      maxP?: number
    ) => {
      try {
        await initDatabase();
        const [cats, prods, user] = await Promise.all([
          fetchCategories(),
          searchAndFilterProducts(searchKw, catId, minP, maxP),
          getCurrentUser(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setCurrentUser(user);
      } catch (error) {
        console.error('Lỗi tải dữ liệu HomeScreen:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadData(
        keyword,
        selectedCategoryId,
        parsePrice(minPriceText),
        parsePrice(maxPriceText)
      );
      setHeaderRefreshKey((prev) => prev + 1);
    }, [loadData, keyword, selectedCategoryId, minPriceText, maxPriceText])
  );

  const handleSearchChange = async (text: string) => {
    setKeyword(text);
    const filtered = await searchAndFilterProducts(
      text,
      selectedCategoryId,
      parsePrice(minPriceText),
      parsePrice(maxPriceText)
    );
    setProducts(filtered);
  };

  const handleSelectCategory = async (catId: number | undefined) => {
    setSelectedCategoryId(catId);
    const filtered = await searchAndFilterProducts(
      keyword,
      catId,
      parsePrice(minPriceText),
      parsePrice(maxPriceText)
    );
    setProducts(filtered);
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
    const filtered = await searchAndFilterProducts(
      keyword,
      selectedCategoryId,
      parsePrice(minVal),
      parsePrice(maxVal)
    );
    setProducts(filtered);
  };

  const handleApplyCustomPrice = async (minStr: string, maxStr: string) => {
    setPricePreset('custom');
    setMinPriceText(minStr);
    setMaxPriceText(maxStr);
    const filtered = await searchAndFilterProducts(
      keyword,
      selectedCategoryId,
      parsePrice(minStr),
      parsePrice(maxStr)
    );
    setProducts(filtered);
  };

  const handleResetFilters = async () => {
    setKeyword('');
    setSelectedCategoryId(undefined);
    setMinPriceText('');
    setMaxPriceText('');
    setPricePreset('all');
    const filtered = await searchAndFilterProducts('', undefined, undefined, undefined);
    setProducts(filtered);
  };

  const handleAddToCart = async (product: Product) => {
    if (currentUser?.role === 'admin') {
      showAlert(
        'Chế độ Quản trị viên',
        'Tài khoản Admin chỉ dùng để quản lý hệ thống, không thực hiện mua hàng!'
      );
      return;
    }
    await addToCart(product, 1);
    setHeaderRefreshKey((prev) => prev + 1);
    showAlert(
      'Đã thêm vào giỏ hàng',
      `Đã thêm "${product.name}" vào giỏ hàng của Ngô Minh Tú Store!`
    );
  };

  const isAdmin = currentUser?.role === 'admin';

  const renderHeader = () => (
    <View>
      <Header
        key={headerRefreshKey}
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên SP hoặc danh mục tại Ngô Minh Tú Store..."
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={handleSearchChange}
          />
          {keyword.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => handleSearchChange('')}
            >
              <Text style={styles.clearBtnText}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.quickNavSection}>
        <Text style={styles.quickNavTitle}>
          {isAdmin
            ? 'CHẾ ĐỘ XEM TRƯỚC CỦA QUẢN TRỊ VIÊN (ADMIN KHÔNG MUA HÀNG)'
            : 'TIỆN ÍCH MUA SẮM KHÁCH HÀNG'}
        </Text>
        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            style={[styles.quickNavBtn, styles.quickNavHomeActive]}
            onPress={() => handleResetFilters()}
          >
            <Text style={[styles.quickNavBtnText, styles.quickNavTextWhite]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate('Products', {})}
          >
            <Text style={styles.quickNavBtnText}>Danh mục sản phẩm</Text>
          </TouchableOpacity>

          {/* Ẩn Giỏ hàng khi đăng nhập Admin vì Admin không mua hàng */}
          {!isAdmin && (
            <TouchableOpacity
              style={[styles.quickNavBtn, styles.quickNavCart]}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={[styles.quickNavBtnText, styles.quickNavTextWhite]}>
                Giỏ hàng
              </Text>
            </TouchableOpacity>
          )}

          {currentUser && !isAdmin && (
            <>
              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() => navigation.navigate('OrderHistory')}
              >
                <Text style={styles.quickNavBtnText}>Lịch sử mua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.quickNavBtnText}>Cập nhật TT</Text>
              </TouchableOpacity>
            </>
          )}

          {isAdmin && (
            <TouchableOpacity
              style={[styles.quickNavBtn, styles.quickNavAdmin]}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'AdminHomeTab' })
              }
            >
              <Text style={[styles.quickNavBtnText, styles.quickNavTextWhite]}>
                Về Trang chủ Quản trị Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.bannerCard}>
        <Image
          source={
            bannerError
              ? require('../../assets/images/hinh1.jpg')
              : { uri: BANNER_URL }
          }
          style={styles.bannerImage}
          resizeMode="cover"
          onError={() => setBannerError(true)}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>NGÔ MINH TÚ STORE - BỘ SƯU TẬP MỚI</Text>
          <Text style={styles.bannerSub}>
            Chuyên Áo Quần & Giày Dép thời trang chính hãng - Giao hàng toàn quốc
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TÌM KIẾM THEO DANH MỤC</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Products', {
              categoryId: selectedCategoryId,
            })
          }
        >
          <Text style={styles.seeAllText}>Mở trang lọc đầy đủ</Text>
        </TouchableOpacity>
      </View>

      <CategorySelector
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={handleSelectCategory}
      />

      {/* BỘ LỌC SẢN PHẨM THEO KHOẢNG GIÁ */}
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          DANH SÁCH SẢN PHẨM ({products.length})
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang khởi tạo CSDL Ngô Minh Tú Store...</Text>
      </View>
    );
  }

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
              Không tìm thấy sản phẩm phù hợp tại Ngô Minh Tú Store.
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
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
    color: '#475569',
    fontWeight: 'bold',
  },
  quickNavSection: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickNavTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickNavBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickNavCart: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  quickNavHomeActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  quickNavAdmin: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  quickNavBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  quickNavTextWhite: {
    color: '#FFFFFF',
  },
  bannerCard: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    height: 155,
    backgroundColor: '#1E3A8A',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bannerSub: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
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
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;

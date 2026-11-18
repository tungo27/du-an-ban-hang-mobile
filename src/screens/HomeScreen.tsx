import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  initDatabase,
  fetchCategories,
  searchAndFilterProducts,
  getSaleProducts,
  addToCart,
  getCurrentUser,
  isAdminRole,
  Category,
  Product,
  User,
  getProductImageSource,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import { showAlert } from '../utils/alertHelper';

type PricePreset = 'all' | 'under200' | '200to400' | 'above400' | 'custom';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width - 24, 260), 520);
  const carouselRef = useRef<FlatList<Product>>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [minPriceText, setMinPriceText] = useState<string>('');
  const [maxPriceText, setMaxPriceText] = useState<string>('');
  const [pricePreset, setPricePreset] = useState<PricePreset>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [headerRefreshKey, setHeaderRefreshKey] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [carouselPaused, setCarouselPaused] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

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
        const [cats, prods, onSale, user] = await Promise.all([
          fetchCategories(),
          searchAndFilterProducts(searchKw, catId, minP, maxP),
          getSaleProducts(),
          getCurrentUser(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setSaleProducts(onSale);
        setCurrentUser(user);
        setCurrentSlide(0);
      } catch (error) {
        console.error('[HomeScreen] Could not load data:', error);
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

  // Auto-scroll the sale carousel
  useEffect(() => {
    if (carouselPaused || saleProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % saleProducts.length;
        try {
          carouselRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (_) {
          // Ignore scroll timing issues on the very first render
        }
        return next;
      });
    }, 3800);
    return () => clearInterval(timer);
  }, [carouselPaused, saleProducts.length]);

  const handleCarouselEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / cardWidth);
    setCurrentSlide(
      Math.max(0, Math.min(index, Math.max(saleProducts.length - 1, 0)))
    );
    setCarouselPaused(false);
  };

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

  const isAdmin = isAdminRole(currentUser?.role);

  const handleAddToCart = async (product: Product) => {
    if (isAdmin) {
      showAlert(
        'Admin Mode',
        'Administrator accounts are for management only and cannot place orders.'
      );
      return;
    }
    if (Number(product.stock ?? 0) <= 0) {
      showAlert('Out of Stock', `"${product.name}" is currently out of stock.`);
      return;
    }
    await addToCart(product, 1);
    setHeaderRefreshKey((prev) => prev + 1);
    showAlert(
      'Added to Cart',
      `"${product.name}" has been added to your TuTu Store cart.`
    );
  };

  const openProduct = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderSaleCarousel = () => {
    if (saleProducts.length === 0) return null;
    return (
      <View style={styles.saleSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flash" size={16} color="#DC2626" />
            <Text style={styles.sectionTitle}>ON SALE NOW</Text>
          </View>
          <Text style={styles.sectionHint}>{saleProducts.length} deals</Text>
        </View>

        <FlatList
          ref={carouselRef}
          data={saleProducts}
          keyExtractor={(item) => `sale-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={cardWidth}
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={(_, index) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          onScrollBeginDrag={() => setCarouselPaused(true)}
          onScrollEndDrag={() => setCarouselPaused(false)}
          onMomentumScrollEnd={handleCarouselEnd}
          onScrollToIndexFailed={(info) => {
            carouselRef.current?.scrollToOffset({
              offset: info.index * cardWidth,
              animated: true,
            });
          }}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <TouchableOpacity
                style={styles.slide}
                activeOpacity={0.9}
                onPress={() => openProduct(item.id)}
              >
                <Image
                  source={
                    failedImages[item.id]
                      ? require('../../assets/images/hinh1.jpg')
                      : getProductImageSource(item.img)
                  }
                  style={styles.slideImage}
                  resizeMode="cover"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                  }
                />
                <View style={styles.slideOverlay}>
                  <View style={styles.salePill}>
                    <Ionicons name="pricetag" size={10} color="#FFFFFF" />
                    <Text style={styles.salePillText}>SALE</Text>
                  </View>
                  <Text style={styles.slideTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.slidePriceRow}>
                    <Text style={styles.slidePrice}>
                      {formatPrice(Number(item.salePrice))}
                    </Text>
                    <Text style={styles.slideOldPrice}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                  <View style={styles.slideButton}>
                    <Text style={styles.slideButtonText}>Shop Now</Text>
                    <Ionicons name="arrow-forward" size={13} color="#1E3A8A" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {saleProducts.map((item, index) => (
            <View
              key={`dot-${item.id}`}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <Header
        key={headerRefreshKey}
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={17} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or categories at TuTu Store..."
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={handleSearchChange}
          />
          {keyword.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => handleSearchChange('')}
            >
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isAdmin && (
        <View style={styles.adminNotice}>
          <Ionicons name="information-circle-outline" size={14} color="#92400E" />
          <Text style={styles.adminNoticeText}>
            Admin preview mode: purchasing and checkout are disabled.
          </Text>
        </View>
      )}

      {renderSaleCarousel()}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="grid-outline" size={16} color="#2563EB" />
          <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Products', {
              categoryId: selectedCategoryId,
            })
          }
        >
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      <CategorySelector
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={handleSelectCategory}
      />

      <View style={styles.priceFilterCard}>
        <View style={styles.priceFilterHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="options-outline" size={14} color="#1E293B" />
            <Text style={styles.priceFilterTitle}>PRICE RANGE</Text>
          </View>
          {(keyword !== '' ||
            selectedCategoryId !== undefined ||
            minPriceText !== '' ||
            maxPriceText !== '') && (
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
              <Ionicons name="refresh-outline" size={12} color="#DC2626" />
              <Text style={styles.resetFilterText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pricePresetRow}>
          {[
            { key: 'all' as PricePreset, label: 'All prices' },
            { key: 'under200' as PricePreset, label: 'Under 200k' },
            { key: '200to400' as PricePreset, label: '200k - 400k' },
            { key: 'above400' as PricePreset, label: 'Above 400k' },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.priceChip,
                pricePreset === chip.key && styles.priceChipActive,
              ]}
              onPress={() => handleSelectPricePreset(chip.key)}
            >
              <Text
                style={[
                  styles.priceChipText,
                  pricePreset === chip.key && styles.priceChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customPriceRow}>
          <TextInput
            style={styles.priceInput}
            placeholder="From (e.g. 150000)"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={minPriceText}
            onChangeText={(val) => handleApplyCustomPrice(val, maxPriceText)}
          />
          <Text style={styles.priceDash}>-</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="To (e.g. 500000)"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={maxPriceText}
            onChangeText={(val) => handleApplyCustomPrice(minPriceText, val)}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="cube-outline" size={16} color="#2563EB" />
          <Text style={styles.sectionTitle}>
            ALL PRODUCTS ({products.length})
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading TuTu Store...</Text>
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
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => openProduct(item.id)}
            onAddToCart={isAdmin ? undefined : handleAddToCart}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyText}>
              No products match your filters.
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
    gap: 8,
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
    padding: 2,
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  adminNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  saleSection: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  slide: {
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
    height: 190,
    backgroundColor: '#1E3A8A',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  salePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  salePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  slidePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  slidePrice: {
    color: '#FBBF24',
    fontSize: 17,
    fontWeight: 'bold',
  },
  slideOldPrice: {
    color: '#CBD5E1',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  slideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 7,
  },
  slideButtonText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#2563EB',
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;

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

type ProductsRouteProp = RouteProp<RootStackParamList, 'Products'>;
type PricePreset = 'all' | 'under200' | '200to400' | 'above400' | 'custom';

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProductsRouteProp>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [cats, prods, user] = await Promise.all([
        fetchCategories(),
        searchAndFilterProducts(kw, catId, minP, maxP),
        getCurrentUser(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setCurrentUser(user);
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
          Hiển thị {products.length} sản phẩm phù hợp
        </Text>
      </View>
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

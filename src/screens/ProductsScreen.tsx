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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  searchAndFilterProducts,
  addToCart,
  getCurrentUser,
  isAdminRole,
  Category,
  Product,
  User,
} from '../data/database';
import Header from '../components/Header';
import AppFooter from '../components/AppFooter';
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

  const isAdmin = isAdminRole(currentUser?.role);

  const handleAddToCart = async (product: Product) => {
    if (isAdmin) return;
    if (Number(product.stock ?? 0) <= 0) {
      showAlert('Out of Stock', `"${product.name}" is currently out of stock.`);
      return;
    }
    // Open size selection modal instead of adding directly
    navigation.openModal();
    navigation.navigate('SizeSelection', { product });
  };

  const renderHeader = () => (
    <View>
      <Header
        key={headerKey}
        subtitle="Browse products & filter by price"
        onUserChanged={(u) => setCurrentUser(u)}
      />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or categories at TuTu Store..."
          placeholderTextColor="#94A3B8"
          value={keyword}
          onChangeText={handleKeywordChange}
        />
        {keyword.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => handleKeywordChange('')}
          >
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.catHeaderRow}>
        <View style={styles.titleRow}>
          <Ionicons name="grid-outline" size={14} color="#1E293B" />
          <Text style={styles.catHeaderTitle}>SHOP BY CATEGORY</Text>
        </View>
      </View>

      <CategorySelector
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={handleCategorySelect}
      />

      <View style={styles.priceFilterCard}>
        <View style={styles.priceFilterHeader}>
          <View style={styles.titleRow}>
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

      <View style={styles.resultRow}>
        <Ionicons name="cube-outline" size={14} color="#334155" />
        <Text style={styles.resultText}>
          Showing {products.length} fashion products
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
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
            onAddToCart={isAdmin ? undefined : handleAddToCart}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyText}>No products match your filters.</Text>
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
    flexGrow: 1,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    padding: 2,
  },
  catHeaderRow: {
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default ProductsScreen;

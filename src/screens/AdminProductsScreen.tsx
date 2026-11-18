import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  Image,
  StyleSheet,
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  fetchAllProducts,
  addProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  getProductImageSource,
  getCurrentUser,
  isAdminRole,
  PRESET_IMAGES,
  Category,
  Product,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert, showConfirm } from '../utils/alertHelper';

type AdminProductsRouteProp = RouteProp<RootStackParamList, 'AdminProducts'>;

type ProductSection = {
  key: 'inStock' | 'outOfStock' | 'deleted';
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count: number;
  data: Product[];
};

const AdminProductsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AdminProductsRouteProp>();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCatId, setFilterCatId] = useState<number | undefined>(
    route.params?.categoryId
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    inStock: false,
    outOfStock: false,
    deleted: true,
  });

  // Add / edit form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [stock, setStock] = useState<string>('20');
  const [description, setDescription] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<number>(1);
  const [image, setImage] = useState<string>(PRESET_IMAGES[0].value);

  const loadData = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (!isAdminRole(user?.role)) {
      showAlert(
        'Access Denied (RBAC)',
        'Only administrators can manage products.',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    const [cats, prods] = await Promise.all([
      fetchCategories(),
      fetchAllProducts(),
    ]);
    setCategories(cats);
    setProducts(prods);
    setSelectedCatId((prev) => {
      if (cats.some((c) => c.id === prev)) return prev;
      return route.params?.categoryId ?? cats[0]?.id ?? prev;
    });
  }, [navigation, route.params?.categoryId]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.categoryId !== undefined) {
        setFilterCatId(route.params.categoryId);
      }
      loadData();
    }, [route.params?.categoryId, loadData])
  );

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImage(res.assets[0].uri);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setSalePrice('');
    setStock('20');
    setDescription('');
    setImage(PRESET_IMAGES[0].value);
    if (categories.length > 0) {
      setSelectedCatId(filterCatId ?? categories[0].id);
    }
  };

  const handleSaveProduct = async () => {
    const priceNum = Number(price);
    const saleNum = salePrice.trim() ? Number(salePrice) : null;
    const stockNum = Number(stock);

    if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
      showAlert(
        'Invalid Data',
        'Please enter a product name and a price greater than 0.'
      );
      return;
    }
    if (salePrice.trim() && (isNaN(Number(saleNum)) || Number(saleNum) <= 0)) {
      showAlert('Invalid Sale Price', 'Sale price must be a positive number.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      showAlert('Invalid Stock', 'Stock must be zero or a positive number.');
      return;
    }

    const payload = {
      name: name.trim(),
      price: priceNum,
      salePrice: saleNum,
      stock: stockNum,
      img: image.trim() || PRESET_IMAGES[0].value,
      categoryId: selectedCatId,
      description:
        description.trim() || 'Genuine product distributed by TuTu Store.',
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      showAlert('Product Updated', `"${name.trim()}" has been updated.`);
    } else {
      await addProduct(payload);
      showAlert('Product Added', `"${name.trim()}" has been created.`);
    }

    resetForm();
    await loadData();
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price.toString());
    setSalePrice(
      prod.salePrice !== null && prod.salePrice !== undefined
        ? Number(prod.salePrice).toString()
        : ''
    );
    setStock(String(prod.stock ?? 0));
    setDescription(prod.description || '');
    setSelectedCatId(prod.categoryId);
    setImage(prod.img);
  };

  const handleSoftDelete = (prod: Product) => {
    showConfirm(
      'Move Product to Deleted',
      `"${prod.name}" will be hidden from the storefront. You can restore it at any time.`,
      async () => {
        await softDeleteProduct(prod.id);
        if (editingProduct?.id === prod.id) {
          resetForm();
        }
        await loadData();
        showAlert(
          'Product Removed',
          `"${prod.name}" is now in the Deleted section.`
        );
      }
    );
  };

  const handleRestore = (prod: Product) => {
    showConfirm(
      'Restore Product',
      `Restore "${prod.name}" so customers can see and buy it again?`,
      async () => {
        await restoreProduct(prod.id);
        await loadData();
        showAlert('Product Restored', `"${prod.name}" is back in the storefront.`);
      }
    );
  };

  const getCatName = (catId: number) =>
    categories.find((c) => c.id === catId)?.name || 'Uncategorized';

  const categoryProducts =
    filterCatId === undefined
      ? products
      : products.filter((p) => p.categoryId === filterCatId);

  const activeProducts = categoryProducts.filter(
    (p) => Number(p.isDeleted ?? 0) === 0
  );
  const inStockProducts = activeProducts.filter((p) => Number(p.stock ?? 0) > 0);
  const outOfStockProducts = activeProducts.filter((p) => Number(p.stock ?? 0) <= 0);
  const deletedProducts = categoryProducts.filter(
    (p) => Number(p.isDeleted ?? 0) === 1
  );

  const buildSection = (
    key: ProductSection['key'],
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    data: Product[]
  ): ProductSection => ({
    key,
    title,
    icon,
    color,
    count: data.length,
    data: collapsed[key] ? [] : data,
  });

  const sections: ProductSection[] = [
    buildSection('inStock', 'In Stock', 'checkmark-circle-outline', '#059669', inStockProducts),
    buildSection('outOfStock', 'Out of Stock', 'alert-circle-outline', '#D97706', outOfStockProducts),
    buildSection('deleted', 'Deleted', 'trash-outline', '#DC2626', deletedProducts),
  ];

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isAdminRole(currentUser?.role)) {
    return (
      <View style={styles.container}>
        <Header subtitle="RBAC Security - Product Management" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <SectionList<Product, ProductSection>
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <Header subtitle="Product Management" />

            <View style={styles.formCard}>
              <View style={styles.formTitleRow}>
                <Ionicons
                  name={editingProduct ? 'create-outline' : 'add-circle-outline'}
                  size={16}
                  color="#1E3A8A"
                />
                <Text style={styles.formTitle}>
                  {editingProduct
                    ? `EDIT PRODUCT #${editingProduct.id}`
                    : 'ADD NEW PRODUCT'}
                </Text>
              </View>

              <Text style={styles.label}>Product name (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. TuTu Sneaker Pro by Ngo Minh Tu"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <View style={styles.inlineFieldRow}>
                <View style={styles.inlineField}>
                  <Text style={styles.label}>Price (VND) (*)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="450000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={styles.inlineField}>
                  <Text style={styles.label}>Sale price</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 399000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={salePrice}
                    onChangeText={setSalePrice}
                  />
                </View>
              </View>

              <Text style={styles.label}>Stock quantity (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />

              <Text style={styles.label}>Category (*)</Text>
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, selectedCatId === cat.id && styles.chipActive]}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCatId === cat.id && styles.chipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Product description at TuTu Store..."
                placeholderTextColor="#94A3B8"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Product image</Text>
              <View style={styles.chipRow}>
                {PRESET_IMAGES.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[styles.chip, image === preset.value && styles.chipActive]}
                    onPress={() => setImage(preset.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        image === preset.value && styles.chipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.pickImageBtn} onPress={pickFromLibrary}>
                  <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.pickImageText}>Library</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formActionRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
                  <Ionicons name="checkmark-done-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? 'Save Changes' : 'Add Product'}
                  </Text>
                </TouchableOpacity>
                {editingProduct && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                    <Ionicons name="close-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.listHeaderTitle}>
                FILTER BY CATEGORY ({categoryProducts.length} PRODUCTS)
              </Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, filterCatId === undefined && styles.chipActive]}
                  onPress={() => setFilterCatId(undefined)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterCatId === undefined && styles.chipTextActive,
                    ]}
                  >
                    All ({products.length})
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, filterCatId === cat.id && styles.chipActive]}
                    onPress={() => setFilterCatId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filterCatId === cat.id && styles.chipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.85}
            onPress={() => toggleSection(section.key)}
          >
            <Ionicons name={section.icon} size={16} color={section.color} />
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {section.title}
            </Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{section.count}</Text>
            </View>
            <Ionicons
              name={collapsed[section.key] ? 'chevron-down' : 'chevron-up'}
              size={16}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
        renderItem={({ item }) => {
          const isDeleted = Number(item.isDeleted ?? 0) === 1;
          const stockQty = Number(item.stock ?? 0);
          const hasSale =
            item.salePrice !== null &&
            item.salePrice !== undefined &&
            Number(item.salePrice) > 0 &&
            Number(item.salePrice) < Number(item.price);
          return (
            <TouchableOpacity
              style={[styles.prodCard, isDeleted && styles.prodCardDeleted]}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item.id })
              }
            >
              <Image
                source={getProductImageSource(item.img)}
                style={styles.prodImg}
                resizeMode="cover"
              />
              <View style={styles.prodInfo}>
                <Text style={styles.prodName} numberOfLines={2}>
                  #{item.id} - {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.prodPrice}>{formatPrice(item.price)}</Text>
                  {hasSale && (
                    <Text style={styles.prodSalePrice}>
                      {formatPrice(Number(item.salePrice))}
                    </Text>
                  )}
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="albums-outline" size={11} color="#64748B" />
                  <Text style={styles.prodMeta}>{getCatName(item.categoryId)}</Text>
                  <Text
                    style={[
                      styles.stockPill,
                      stockQty > 0 ? styles.stockOk : styles.stockOut,
                    ]}
                  >
                    Stock: {stockQty}
                  </Text>
                </View>
                {isDeleted ? (
                  <Text style={styles.deletedLabel}>SOFT DELETED</Text>
                ) : null}

                <View style={styles.prodActionRow}>
                  {!isDeleted && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => startEditProduct(item)}
                    >
                      <Ionicons name="create-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  {isDeleted ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.restoreBtn]}
                      onPress={() => handleRestore(item)}
                    >
                      <Ionicons name="refresh-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.actionText}>Restore</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleSoftDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.detailBtn]}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { productId: item.id })
                    }
                  >
                    <Ionicons name="eye-outline" size={13} color="#1D4ED8" />
                    <Text style={[styles.actionText, styles.detailText]}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        renderSectionFooter={({ section }) =>
          section.count === 0 ? (
            <Text style={styles.emptySectionText}>No products in this section.</Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 32 },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A' },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 5 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 10,
  },
  textArea: { height: 64, paddingTop: 8, textAlignVertical: 'top' },
  inlineFieldRow: { flexDirection: 'row', gap: 10 },
  inlineField: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  pickImageText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  formActionRow: { flexDirection: 'row', gap: 8 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#64748B',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
  },
  cancelBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  filterSection: { paddingHorizontal: 14, marginBottom: 4 },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: 'bold' },
  sectionCountBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sectionCountText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  prodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodCardDeleted: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  prodImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  prodInfo: { flex: 1 },
  prodName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  prodPrice: { fontSize: 14, fontWeight: 'bold', color: '#DC2626' },
  prodSalePrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  prodMeta: { fontSize: 11, color: '#64748B' },
  stockPill: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockOk: { backgroundColor: '#DCFCE7', color: '#059669' },
  stockOut: { backgroundColor: '#FEF3C7', color: '#B45309' },
  deletedLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 6,
  },
  prodActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  editBtn: { backgroundColor: '#D97706' },
  deleteBtn: { backgroundColor: '#DC2626' },
  restoreBtn: { backgroundColor: '#16A34A' },
  detailBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#93C5FD' },
  detailText: { color: '#1D4ED8' },
  emptySectionText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default AdminProductsScreen;

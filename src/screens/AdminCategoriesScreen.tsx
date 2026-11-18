import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  fetchProducts,
  addCategory,
  updateCategory,
  deleteCategory,
  addProduct,
  getProductImageSource,
  getCurrentUser,
  isAdminRole,
  PRESET_IMAGES,
  Category,
  Product,
  User,
} from '../data/database';
import Header from '../components/Header';
import { showAlert, showConfirm } from '../utils/alertHelper';

const AdminCategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Add / Edit category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catImage, setCatImage] = useState<string>(PRESET_IMAGES[0].value);

  // Add product for a category modal
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<string>('');
  const [prodSalePrice, setProdSalePrice] = useState<string>('');
  const [prodStock, setProdStock] = useState<string>('20');
  const [prodDesc, setProdDesc] = useState<string>('');
  const [prodImage, setProdImage] = useState<string>(PRESET_IMAGES[0].value);

  const loadData = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (!isAdminRole(user?.role)) {
      showAlert(
        'Access Denied (RBAC)',
        'Only administrators can manage product categories.',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }
    const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts()]);
    setCategories(cats);
    setProducts(prods);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pickFromLibrary = async (setter: (uri: string) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setter(res.assets[0].uri);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatImage(PRESET_IMAGES[0].value);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatImage(cat.img || PRESET_IMAGES[0].value);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      showAlert('Missing Name', 'Please enter a category name.');
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, catName.trim(), catImage.trim());
      showAlert('Category Updated', `"${catName.trim()}" has been updated.`);
    } else {
      await addCategory(catName.trim(), catImage.trim());
      showAlert('Category Added', `"${catName.trim()}" has been created.`);
    }

    setCategoryModalOpen(false);
    setEditingCategory(null);
    setCatName('');
    await loadData();
  };

  const handleDeleteCategory = (cat: Category) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    showConfirm(
      'Delete Category (Cascade)',
      `Delete "${cat.name}"? All ${count} product(s) inside this category will also be deleted.`,
      async () => {
        await deleteCategory(cat.id);
        await loadData();
        showAlert(
          'Category Deleted',
          `"${cat.name}" and ${count} product(s) were removed.`
        );
      }
    );
  };

  const openAddProduct = (cat: Category) => {
    setTargetCategory(cat);
    setProdName('');
    setProdPrice('');
    setProdSalePrice('');
    setProdStock('20');
    setProdDesc(`Product from ${cat.name} at TuTu Store.`);
    setProdImage(cat.img || PRESET_IMAGES[0].value);
  };

  const handleSaveProduct = async () => {
    if (!targetCategory) return;
    const priceNum = Number(prodPrice);
    const saleNum = prodSalePrice.trim() ? Number(prodSalePrice) : null;
    const stockNum = Number(prodStock);

    if (!prodName.trim() || isNaN(priceNum) || priceNum <= 0) {
      showAlert(
        'Invalid Data',
        'Please enter a product name and a valid price greater than 0.'
      );
      return;
    }
    if (prodSalePrice.trim() && (isNaN(Number(saleNum)) || Number(saleNum) <= 0)) {
      showAlert('Invalid Sale Price', 'Sale price must be a positive number.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      showAlert('Invalid Stock', 'Stock must be zero or a positive number.');
      return;
    }

    await addProduct({
      name: prodName.trim(),
      price: priceNum,
      salePrice: saleNum,
      stock: stockNum,
      img: prodImage.trim() || PRESET_IMAGES[0].value,
      categoryId: targetCategory.id,
      description:
        prodDesc.trim() || 'Genuine product distributed by TuTu Store.',
    });

    const catTitle = targetCategory.name;
    setTargetCategory(null);
    await loadData();
    showAlert('Product Added', `"${prodName.trim()}" was added to "${catTitle}".`);
  };

  if (!isAdminRole(currentUser?.role)) {
    return (
      <View style={styles.container}>
        <Header subtitle="RBAC Security - Category Management" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Header subtitle="Category Management" />

            <View style={styles.topBar}>
              <View style={styles.titleRow}>
                <Ionicons name="albums-outline" size={18} color="#1E3A8A" />
                <Text style={styles.title}>CATEGORIES ({categories.length})</Text>
              </View>
              <TouchableOpacity style={styles.addCategoryBtn} onPress={openAddCategory}>
                <Ionicons name="add-circle-outline" size={15} color="#FFFFFF" />
                <Text style={styles.addCategoryText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const count = products.filter((p) => p.categoryId === item.id).length;
          return (
            <View style={styles.catCard}>
              <View style={styles.catTopRow}>
                <Image
                  source={getProductImageSource(item.img)}
                  style={styles.catImage}
                  resizeMode="cover"
                />
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>
                    #{item.id} - {item.name}
                  </Text>
                  <Text style={styles.catCount}>{count} product(s) in this category</Text>
                </View>
              </View>

              <View style={styles.catButtonsRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.addProdBtn]}
                  onPress={() => openAddProduct(item)}
                >
                  <Ionicons name="add-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.smallBtnText}>Add Product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.viewBtn]}
                  onPress={() =>
                    navigation.navigate('AdminProducts', {
                      categoryId: item.id,
                      categoryName: item.name,
                    })
                  }
                >
                  <Ionicons name="eye-outline" size={13} color="#1D4ED8" />
                  <Text style={[styles.smallBtnText, styles.viewBtnText]}>
                    View ({count})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.editBtn]}
                  onPress={() => openEditCategory(item)}
                >
                  <Ionicons name="create-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.smallBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.deleteBtn]}
                  onPress={() => handleDeleteCategory(item)}
                >
                  <Ionicons name="trash-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.smallBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="albums-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>No categories yet. Add your first category.</Text>
          </View>
        }
      />

      {/* Add / Edit Category Modal */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editingCategory
                  ? `EDIT CATEGORY #${editingCategory.id}`
                  : 'ADD NEW CATEGORY'}
              </Text>

              <Text style={styles.label}>Category name (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Shoes & Sneakers by Ngo Minh Tu"
                placeholderTextColor="#94A3B8"
                value={catName}
                onChangeText={setCatName}
              />

              <Text style={styles.label}>Category image</Text>
              <View style={styles.presetRow}>
                {PRESET_IMAGES.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetChip,
                      catImage === preset.value && styles.presetChipActive,
                    ]}
                    onPress={() => setCatImage(preset.value)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        catImage === preset.value && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pickLibBtn}
                  onPress={() => pickFromLibrary(setCatImage)}
                >
                  <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.pickLibBtnText}>Library</Text>
                </TouchableOpacity>
              </View>

              {catImage ? (
                <Image
                  source={getProductImageSource(catImage)}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory}>
                  <Ionicons name="checkmark-done-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setCategoryModalOpen(false)}
                >
                  <Ionicons name="close-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Product For Category Modal */}
      <Modal
        visible={targetCategory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTargetCategory(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                ADD PRODUCT TO: {targetCategory?.name.toUpperCase()}
              </Text>

              <Text style={styles.label}>Product name (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Premium Polo by Ngo Minh Tu"
                placeholderTextColor="#94A3B8"
                value={prodName}
                onChangeText={setProdName}
              />

              <Text style={styles.label}>Price (VND) (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 350000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={prodPrice}
                onChangeText={setProdPrice}
              />

              <Text style={styles.label}>Sale price (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 299000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={prodSalePrice}
                onChangeText={setProdSalePrice}
              />

              <Text style={styles.label}>Stock quantity (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={prodStock}
                onChangeText={setProdStock}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Product description at TuTu Store..."
                placeholderTextColor="#94A3B8"
                multiline
                value={prodDesc}
                onChangeText={setProdDesc}
              />

              <Text style={styles.label}>Product image</Text>
              <View style={styles.presetRow}>
                {PRESET_IMAGES.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.presetChip,
                      prodImage === preset.value && styles.presetChipActive,
                    ]}
                    onPress={() => setProdImage(preset.value)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        prodImage === preset.value && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pickLibBtn}
                  onPress={() => pickFromLibrary(setProdImage)}
                >
                  <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.pickLibBtnText}>Library</Text>
                </TouchableOpacity>
              </View>

              {prodImage ? (
                <Image
                  source={getProductImageSource(prodImage)}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
                  <Ionicons name="checkmark-done-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Product</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setTargetCategory(null)}
                >
                  <Ionicons name="close-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 28 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCategoryText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  catCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  catCount: { fontSize: 12, color: '#64748B', marginTop: 2 },
  catButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  smallBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  addProdBtn: { backgroundColor: '#16A34A' },
  viewBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  viewBtnText: { color: '#1D4ED8' },
  editBtn: { backgroundColor: '#D97706' },
  deleteBtn: { backgroundColor: '#DC2626' },
  emptyBox: { padding: 36, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: 8 },
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
  textArea: { height: 68, paddingTop: 8, textAlignVertical: 'top' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  presetChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  presetChipTextActive: { color: '#FFFFFF' },
  pickLibBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  pickLibBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  previewImage: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
});

export default AdminCategoriesScreen;

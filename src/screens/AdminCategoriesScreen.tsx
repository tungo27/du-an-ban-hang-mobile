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
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  fetchProducts,
  insertCategory,
  updateCategory,
  deleteCategory,
  insertProduct,
  getProductImageSource,
  getCurrentUser,
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

  // Form Thêm / Sửa loại sản phẩm
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catImage, setCatImage] = useState<string>('local:hinh1');

  // Modal Thêm sản phẩm trực tiếp cho loại tương ứng
  const [targetCategoryForProduct, setTargetCategoryForProduct] =
    useState<Category | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<string>('');
  const [prodDesc, setProdDesc] = useState<string>('');
  const [prodImage, setProdImage] = useState<string>('local:hinh1');

  const loadData = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (!user || user.role !== 'admin') {
      showAlert(
        'Truy cập bị từ chối (RBAC)',
        'Chỉ Quản trị viên (Admin) mới được phép quản lý loại sản phẩm!',
        () => {
          navigation.navigate('MainTabs', { screen: 'UserHomeTab' });
        }
      );
      return;
    }

    const [cats, prods] = await Promise.all([
      fetchCategories(),
      fetchProducts(),
    ]);
    setCategories(cats);
    setProducts(prods);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePickCategoryImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setCatImage(res.assets[0].uri);
    }
  };

  const handlePickProductImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setProdImage(res.assets[0].uri);
    }
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      showAlert('Thiếu tên loại', 'Vui lòng nhập tên loại sản phẩm!');
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, catName.trim(), catImage.trim());
      showAlert('Đã cập nhật', `Đã sửa loại sản phẩm "${catName.trim()}"!`);
    } else {
      await insertCategory(catName.trim(), catImage.trim());
      showAlert('Đã thêm mới', `Đã thêm loại sản phẩm "${catName.trim()}"!`);
    }

    setEditingCategory(null);
    setCatName('');
    setCatImage('local:hinh1');
    loadData();
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatImage(cat.img || 'local:hinh1');
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatImage('local:hinh1');
  };

  const handleDeleteCategory = (cat: Category) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    showConfirm(
      'Xóa loại sản phẩm (Cascade Delete)',
      `Bạn có chắc muốn xóa loại "${cat.name}"? Toàn bộ ${count} sản phẩm thuộc loại này cũng sẽ bị xóa theo!`,
      async () => {
        await deleteCategory(cat.id);
        if (editingCategory?.id === cat.id) {
          cancelEditCategory();
        }
        await loadData();
        showAlert(
          'Đã xóa thành công',
          `Đã xóa loại "${cat.name}" và ${count} sản phẩm thuộc loại này.`
        );
      }
    );
  };

  const openAddProductModal = (cat: Category) => {
    setTargetCategoryForProduct(cat);
    setProdName('');
    setProdPrice('');
    setProdDesc(`Sản phẩm thuộc danh mục ${cat.name} tại Ngô Minh Tú Store.`);
    setProdImage(cat.img || 'local:hinh1');
  };

  const handleSaveProductForCategory = async () => {
    if (!targetCategoryForProduct) return;
    const priceNum = Number(prodPrice);
    if (!prodName.trim() || !prodPrice.trim() || isNaN(priceNum) || priceNum <= 0) {
      showAlert(
        'Dữ liệu không hợp lệ',
        'Vui lòng nhập tên sản phẩm và giá hợp lệ (> 0)!'
      );
      return;
    }

    await insertProduct(
      prodName.trim(),
      priceNum,
      prodImage.trim() || 'local:hinh1',
      prodDesc.trim() || `Phân phối chính hãng bởi Ngô Minh Tú Store.`,
      targetCategoryForProduct.id,
      0
    );

    const catTitle = targetCategoryForProduct.name;
    setTargetCategoryForProduct(null);
    await loadData();
    showAlert(
      'Thêm sản phẩm thành công',
      `Đã thêm "${prodName.trim()}" vào loại "${catTitle}"!`
    );
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Header subtitle="Bảo mật RBAC - Quản trị Loại sản phẩm" />
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
            <Header subtitle="Quản trị Loại sản phẩm & Thêm SP theo loại" />

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingCategory
                  ? `SỬA LOẠI SẢN PHẨM #${editingCategory.id}`
                  : 'THÊM LOẠI SẢN PHẨM MỚI'}
              </Text>

              <Text style={styles.label}>Tên loại sản phẩm (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đồng hồ Ngô Minh Tú"
                placeholderTextColor="#94A3B8"
                value={catName}
                onChangeText={setCatName}
              />

              <Text style={styles.label}>Chọn nhanh ảnh mẫu hoặc tải ảnh</Text>
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
                  onPress={handlePickCategoryImage}
                >
                  <Text style={styles.pickLibBtnText}>Chọn ảnh từ máy</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formActionRow}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveCategory}
                >
                  <Text style={styles.saveBtnText}>
                    {editingCategory ? 'LƯU CẬP NHẬT LOẠI' : 'THÊM LOẠI MỚI'}
                  </Text>
                </TouchableOpacity>

                {editingCategory && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelEditCategory}
                  >
                    <Text style={styles.cancelBtnText}>HỦY SỬA</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.listHeaderTitle}>
              DANH SÁCH LOẠI SẢN PHẨM ({categories.length})
            </Text>
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
                  <Text style={styles.catCount}>
                    Số lượng sản phẩm thuộc loại này: {count} SP
                  </Text>
                </View>
              </View>

              <View style={styles.catButtonsRow}>
                <TouchableOpacity
                  style={styles.addProdForCatBtn}
                  onPress={() => openAddProductModal(item)}
                >
                  <Text style={styles.addProdForCatText}>
                    + Thêm SP cho loại này
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewProdsBtn}
                  onPress={() =>
                    navigation.navigate('AdminProducts', {
                      categoryId: item.id,
                      categoryName: item.name,
                    })
                  }
                >
                  <Text style={styles.viewProdsText}>Xem DS ({count})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => startEditCategory(item)}
                >
                  <Text style={styles.editBtnText}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteCategory(item)}
                >
                  <Text style={styles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={targetCategoryForProduct !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTargetCategoryForProduct(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                THÊM SẢN PHẨM CHO LOẠI:{' '}
                {targetCategoryForProduct?.name.toUpperCase()}
              </Text>

              <Text style={styles.label}>Tên sản phẩm (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Áo Polo Ngô Minh Tú Cao Cấp"
                placeholderTextColor="#94A3B8"
                value={prodName}
                onChangeText={setProdName}
              />

              <Text style={styles.label}>Giá bán (VNĐ) (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 350000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={prodPrice}
                onChangeText={setProdPrice}
              />

              <Text style={styles.label}>Mô tả sản phẩm</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả sản phẩm tại Ngô Minh Tú Store..."
                placeholderTextColor="#94A3B8"
                multiline
                value={prodDesc}
                onChangeText={setProdDesc}
              />

              <Text style={styles.label}>Hình ảnh sản phẩm</Text>
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
                  onPress={handlePickProductImage}
                >
                  <Text style={styles.pickLibBtnText}>Chọn ảnh từ máy</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProductForCategory}
                >
                  <Text style={styles.saveBtnText}>LƯU SẢN PHẨM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setTargetCategoryForProduct(null)}
                >
                  <Text style={styles.cancelBtnText}>ĐÓNG</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
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
  textArea: {
    height: 68,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  presetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  pickLibBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  pickLibBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: '#64748B',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginHorizontal: 14,
    marginBottom: 8,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  catImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  catCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  catButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  addProdForCatBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addProdForCatText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewProdsBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  viewProdsText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
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
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
});

export default AdminCategoriesScreen;

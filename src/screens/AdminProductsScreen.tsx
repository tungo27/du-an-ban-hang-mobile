import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
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
import { RootStackParamList } from '../types/navigation';
import {
  fetchCategories,
  fetchProducts,
  insertProduct,
  updateProduct,
  deleteProduct,
  getProductImageSource,
  getCurrentUser,
  PRESET_IMAGES,
  Category,
  Product,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert, showConfirm } from '../utils/alertHelper';

type AdminProductsRouteProp = RouteProp<RootStackParamList, 'AdminProducts'>;

const AdminProductsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AdminProductsRouteProp>();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCatId, setFilterCatId] = useState<number | undefined>(
    route.params?.categoryId
  );

  // Form Thêm / Sửa sản phẩm
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<number>(1);
  const [image, setImage] = useState<string>('local:hinh1');

  const loadData = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (!user || user.role !== 'admin') {
      showAlert(
        'Truy cập bị từ chối (RBAC)',
        'Chỉ Quản trị viên (Admin) mới được phép quản lý sản phẩm!',
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
    if (route.params?.categoryId) {
      setSelectedCatId(route.params.categoryId);
    } else if (cats.length > 0 && !editingProduct) {
      setSelectedCatId(cats[0].id);
    }
  }, [route.params?.categoryId, editingProduct, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.categoryId !== undefined) {
        setFilterCatId(route.params.categoryId);
      }
      loadData();
    }, [route.params?.categoryId, loadData])
  );

  const handlePickImage = async () => {
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
    setDescription('');
    setImage('local:hinh1');
    if (categories.length > 0) {
      setSelectedCatId(filterCatId ?? categories[0].id);
    }
  };

  const handleSaveProduct = async () => {
    const priceNum = Number(price);
    if (!name.trim() || !price.trim() || isNaN(priceNum) || priceNum <= 0) {
      showAlert(
        'Dữ liệu chưa hợp lệ',
        'Vui lòng nhập Tên sản phẩm và Giá hợp lệ (> 0)!'
      );
      return;
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: name.trim(),
        price: priceNum,
        img: image.trim() || 'local:hinh1',
        description:
          description.trim() || 'Sản phẩm chính hãng tại Ngô Minh Tú Store.',
        categoryId: selectedCatId,
      });
      showAlert('Đã cập nhật', `Đã cập nhật sản phẩm "${name.trim()}"!`);
    } else {
      await insertProduct(
        name.trim(),
        priceNum,
        image.trim() || 'local:hinh1',
        description.trim() || 'Sản phẩm chính hãng tại Ngô Minh Tú Store.',
        selectedCatId,
        0
      );
      showAlert('Đã thêm mới', `Đã thêm sản phẩm "${name.trim()}" vào CSDL!`);
    }

    resetForm();
    loadData();
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price.toString());
    setDescription(prod.description || '');
    setSelectedCatId(prod.categoryId);
    setImage(prod.img);
  };

  const handleDeleteProduct = (prod: Product) => {
    showConfirm(
      'Xác nhận xóa sản phẩm',
      `Bạn có chắc muốn xóa sản phẩm "${prod.name}" khỏi Ngô Minh Tú Store?`,
      async () => {
        await deleteProduct(prod.id);
        if (editingProduct?.id === prod.id) {
          resetForm();
        }
        await loadData();
        showAlert('Đã xóa', `Đã xóa sản phẩm "${prod.name}".`);
      }
    );
  };

  const displayedProducts =
    filterCatId === undefined
      ? products
      : products.filter((p) => p.categoryId === filterCatId);

  const getCatName = (catId: number) =>
    categories.find((c) => c.id === catId)?.name || 'Chưa phân loại';

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Header subtitle="Bảo mật RBAC - Quản trị Sản phẩm" />
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
        data={displayedProducts}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Header subtitle="Quản trị Sản phẩm (Xem, Thêm, Sửa, Xóa)" />

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingProduct
                  ? `CHỈNH SỬA SẢN PHẨM #${editingProduct.id}`
                  : 'THÊM SẢN PHẨM MỚI VÀO CSDL'}
              </Text>

              <Text style={styles.label}>Tên sản phẩm (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Balo Laptop Ngô Minh Tú Pro"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Giá bán (VNĐ) (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 450000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>Thuộc Loại sản phẩm (*)</Text>
              <View style={styles.catChipRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selectedCatId === cat.id && styles.catChipActive,
                    ]}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        selectedCatId === cat.id && styles.catChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Mô tả chi tiết</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập mô tả sản phẩm tại Ngô Minh Tú Store..."
                placeholderTextColor="#94A3B8"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Chọn hình ảnh sản phẩm</Text>
              <View style={styles.catChipRow}>
                {PRESET_IMAGES.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.catChip,
                      image === preset.value && styles.catChipActive,
                    ]}
                    onPress={() => setImage(preset.value)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        image === preset.value && styles.catChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pickImageBtn}
                  onPress={handlePickImage}
                >
                  <Text style={styles.pickImageText}>Chọn từ thư viện</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formActionRow}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? 'LƯU CẬP NHẬT SP' : 'THÊM SẢN PHẨM MỚI'}
                  </Text>
                </TouchableOpacity>
                {editingProduct && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={resetForm}
                  >
                    <Text style={styles.cancelBtnText}>HỦY SỬA</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.listHeaderTitle}>
                LỌC DANH SÁCH SẢN PHẨM ({displayedProducts.length} SP):
              </Text>
              <View style={styles.catChipRow}>
                <TouchableOpacity
                  style={[
                    styles.catChip,
                    filterCatId === undefined && styles.catChipActive,
                  ]}
                  onPress={() => setFilterCatId(undefined)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      filterCatId === undefined && styles.catChipTextActive,
                    ]}
                  >
                    Tất cả ({products.length})
                  </Text>
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.catChip,
                      filterCatId === c.id && styles.catChipActive,
                    ]}
                    onPress={() => setFilterCatId(c.id)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        filterCatId === c.id && styles.catChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.prodCard}>
            <Image
              source={getProductImageSource(item.img)}
              style={styles.prodImg}
              resizeMode="cover"
            />
            <View style={styles.prodInfo}>
              <Text style={styles.prodName} numberOfLines={2}>
                #{item.id} - {item.name}
              </Text>
              <Text style={styles.prodPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.prodMeta}>
                Loại: {getCatName(item.categoryId)} | Đã bán: {item.soldCount ?? 0}
              </Text>
              <View style={styles.prodActionRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => startEditProduct(item)}
                >
                  <Text style={styles.editBtnText}>Sửa sản phẩm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProduct(item)}
                >
                  <Text style={styles.deleteBtnText}>Xóa sản phẩm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    height: 64,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  catChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  pickImageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  pickImageText: {
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
  filterSection: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  prodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  prodInfo: {
    flex: 1,
  },
  prodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  prodPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  prodMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  prodActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default AdminProductsScreen;

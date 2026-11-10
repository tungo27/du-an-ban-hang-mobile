import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  getProductImageSource,
  fetchCategories,
  getProductById,
  addToCart,
  getCurrentUser,
  Category,
  Product,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

type DetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailRouteProp>();

  const [product, setProduct] = useState<Product | null>(
    route.params?.product || null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categoryName, setCategoryName] = useState<string>('Đang tải...');
  const [quantity, setQuantity] = useState<number>(1);
  const [imgError, setImgError] = useState<boolean>(false);
  const [headerKey, setHeaderKey] = useState<number>(0);

  useEffect(() => {
    const initDetail = async () => {
      const u = await getCurrentUser();
      setCurrentUser(u);
      let currentProd = route.params?.product || null;
      if (!currentProd && route.params?.productId) {
        currentProd = await getProductById(route.params.productId);
        setProduct(currentProd);
      }
      if (currentProd) {
        const cats: Category[] = await fetchCategories();
        const found = cats.find((c) => c.id === currentProd!.categoryId);
        setCategoryName(found ? found.name : 'Danh mục khác');
      }
    };
    initDetail();
  }, [route.params?.product, route.params?.productId]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Header subtitle="Chi tiết sản phẩm" />
        <View style={styles.card}>
          <Text style={styles.productName}>Đang tải thông tin sản phẩm...</Text>
        </View>
      </View>
    );
  }

  const handleAddCart = async () => {
    await addToCart(product, quantity);
    setHeaderKey((prev) => prev + 1);
    showAlert(
      'Thành công',
      `Đã thêm ${quantity} x "${product.name}" vào giỏ hàng Ngô Minh Tú Store!`
    );
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity);
    navigation.navigate('Cart');
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <ScrollView style={styles.container}>
      <Header
        key={headerKey}
        subtitle="Chi tiết sản phẩm"
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.imageContainer}>
        <Image
          source={
            imgError
              ? require('../../assets/images/hinh1.jpg')
              : getProductImageSource(product.img)
          }
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <TouchableOpacity
            style={styles.categoryBadge}
            onPress={() =>
              navigation.navigate('Products', { categoryId: product.categoryId })
            }
          >
            <Text style={styles.categoryBadgeText}>Loại: {categoryName}</Text>
          </TouchableOpacity>
          <Text style={styles.soldText}>
            Đã bán: {product.soldCount ?? 0} sản phẩm
          </Text>
        </View>

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>MÔ TẢ SẢN PHẨM</Text>
        <Text style={styles.descriptionText}>
          {product.description || 'Sản phẩm chính hãng tại Ngô Minh Tú Store.'}
        </Text>

        <View style={styles.divider} />

        {isAdmin ? (
          <View style={styles.adminNoticeBox}>
            <Text style={styles.adminNoticeText}>
              Bạn đang đăng nhập với quyền Quản trị viên (Admin). Tài khoản Admin không thực hiện đặt mua hàng.
            </Text>
            <TouchableOpacity
              style={styles.editInAdminBtn}
              onPress={() =>
                navigation.navigate('AdminProducts', {
                  categoryId: product.categoryId,
                })
              }
            >
              <Text style={styles.editInAdminBtnText}>
                QUẢN LÝ SẢN PHẨM NÀY TRONG ADMIN
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.quantityRow}>
              <Text style={styles.sectionLabel}>SỐ LƯỢNG ĐẶT MUA:</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.subtotalText}>
              Tạm tính: {formatPrice(product.price * quantity)}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddCart}>
                <Text style={styles.addToCartBtnText}>THÊM VÀO GIỎ HÀNG</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
                <Text style={styles.buyNowBtnText}>MUA NGAY</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  soldText: {
    fontSize: 12,
    color: '#64748B',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  qtyValue: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtotalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 14,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  addToCartBtnText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 13,
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adminNoticeBox: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  adminNoticeText: {
    fontSize: 12,
    color: '#5B21B6',
    marginBottom: 10,
    lineHeight: 18,
  },
  editInAdminBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editInAdminBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;

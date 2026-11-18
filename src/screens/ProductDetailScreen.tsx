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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import {
  getProductImageSource,
  fetchCategories,
  getProductById,
  addToCart,
  getCurrentUser,
  getDefaultSizes,
  isAdminRole,
  Category,
  Product,
  User,
} from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import Header from '../components/Header';
import { showAlert } from '../utils/alertHelper';

type DetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

const PACKAGING_IMAGES = [
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80',
];

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DetailRouteProp>();

  const [product, setProduct] = useState<Product | null>(
    route.params?.product || null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categoryName, setCategoryName] = useState<string>('Loading...');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [headerKey, setHeaderKey] = useState<number>(0);

  useEffect(() => {
    const initDetail = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);

      let currentProd = route.params?.product || null;
      if (!currentProd && route.params?.productId) {
        currentProd = await getProductById(route.params.productId);
        setProduct(currentProd);
      }
      if (currentProd) {
        setSelectedImage(currentProd.img);
        const cats: Category[] = await fetchCategories();
        const found = cats.find((c) => c.id === currentProd!.categoryId);
        setCategoryName(found ? found.name : 'Uncategorized');
      }
    };
    initDetail();
  }, [route.params?.product, route.params?.productId]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Header subtitle="Product Details" />
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading product information...</Text>
        </View>
      </View>
    );
  }

  const isAdmin = isAdminRole(currentUser?.role);
  const stockQty = Number(product.stock ?? 0);
  const isOutOfStock = stockQty <= 0;
  const isDeleted = Number(product.isDeleted ?? 0) === 1;
  const hasSale =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.salePrice) > 0 &&
    Number(product.salePrice) < Number(product.price);
  const effectivePrice = hasSale ? Number(product.salePrice) : product.price;
  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : getDefaultSizes(product.name, product.categoryId);

  const validateQuantity = (): boolean => {
    if (isOutOfStock) {
      showAlert('Out of Stock', `"${product.name}" is currently out of stock.`);
      return false;
    }
    if (!selectedSize) {
      showAlert('Select a Size', 'Please choose a size before adding this product.');
      return false;
    }
    if (quantity > stockQty) {
      showAlert(
        'Not Enough Stock',
        `Only ${stockQty} item(s) of "${product.name}" are available.`
      );
      return false;
    }
    return true;
  };

  const handleAddCart = async () => {
    if (!validateQuantity()) return;
    await addToCart(product, quantity, selectedSize);
    setHeaderKey((prev) => prev + 1);
    showAlert(
      'Added to Cart',
      `${quantity} x "${product.name}" (Size ${selectedSize}) was added to your TuTu Store cart.`
    );
  };

  const handleBuyNow = async () => {
    if (!validateQuantity()) return;
    await addToCart(product, quantity, selectedSize);
    navigation.navigate('Cart');
  };

  return (
    <ScrollView style={styles.container}>
      <Header
        key={headerKey}
        subtitle="Product Details"
        onUserChanged={(u) => setCurrentUser(u)}
      />

      <View style={styles.imageContainer}>
        <Image
          source={
            imgError
              ? require('../../assets/images/hinh1.jpg')
              : getProductImageSource(selectedImage || product.img)
          }
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
        <View style={styles.storeTag}>
          <Ionicons name="storefront-outline" size={12} color="#FFFFFF" />
          <Text style={styles.storeTagText}>TuTu Store</Text>
        </View>
        {hasSale && (
          <View style={styles.saleTag}>
            <Text style={styles.saleTagText}>SALE</Text>
          </View>
        )}
      </View>

      <View style={styles.gallerySection}>
        <Text style={styles.galleryLabel}>PRODUCT & PACKAGING PHOTOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryRow}
        >
          {[product.img, ...PACKAGING_IMAGES].map((imgUri, idx) => {
            const isSelected = (selectedImage || product.img) === imgUri;
            return (
              <TouchableOpacity
                key={`${imgUri}-${idx}`}
                style={[styles.galleryThumbWrap, isSelected && styles.galleryThumbWrapActive]}
                onPress={() => {
                  setImgError(false);
                  setSelectedImage(imgUri);
                }}
              >
                <Image
                  source={getProductImageSource(imgUri)}
                  style={styles.galleryThumb}
                  resizeMode="cover"
                />
                <Text style={styles.galleryThumbCaption}>
                  {idx === 0 ? 'Product' : `Pack ${idx}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <TouchableOpacity
            style={styles.categoryBadge}
            onPress={() =>
              navigation.navigate('Products', { categoryId: product.categoryId })
            }
          >
            <Ionicons name="albums-outline" size={11} color="#2563EB" />
            <Text style={styles.categoryBadgeText}>{categoryName}</Text>
          </TouchableOpacity>
          <Text style={styles.soldText}>Sold: {product.soldCount ?? 0}</Text>
        </View>

        <Text style={styles.productName}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(effectivePrice)}</Text>
          {hasSale && (
            <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
          )}
        </View>

        <View
          style={[
            styles.stockBadge,
            isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn,
          ]}
        >
          <Ionicons
            name={isOutOfStock ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={13}
            color={isOutOfStock ? '#B45309' : '#059669'}
          />
          <Text
            style={[
              styles.stockText,
              isOutOfStock ? styles.stockTextOut : styles.stockTextIn,
            ]}
          >
            {isOutOfStock ? 'Out of stock' : `In stock: ${stockQty}`}
          </Text>
        </View>

        {isDeleted && (
          <View style={styles.deletedNotice}>
            <Ionicons name="trash-outline" size={13} color="#DC2626" />
            <Text style={styles.deletedNoticeText}>
              This product is soft deleted and hidden from customers.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <Text style={styles.descriptionText}>
          {product.description || 'Genuine product distributed by TuTu Store.'}
        </Text>

        <View style={styles.divider} />

        {isAdmin ? (
          <View style={styles.adminNoticeBox}>
            <View style={styles.adminNoticeRow}>
              <Ionicons name="shield-half" size={15} color="#5B21B6" />
              <Text style={styles.adminNoticeText}>
                Administrator account: ordering is disabled. Manage this product
                from the dashboard.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editInAdminBtn}
              onPress={() =>
                navigation.navigate('AdminProducts', {
                  categoryId: product.categoryId,
                })
              }
            >
              <Ionicons name="construct-outline" size={14} color="#FFFFFF" />
              <Text style={styles.editInAdminBtnText}>MANAGE IN ADMIN</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sizeHeaderRow}>
              <Text style={styles.sectionLabel}>SELECT SIZE (*):</Text>
              <Text style={styles.sizeHint}>
                {availableSizes.length} sizes available
              </Text>
            </View>
            <View style={styles.sizeRow}>
              {availableSizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeChip, active && styles.sizeChipActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        active && styles.sizeChipTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.sectionLabel}>QUANTITY:</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  disabled={isOutOfStock}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove-outline" size={16} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  disabled={isOutOfStock}
                  onPress={() => setQuantity((q) => Math.min(Math.max(stockQty, 1), q + 1))}
                >
                  <Ionicons name="add-outline" size={16} color="#1E293B" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.subtotalText}>
              Subtotal: {formatPrice(effectivePrice * quantity)}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addToCartBtn, isOutOfStock && styles.disabledBtn]}
                onPress={handleAddCart}
                disabled={isOutOfStock}
              >
                <Ionicons name="cart-outline" size={15} color="#2563EB" />
                <Text style={styles.addToCartBtnText}>ADD TO CART</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buyNowBtn, isOutOfStock && styles.disabledBtn]}
                onPress={handleBuyNow}
                disabled={isOutOfStock}
              >
                <Ionicons name="flash-outline" size={15} color="#FFFFFF" />
                <Text style={styles.buyNowBtnText}>BUY NOW</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.reviewSection}>
          <View style={styles.reviewHeaderRow}>
            <View style={styles.reviewTitleRow}>
              <Ionicons name="star-outline" size={14} color="#D97706" />
              <Text style={styles.sectionLabel}>
                CUSTOMER PHOTOS ({product.rating ?? 4.9}/5)
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={styles.viewOrdersLink}>My orders</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewItemCard}>
            <Text style={styles.reviewerName}>
              Customer: Ngo Minh Tu - Purchased at TuTu Store
            </Text>
            <Text style={styles.reviewComment}>
              Packed carefully, delivered quickly, and exactly as described -
              great fit and fabric quality.
            </Text>
            <View style={styles.reviewImagesRow}>
              <Image
                source={getProductImageSource(product.img)}
                style={styles.reviewOrderImg}
                resizeMode="cover"
              />
              <Image
                source={getProductImageSource(PACKAGING_IMAGES[0])}
                style={styles.reviewOrderImg}
                resizeMode="cover"
              />
              <Image
                source={getProductImageSource(PACKAGING_IMAGES[1])}
                style={styles.reviewOrderImg}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingText: { fontSize: 14, color: '#475569' },
  imageContainer: { width: '100%', height: 280, backgroundColor: '#E2E8F0' },
  image: { width: '100%', height: '100%' },
  storeTag: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  storeTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  saleTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  gallerySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  galleryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  galleryRow: { flexDirection: 'row', gap: 10 },
  galleryThumbWrap: {
    width: 70,
    alignItems: 'center',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  galleryThumbWrapActive: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  galleryThumb: { width: 60, height: 54, borderRadius: 6, backgroundColor: '#E2E8F0' },
  galleryThumbCaption: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 3,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  soldText: { fontSize: 12, color: '#64748B' },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productPrice: { fontSize: 22, fontWeight: 'bold', color: '#DC2626' },
  originalPrice: {
    fontSize: 15,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  stockBadgeIn: { backgroundColor: '#DCFCE7' },
  stockBadgeOut: { backgroundColor: '#FEF3C7' },
  stockText: { fontSize: 11, fontWeight: 'bold' },
  stockTextIn: { color: '#059669' },
  stockTextOut: { color: '#B45309' },
  deletedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  deletedNoticeText: { flex: 1, fontSize: 11, color: '#B91C1C', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeHint: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sizeChip: {
    minWidth: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  sizeChipActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#1E3A8A',
  },
  sizeChipText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  sizeChipTextActive: { color: '#FFFFFF' },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginTop: 6,
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
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F5F9' },
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
  actionRow: { flexDirection: 'row', gap: 10 },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  addToCartBtnText: { color: '#2563EB', fontWeight: 'bold', fontSize: 13 },
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 8,
  },
  buyNowBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  disabledBtn: { opacity: 0.45 },
  adminNoticeBox: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  adminNoticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  adminNoticeText: { flex: 1, fontSize: 12, color: '#5B21B6', lineHeight: 18 },
  editInAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  editInAdminBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  reviewSection: { marginTop: 2 },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewOrdersLink: { fontSize: 12, fontWeight: 'bold', color: '#2563EB' },
  reviewItemCard: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewerName: { fontSize: 12, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  reviewComment: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewImagesRow: { flexDirection: 'row', gap: 8 },
  reviewOrderImg: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
});

export default ProductDetailScreen;

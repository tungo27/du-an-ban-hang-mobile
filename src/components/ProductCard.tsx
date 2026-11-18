import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, getProductImageSource } from '../data/database';
import { formatPrice } from '../utils/formatPrice';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const [imgError, setImgError] = useState(false);

  const hasSale =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.salePrice) > 0 &&
    Number(product.salePrice) < Number(product.price);
  const finalPrice = hasSale ? Number(product.salePrice) : product.price;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={onPress}
        activeOpacity={0.85}
      >
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
        {hasSale && (
          <View style={styles.saleTag}>
            <Ionicons name="pricetag" size={10} color="#FFFFFF" />
            <Text style={styles.saleTagText}>SALE</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.info}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </TouchableOpacity>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(finalPrice)}</Text>
          {hasSale && (
            <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>
          )}
        </View>

        <Text style={styles.sold}>Sold: {product.soldCount ?? 0}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.detailButton} onPress={onPress}>
            <Ionicons name="eye-outline" size={12} color="#2563EB" />
            <Text style={styles.detailButtonText}>Details</Text>
          </TouchableOpacity>

          {onAddToCart && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => onAddToCart(product)}
            >
              <Ionicons name="cart-outline" size={12} color="#FFFFFF" />
              <Text style={styles.cartButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 290,
  },
  imageWrapper: {
    width: '100%',
    height: 155,
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  saleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  saleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  oldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  sold: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailButtonText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    borderRadius: 6,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ProductCard;

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
      </TouchableOpacity>
      <View style={styles.info}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </TouchableOpacity>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.sold}>Đã bán: {product.soldCount ?? 0}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.detailButton} onPress={onPress}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>

          {onAddToCart && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => onAddToCart(product)}
            >
              <Text style={styles.cartButtonText}>+ Giỏ</Text>
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
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  sold: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
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
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ProductCard;

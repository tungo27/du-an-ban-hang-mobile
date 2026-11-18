import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useSafeAreaInsets,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDefaultSizes, getProductImageSource } from '../data/database';
import { formatPrice } from '../utils/formatPrice';
import { addToCart } from '../data/database';
import Header from '../components/Header';

type SizeSelectionParam = {
  product: any;
};

const SizeSelectionScreen: React.FC<SizeSelectionParam> = ({ product }) => {
  const navigation = useNavigation();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const insets = useSafeAreaInsets();

  const effectivePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.salePrice) > 0 &&
    Number(product.salePrice) < Number(product.price)
      ? Number(product.salePrice)
      : product.price;

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : getDefaultSizes(product.name, product.categoryId);

  const handleSizePress = (size: string) => {
    setSelectedSize(size);
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      showAlert('Select a Size', 'Please choose a size before adding to cart.');
      return;
    }
    const result = await addToCart(product, quantity, selectedSize);
    setShowCart(true);
    setTimeout(() => setShowCart(false), 1500);
  };

  const cartItem = navigation.getParam('fromCart', false);

  useCallback(() => {
    const items = navigation.getParam('cartItems', []);
    // Could handle cart state if needed
  }, []);

  return (
    <>
      <Header
        subtitle={`Select size for ${product.name}`}
        showBackButton
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sizeHeader}>
          <Text style={styles.sizeHeaderText}>SELECT SIZE</Text>
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
                style={[
                  styles.sizeChip,
                  active && styles.sizeChipActive,
                ]}
                onPress={() => handleSizePress(size)}
                accessibilityRole="radio"
                accessibilityState={{ value: selectedSize === size }}
              >
                <Text style={[
                  styles.sizeChipText,
                  active && styles.sizeChipTextActive,
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>QUANTITY:</Text>
          <View style={styles.quantityStepper}>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Ionicons name="remove-outline" size={18} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(quantity + 1)}>
              <Ionicons name="add-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.quantityPrice}>${formatPrice(effectivePrice * quantity)}</Text>
        </View>

        {!!selectedSize && (
          <View style={styles.selectedSizeDisplay}>
            <Text style={styles.selectedSizeText}>
              Selected size: {selectedSize}
            </Text>
          </View>
        )}

        <View style={styles.sizeFooter}>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating cart badge after adding */}
      {showCart && (
        <View style={styles.floatingCart}>
          <Ionicons name="cart-outline" size={24} color="#1E3A8A" />
          <Text style={styles.floatingCartText}>
            {quantity} x {product.name} ({selectedSize}) added!
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sizeHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sizeHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sizeChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  sizeChipActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#1E3A8A',
  },
  sizeChipText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  quantityBtn: {
    padding: 6,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginHorizontal: 8,
  },
  quantityPrice: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  selectedSizeDisplay: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  selectedSizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  sizeFooter: {
    paddingHorizontal: 20,
    paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SizeSelectionScreen;
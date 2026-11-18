import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ModalBody,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDefaultSizes, getProductImageSource } from '../data/database';
import { formatPrice } from '../utils/formatPrice';

interface SizeSelectionModalProps {
  product: any;
  onSizeSelected: (size: string, quantity: number) => void;
  onClose: () => void;
}

const SizeSelectionModal: React.FC<SizeSelectionModalProps> = ({
  product,
  onSizeSelected,
  onClose,
}) => {
  const [quantity, setQuantity] = useState(1);
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

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      openTimeoutDuration={200}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Ionicons name="close-outline" size={24} color="#64748B" style={styles.closeButton} onPress={onClose} />
            <Text style={styles.modalTitle}>Select Size for {product.name}</Text>
          </View>

          <View style={styles.modalContent}>
            <Image
              source={getProductImageSource(product.img)}
              style={styles.modalProductImage}
              resizeMode="cover"
            />
            <Text style={styles.modalProductName}>{product.name}</Text>

            <View style={styles.sizeOptions}>
              <Text style={styles.sizeLabel}>Size:</Text>
              {availableSizes.map((size) => {
                const [baseSize] = size.split(' '); // handle multi-word sizes
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeChip, styles.sizeChipActive]}
                    onPress={() => onSizeSelected(size, quantity)}
                  >
                    <Text style={styles.sizeChipText}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityStepper}>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Ionicons name="remove-outline" size={16} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(quantity + 1)}>
                  <Ionicons name="add-outline" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.quantityPrice}>${formatPrice(effectivePrice * quantity)}</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.confirmButton} onPress={() => onSizeSelected(selectedSize || availableSizes[0], quantity)}>
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  modalProductImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  sizeOptions: {},
  sizeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  sizeChip: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
    marginBottom: 6,
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
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SizeSelectionModal;
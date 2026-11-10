import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { Category, getProductImageSource } from '../data/database';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: number | undefined;
  onSelect: (id: number | undefined) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            selectedId === undefined && styles.categoryCardActive,
          ]}
          onPress={() => onSelect(undefined)}
          activeOpacity={0.75}
        >
          <View
            style={[
              styles.allIconBox,
              selectedId === undefined && styles.allIconBoxActive,
            ]}
          >
            <Text
              style={[
                styles.allIconText,
                selectedId === undefined && styles.allIconTextActive,
              ]}
            >
              ALL
            </Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              selectedId === undefined && styles.categoryNameActive,
            ]}
            numberOfLines={1}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardActive,
              ]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.75}
            >
              <Image
                source={getProductImageSource(cat.img)}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameActive,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 106,
    marginVertical: 6,
  },
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  categoryCard: {
    width: 76,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  categoryCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  allIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  allIconBoxActive: {
    backgroundColor: '#2563EB',
  },
  allIconText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  allIconTextActive: {
    color: '#FFFFFF',
  },
  categoryImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F1F5F9',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
});

export default CategorySelector;

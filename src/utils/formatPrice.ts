export const formatVND = (price: number): string => {
  if (isNaN(price)) return '0 đ';
  return price.toLocaleString('vi-VN') + ' đ';
};

export const formatPrice = formatVND;

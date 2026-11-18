export const formatVND = (price: number): string => {
  if (isNaN(price)) return '0 VND';
  return price.toLocaleString('en-US') + ' VND';
};

export const formatPrice = formatVND;

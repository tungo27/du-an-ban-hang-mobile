import { getCartItemKey } from './database';

// The cart lets the customer tick the products that belong to this order.
// The selection is handed to the Checkout screen through this tiny store so
// the checkout only contains the products the customer actually chose.
let selectedKeys: string[] | null = null;

export const setCheckoutSelection = (
  items: { productId: number; size?: string }[]
): void => {
  selectedKeys = items.map(getCartItemKey);
};

export const getCheckoutSelection = (): string[] | null =>
  selectedKeys ? [...selectedKeys] : null;

export const clearCheckoutSelection = (): void => {
  selectedKeys = null;
};

import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Global navigation ref so floating overlays rendered outside a navigator
// (like the floating cart button) can still navigate.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const getLeafRouteName = (state: any): string | undefined => {
  if (!state || !Array.isArray(state.routes) || state.routes.length === 0) {
    return undefined;
  }
  const index =
    typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return undefined;
  if (route.state) {
    return getLeafRouteName(route.state) ?? route.name;
  }
  return route.name;
};

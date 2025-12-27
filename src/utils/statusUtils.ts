import type { FoodItemStatus } from '../types';
import { isExpired, isExpiringSoon } from './dateUtils';

export const getFoodItemStatus = (expirationDate: Date | string, reminderDays: number = 7): FoodItemStatus => {
  if (isExpired(expirationDate)) {
    return 'expired';
  } else if (isExpiringSoon(expirationDate, reminderDays)) {
    return 'expiring_soon';
  } else {
    return 'fresh';
  }
};

export const getStatusColor = (status: FoodItemStatus): string => {
  switch (status) {
    case 'expiring_soon':
      return '#eab308'; // yellow
    case 'expired':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const getStatusLabel = (status: FoodItemStatus): string => {
  switch (status) {
    case 'fresh':
      return 'Fresh';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
};

export const getStatusBgColor = (status: FoodItemStatus): string => {
  switch (status) {
    case 'expiring_soon':
      return '#fef9c3'; // light yellow
    case 'expired':
      return '#fee2e2'; // light red
    default:
      return '#f3f4f6'; // light gray
  }
};


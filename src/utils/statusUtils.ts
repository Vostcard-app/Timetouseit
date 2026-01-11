import type { FoodItemStatus } from '../types';
import { isPastBestBy, isBestBySoon } from './dateUtils';

export const getFoodItemStatus = (bestByDate: Date | string, reminderDays: number = 7): FoodItemStatus => {
  if (isPastBestBy(bestByDate)) {
    return 'pastBestBy';
  } else if (isBestBySoon(bestByDate, reminderDays)) {
    return 'bestBySoon';
  } else {
    return 'fresh';
  }
};

export const getStatusColor = (status: FoodItemStatus): string => {
  switch (status) {
    case 'bestBySoon':
      return '#eab308'; // yellow
    case 'pastBestBy':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const getStatusLabel = (status: FoodItemStatus): string => {
  switch (status) {
    case 'fresh':
      return 'Fresh';
    case 'bestBySoon':
      return 'Best By Soon';
    case 'pastBestBy':
      return 'Past Best By';
    default:
      return 'Unknown';
  }
};

export const getStatusBgColor = (status: FoodItemStatus): string => {
  switch (status) {
    case 'bestBySoon':
      return '#fef9c3'; // light yellow
    case 'pastBestBy':
      return '#fee2e2'; // light red
    default:
      return '#f3f4f6'; // light gray
  }
};


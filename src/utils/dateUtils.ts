export const calculateDaysUntilBestBy = (bestByDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bestBy = new Date(bestByDate);
  bestBy.setHours(0, 0, 0, 0);
  
  const diffTime = bestBy.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatRelativeDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';
  const days = calculateDaysUntilBestBy(d);
  
  if (days < 0) {
    return `Past best by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  } else if (days === 0) {
    return 'Best by today';
  } else if (days === 1) {
    return 'Best by tomorrow';
  } else {
    return `Best by in ${days} days`;
  }
};

export const isPastBestBy = (bestByDate: Date | string): boolean => {
  const d = typeof bestByDate === 'string' ? new Date(bestByDate) : bestByDate;
  if (isNaN(d.getTime())) return false;
  return calculateDaysUntilBestBy(d) < 0;
};

export const isBestBySoon = (bestByDate: Date | string, daysThreshold: number = 7): boolean => {
  const d = typeof bestByDate === 'string' ? new Date(bestByDate) : bestByDate;
  if (isNaN(d.getTime())) return false;
  const days = calculateDaysUntilBestBy(d);
  return days >= 0 && days <= daysThreshold;
};

// Legacy aliases for backward compatibility during migration
export const calculateDaysUntilExpiration = calculateDaysUntilBestBy;
export const isExpired = isPastBestBy;
export const isExpiringSoon = isBestBySoon;

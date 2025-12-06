export const calculateDaysUntilExpiration = (expirationDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  
  const diffTime = expDate.getTime() - today.getTime();
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
  const days = calculateDaysUntilExpiration(d);
  
  if (days < 0) {
    return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  } else if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${days} days`;
  }
};

export const isExpired = (expirationDate: Date | string): boolean => {
  const d = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  if (isNaN(d.getTime())) return false;
  return calculateDaysUntilExpiration(d) < 0;
};

export const isExpiringSoon = (expirationDate: Date | string, daysThreshold: number = 7): boolean => {
  const d = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  if (isNaN(d.getTime())) return false;
  const days = calculateDaysUntilExpiration(d);
  return days >= 0 && days <= daysThreshold;
};


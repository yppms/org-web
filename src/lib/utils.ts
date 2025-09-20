// Utility functions for formatting

export const formatCurrency = (amount: number): string => {
  // Use Indonesian format with "Rp" prefix
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `Rp${formatted}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
  
  // Indonesian month abbreviations
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const month = monthNames[date.getMonth()];
  
  return `${day}-${month}-${year}`;
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

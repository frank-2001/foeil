export const formatCompactNumber = (value: number): string => {
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  let res = '';
  if (absValue >= 1000000000) {
    res = (absValue / 1000000000).toFixed(1).replace(/\.0$/, '') + 'Md';
  } else if (absValue >= 1000000) {
    res = (absValue / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    res = absValue.toFixed(1).replace(/\.0$/, '');
  }
  
  // Replace dot with comma for certain locales (French convention)
  return sign + res.replace('.', ',');
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

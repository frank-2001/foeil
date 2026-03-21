export const formatCompactNumber = (
  value: number,
  currency: string = 'USD'
): string => {
  let suffix = '';
  let shortValue = value;

  if (value >= 1_000_000_000) {
    shortValue = value / 1_000_000_000;
    suffix = ' Md';
  } else if (value >= 1_000_000) {
    shortValue = value / 1_000_000;
    suffix = ' M';
  } else if (value >= 1_000) {
    shortValue = value / 1_000;
    suffix = ' K';
  }

  // Format du nombre
  const numberFormatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(shortValue);

  // Récupérer le symbole de la devise
  const currencySymbol = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value;

  return `${numberFormatted}${suffix} ${currencySymbol}`;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

/** Currencies BGG accepts for prices (marketplace, price paid, current value), with their short labels. */
export const CURRENCIES = [
    { value: 'USD', label: 'US$' },
    { value: 'EUR', label: 'EU€' },
    { value: 'GBP', label: 'GB£' },
    { value: 'CAD', label: 'CA$' },
    { value: 'AUD', label: 'AU$' },
    { value: 'NZD', label: 'NZ$' },
    { value: 'BRL', label: 'R$' },
    { value: 'MXN', label: 'MX$' },
    { value: 'CHF', label: 'SFr' },
    { value: 'CZK', label: 'Kč' },
    { value: 'DKK', label: 'DKK' },
    { value: 'SEK', label: 'SEK' },
    { value: 'HUF', label: 'Ft' },
    { value: 'ILS', label: '₪' },
    { value: 'NOK', label: 'NOK' },
    { value: 'PLN', label: 'zł' },
    { value: 'JPY', label: '¥' },
    { value: 'CNY', label: '元' },
    { value: 'HKD', label: 'HK$' },
    { value: 'MYR', label: 'RM' },
    { value: 'TWD', label: 'NT$' },
    { value: 'PHP', label: '₱' },
    { value: 'SGD', label: 'S$' },
    { value: 'THB', label: '฿' },
] as const;

export type Currency = typeof CURRENCIES[number]['value'];

export const CURRENCY_CODES = CURRENCIES.map(currency => currency.value) as [Currency, ...Currency[]];

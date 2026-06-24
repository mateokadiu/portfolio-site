// Real EU27 standard VAT rates, mirrored from the stripe-eu-vat-moss project's
// Liquibase changeset at
// moss-ledger/src/main/resources/db/changelog/data/003-vat-rates-eu27.sql
// Source: EU Commission VAT rates database. Rates effective for 2026-current.
// rate_basis_points: 1900 = 19.00%

export interface VatRate {
  code: string;
  name: string;
  flag: string;
  rateBp: number;
  note?: string;
}

export const EU27_VAT: VatRate[] = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹', rateBp: 2000 },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', rateBp: 2100 },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', rateBp: 2000 },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', rateBp: 1900 },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿', rateBp: 2100 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', rateBp: 1900 },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', rateBp: 2500 },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', rateBp: 2200, note: 'from 2024' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', rateBp: 2100 },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', rateBp: 2550, note: 'raised 2024-09' },
  { code: 'FR', name: 'France', flag: '🇫🇷', rateBp: 2000 },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', rateBp: 2400 },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', rateBp: 2500 },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', rateBp: 2700, note: 'highest in EU' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', rateBp: 2300 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', rateBp: 2200 },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', rateBp: 2100 },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', rateBp: 1700, note: 'lowest in EU' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', rateBp: 2100 },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', rateBp: 1800 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', rateBp: 2100 },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', rateBp: 2300 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', rateBp: 2300 },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', rateBp: 1900 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', rateBp: 2500 },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', rateBp: 2200 },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', rateBp: 2300, note: 'from 2025' },
];

export const bpToPercent = (bp: number): number => bp / 100;

export const findRate = (code: string): VatRate | undefined =>
  EU27_VAT.find((r) => r.code === code);

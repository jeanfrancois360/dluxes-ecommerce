/**
 * Country Name to ISO 3166-1 alpha-2 Code Mapping
 * Used for Gelato API which requires 2-letter country codes
 */

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  // Common countries
  'United States': 'US',
  'United Kingdom': 'GB',
  Canada: 'CA',
  Australia: 'AU',
  France: 'FR',
  Germany: 'DE',
  Italy: 'IT',
  Spain: 'ES',
  Netherlands: 'NL',
  Belgium: 'BE',
  Switzerland: 'CH',
  Austria: 'AT',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Poland: 'PL',
  Portugal: 'PT',
  Ireland: 'IE',
  Greece: 'GR',
  'Czech Republic': 'CZ',
  Hungary: 'HU',
  Romania: 'RO',
  Bulgaria: 'BG',
  Croatia: 'HR',
  Slovakia: 'SK',
  Slovenia: 'SI',
  Lithuania: 'LT',
  Latvia: 'LV',
  Estonia: 'EE',
  Luxembourg: 'LU',
  Malta: 'MT',
  Cyprus: 'CY',

  // Americas
  Mexico: 'MX',
  Brazil: 'BR',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  Peru: 'PE',
  Venezuela: 'VE',
  Ecuador: 'EC',
  Uruguay: 'UY',
  Paraguay: 'PY',
  Bolivia: 'BO',
  'Costa Rica': 'CR',
  Panama: 'PA',
  Guatemala: 'GT',
  Honduras: 'HN',
  'El Salvador': 'SV',
  Nicaragua: 'NI',
  'Dominican Republic': 'DO',
  Cuba: 'CU',
  Jamaica: 'JM',
  'Trinidad and Tobago': 'TT',
  Bahamas: 'BS',
  Barbados: 'BB',

  // Asia
  China: 'CN',
  Japan: 'JP',
  'South Korea': 'KR',
  India: 'IN',
  Indonesia: 'ID',
  Malaysia: 'MY',
  Singapore: 'SG',
  Thailand: 'TH',
  Vietnam: 'VN',
  Philippines: 'PH',
  Pakistan: 'PK',
  Bangladesh: 'BD',
  'Sri Lanka': 'LK',
  Myanmar: 'MM',
  Cambodia: 'KH',
  Laos: 'LA',
  'Hong Kong': 'HK',
  Taiwan: 'TW',
  Macau: 'MO',

  // Middle East
  Israel: 'IL',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  UAE: 'AE',
  Qatar: 'QA',
  Kuwait: 'KW',
  Bahrain: 'BH',
  Oman: 'OM',
  Jordan: 'JO',
  Lebanon: 'LB',
  Turkey: 'TR',
  Iran: 'IR',
  Iraq: 'IQ',
  Syria: 'SY',
  Yemen: 'YE',

  // Africa
  'South Africa': 'ZA',
  Egypt: 'EG',
  Nigeria: 'NG',
  Kenya: 'KE',
  Ghana: 'GH',
  Morocco: 'MA',
  Algeria: 'DZ',
  Tunisia: 'TN',
  Ethiopia: 'ET',
  Uganda: 'UG',
  Tanzania: 'TZ',
  Zimbabwe: 'ZW',
  Zambia: 'ZM',
  Botswana: 'BW',
  Namibia: 'NA',
  Mauritius: 'MU',
  Senegal: 'SN',
  'Ivory Coast': 'CI',
  Cameroon: 'CM',
  Angola: 'AO',
  Mozambique: 'MZ',

  // Oceania
  'New Zealand': 'NZ',
  Fiji: 'FJ',
  'Papua New Guinea': 'PG',
  Samoa: 'WS',
  Tonga: 'TO',
  Vanuatu: 'VU',

  // Russia and neighbors
  Russia: 'RU',
  'Russian Federation': 'RU',
  Ukraine: 'UA',
  Belarus: 'BY',
  Kazakhstan: 'KZ',
  Georgia: 'GE',
  Armenia: 'AM',
  Azerbaijan: 'AZ',
  Uzbekistan: 'UZ',
  Turkmenistan: 'TM',
  Tajikistan: 'TJ',
  Kyrgyzstan: 'KG',
  Moldova: 'MD',
  Mongolia: 'MN',
};

/**
 * Convert country name to ISO 3166-1 alpha-2 code
 * @param countryName - Full country name (e.g., "United States", "France")
 * @returns ISO 2-letter code (e.g., "US", "FR") or the original value if not found
 */
export function convertCountryNameToISO2(countryName: string): string {
  if (!countryName) return '';

  // If already a 2-letter code, return as-is
  if (countryName.length === 2 && countryName === countryName.toUpperCase()) {
    return countryName;
  }

  // Try exact match
  const iso2 = COUNTRY_NAME_TO_ISO2[countryName];
  if (iso2) return iso2;

  // Try case-insensitive match
  const lowerName = countryName.toLowerCase();
  const entry = Object.entries(COUNTRY_NAME_TO_ISO2).find(
    ([name]) => name.toLowerCase() === lowerName
  );
  if (entry) return entry[1];

  // Return original value if not found (Gelato API will return a specific error)
  return countryName;
}

/**
 * Validate if a string is a valid ISO 3166-1 alpha-2 code
 * @param code - String to validate
 * @returns true if valid ISO 2-letter code
 */
export function isValidISO2Code(code: string): boolean {
  if (!code || code.length !== 2) return false;
  const validCodes = Object.values(COUNTRY_NAME_TO_ISO2);
  return validCodes.includes(code.toUpperCase());
}

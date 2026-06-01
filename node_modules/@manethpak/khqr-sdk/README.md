# KHQR SDK

TypeScript SDK for generating, decoding, and validating KHQR (Cambodia's Bakong QR payment codes) following the EMV QR Code specification.

[Live demo](https://khqr-sdk.vercel.app/)

> **⚠️ Note:** This is a **community-maintained** SDK and is **not officially endorsed or supported** by Bakong or the National Bank of Cambodia. Use at your own discretion.

![preview](/example/public/preview.png)

## Features

- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🔒 **EMV Compliant**: Follows EMV QR Code specification standards
- 🏦 **Bakong API Integration**: Ready-to-use Bakong API client with Zod validation
- ✅ **QR Generation**: Generate static and dynamic KHQR codes
- 🔍 **QR Validation**: Decode and verify KHQR strings with CRC integrity checks
- 📦 **Support**: ESM and CommonJS exports

## Installation

```bash
npm install @manethpak/khqr-sdk
```

```bash
yarn add @manethpak/khqr-sdk
```

```bash
pnpm add @manethpak/khqr-sdk
```

## Quick Start

### QR Code Generation

```typescript
import { createKHQR } from '@manethpak/khqr-sdk'

// Initialize the SDK
const khqr = createKHQR({
  baseURL: 'https://api-bakong.nbc.gov.kh',
  auth: {
    type: 'Bearer',
    token: 'your_bakong_api_token',
  },
})

// Generate a static QR code (no amount)
const staticQR = khqr.qr.generateKHQR({
  bakongAccountID: 'user@bank',
  merchantName: 'Coffee Shop',
  merchantCity: 'Phnom Penh',
  currency: 'KHR',
})

if (!staticQR.error) {
  console.log('QR Code:', staticQR.result?.qr)
  console.log('MD5 Hash:', staticQR.result?.md5)
}

// Generate a dynamic QR code (with amount)
const dynamicQR = khqr.qr.generateKHQR({
  bakongAccountID: 'merchant@aclb',
  merchantName: 'Coffee Shop',
  merchantCity: 'Phnom Penh',
  amount: 10000,
  currency: 'KHR',
})

if (!dynamicQR.error) {
  console.log('QR Code:', dynamicQR.result?.qr)
  console.log('MD5 Hash:', dynamicQR.result?.md5)
}
```

### QR Code Decoding

```typescript
const qrString = '00020101021229180...' // Your KHQR string

const decoded = khqr.qr.decodeKHQR(qrString)

if (!decoded.error) {
  console.log('Decoded Data:', decoded.result)
}
```

### QR Code Verification

```typescript
const verification = khqr.qr.verifyKHQRString(qrString)

if (!verification.error && verification.result?.isValid) {
  console.log('QR code is valid!')
  console.log('Expected CRC:', verification.result.expectedCRC)
  console.log('Actual CRC:', verification.result.actualCRC)
} else {
  console.error('Validation errors:', verification.result?.errors)
}
```

### Bakong API Integration

```typescript
// Check Bakong account
const { data, error } = await khqr.$fetch('/v1/check_bakong_account', {
  body: {
    accountId: 'user@bank',
  },
})

if (!error) {
  console.log('Account Info:', data)
}

// Check transaction by MD5
const transaction = await khqr.$fetch('/v1/check_transaction_by_md5', {
  body: {
    md5: staticQR.result?.md5,
  },
})

// Generate deeplink for mobile apps
const deeplink = await khqr.$fetch('/v1/generate_deeplink_by_qr', {
  body: {
    qr: staticQR.result?.qr,
    sourceInfo: {
      appIconUrl: 'https://example.com/icon.png',
      appName: 'My Payment App',
      appDeepLinkCallback: 'myapp://payment/callback',
    },
  },
})
```

## API Reference

### QR Generation

#### `generateKHQR(info: IndividualInfo | MerchantInfo): Result<QRResult>`

Generates a KHQR code with automatic type detection.

**Individual Account Example:**

```typescript
const info: IndividualInfo = {
  bakongAccountID: 'user@bank',
  merchantName: 'John Doe',
  merchantCity: 'Phnom Penh',
  currency: 'KHR',
  amount: 50000,
  billNumber?: 'INV-001',
  mobileNumber?: '+85512345678',
  storeLabel?: 'Main Store',
  terminalLabel?: 'POS-01',
  purposeOfTransaction?: 'Payment for goods',
  expirationTimestamp?: Date.now() + 3600000 // 1 hour from now
}
```

**Merchant Account Example:**

```typescript
const info: MerchantInfo = {
  bakongAccountID: 'merchant@bank',
  merchantID: 'MERCHANT123',
  merchantName: 'Big Store',
  merchantCity: 'Phnom Penh',
  acquiringBank: 'ACLB',
  currency: 'USD',
  amount: 25.99,
  merchantCategoryCode: '5411', // Grocery stores
}
```

**Return Type:**

```typescript
interface QRResult {
  qr: string // EMV-compliant QR string
  md5: string // MD5 hash for transaction tracking
}
```

#### `decodeKHQR(qrString: string): Result<DecodedKHQRData>`

Decodes a KHQR string into its constituent parts.

#### `verifyKHQRString(qrString: string): Result<VerifyStringResult>`

Verifies the structural validity and CRC integrity of a KHQR string.

### Currency Support

- **KHR (Khmer Riel)**: Must be whole numbers only
- **USD (US Dollar)**: Supports up to 2 decimal places

```typescript
// Valid KHR amounts
amount: 10000 // ✅
amount: 50000 // ✅

// Invalid KHR amounts
amount: 10000.5 // ❌ No decimals allowed

// Valid USD amounts
amount: 25.99 // ✅
amount: 100 // ✅

// Invalid USD amounts
amount: 25.999 // ❌ Max 2 decimals
```

### QR Code Types

The SDK automatically detects QR code types based on input:

**Static QR** (amount is 0 or undefined):

- Point of Initiation Method = "11"
- No amount field in QR code
- User scans and enters amount manually

**Dynamic QR** (amount > 0):

- Point of Initiation Method = "12"
- Fixed amount in QR code
- Optional expiration timestamp

**Individual vs Merchant**:

- Individual: Has `bakongAccountID` but no `merchantID`
- Merchant: Has both `bakongAccountID` and `merchantID`

## Subpath Exports

Import only what you need to reduce bundle size:

```typescript
// Main SDK
import { createKHQR } from '@manethpak/khqr-sdk'

// Constants only
import { EMV_TAGS, CURRENCY_CODES } from '@manethpak/khqr-sdk/constants'

// Helper utilities
import { validators, calculateCRC16 } from '@manethpak/khqr-sdk/helper'

// Type definitions
import type {
  IndividualInfo,
  MerchantInfo,
  QRResult,
} from '@manethpak/khqr-sdk/types'
```

## Error Handling

The SDK uses a `Result<T>` pattern instead of throwing exceptions:

```typescript
const result = khqr.qr.generateKHQR(info)

if (result.error) {
  // Handle KHQRError
  console.error('Error code:', result.error.code)
  console.error('Message:', result.error.message)
  console.error('Details:', result.error.details)
} else {
  // Use result.result
  const { qr, md5 } = result.result
}
```

### Error Codes

```typescript
{
  INVALID_QR: 'Invalid QR code format',
  INVALID_AMOUNT: 'Invalid amount for currency',
  INVALID_ACCOUNT: 'Invalid account information',
  REQUIRED_FIELD: 'Required field missing',
  INVALID_FORMAT: 'Invalid format',
  CRC_INVALID: 'CRC checksum is invalid'
}
```

## Advanced Usage

### Custom Validation

```typescript
import { validators } from '@manethpak/khqr-sdk/helper'

const validation = validators.validateIndividualInfo({
  bakongAccountID: 'user@bank',
  merchantName: 'Test',
  merchantCity: 'PP',
})

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

### CRC Calculation

```typescript
import { calculateCRC16 } from '@manethpak/khqr-sdk/helper'

const payload = '00020101021229180...'
const crc = calculateCRC16(payload + '6304')
console.log('CRC16:', crc) // e.g., "A1B2"
```

### Language Support

Add alternate language fields for bilingual QR codes:

```typescript
const qr = khqr.qr.generateKHQR({
  bakongAccountID: 'user@bank',
  merchantName: 'Coffee Shop',
  merchantCity: 'Phnom Penh',
  languagePreference: 'km',
  merchantNameAlternateLanguage: 'ហាងកាហ្វេ',
  merchantCityAlternateLanguage: 'ភ្នំពេញ',
})
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  IndividualInfo,
  MerchantInfo,
  QRResult,
  DecodedKHQRData,
  CurrencyType,
  Result,
} from '@manethpak/khqr-sdk/types'

// Strongly typed API responses
const response = await khqr.$fetch('/v1/check_bakong_account', {
  body: { accountId: 'user@bank' },
})
// response.data is fully typed based on the endpoint
```

## Examples

Check out the `/example` directory for a complete Hono.js server integration:

```bash
cd example
pnpm install
pnpm dev
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm coverage

# Lint code
pnpm lint:fix

# Format code
pnpm format
```

## Bakong API Endpoints

The SDK includes type-safe wrappers for all Bakong API endpoints:

- `/v1/renew_token` - Refresh authentication token
- `/v1/generate_deeplink_by_qr` - Generate mobile app deeplinks
- `/v1/check_transaction_by_md5` - Check transaction by MD5 hash
- `/v1/check_transaction_by_hash` - Check transaction by hash
- `/v1/check_transaction_by_short_hash` - Check transaction by short hash
- `/v1/check_bakong_account` - Verify Bakong account existence

## Requirements

- Node.js >= 20
- TypeScript >= 5.0 (for TypeScript users)

## License

ISC © [Manethpak](https://github.com/manethpak)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Links

- [Bakong Official Documentation](https://bakong.nbc.gov.kh)
- [EMV QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [GitHub Repository](https://github.com/manethpak/khqr-sdk)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/manethpak/khqr-sdk/issues) on GitHub.

---

Made with ❤️ for the Cambodian fintech community

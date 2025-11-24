# Dust Sweeper - Technical Documentation

## Overview

Dust Sweeper is a Next.js-based web application designed to help cryptocurrency users identify and manage "dust" tokens—small token balances across multiple blockchain networks that are often uneconomical to transact with individually. The application aggregates token balances from multiple networks, calculates their USD values, and provides gas cost estimates for potential consolidation transactions.

## Architecture

### Technology Stack

- **Framework**: Next.js 13.4.16 (App Router)
- **UI Library**: React 18.2.0
- **Component Library**: Material-UI Joy (@mui/joy 5.0.0-beta.2)
- **Styling**: Tailwind CSS 3.3.3
- **Blockchain Integration**: 
  - Alchemy SDK for multi-chain data retrieval
  - ethers.js for MetaMask wallet integration
- **External APIs**:
  - CoinGecko API for cryptocurrency price data
  - GweiStation API for gas price estimation

### System Architecture

```
┌─────────────────┐
│   Client (Web)  │
│  Next.js App    │
└────────┬────────┘
         │
         ├─── MetaMask Wallet Connection
         │    (ethers.js BrowserProvider)
         │
         ├─── API Routes (Next.js)
         │    └─── /api/tokens
         │
         └─── External Services
              ├─── Alchemy SDK (Multi-chain)
              │    ├─── Ethereum Mainnet
              │    ├─── Ethereum Goerli
              │    ├─── Ethereum Sepolia
              │    ├─── Polygon Mainnet
              │    └─── Polygon Mumbai
              │
              ├─── CoinGecko API
              │    └─── Price Data
              │
              └─── GweiStation API
                   └─── Gas Estimates
```

## Core Components

### Frontend Components

#### 1. Main Page (`src/app/(root)/page.js`)
- **Purpose**: Primary user interface for wallet connection and dust token search
- **Key Features**:
  - MetaMask wallet integration via ethers.js
  - Wallet address input (manual or auto-filled from MetaMask)
  - Configurable USD threshold for dust filtering
  - Token search trigger

#### 2. Token Table Component (`src/components/table.js`)
- **Purpose**: Displays token balances with interactive filtering
- **Key Features**:
  - Click-to-exclude tokens from total calculation
  - Real-time USD value aggregation
  - Gas cost estimation based on transaction speed
  - Network-specific gas calculations (Ethereum vs Polygon)

### Backend API

#### API Route: `/api/tokens` (`src/app/api/tokens/route.js`)
- **Method**: GET
- **Parameters**:
  - `address` (required): Ethereum wallet address
  - `dust` (optional): Minimum USD value threshold (default: 0)
- **Response Structure**:
```json
{
  "tokenData": [
    {
      "tokenMetadata": {
        "name": "Token Name",
        "symbol": "SYMBOL",
        "decimals": 18,
        "logo": "url"
      },
      "balance": "123.45",
      "network": "eth_mainnet",
      "USDValue": "123.45"
    }
  ],
  "price_info": {
    "ethereum": { "usd": 1841.58 }
  },
  "gas": {
    "data": {
      "eth": { "gas": { "slow": 20, "average": 30, "fast": 40, "instant": 50 } },
      "polygon": { "gas": { "slow": 30, "average": 40, "fast": 50, "instant": 60 } }
    }
  }
}
```

### Core Logic (`src/app/api/tokens/logics.js`)

#### Multi-Chain Token Aggregation
The application maintains a connection pool to multiple blockchain networks via Alchemy SDK:

```javascript
const networks = ['eth_sepolia', 'eth_goerli', 'eth_mainnet', 'matic', 'matic_mumbai']
```

**Key Functions**:

1. **`getWalletInfo(address, dust)`**
   - Fetches native token balances for each network
   - Retrieves ERC-20 token balances via Alchemy's `getTokenBalances()`
   - Filters tokens based on dust threshold
   - Fetches token metadata (name, symbol, decimals, logo)
   - Converts hex Wei values to human-readable decimals
   - Aggregates price data from CoinGecko

2. **`fetchCryptoPrice(tokenData, currency)`**
   - Extracts token symbols from token metadata
   - Batches price requests to CoinGecko API
   - Handles API failures with fallback price data
   - Returns price data keyed by token symbol

3. **`fetchGas()`**
   - Retrieves current gas price estimates from GweiStation API
   - Returns network-specific gas prices for different transaction speeds

4. **`hexWeiToFloatEth(hexWei)`**
   - Converts hexadecimal Wei values to floating-point Ethereum
   - Handles conversion errors gracefully

## Data Flow

### Token Discovery Flow

1. **User Input**: User provides wallet address and dust threshold
2. **Parallel Network Queries**: Application queries all configured networks simultaneously using `Promise.all()`
3. **Token Balance Retrieval**: For each network:
   - Fetch native token balance
   - Fetch ERC-20 token balances
   - Filter tokens with balance > 0
   - Apply dust threshold filter
4. **Metadata Enrichment**: Fetch token metadata for each token
5. **Price Lookup**: Batch request to CoinGecko for all unique token symbols
6. **USD Value Calculation**: Multiply token balance by USD price
7. **Gas Estimation**: Fetch current gas prices for transaction cost estimation
8. **Response Assembly**: Combine all data into unified response

### Gas Cost Calculation

The application estimates gas costs for potential token consolidation transactions:

```javascript
const UniSwapGasLimit = 184523; // Standard gas limit for Uniswap swaps
const ethMultiplier = eth_speed * UniSwapGasLimit;
const polygonMultiplier = poly_speed * UniSwapGasLimit;
```

Gas costs are calculated per network and aggregated based on selected transaction speed (slow, average, fast, instant).

## Performance Optimizations

1. **Parallel Network Queries**: All blockchain network queries execute concurrently using `Promise.all()`
2. **Connection Pooling**: Alchemy SDK connections are pre-initialized and reused
3. **Batch Price Requests**: Token prices are fetched in a single API call to CoinGecko
4. **Client-Side Filtering**: Token exclusion from totals happens client-side without API calls

## Security Considerations

### Current Implementation
- API keys are hardcoded in the source code (⚠️ **Security Risk**)
- No authentication or rate limiting on API endpoints
- Wallet connection uses standard MetaMask integration

### Recommended Improvements
1. **Environment Variables**: Move all API keys to environment variables
2. **API Key Rotation**: Implement secure key management
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Input Validation**: Enhanced address validation and sanitization
5. **Error Handling**: More comprehensive error handling and user feedback

## Configuration

### Supported Networks

| Network | Alchemy Network | CoinGecko ID | Status |
|---------|----------------|--------------|--------|
| Ethereum Mainnet | `ETH_MAINNET` | `ethereum` | ✅ Active |
| Ethereum Goerli | `ETH_GOERLI` | `goerli-eth` | ✅ Active |
| Ethereum Sepolia | `ARB_MAINNET`* | N/A | ⚠️ Config Issue |
| Polygon Mainnet | `MATIC_MAINNET` | `matic-network` | ✅ Active |
| Polygon Mumbai | `OPT_MAINNET`* | N/A | ⚠️ Config Issue |

*Note: Network configurations for Sepolia and Mumbai appear to have incorrect network mappings in the current implementation.

### Environment Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Known Issues & Limitations

1. **Network Configuration**: Some networks have incorrect Alchemy network mappings
2. **Error Handling**: Limited error handling for API failures
3. **Price Data**: Fallback prices are hardcoded; no retry mechanism
4. **Gas Estimation**: Uses fixed gas limit (184523) which may not be accurate for all token types
5. **Token Filtering**: Only filters by USD value; doesn't account for gas costs in filtering logic

## Future Enhancements

### Planned Features
1. **Transaction Execution**: Direct integration with DEX aggregators for token swapping
2. **Historical Analysis**: Track dust accumulation over time
3. **Multi-Wallet Support**: Manage multiple wallets simultaneously
4. **Custom Network Support**: Allow users to add custom networks
5. **Advanced Filtering**: Filter by network, token type, or custom criteria
6. **Export Functionality**: Export token data to CSV/JSON
7. **Gas Optimization**: Suggest optimal transaction batching strategies

### Technical Improvements
1. **Caching Layer**: Implement Redis for price and balance caching
2. **WebSocket Integration**: Real-time balance updates
3. **GraphQL API**: More flexible data querying
4. **TypeScript Migration**: Add type safety across the codebase
5. **Testing Suite**: Unit and integration tests
6. **Monitoring**: Add error tracking and performance monitoring

## API Rate Limits & Costs

### Alchemy SDK
- Free tier: 300M compute units/month
- Token balance queries: ~1-2 compute units per call
- Token metadata queries: ~1 compute unit per call

### CoinGecko API
- Free tier: 10-50 calls/minute
- Current implementation: 1 call per search (batched)

### GweiStation API
- No documented rate limits
- 1 call per search

## Development Guidelines

### Code Style
- Uses ESLint with Next.js configuration
- Follows React functional component patterns
- Uses Material-UI Joy for consistent UI components

### File Structure
```
dust.sweeper/
├── src/
│   ├── app/
│   │   ├── (root)/
│   │   │   └── page.js          # Main application page
│   │   ├── api/
│   │   │   └── tokens/
│   │   │       ├── route.js     # API endpoint handler
│   │   │       └── logics.js    # Core business logic
│   │   ├── layout.js            # Root layout
│   │   └── globals.css          # Global styles
│   └── components/
│       └── table.js              # Token table component
├── public/                       # Static assets
├── package.json
├── next.config.js
└── tailwind.config.js
```

## Contributing

When contributing to this project:

1. Follow the existing code style and patterns
2. Add error handling for new features
3. Update this documentation for significant changes
4. Test across all supported networks
5. Consider performance implications of new features


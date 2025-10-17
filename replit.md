# TRON TRC-20 Token Management Tool

A full-stack web application for managing TRC-20 tokens on the TRON blockchain, with support for both testnet (Shasta) and mainnet networks.

## Project Overview

This tool provides a comprehensive interface for TRON token development and management, including:
- Wallet creation and import
- Network switching (Testnet/Mainnet)
- Token deployment
- Token operations (transfer, mint, burn)
- Transaction history tracking
- Real-time balance monitoring

## Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Wouter** for routing
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **Dark mode** support

### Backend
- **Express.js** with TypeScript
- **TronWeb** for blockchain interactions
- **In-memory storage** for development
- **Zod** for request validation

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Theme)
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and config
│   │   └── App.tsx        # Main app component
├── server/
│   ├── contracts/         # Solidity smart contracts
│   ├── routes.ts          # API endpoints
│   ├── tronService.ts     # TronWeb integration
│   └── storage.ts         # Data persistence
└── shared/
    └── schema.ts          # Shared types and validation
```

## Features Implemented

### ✅ Core Functionality
- **Wallet Management**
  - **TronLink Wallet Connection** (Browser extension)
  - Create new wallet
  - Import existing wallet (private key)
  - Display wallet address and TRX balance
  - Disconnect wallet
  - Real-time balance monitoring

- **Network Management**
  - Switch between Testnet (Shasta) and Mainnet
  - Confirmation dialog for mainnet operations
  - Network-specific data persistence

- **Token Deployment (Production-Ready)**
  - **Simplified TRC-20 Contract** (Solidity ^0.5.10)
  - Standard TRC-20 parameters (name, symbol, decimals, supply)
  - Real-time blockchain fee estimation
  - Balance verification before deployment
  - Deployment to testnet or mainnet
  - Transaction confirmation and tracking

- **User Interface**
  - Beautiful dark-themed blockchain UI
  - Responsive design for all screen sizes
  - Sidebar navigation with Shadcn components
  - Real-time status indicators
  - Loading and error states
  - Transaction history table

- **Data Management**
  - Token list with contract details and metadata
  - Transaction tracking
  - Network-specific storage
  - Balance queries

### ✅ Blockchain Integration Status

**Fully Working:**
- ✅ **TronLink Wallet Integration** - Connect browser wallet with one click
- ✅ **Wallet creation and import** using TronWeb
- ✅ **Network configuration** and switching (testnet/mainnet)
- ✅ **TRX balance queries** with auto-refresh
- ✅ **Token deployment infrastructure** with fee estimation
- ✅ **Simplified TRC-20 Contract** (pragma ^0.5.10, production-ready)
- ✅ **Complete UI/UX** for all token operations

**Deployment Ready (Requires Bytecode Compilation):**

The app is **fully configured** to deploy real tokens on testnet/mainnet. You only need to:

1. **Compile the Solidity contract** using TronIDE or Remix (see DEPLOYMENT_GUIDE.md)
2. **Update bytecode** in `server/tronService.ts` → `getContractBytecode()` method
3. **Deploy tokens** to testnet or mainnet

📚 **See DEPLOYMENT_GUIDE.md** for complete step-by-step instructions

### 🔗 Wallet Connection Methods

1. **TronLink Wallet (Recommended)**
   - Browser extension integration
   - Secure key management
   - One-click connection
   - Automatic network detection

2. **Create New Wallet**
   - Generate new TRON wallet
   - Receive private key (save securely!)

3. **Import Existing Wallet**
   - Import via private key
   - Use existing TRON address

## Design Guidelines

The application follows a dark blockchain theme with:
- **Primary Color**: TRON Red (#E51A31) 
- **Typography**: Inter for UI, JetBrains Mono for addresses/hashes
- **Components**: Shadcn UI with consistent spacing and elevation
- **Interactions**: Subtle hover/active states with elevation system
- **Network Indicators**: Color-coded badges (red for mainnet, amber for testnet)

See `design_guidelines.md` for complete design specifications.

## Environment Setup

### Networks
- **Testnet**: Shasta (https://api.shasta.trongrid.io)
- **Mainnet**: TRON (https://api.trongrid.io)

### Configuration
The application uses in-memory storage by default. Network and wallet state persist during the session but reset on server restart.

## API Endpoints

### Wallet
- `GET /api/wallet` - Get current wallet
- `POST /api/wallet/create` - Create new wallet
- `POST /api/wallet/import` - Import wallet from private key
- `POST /api/wallet/disconnect` - Disconnect wallet
- `GET /api/wallet/balance` - Get TRX balance

### Network
- `GET /api/network` - Get current network
- `POST /api/network/switch` - Switch network

### Tokens
- `GET /api/tokens` - List deployed tokens
- `POST /api/tokens/deploy` - Deploy new token
- `POST /api/tokens/transfer` - Transfer tokens
- `POST /api/tokens/mint` - Mint tokens
- `POST /api/tokens/burn` - Burn tokens

### Transactions
- `GET /api/transactions` - Get transaction history

## Security Considerations

- Private keys are stored in server memory only during session
- Never sent to frontend (only address is transmitted)
- Mainnet operations require explicit confirmation
- Input validation on all endpoints using Zod schemas
- Network separation to prevent accidental mainnet operations

## Development

The application runs on port 5000 with hot-reload enabled:
- Frontend: Vite dev server
- Backend: Express with tsx watch mode

## Future Enhancements

Potential additions for production:
- PostgreSQL database integration
- Smart contract compilation pipeline
- Multi-signature wallet support
- Token analytics dashboard
- Batch operations
- Contract verification
- Gas optimization tools
- TronGrid API key management

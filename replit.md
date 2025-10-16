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
  - Create new wallet
  - Import existing wallet (private key)
  - Display wallet address and TRX balance
  - Disconnect wallet

- **Network Management**
  - Switch between Testnet (Shasta) and Mainnet
  - Confirmation dialog for mainnet operations
  - Network-specific data persistence

- **Enhanced Token Deployment**
  - **Token Metadata Support** (NEW!)
    - Logo URL (direct link or IPFS)
    - Website URL
    - Project description
  - Standard TRC-20 parameters (name, symbol, decimals, supply)
  - Real-time form preview
  - Blockchain fee estimation
  - Metadata stored on-chain in smart contract

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

### ⚠️ Blockchain Integration Notes

The application includes the infrastructure for full blockchain operations:

**Working:**
- Wallet creation and import using TronWeb
- Network configuration and switching
- TRX balance queries
- UI/UX for all token operations

**Requires Additional Setup:**
- **Contract Deployment**: Actual smart contract deployment requires proper Solidity compilation infrastructure (solc compiler) and complete contract bytecode
- **Token Operations**: Mint/burn/transfer operations are implemented but require deployed contracts to function on the blockchain
- **Transaction Broadcasting**: The TronWeb service is configured but actual blockchain transactions would need proper gas estimation and signing

For production deployment of smart contracts, you would need to:
1. Set up Solidity compiler (solc) in the environment
2. Compile the TRC-20 contract to get complete bytecode
3. Or use pre-compiled bytecode from TronIDE or similar tools
4. Configure TronGrid API keys for better rate limits

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

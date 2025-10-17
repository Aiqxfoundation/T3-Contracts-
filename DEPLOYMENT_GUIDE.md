# 🚀 TRON Token Deployment Guide

Complete guide for deploying real TRC-20 tokens on TRON testnet and mainnet.

## ⚠️ IMPORTANT: Bytecode Compilation Required

The app is configured to deploy tokens using the simplified TRC-20 contract, but you **MUST compile the Solidity contract** to get the correct bytecode before deployment will work on testnet/mainnet.

### Current Status

✅ **Working:**
- TronLink wallet connection
- Simplified TRC-20 contract (pragma ^0.5.10)
- Network switching (testnet/mainnet)
- Wallet creation and import
- TRX balance queries
- Complete UI for token deployment

❌ **Needs Setup:**
- Contract bytecode compilation (required for actual blockchain deployment)

## 📋 Step-by-Step Deployment Setup

### 1. Compile the Smart Contract

You have **3 options** to compile the TRC-20 contract:

#### Option A: TronIDE (Recommended for TRON)

1. Visit [https://www.tronide.io/](https://www.tronide.io/)
2. Create a new file and paste the contract from `server/contracts/TRC20Token.sol`
3. Select compiler version: **0.5.10**
4. Click "Compile"
5. Copy the **bytecode** from the compilation result (without `0x` prefix)
6. Update `server/tronService.ts` → `getContractBytecode()` method with the new bytecode

#### Option B: Remix IDE

1. Visit [https://remix.ethereum.org/](https://remix.ethereum.org/)
2. Create new Solidity file with contract code
3. Select Solidity compiler: **0.5.10**
4. Compile and copy bytecode
5. Update `server/tronService.ts` → `getContractBytecode()` method

#### Option C: Local Solidity Compiler

If you have solc installed locally:

```bash
solc --bin --optimize server/contracts/TRC20Token.sol
```

Copy the output bytecode and update `server/tronService.ts` → `getContractBytecode()` method.

### 2. Update the Bytecode

Open `server/tronService.ts` and find the `getContractBytecode()` method (around line 540):

```typescript
private getContractBytecode(): string {
  return "YOUR_COMPILED_BYTECODE_HERE"; // Replace with actual bytecode (no 0x prefix)
}
```

Replace the placeholder with your compiled bytecode.

### 3. Restart the Application

After updating the bytecode:

```bash
npm run dev
```

The workflow will automatically restart.

## 🔗 Wallet Connection Options

### Option 1: TronLink / TronLink Pro Wallet (Recommended)

1. **Install TronLink:**
   - **Desktop:** Download browser extension from [https://www.tronlink.org/](https://www.tronlink.org/)
     - Available for Chrome, Firefox, Edge
   - **Mobile:** Download TronLink Pro app from App Store or Google Play
     - iOS: [TronLink Pro on App Store](https://apps.apple.com/app/tronlink-pro/id1453530188)
     - Android: [TronLink Pro on Google Play](https://play.google.com/store/apps/details?id=com.tronlinkpro.wallet)

2. **Connect TronLink:**
   - **Desktop:** Click "Connect TronLink" button in the app
   - **Mobile (TronLink Pro):** 
     - Open TronLink Pro app
     - Navigate to the app URL in the built-in browser
     - Click "Connect TronLink Pro" button
   - Approve connection in your wallet
   - Your wallet address will be connected automatically

3. **Switch Network:**
   - Use TronLink/TronLink Pro to switch between testnet (Shasta) and mainnet
   - The app will detect the network automatically
   - **Note:** Make sure the wallet network matches the app network for smooth operation

### Option 2: Create New Wallet

- Click "Create New Wallet"
- Save your private key securely (shown once!)
- Wallet will be created on the current network

### Option 3: Import Existing Wallet

- Click "Import Wallet"
- Enter your 64-character private key
- Wallet will be imported

## 🌐 Network Setup

### Testnet (Shasta)

1. **Get Test TRX:**
   - Visit [https://shasta.tronex.io](https://shasta.tronex.io)
   - Enter your wallet address
   - Request test TRX (free)

2. **Deploy Token:**
   - Fill in token details (name, symbol, decimals, initial supply)
   - Click "Deploy Token"
   - Confirm the transaction

### Mainnet (Production)

1. **Fund Wallet:**
   - Purchase TRX from exchanges
   - Send to your wallet address
   - Ensure sufficient balance for gas fees (~50-100 TRX recommended)

2. **Switch to Mainnet:**
   - Use network selector
   - Confirm mainnet switch
   - Double-check you're on mainnet before deployment

3. **Deploy Token:**
   - Fill in token details carefully (cannot be changed after deployment)
   - Review estimated fees
   - Confirm deployment

## 💰 Gas & Fees

### Deployment Costs

- **Testnet:** Free (using test TRX)
- **Mainnet:** ~20-50 TRX typically
  - Contract deployment: ~10-30 TRX
  - Energy costs: ~10-20 TRX
  - Bandwidth: ~1-5 TRX

### Fee Estimation

The app provides real-time fee estimates before deployment:

1. Fill in token details
2. Click "Deploy Token"
3. Review the confirmation dialog with:
   - Estimated TRX cost
   - Estimated USD cost
   - Your current balance

## 🔒 Security Best Practices

### For TronLink / TronLink Pro Users

✅ **Safe:**
- TronLink/TronLink Pro manages your private key
- Keys never leave your wallet (browser extension or mobile app)
- App cannot access your private key
- All transactions require your approval

⚠️ **Remember:**
- Always verify transaction details before approving
- Double-check network (testnet vs mainnet)
- Never share your seed phrase or private key
- For mobile users: Use the TronLink Pro built-in browser for best compatibility

### For Manual Wallet Users

⚠️ **CRITICAL:**
- Private keys are stored in server memory (in-memory storage)
- Keys are cleared when server restarts
- **NEVER use production private keys in development mode**

✅ **Best Practice:**
- Use separate wallets for testing
- Export/backup your private key before disconnecting
- Use TronLink for mainnet operations

## 🧪 Testing Your Deployment

### Testnet Testing Workflow

1. **Create/Import Wallet**
2. **Get Test TRX** from faucet
3. **Deploy Token** with test parameters
4. **Verify on TronScan:**
   - Visit [https://shasta.tronscan.org](https://shasta.tronscan.org)
   - Search for your token contract address
   - Verify token details

5. **Test Operations:**
   - Transfer tokens
   - Check balances
   - Review transaction history

### Mainnet Deployment Checklist

- [ ] Contract bytecode is compiled and updated
- [ ] Tested successfully on testnet
- [ ] Wallet has sufficient TRX balance
- [ ] Token details are finalized (name, symbol, decimals, supply)
- [ ] Double-checked network is set to mainnet
- [ ] Reviewed estimated deployment fees
- [ ] Confirmed transaction details

## 📝 Contract Details

### Simplified TRC-20 Contract

**Location:** `server/contracts/TRC20Token.sol`

**Features:**
- Standard TRC-20 implementation
- Solidity version: ^0.5.10
- Constructor parameters:
  - `_name`: Token name
  - `_symbol`: Token symbol  
  - `_decimals`: Token decimals (usually 6 or 18)
  - `_initialSupply`: Initial token supply

**Functions:**
- `transfer`: Transfer tokens
- `approve`: Approve spending
- `transferFrom`: Transfer from approved address
- `balanceOf`: Check token balance
- `allowance`: Check approved amount

## 🐛 Troubleshooting

### "Failed to deploy token" Error

**Cause:** Bytecode not compiled or incorrect

**Solution:**
1. Follow compilation steps above
2. Ensure bytecode is correctly updated in `tronService.ts`
3. Restart the application

### "TronLink not found" Error

**Solution:**
1. Install TronLink extension
2. Refresh the page
3. Click "Connect TronLink Wallet"

### "Insufficient Balance" Error

**Testnet:**
- Get test TRX from [https://shasta.tronex.io](https://shasta.tronex.io)

**Mainnet:**
- Add more TRX to your wallet
- Typical deployment needs 50-100 TRX

### Network Mismatch

**Solution:**
1. Check TronLink network matches app network
2. Use network selector to switch
3. Confirm network change

## 🔗 Useful Links

- **TronLink Wallet:** https://www.tronlink.org/
- **TronIDE (Compiler):** https://www.tronide.io/
- **Testnet Faucet:** https://shasta.tronex.io
- **Testnet Explorer:** https://shasta.tronscan.org
- **Mainnet Explorer:** https://tronscan.org
- **TRON Documentation:** https://developers.tron.network/

## ✅ Deployment Verification

After successful deployment:

1. **Contract Address:** Copy from deployment success message
2. **View on TronScan:**
   - Testnet: `https://shasta.tronscan.org/#/contract/YOUR_ADDRESS`
   - Mainnet: `https://tronscan.org/#/contract/YOUR_ADDRESS`

3. **Verify Token Info:**
   - Name, symbol, decimals match your input
   - Total supply is correct
   - Contract is verified on TronScan

## 🎯 Next Steps

Once your token is deployed:

1. **Manage Tokens:** Navigate to "Manage Tokens" page
2. **Transfer:** Send tokens to other addresses
3. **Track Transactions:** View all operations in "Transactions" page
4. **Add to Wallets:** Users can add your token to TronLink using the contract address

---

**Need Help?** Check the troubleshooting section or review the TronScan explorer for transaction details.

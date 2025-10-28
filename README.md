## 🚀 Flow Pilot: The Future of Autonomous DeFi Automation



A comprehensive DeFi platform built on the Flow blockchain, featuring yield farming, and AI-powered trading agents. Flow Pilot demonstrates the future of decentralized finance with automated transaction scheduling, composable agent strategies, and a beautiful modern UI.

---

## 🌐 Live Demo & Resources

- **Vercel Live Demo:** (https://flow-pilot-2gpx.vercel.app/)
- **YouTube Video Demo:** (https://youtu.be/qoouz4My9OI)
- **Social Media Post:** (https://x.com/al_kaif_/status/1983216313364320333?t=Gb7HtcowhYFWB7f6q3ceIg&s=19)
- **View all deployed contracts on Flow Testnet:** (https://testnet.flowscan.io/account/0x8b32c5ecee9fe36f)
- **Testnet Account Address:** `0x8b32c5ecee9fe36f`

---

## 🎯 Project Overview

Flow Pilot leverages Forte Actions Flow's revolutionary transaction scheduling—to enable true on-chain DeFi automation. Users mint AI trading agents as NFTs, deposit tokens into mock yield farms, and enable automated strategies that execute and adapt, without manual intervention.

## 📋 Table of Contents

- Features
- Tech Stack
- Prerequisites
- Project Structure
- Installation & Setup
- Running the Application
- Troubleshooting
- Contributing

## ✨ Features

- **Create AI Agent NFTs**: Design unique AI agents with custom personalities, skills, and attributes
- **NFT Marketplace**: Buy and sell Agent NFTs with other users
- **Personal Dashboard**: View and manage your NFT collection
- **Wallet Integration**: Connect with Flow wallet for secure transactions
- **Real-time Updates**: Live marketplace listings and transaction status

## 🛠 Tech Stack

### Frontend

- **Next.js**  - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **FCL (Flow Client Library)** - Flow blockchain integration

### Blockchain

- **Flow Blockchain** - Layer 1 blockchain
- **Cadence** - Smart contract language
- **Flow CLI** - Development tools

### Backend/Tools

- **Flow Emulator** - Local blockchain for development
- **Flow Dev Wallet** - Local wallet for testing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
    
    ```bash
    node --version  # Should be v18+
    
    ```
    
    Download from: https://nodejs.org/
    
2. **npm** or **yarn**
    
    ```bash
    npm --version  # Should be 9+
    
    ```
    
3. **Flow CLI**
    
    ```bash
    # Install Flow CLI
    sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
    
    # Verify installation
    flow version
    
    ```
    
4. **Git**
    
    ```bash
    git --version
    
    ```
    

## 📁 Project Structure

```
Pilot_FINAL/
├── frontend/               # Next.js application
│   ├── pages/             # Pages directory
│   │   ├── dashboard.tsx  # User dashboard
│   │   ├── leaderboards.tsx # Leaderboards page
│   │   ├── buy-sell.tsx   # Buy/Sell marketplace
│   │   ├── analytics.tsx  # Analytics page
│   │   └── app.tsx        # Main app component
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   └── flow/             # Flow configuration
│       └── config.ts     # FCL configuration
├── cadence/              # Smart contracts
│   ├── contracts/        # Contract files
│   │   └── AgentNFT.cdc  # Main NFT contract
│   ├── transactions/     # Transaction scripts
│   └── scripts/          # Query scripts
├── flow.json            # Flow project configuration
└── README.md           # This file

```

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Pilot_FINAL.git
cd Pilot_FINAL

```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install

```

### Step 3: Configure Flow Project

The `flow.json` file should already be configured.

### Step 4: Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
touch .env.local

```

Add the following variables:

```
NEXT_PUBLIC_FLOW_NETWORK=emulator
NEXT_PUBLIC_ACCESS_NODE=http://localhost:8888
NEXT_PUBLIC_WALLET_DISCOVERY=http://localhost:8701/fcl/authn
NEXT_PUBLIC_CONTRACT_ADDRESS=0xf8d6e0586b0a20c7

```

## 🏃 Running the Application

You need **3 terminal windows** running simultaneously. Follow these steps in order:

### Terminal 1: Start the Flow Emulator

```bash
# Navigate to project root
cd Pilot_FINAL

# Start the emulator
flow emulator

```

You should see:

```
INFO[0000] ⚙️   Using service account 0xf8d6e0586b0a20c7
INFO[0000] 📜  Flow contract debugger enabled
INFO[0000] 🌱  Starting emulator...
INFO[0000] ✅  Emulator started on port 3569

```

**⚠️ Keep this terminal running!** Do not close it.

---

### Terminal 2: Deploy Smart Contracts

Open a **new terminal window**:

```bash
# Navigate to project root (if not already there)
cd Pilot_FINAL

# Deploy contracts to emulator
flow project deploy

```

**First time deployment:** Use `flow project deploy`

**If updating contracts:** Use `flow project deploy --update`

You should see:

```
Deploying 1 contracts for accounts: emulator-account

AgentNFT -> 0xf8d6e0586b0a20c7

✅ All contracts deployed successfully

```

**Note:** This terminal can be closed after successful deployment, or keep it open for redeployment.

---

### Terminal 3: Start the Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Start the development server
npm run dev

```

You should see:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s

```

**⚠️ Keep this terminal running!** Do not close it.

---

### ✅ Access the Application

Open your browser and navigate to:

```
http://localhost:3000

```

**Summary - What Should Be Running:**

- ✅ Terminal 1: `flow emulator` (port 3569)
- ✅ Terminal 2: Closed or idle (deployment done)
- ✅ Terminal 3: `npm run dev` in frontend folder (port 3000)

## 🔗 Connect Your Wallet

1. Click **"Connect Wallet"** button in the application
2. Your wallet connection interface will appear
3. Follow the prompts to connect your Flow wallet
4. Approve the connection

## 💡 Using the Platform

### Available Pages

Navigate through the platform using these pages:

1. **Dashboard** (`/dashboard`)
    - View and manage your Agent NFT collection
    - See all your minted NFTs
    - Access NFT details and actions
2. **Buy/Sell** (`/buy-sell`)
    - Browse marketplace listings
    - Purchase Agent NFTs from other users
    - List your NFTs for sale
3. **Leaderboards** (`/leaderboards`)
    - View top collectors and traders
    - Track marketplace statistics
    - See trending Agent NFTs
4. **Analytics** (`/analytics`)
    - View market trends and data
    - Analyze NFT performance
    - Track your collection value

## 🐛 Troubleshooting

### Common Issues

### 1. "Cannot connect to Flow Emulator"

**Solution**:

- Ensure the emulator is running: `flow emulator start`
- Check if port 3569 is available
- Restart the emulator

### 2. "Contract not found"

**Solution**:

```bash
# Redeploy with update flag
flow project deploy --update

```

### 3. "Transaction failed: account not set up"

**Solution**: Initialize your account first by running the setup transaction

### 4. Frontend not loading

**Solution**:

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev

```

### 5. "Cannot find type in scope" errors

**Solution**: This is a smart contract issue. Check:

- Contract is properly deployed
- Public interfaces are correctly defined
- Script is using the correct paths

### Checking Emulator Status

```bash
# Check accounts
flow accounts get 0xf8d6e0586b0a20c7 --network=emulator

# Check deployed contracts
flow accounts get 0xf8d6e0586b0a20c7 --network=emulator | grep -A 5 "Contracts"

```

### Viewing Logs

**Emulator Logs**: Check the terminal where emulator is running

**Frontend Logs**: Check browser console (F12)

**Transaction Logs**: Visible in emulator terminal output

## 📝 Smart Contract Reference

### Main Contract: AgentNFT

**Location**: `cadence/contracts/AgentNFT.cdc`

**Key Resources**:

- `NFT`: Individual Agent NFT
- `Collection`: User's NFT collection
- `Minter`: Admin minting capability

**Public Functions**:

- `mintNFT()`: Create a new Agent NFT
- `borrowNFT()`: Get NFT reference
- `getIDs()`: List owned NFT IDs

### Transactions

**Location**: `cadence/transactions/`

- `setup_account.cdc`: Initialize user account
- `mint_nft.cdc`: Mint new Agent NFT
- `transfer_nft.cdc`: Transfer NFT to another account
- `list_for_sale.cdc`: List NFT on marketplace

### Scripts

**Location**: `cadence/scripts/`

- `get_nfts.cdc`: Get user's NFT IDs
- `get_nft_metadata.cdc`: Get specific NFT details
- `get_marketplace_listings.cdc`: Get all marketplace listings

## 🔄 Development Workflow

### Making Changes to Smart Contracts

1. Edit contract in `cadence/contracts/AgentNFT.cdc`
2. Redeploy:
    
    ```bash
    flow project deploy --network=emulator --update
    
    ```
    
3. Restart frontend if needed

### Adding New Features

1. Create new transaction or script in `cadence/`
2. Add corresponding function in `frontend/lib/flow/`
3. Integrate with UI components

## 🌐 Deploying to Testnet

### Step 1: Get Testnet Account

1. Create account at: https://testnet-faucet.onflow.org/
2. Save your address and private key

### Step 2: Update flow.json

### Step 3: Deploy

```bash
flow project deploy --network=testnet

```

### Step 4: Update Frontend Config

```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_TESTNET_ADDRESS

```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## *Built with ❤️ for the hackathon*

## 📞 Support

- **Documentation**: https://developers.flow.com/
- **Discord**: https://discord.gg/flow
- **GitHub Issues**: https://github.com/yourusername/Pilot_FINAL/issues

## 🙏 Acknowledgments

- Flow Blockchain Team
- Cadence Language Developers
- Next.js Team
- Open Source Community

---

**Happy Building! 🚀**

For questions or issues, please open a GitHub issue or reach out on Discord.

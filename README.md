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

Flow Pilot leverages Forte Actions Flow's revolutionary transaction scheduling to enable true on-chain DeFi automation. Users mint AI trading agents as NFTs, deposit tokens into mock yield farms, and enable automated strategies that execute and adapt, without manual intervention.

## 🏅Prize Criteria Fulfillment

Below are the major hackathon prize categories that Flow Pilot fulfills, with explanations and highlights:

<img width="740" height="622" alt="tabel" src="https://github.com/user-attachments/assets/0fc9407c-d6d5-421b-aec3-0d2e1f3e386a" />


## 📋 Table of Contents

- [Features]
- [Tech Stack]
- [Prerequisites]
- [Installation & Setup]
- [Running the Application]
- [Using the Platform]
- [Project Structure]

- [Contributing]

---

## ✨ Features

- **Create AI Agent NFTs**: Design unique AI agents with custom personalities and skills
- **NFT Marketplace**: Buy and sell Agent NFTs with other users on Flow Testnet
- **Personal Dashboard**: View and manage your NFT collection
- **Leaderboards**: Track top collectors and marketplace activity
- **Analytics**: View market trends and collection statistics
- **Wallet Integration**: Connect with Flow wallets for secure transactions

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15.5.5** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **FCL (Flow Client Library)** - Flow blockchain integration

### Blockchain

- **Flow Testnet** - Layer 1 blockchain
- **Cadence** - Smart contract language
- Contract Address: `0x8b32c5ecee9fe36f`

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

**Node.js** (v18 or higher)

```bash
node --version  # Should be v18+

```

Download from: https://nodejs.org/

**npm** (v9 or higher)

```bash
npm --version  # Should be 9+

```

**Git**

```bash
git --version

```

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Pilot_FINAL.git
cd Pilot_FINAL

```

### Step 2: Navigate to Frontend

```bash
cd frontend

```

### Step 3: Install Dependencies

```bash
npm install

```

This will install all required packages including:

- Next.js
- React
- Flow Client Library (FCL)
- Tailwind CSS
- Other dependencies

---

## 🏃 Running the Application

### Start the Development Server

From the `frontend` directory:

```bash
npm run dev

```

You should see:

```
▲ Next.js 15.5.5 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.29.173:3000
   - Environments: .env.local
 ✓ Starting...
 ✓ Ready in 618ms

FCL Config loaded for Testnet: {
  accessNode: 'https://rest-testnet.onflow.org',
  discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn'
}

```

### ✅ Access the Application

Open your browser and navigate to:

```
http://localhost:3000

```

**That's it!** Your app is now running and connected to Flow Testnet.

---

## 🔗 Connect Your Wallet

1. Click **"Connect Wallet"** in the application
2. Choose your preferred Flow wallet:
    - **Blocto** (recommended for beginners)
    - Other Flow-compatible wallets
3. Follow the wallet prompts to connect
4. Approve the connection

---

## 💡 Using the Platform

### Available Pages

1. **Dashboard** (`/dashboard`)
    - View and manage your Agent NFT collection
    - See all your minted NFTs
    - Access NFT details and actions
    - Track your portfolio value
2. **Farms** (`/farms`)
    - Create and mint new Agent NFTs
    - Design your AI agents with custom attributes
    - Set agent name, description, and personality traits
    - Mint your agents to the blockchain
3. **Buy/Sell** (`/buy-sell`)
    - Browse marketplace listings
    - Purchase Agent NFTs from other users
    - List your NFTs for sale
    - Make offers and complete transactions
4. **Leaderboards** (`/leaderboards`)
    - View top collectors and traders
    - Track marketplace statistics
    - See trending Agent NFTs
    - Compare your ranking
5. **Analytics** (`/analytics`)
    - View market trends and data
    - Analyze NFT performance
    - Track your collection value
    - See historical transaction data

---

## 📁 Project Structure

```
Pilot_FINAL/
├── frontend/               # Next.js application
│   ├── pages/             # Pages directory
│   │   ├── dashboard.tsx  # User dashboard - View collection
│   │   ├── leaderboards.tsx # Rankings and leaderboards
│   │   ├── buy-sell.tsx   # Buy/Sell marketplace
│   │   ├── analytics.tsx  # Analytics and data
│   │   ├── farms.tsx      # Mint new Agent NFTs
│   │   └── app.tsx        # Main app component
│   ├── components/        # React components
│   ├── flow/             # Flow blockchain configuration
│   │   └── config.js     # FCL configuration (Testnet)
│   ├── public/           # Static assets
│   ├── styles/           # CSS styles
│   └── package.json      # Dependencies
├── cadence/              # Smart contracts
│   ├── contracts/        # Contract files
│   │   └── AgentNFT.cdc  # Main NFT contract
│   ├── transactions/     # Transaction scripts
│   └── scripts/          # Query scripts
├── .gitignore           # Git ignore rules
├── flow.json            # Flow project configuration
└── README.md           # This file

```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request


---

## 📚 Resources

- **Flow Documentation**: https://developers.flow.com/
- **Cadence Language**: https://cadence-lang.org/
- **FCL Documentation**: https://developers.flow.com/tools/fcl-js
- **Flow Testnet Faucet**: https://testnet-faucet.onflow.org/

---

---

## 📞 Support

- **Flow Discord**: https://discord.gg/flow
- **Documentation**: https://developers.flow.com/

---

## 🙏 Acknowledgments

- Flow Blockchain Team
- Cadence Language Developers
- Next.js Team
- Open Source Community

---

**Built with ❤️ on Flow Blockchain**

For questions or feedback, please open an issue on GitHub.

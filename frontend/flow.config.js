import { config } from "@onflow/fcl";

// Use Flow Testnet for production
config({
  "accessNode.api": "https://rest-testnet.onflow.org", 
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", 
  "discovery.wallet.method": "IFRAME/RPC",
  "app.detail.title": "Flow Pilot",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "fcl.walletConnect.projectId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "fcl.walletConnect.enabled": false,
  "0xAgentNFT": "0x8b32c5ecee9fe36f",
  "0xMockFarm": "0x8b32c5ecee9fe36f",
  "0xMockFarm2": "0x8b32c5ecee9fe36f", 
  "0xMockFarm3": "0x8b32c5ecee9fe36f",
  "0xMockUSDC": "0x8b32c5ecee9fe36f",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xNonFungibleToken": "0x631e88ae7f1d7c20"
});

// Add debugging
console.log("FCL Config loaded for Testnet:", {
  accessNode: "https://rest-testnet.onflow.org",
  discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn"
});
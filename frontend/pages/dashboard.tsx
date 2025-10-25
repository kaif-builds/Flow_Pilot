import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import '../flow.config';
import Header from '../components/Header';
import Link from 'next/link';

// Define the type for the user object we care about.
type FlowUser = {
  loggedIn: boolean | null;
  addr?: string | null;
}

type AgentDetails = {
    id: string;
    type: string;
    strategy: string;
    description: string;
    emoji: string;
    status: string;
    cost?: number;
}

type FleetNFT = {
    id: string;
    name: string;
    rarity: string;
    successRate: number;
    totalAgents: number;
    totalMissions: number;
    efficiencyScore: number;
    totalProfit: number;
    growthRate: number;
    owner: string;
    createdAt: string;
    lastActivity: string;
    isForSale: boolean;
    isOwnedByUser: boolean;
    price: number;
    tags: string[];
    purchaseDate?: string;
    purchasePrice?: number;
}

const getUserBalanceScript = `
  import AgentNFT from 0x8b32c5ecee9fe36f
  access(all) fun main(address: Address): UFix64 {
      let account = getAccount(address)
      var balance: UFix64 = 1000.0
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          let agentIDs = collectionRef.getIDs()
          for agentID in agentIDs {
              let nftRef = collectionRef.borrowAgent(id: agentID)
              if nftRef.strategy.strategyType == "HighestAPY" {
                  balance = balance - 200.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly15P" {
                  balance = balance - 8.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
                  balance = balance - 100.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
                  balance = balance - 150.0
              } else {
                  balance = balance - 50.0
              }
          }
      }
      return balance
  }
`;

const getAgentsScript = `
  import AgentNFT from 0x8b32c5ecee9fe36f
  access(all) fun main(address: Address): [UInt64] {
      let account = getAccount(address)
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          return collectionRef.getIDs()
      } else {
          return []
      }
  }
`;

const getAgentDetailsScript = `
  import AgentNFT from 0x8b32c5ecee9fe36f
  access(all) fun main(address: Address, agentID: UInt64): {String: String} {
      let account = getAccount(address)
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          let nftRef = collectionRef.borrowAgent(id: agentID)
          var agentType: String = ""
          var strategyDescription: String = ""
          var agentEmoji: String = ""
          if nftRef.strategy.strategyType == "HighestAPY" {
              agentType = "Smart Agent"
              strategyDescription = "Automatically finds and moves to the farm with the highest APY"
              agentEmoji = "🧠"
          } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
              agentType = "Simple Agent (10% APY)"
              strategyDescription = "Auto-Compound only"
              agentEmoji = "🌱"
          } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
              agentType = "Premium Simple Agent (15% APY)"
              strategyDescription = "Auto-Compound and Split"
              agentEmoji = "💎"
          } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P" {
              agentType = "Simple Agent (5% APY)"
              strategyDescription = "Auto-Compound only"
              agentEmoji = "🛡️"
          } else if nftRef.strategy.strategyType == "AutoCompoundOnly15P" {
              agentType = "Simple Agent (5% APY)"
              strategyDescription = "Automatically compounds rewards in the current farm"
              agentEmoji = "🛡️"
          } else {
              agentType = "Simple Agent"
              strategyDescription = "Automatically compounds rewards in the current farm"
              agentEmoji = "🔄"
          }
          return {
              "id": agentID.toString(),
              "type": agentType,
              "strategy": nftRef.strategy.strategyType,
              "description": strategyDescription,
              "emoji": agentEmoji,
              "status": "Active"
          }
      } else {
          panic("Agent NFT not found")
      }
  }
`;

export default function DashboardPage() {
    const [user, setUser] = useState<FlowUser>({ loggedIn: null });
    const router = useRouter();
    const [agentIDs, setAgentIDs] = useState<number[] | null>(null);
    const [agentDetails, setAgentDetails] = useState<AgentDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [userBalance, setUserBalance] = useState<number>(1000.0);
    const [boughtFleets, setBoughtFleets] = useState<FleetNFT[]>([]);
    const [showFleetModal, setShowFleetModal] = useState(false);
    const [selectedFleet, setSelectedFleet] = useState<FleetNFT | null>(null);
    const [showSellFleetModal, setShowSellFleetModal] = useState(false);
    const [sellPrice, setSellPrice] = useState<number>(0);
    const [isFleetListed, setIsFleetListed] = useState(false);

    // Function to list agent for sale
    const listAgentForSale = () => {
        if (agentDetails.length === 0) return;
        
        // Create a marketplace listing for the agent fleet
        const listing = {
            id: `agent-fleet-${Date.now()}`,
            type: 'Agent Fleet',
            name: 'AI Agent Fleet',
            description: 'Complete AI agent fleet with automated DeFi strategies',
            price: sellPrice,
            seller: 'You',
            listedAt: new Date().toISOString(),
            agents: agentDetails.map(agent => ({
                id: agent.id,
                type: agent.type,
                strategy: agent.strategy,
                cost: agent.cost
            })),
            totalAgents: agentDetails.length,
            rarity: agentDetails.length >= 5 ? 'Epic' : agentDetails.length >= 3 ? 'Rare' : 'Common',
            tags: ['AI Agents', 'DeFi', 'Automation', 'Fleet'],
            image: '/api/placeholder/300/200'
        };
        
        // Get existing marketplace listings
        const existingListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
        
        // Add new listing
        existingListings.push(listing);
        
        // Save back to localStorage
        localStorage.setItem('marketplaceListings', JSON.stringify(existingListings));
        
        // Close modal and show success message
        setShowSellFleetModal(false);
        console.log(`✅ Agent Fleet listed for sale at $${sellPrice.toLocaleString()}! Check the marketplace to see your listing.`);
        
        // Dispatch custom event to refresh marketplace
        window.dispatchEvent(new CustomEvent('marketplaceUpdated', { detail: { newListing: listing } }));
        
        // Mark fleet as listed
        setIsFleetListed(true);
        
        // Keep agents on dashboard - they're still owned until someone buys them
    };

    // Function to check if fleet is listed
    const checkFleetListed = () => {
        const agentListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
        console.log('Checking marketplace listings:', agentListings);
        
        // Only check for listings that were created by listAgentForSale
        // These should have specific properties that distinguish them from bought fleets
        const isListed = agentListings.some((listing: any) => {
            const isAgentFleetListing = listing.seller === 'You' && 
                                      listing.type === 'Agent Fleet' && 
                                      listing.agents && 
                                      Array.isArray(listing.agents) &&
                                      listing.agents.length > 0;
            
            console.log('Listing check:', {
                seller: listing.seller,
                type: listing.type,
                hasAgents: !!listing.agents,
                agentsLength: listing.agents?.length,
                isAgentFleetListing
            });
            
            return isAgentFleetListing;
        });
        
        console.log('Fleet is listed:', isListed);
        setIsFleetListed(isListed);
    };

    // Function to clear incorrect marketplace listings
    const clearIncorrectListings = () => {
        const agentListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
        console.log('Current marketplace listings before cleanup:', agentListings);
        
        // Remove ALL listings with seller: 'You' that don't have proper agent fleet structure
        const correctListings = agentListings.filter((listing: any) => {
            // Keep listings that are NOT from 'You' (bought fleets from others)
            if (listing.seller !== 'You') {
                return true;
            }
            
            // For listings from 'You', only keep if they have proper agent fleet structure
            const hasProperStructure = listing.type === 'Agent Fleet' && 
                                     listing.agents && 
                                     Array.isArray(listing.agents) &&
                                     listing.agents.length > 0;
            
            console.log('Checking listing:', {
                seller: listing.seller,
                type: listing.type,
                hasAgents: !!listing.agents,
                agentsLength: listing.agents?.length,
                hasProperStructure,
                willKeep: listing.seller !== 'You' || hasProperStructure
            });
            
            return hasProperStructure;
        });
        
        if (correctListings.length !== agentListings.length) {
            console.log('Clearing incorrect listings:', agentListings.length - correctListings.length);
            localStorage.setItem('marketplaceListings', JSON.stringify(correctListings));
        } else {
            console.log('No incorrect listings found');
        }
    };
    
    // Dynamic profit tracking for realistic updates
    const [agentProfits, setAgentProfits] = useState<{[key: string]: number}>({});
    const [liveNotifications, setLiveNotifications] = useState<string[]>([]);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        console.log('🔄 Dashboard initializing...');
        
        // Start in demo mode for better UX
        console.log('🎭 Starting in demo mode');
        setIsDemoMode(true);
        setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
        setIsLoading(false);
    }, []);

    // Listen for wallet connection/disconnection events
    useEffect(() => {
        const handleWalletConnected = (event: CustomEvent) => {
            setUserBalance(event.detail.balance);
            setIsDemoMode(false); // Exit demo mode when real wallet connects
            localStorage.setItem('realWalletConnected', 'true');
            // Note: Bought fleets are not automatically restored on reconnect
            // This maintains the logout behavior where fleets are cleared
        };

        const handleWalletDisconnected = (event: CustomEvent) => {
            setUserBalance(event.detail.balance);
            setIsDemoMode(true); // Return to demo mode when wallet disconnects
            
            // Only clear data if we were actually connected to a real wallet
            const wasRealWalletConnected = localStorage.getItem('realWalletConnected') === 'true';
            
            if (wasRealWalletConnected) {
                console.log('🔌 Real wallet disconnected - clearing all data');
                // Clear bought fleets when real wallet is disconnected
                setBoughtFleets([]);
                localStorage.removeItem('boughtFleets');
                // Clear agent data when real wallet is disconnected
                setAgentIDs([]);
                setAgentDetails([]);
                // Clear wallet connection flag
                localStorage.removeItem('realWalletConnected');
            } else {
                console.log('🎭 Demo mode logout - keeping agents');
                // In demo mode, just clear bought fleets but keep agents
                setBoughtFleets([]);
                localStorage.removeItem('boughtFleets');
            }
        };

        const handleMarketplaceUpdate = () => {
            // Check if fleet is still listed when marketplace updates
            checkFleetListed();
        };

        window.addEventListener('walletConnected', handleWalletConnected as EventListener);
        window.addEventListener('walletDisconnected', handleWalletDisconnected as EventListener);
        window.addEventListener('marketplaceUpdated', handleMarketplaceUpdate as EventListener);

        return () => {
            window.removeEventListener('walletConnected', handleWalletConnected as EventListener);
            window.removeEventListener('walletDisconnected', handleWalletDisconnected as EventListener);
            window.removeEventListener('marketplaceUpdated', handleMarketplaceUpdate as EventListener);
        };
    }, []);

    // Load bought fleets from localStorage
    useEffect(() => {
        const loadBoughtFleets = () => {
            try {
                const storedFleets = localStorage.getItem('boughtFleets');
                if (storedFleets) {
                    const fleets = JSON.parse(storedFleets);
                    setBoughtFleets(fleets);
                } else {
                    setBoughtFleets([]);
                }
            } catch (error) {
                console.error('Error loading bought fleets:', error);
                setBoughtFleets([]);
            }
        };

        loadBoughtFleets();

        // Listen for storage changes (when fleets are bought from other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'boughtFleets') {
                loadBoughtFleets();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Handle fleet details modal
    const handleViewFleetDetails = (fleet: FleetNFT) => {
        setSelectedFleet(fleet);
        setShowFleetModal(true);
    };

    // Handle sell fleet modal
    const handleSellFleet = () => {
        if (agentDetails.length === 0) {
            // Show a message that they need to mint agents first
            console.log('⚠️ You need to mint agent NFTs from the farms first before you can sell them.');
            return;
        }
        
        // Calculate current portfolio value using the same logic as the portfolio display
        let currentPortfolioValue = 0;
        if (isDemoMode) {
            const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
            currentPortfolioValue = mintedAgents.reduce((sum: number, agent: any) => sum + (agent.cost * 1.3), 0);
        } else {
            agentDetails.forEach(agent => {
                let cost = 50;
                if (agent.strategy === "HighestAPY") cost = 200;
                else if (agent.strategy === "AutoCompoundOnly5P-Farm2") cost = 150;
                else if (agent.strategy === "AutoCompoundOnly5P-Farm1") cost = 100;
                else if (agent.strategy === "AutoCompoundOnly5P") cost = 50;
                else if (agent.strategy === "AutoCompoundOnly15P") cost = 8;
                currentPortfolioValue += cost * 1.3;
            });
        }
        
        // Set the recommended selling price (15% markup) as the default selling price
        setSellPrice(Math.round(currentPortfolioValue * 1.15));
        setShowSellFleetModal(true);
    };

    // Dynamic profit simulation for realistic agent performance
    useEffect(() => {
        const simulateAgentPerformance = () => {
            // Update agent profits with realistic variations
            setAgentProfits(prev => {
                const newProfits = { ...prev };
                
                // Generate realistic profit updates for each agent
                agentDetails.forEach(agent => {
                    const agentId = agent.id;
                    const currentProfit = newProfits[agentId] || 0;
                    
                    // Skip profit updates for paused agents
                    if (agent.status === 'Paused') {
                        newProfits[agentId] = currentProfit; // Keep current profit unchanged
                        return;
                    }
                    
                    // Different profit rates based on agent type
                    let profitRate = 0.5; // Base rate
                    if (agent.type === 'Smart Agent') {
                        profitRate = 1.2; // Higher rate for smart agents
                    } else if (agent.type.includes('15%')) {
                        profitRate = 0.8;
                    } else if (agent.type.includes('10%')) {
                        profitRate = 0.6;
                    }
                    
                    // Add random variation
                    const variation = (Math.random() - 0.5) * 0.4;
                    const newProfit = currentProfit + profitRate + variation;
                    
                    newProfits[agentId] = Math.max(0, newProfit);
                });
                
                return newProfits;
            });

            // Generate live notifications for agent activities
            if (agentDetails.length > 0 && Math.random() < 0.4) { // 40% chance
                const randomAgent = agentDetails[Math.floor(Math.random() * agentDetails.length)];
                const notificationTemplates = [
                    `Agent #${randomAgent.id}: Auto-compound executed (+$${(Math.random() * 20 + 5).toFixed(2)})`,
                    `Smart Agent #${randomAgent.id}: APY analysis completed (+$${(Math.random() * 30 + 10).toFixed(2)})`,
                    `Agent #${randomAgent.id}: Rewards claimed from farm (+$${(Math.random() * 15 + 3).toFixed(2)})`,
                    `Agent #${randomAgent.id}: Best APY farm selected (+$${(Math.random() * 25 + 8).toFixed(2)})`,
                    `Agent #${randomAgent.id}: Rewards deposited to optimal farm (+$${(Math.random() * 18 + 6).toFixed(2)})`
                ];
                
                const randomNotification = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
                setLiveNotifications(prev => [randomNotification, ...prev.slice(0, 3)]); // Keep last 4 notifications
            }
        };

        // Run simulation every 100 seconds (5x slower)
        const interval = setInterval(simulateAgentPerformance, 100000);
        
        // Run initial simulation
        if (agentDetails.length > 0) {
            simulateAgentPerformance();
        }

        return () => clearInterval(interval);
    }, [agentDetails]);

    // Cleanup effect - clear all data when component unmounts or user logs out
    useEffect(() => {
        return () => {
            // Clear all timeouts
            timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
            timeoutRefs.current = [];
        };
    }, []);

    useEffect(() => {
        console.log('🔄 Main data loading effect triggered');
        console.log('👤 User state:', { loggedIn: user.loggedIn, addr: user.addr });
        console.log('🎭 Demo mode:', isDemoMode);
        console.log('🔄 Router ready:', router.isReady);
        console.log('🔍 Debug: hasMintedAgents =', sessionStorage.getItem('hasMintedAgents'));
        console.log('🔍 Debug: demoMintedAgents =', sessionStorage.getItem('demoMintedAgents'));
        
        // If localStorage says real wallet connected but FCL shows no user, fallback to demo
        const localStorageSaysConnected = localStorage.getItem('realWalletConnected') === 'true';
        const fclShowsNoUser = user.loggedIn === null || user.loggedIn === false;
        
        if (localStorageSaysConnected && fclShowsNoUser) {
            console.log('🔄 Fallback: localStorage says connected but FCL shows no user - switching to demo mode');
            setIsDemoMode(true);
            setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
            localStorage.removeItem('realWalletConnected');
            setIsLoading(false);
            return;
        }
        
        // Only fetch data if user is connected
        if (user.loggedIn === true && user.addr) {
            console.log('📊 Starting to fetch agents...');
            setIsLoading(true);
            const fetchAgents = async () => {
                try {
                    if (isDemoMode) {
                        console.log('🎭 Fetching demo agents...');
                        const isNewSession = !sessionStorage.getItem('hasMintedAgents');
                        if (isNewSession) {
                            console.log('🆕 New session, no agents');
                            console.log('🔍 Debug: hasMintedAgents =', sessionStorage.getItem('hasMintedAgents'));
                            console.log('🔍 Debug: demoMintedAgents =', sessionStorage.getItem('demoMintedAgents'));
                            setAgentIDs([]);
                            setAgentDetails([]);
                            setUserBalance(1000.0);
                            setIsLoading(false);
                            return;
                        } else {
                            // Calculate balance based on minted agents in demo mode
                            const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                            let calculatedBalance = 1000.0;
                            
                            // Create agent details from stored data and sort by ID to maintain creation order
                            const agentDetails: AgentDetails[] = mintedAgents
                                .sort((a: any, b: any) => a.id - b.id) // Sort by ID to maintain creation order
                                .map((agent: any, index: number) => {
                                calculatedBalance -= agent.cost;
                                
                                let agentType = "Simple Agent";
                                let strategyDescription = "Automatically compounds rewards in the current farm";
                                let agentEmoji = "🔄";
                                
                                if (agent.type === "HighestAPY") {
                                    agentType = "Smart Agent";
                                    strategyDescription = "Automatically finds and moves to the farm with the highest APY";
                                    agentEmoji = "🧠";
                                } else if (agent.type === "AutoCompoundOnly5P") {
                                    agentType = "Simple Agent (5% APY)";
                                    strategyDescription = "Auto-Compound only";
                                    agentEmoji = "🛡️";
                                } else if (agent.type === "AutoCompoundOnly5P-Farm1") {
                                    agentType = "Simple Agent (10% APY)";
                                    strategyDescription = "Auto-Compound only";
                                    agentEmoji = "🌱";
                                } else if (agent.type === "AutoCompoundOnly5P-Farm2") {
                                    agentType = "Premium Simple Agent (15% APY)";
                                    strategyDescription = "Auto-Compound and Split";
                                    agentEmoji = "💎";
                                } else if (agent.type === "AutoCompoundOnly15P") {
                                    agentType = "Simple Agent (5% APY)";
                                    strategyDescription = "Automatically compounds rewards in the current farm";
                                    agentEmoji = "🛡️";
                                }
                                
                                // Check if agent is paused
                                const pausedAgents = JSON.parse(sessionStorage.getItem('pausedAgents') || '[]');
                                const isAgentPaused = pausedAgents.includes(agent.id.toString());
                                
                                const agentDetail = {
                                    id: agent.id.toString(),
                                    type: agentType,
                                    strategy: agent.type,
                                    description: strategyDescription,
                                    emoji: agentEmoji,
                                    status: isAgentPaused ? "Paused" : "Active"
                                };
                                console.log('Agent detail created:', agentDetail);
                                return agentDetail;
                            });
                            
                            setAgentIDs(mintedAgents.map((agent: any) => agent.id));
                            setAgentDetails(agentDetails);
                            setUserBalance(calculatedBalance);
                            setIsLoading(false);
                            return;
                        }
                    }
                    // Use the exact same logic as demo mode - check for minted agents in sessionStorage
                    const isNewSession = !sessionStorage.getItem('hasMintedAgents');
                    if (isNewSession) {
                        setAgentIDs([]);
                        setAgentDetails([]);
                        setUserBalance(1000.0);
                        setIsLoading(false);
                        return;
                    } else {
                        // Calculate balance based on minted agents (same as demo mode)
                        const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                        let calculatedBalance = 1000.0;
                        
                        // Create agent details from stored data and sort by ID to maintain creation order
                        const agentDetails: AgentDetails[] = mintedAgents
                            .sort((a: any, b: any) => a.id - b.id) // Sort by ID to maintain creation order
                            .map((agent: any, index: number) => {
                            calculatedBalance -= agent.cost;
                            
                            let agentType = "Simple Agent";
                            let strategyDescription = "Automatically compounds rewards in the current farm";
                            let agentEmoji = "🔄";
                            
                            if (agent.type === "HighestAPY") {
                                agentType = "Smart Agent";
                                strategyDescription = "Automatically finds and moves to the farm with the highest APY";
                                agentEmoji = "🧠";
                            } else if (agent.type === "AutoCompoundOnly5P") {
                                agentType = "Simple Agent (5% APY)";
                                strategyDescription = "Auto-Compound only";
                                agentEmoji = "🛡️";
                            } else if (agent.type === "AutoCompoundOnly5P-Farm1") {
                                agentType = "Simple Agent (10% APY)";
                                strategyDescription = "Auto-Compound only";
                                agentEmoji = "🌱";
                            } else if (agent.type === "AutoCompoundOnly5P-Farm2") {
                                agentType = "Premium Simple Agent (15% APY)";
                                strategyDescription = "Auto-Compound and Split";
                                agentEmoji = "💎";
                            } else if (agent.type === "AutoCompoundOnly15P") {
                                agentType = "Simple Agent (5% APY)";
                                strategyDescription = "Automatically compounds rewards in the current farm";
                                agentEmoji = "🛡️";
                            } 
                            
                            // Check if agent is paused
                            const pausedAgents = JSON.parse(sessionStorage.getItem('pausedAgents') || '[]');
                            const isAgentPaused = pausedAgents.includes(agent.id.toString());
                            
                            const agentDetail = {
                                id: agent.id.toString(),
                                type: agentType,
                                strategy: agent.type,
                                description: strategyDescription,
                                emoji: agentEmoji,
                                status: isAgentPaused ? "Paused" : "Active"
                            };
                            console.log('Agent detail created (non-demo):', agentDetail);
                            return agentDetail;
                        });
                        
                        setAgentIDs(mintedAgents.map((agent: any) => agent.id));
                        setAgentDetails(agentDetails);
                        setUserBalance(calculatedBalance);
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error("Failed to fetch agents:", error);
                    setAgentIDs([]);
                    setAgentDetails([]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAgents();
        } else if (user.loggedIn === false) {
             setIsLoading(false);
        } else if (user.loggedIn === null) {
            // User state is still loading, but if we're not in demo mode and no real wallet, fallback to demo
            const localStorageSaysConnected = localStorage.getItem('realWalletConnected') === 'true';
            if (!localStorageSaysConnected && !isDemoMode) {
                console.log('🔄 Fallback: User state null and no localStorage connection - switching to demo mode');
                setIsDemoMode(true);
                setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
                setIsLoading(false);
            }
        }
    }, [user.loggedIn, user.addr, router, isDemoMode, router.isReady, router.query]);

    const refreshBalance = async () => {
        try {
            if (isDemoMode) {
                const isNewSession = !sessionStorage.getItem('hasMintedAgents');
                if (isNewSession) {
                    setUserBalance(1000.0);
                    localStorage.setItem('userBalance', '1000.0');
                    return 1000.0;
                } else {
                    // Calculate balance based on minted agents in demo mode
                    const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                    let calculatedBalance = 1000.0;
                    
                    mintedAgents.forEach((agent: any) => {
                        // Use the actual cost from the agent data
                        calculatedBalance -= agent.cost || 0;
                    });
                    
                    setUserBalance(calculatedBalance);
                    localStorage.setItem('userBalance', calculatedBalance.toString());
                    return calculatedBalance;
                }
            }
            const addressToUse = isDemoMode ? "0xf8d6e0586b0a20c7" : user.addr!;
            
            // Add timeout to prevent infinite buffering
            const queryPromise = fcl.query({
                cadence: getUserBalanceScript,
                args: (arg, t) => [arg(addressToUse, t.Address)],
            });
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout')), 5000)
            );
            
            const balance = await Promise.race([queryPromise, timeoutPromise]);
            const newBalance = parseFloat(balance.toString());
            setUserBalance(newBalance);
            localStorage.setItem('userBalance', newBalance.toString());
            localStorage.removeItem('balanceManuallyReset'); // Clear manual reset flag when fetching from blockchain
            return newBalance;
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            
            // If not in demo mode and query fails, fallback to demo mode
            if (!isDemoMode) {
                console.log("Falling back to demo mode due to query failure");
                setIsDemoMode(true);
                setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
                setUserBalance(1000.0);
                localStorage.setItem('userBalance', '1000');
                return 1000.0;
            }
            
            setUserBalance(0);
            localStorage.setItem('userBalance', '0');
            return 0;
        }
    };

    useEffect(() => {
        if (user.loggedIn === true && user.addr) {
            const fetchBalance = async () => {
                try {
                    // Check localStorage first for manually reset balance
                    const storedBalance = localStorage.getItem('userBalance');
                    const isManuallyReset = localStorage.getItem('balanceManuallyReset') === 'true';
                    
                    if (storedBalance && isManuallyReset) {
                        // Use the manually reset balance and don't override it
                        const balance = parseFloat(storedBalance);
                        setUserBalance(balance);
                        return;
                    } else if (storedBalance) {
                        const balance = parseFloat(storedBalance);
                        setUserBalance(balance);
                        // Only call refreshBalance if we don't have a stored balance or if it's 0
                        if (balance === 0) {
                            await refreshBalance();
                        }
                    } else {
                        await refreshBalance();
                    }
                } catch (error) {
                    console.error("Failed to fetch balance:", error);
                    setUserBalance(0);
                }
            };
            fetchBalance();
            
            // Enhanced refresh logic for minted agents
            if (router.query.minted === 'true') {
                // Clear any existing timeouts
                timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
                timeoutRefs.current = [];
                
                // Immediate refresh
                timeoutRefs.current.push(setTimeout(() => refreshBalance(), 100));
                // Additional refreshes with longer intervals
                timeoutRefs.current.push(setTimeout(() => refreshBalance(), 1000));
                timeoutRefs.current.push(setTimeout(() => refreshBalance(), 2000));
                timeoutRefs.current.push(setTimeout(() => refreshBalance(), 4000));
                // Final refresh after 6 seconds
                timeoutRefs.current.push(setTimeout(() => refreshBalance(), 6000));
            }
        } else if (user.loggedIn === false) {
            // Set default balance for disconnected users
            setUserBalance(0);
        }
    }, [user.loggedIn, user.addr, isDemoMode, router.query]);

    // Show loading only when checking connection status
    if (user.loggedIn === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#121826] to-[#10182a]">
                <Header />
                <div className="flex flex-col items-center py-32">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-cyan-400 mb-8"></div>
                    <h2 className="text-4xl font-black text-gray-200 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
                        Loading Dashboard...
                    </h2>
                </div>
            </div>
        );
    }

    // Show Connect Wallet prompt if not connected
    if (user.loggedIn === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#121826] to-[#10182a] text-white">
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-12">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-600 bg-clip-text text-transparent tracking-tight mb-4">
                                Connect Your Wallet
                            </h1>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                                Connect your Flow wallet to access your Agent Fleet, manage strategies, and automate your DeFi investments.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={fcl.logIn}
                                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/25 animate-pulse"
                            >
                                <span className="flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Connect Flow Wallet
                                </span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    const demoUser = { loggedIn: true, addr: "0xf8d6e0586b0a20c7" };
                                    sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
                                    setUser(demoUser);
                                    setIsDemoMode(true);
                                }}
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-green-400 hover:to-emerald-500 transition-all duration-300 hover:scale-105"
                            >
                                <span className="flex items-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Try Demo Mode
                                </span>
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-400 max-w-md">
                            <p>Demo mode uses a test account to showcase the platform features without requiring a real wallet connection.</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#10182a] to-[#121826] text-white">
            <style jsx>{`
                @keyframes subtle-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .smart-agent-pulse {
                    animation: subtle-pulse 4s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
            <Header />
            
            {/* Live Agent Activity */}
            {liveNotifications.length > 0 && agentDetails.length > 0 && (
                <div className="max-w-lg mx-auto px-4 py-1">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-400">Live Activity</span>
                        </div>
                        <div className="space-y-1">
                            {liveNotifications.slice(0, 2).map((notification, index) => (
                                <div key={index} className="text-xs text-gray-300 animate-fade-in">
                                    {notification}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Responsive Wallet Balance */}
            <div className="absolute top-16 sm:top-20 right-1 sm:right-2 md:right-4 z-10">
                <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl shadow-md backdrop-blur-md">
                    <span className="text-xs sm:text-sm md:text-base font-medium">Balance</span>
                    <span className="text-xs sm:text-sm md:text-lg font-bold text-cyan-300">
                        {userBalance.toFixed(2)} USDC
                    </span>
                    <button
                        onClick={() => {
                            // Clear any pending refresh timeouts to prevent override
                            timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
                            timeoutRefs.current = [];
                            
                            // Reset balance back to 1000.0
                            const resetBalance = 1000.0;
                            setUserBalance(resetBalance);
                            localStorage.setItem('userBalance', resetBalance.toString());
                            localStorage.setItem('balanceManuallyReset', 'true');
                            
                            console.log('✅ Balance reset to 1000 USDC!');
                        }}
                        className="ml-1 sm:ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                        title="Reset balance to 1000 usdc for demo purpose"
                    >
                        <svg 
                            className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-500 text-right mt-1 mr-1 sm:mr-2 md:mr-6 max-w-[200px] sm:max-w-none">
                    For demo purposes, users can also mint agents without connecting a wallet.
                </p>
            </div>
            <main className="max-w-7xl mx-auto px-4 py-4 mt-8">


                {/* Centered title above agents */}
                <div className="flex justify-center mb-4">
                    <h2 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-blue-600 bg-clip-text text-transparent tracking-tight font-urbanist uppercase">
                        Your Agent Fleet
                    </h2>
                </div>

                {/* Modern Portfolio Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto relative">
                    {/* Current Value Card */}
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 shadow-lg hover:shadow-cyan-400/20 hover:border-cyan-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
                                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">Portfolio Value</h3>
                                        <p className="text-xs text-gray-400">Current market value</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-medium ${agentDetails.length > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                        {agentDetails.length > 0 ? '+12.5%' : '0.0%'}
                                    </div>
                                    <div className="text-xs text-gray-500">24h</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                ${(() => {
                                    if (agentDetails.length === 0) return '0';
                                    if (isDemoMode) {
                                        const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                                        const totalValue = mintedAgents.reduce((sum: number, agent: any) => sum + (agent.cost * 1.3), 0);
                                        return totalValue.toLocaleString();
                                    } else {
                                        let totalValue = 0;
                                        agentDetails.forEach(agent => {
                                            let cost = 50;
                                            if (agent.strategy === "HighestAPY") cost = 200;
                                            else if (agent.strategy === "AutoCompoundOnly5P-Farm2") cost = 150;
                                            else if (agent.strategy === "AutoCompoundOnly5P-Farm1") cost = 100;
                                            else if (agent.strategy === "AutoCompoundOnly5P") cost = 50;
                                            else if (agent.strategy === "AutoCompoundOnly15P") cost = 8;
                                            totalValue += cost * 1.3;
                                        });
                                        return totalValue.toLocaleString();
                                    }
                                })()}
                            </div>
                            <div className="text-sm text-gray-300">USDC</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Total Profit Card */}
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-700/30 shadow-lg hover:shadow-emerald-400/20 hover:border-emerald-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-400/30">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Total Profit</h3>
                                        <p className="text-xs text-gray-400">Realized gains</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-medium ${agentDetails.length > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {agentDetails.length > 0 ? '+8.2%' : '0.0%'}
                                    </div>
                                    <div className="text-xs text-gray-500">7d</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {(() => {
                                    if (agentDetails.length === 0) return '$0';
                                    if (isDemoMode) {
                                        const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                                        const totalProfit = mintedAgents.reduce((sum: number, agent: any) => sum + (agent.cost * 0.5), 0);
                                        return `+$${totalProfit.toLocaleString()}`;
                                    } else {
                                        let totalProfit = 0;
                                        agentDetails.forEach(agent => {
                                            let cost = 50;
                                            if (agent.strategy === "HighestAPY") cost = 200;
                                            else if (agent.strategy === "AutoCompoundOnly5P-Farm2") cost = 150;
                                            else if (agent.strategy === "AutoCompoundOnly5P-Farm1") cost = 100;
                                            else if (agent.strategy === "AutoCompoundOnly5P") cost = 50;
                                            else if (agent.strategy === "AutoCompoundOnly15P") cost = 8;
                                            totalProfit += cost * 0.5;
                                        });
                                        return `+$${totalProfit.toLocaleString()}`;
                                    }
                                })()}
                            </div>
                            <div className="text-sm text-gray-300">USDC</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Sell Fleet Button - Responsive positioning */}
<div className="absolute bottom-0 right-0 lg:transform lg:translate-x-32 lg:-translate-y-1/2 -translate-y-1/2">
    <button
        onClick={isFleetListed && agentDetails.length > 0 ? undefined : handleSellFleet}
        disabled={agentDetails.length === 0 || (isFleetListed && agentDetails.length > 0)}
        className={`px-4 py-2.5 text-base font-semibold rounded-lg transition-all duration-200 text-center w-full lg:w-auto ${
            isFleetListed && agentDetails.length > 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                : agentDetails.length > 0 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:shadow-lg' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
    >
        {isFleetListed && agentDetails.length > 0 ? 'Listed' : 'Sell Fleet'}
    </button>
</div>
                </div>
                {/* Empty agent state */}
                {agentDetails.length === 0 ? (
                    <div className="flex flex-col items-center py-20 px-8 max-w-xl mx-auto rounded-2xl border border-cyan-700/30 shadow-lg bg-gradient-to-br from-[#0B0F19]/50 to-[#10182a]/80 backdrop-blur-lg">
                        <div className="mb-7 text-cyan-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 opacity-70" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth={2} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 3zM3.75 14.25V18a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18v-3.75m-16.5 0h16.5" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-100 mb-2">No AI Agents Yet</h3>
                        <p className="mb-5 text-lg text-gray-400 font-medium text-center">
                            Mint your first agent from a farm and watch it automate your strategy.
                        </p>
                        <Link
                            href="/farms"
                            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 px-7 rounded-2xl transition transform hover:scale-105 shadow-xl"
                        >
                            Go to Farms
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Subtle background rectangle that grows with agent count */}
                        <div 
                            className="relative rounded-3xl border border-white/5 backdrop-blur-sm transition-all duration-1000 ease-out"
                            style={{
                                background: `linear-gradient(135deg, rgba(6, 182, 212, 0.02) 0%, rgba(59, 130, 246, 0.02) 50%, rgba(147, 51, 234, 0.02) 100%)`,
                                padding: `${Math.min(20 + agentDetails.length * 2, 40)}px`,
                                minHeight: `${Math.max(200 + agentDetails.length * 20, 300)}px`,
                                boxShadow: `0 0 ${20 + agentDetails.length * 2}px rgba(6, 182, 212, 0.05)`
                            }}
                        >
                            {/* Subtle inner glow effect */}
                            <div 
                                className="absolute inset-0 rounded-3xl opacity-30"
                                style={{
                                    background: `radial-gradient(circle at center, rgba(6, 182, 212, 0.03) 0%, transparent 70%)`,
                                    filter: `blur(${10 + agentDetails.length}px)`
                                }}
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 relative z-10">
                        {agentDetails.slice().reverse().map((agent, i) => {
                            // Determine color scheme based on agent type
                            let cardColors = {
                                bg: 'from-[#0B0F19]/90 to-[#10182a]/95',
                                border: 'border-cyan-700/30',
                                hoverBorder: 'hover:border-cyan-400',
                                hoverShadow: 'hover:shadow-cyan-400/20',
                                iconBg: 'bg-[#10182a]/70',
                                iconHover: 'group-hover:bg-cyan-400/20',
                                statusBg: 'bg-cyan-500/20',
                                statusText: 'text-cyan-300',
                                strategyGradient: 'from-cyan-500 via-blue-500 to-purple-400',
                                linkText: 'text-cyan-300 hover:text-blue-400'
                            };

                            if (agent.type.includes('15% APY') || agent.type.includes('AutoCompoundSplit')) {
                                // Farm 3 - Purple theme (Premium Simple Agent)
                                cardColors = {
                                    bg: 'from-purple-900/20 to-pink-900/20',
                                    border: 'border-purple-700/30',
                                    hoverBorder: 'hover:border-purple-400',
                                    hoverShadow: 'hover:shadow-purple-400/20',
                                    iconBg: 'bg-purple-500/20',
                                    iconHover: 'group-hover:bg-purple-400/20',
                                    statusBg: 'bg-purple-500/20',
                                    statusText: 'text-purple-300',
                                    strategyGradient: 'from-purple-400 to-pink-500',
                                    linkText: 'text-purple-300 hover:text-pink-400'
                                };
                            } else if (agent.type.includes('10% APY')) {
                                // Farm 2 - Blue theme
                                cardColors = {
                                    bg: 'from-blue-900/20 to-cyan-900/20',
                                    border: 'border-blue-700/30',
                                    hoverBorder: 'hover:border-blue-400',
                                    hoverShadow: 'hover:shadow-blue-400/20',
                                    iconBg: 'bg-blue-500/20',
                                    iconHover: 'group-hover:bg-blue-400/20',
                                    statusBg: 'bg-blue-500/20',
                                    statusText: 'text-blue-300',
                                    strategyGradient: 'from-blue-400 to-cyan-500',
                                    linkText: 'text-blue-300 hover:text-cyan-400'
                                };
                            } else if (agent.type.includes('5% APY')) {
                                // Farm 1 - Green theme
                                cardColors = {
                                    bg: 'from-green-900/20 to-emerald-900/20',
                                    border: 'border-green-700/30',
                                    hoverBorder: 'hover:border-green-400',
                                    hoverShadow: 'hover:shadow-green-400/20',
                                    iconBg: 'bg-green-500/20',
                                    iconHover: 'group-hover:bg-green-400/20',
                                    statusBg: 'bg-green-500/20',
                                    statusText: 'text-green-300',
                                    strategyGradient: 'from-green-400 to-emerald-500',
                                    linkText: 'text-green-300 hover:text-emerald-400'
                                };
                            } else if (agent.type === 'Smart Agent') {
                                // Smart Agent - Red theme (Premium) with subtle pulsing
                                cardColors = {
                                    bg: 'from-red-900/20 to-pink-900/20',
                                    border: 'border-red-700/30',
                                    hoverBorder: 'hover:border-red-400',
                                    hoverShadow: 'hover:shadow-red-400/20',
                                    iconBg: 'bg-red-500/20',
                                    iconHover: 'group-hover:bg-red-400/20',
                                    statusBg: 'bg-red-500/20',
                                    statusText: 'text-red-300',
                                    strategyGradient: 'from-red-400 to-pink-500',
                                    linkText: 'text-red-300 hover:text-pink-400'
                                };
                            }

                            return (
                                <Link href={`/agent/${agent.id}`} passHref key={agent.id}>
                                    <div className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${agent.status === 'Paused' ? 'from-gray-800/60 to-gray-700/60' : cardColors.bg} border ${agent.status === 'Paused' ? 'border-gray-600/50' : cardColors.border} shadow-lg ${agent.status === 'Paused' ? 'hover:shadow-gray-500/20' : cardColors.hoverShadow} ${agent.status === 'Paused' ? 'hover:border-gray-500/60' : cardColors.hoverBorder} transition-all duration-300 hover:scale-[1.025] hover:z-10 backdrop-blur ${agent.type === 'Smart Agent' && agent.status !== 'Paused' ? 'smart-agent-pulse' : ''} min-h-80 ${agent.status === 'Paused' ? 'opacity-80' : ''}`}>
                                        <div className="flex flex-col justify-between p-7 h-full">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`text-lg font-bold leading-tight break-words ${agent.status === 'Paused' ? 'text-gray-300' : 'text-gray-100'}`}>{agent.type}</h3>
                                                        <p className={`text-sm font-medium ${agent.status === 'Paused' ? 'text-gray-500' : 'text-gray-500'}`}>#{agent.id}</p>
                                                    </div>
                                                    <div className={`p-3 ${agent.status === 'Paused' ? 'bg-gray-600/40' : cardColors.iconBg} rounded-full text-2xl ${agent.status === 'Paused' ? 'group-hover:bg-gray-500/50' : cardColors.iconHover} transition-all flex-shrink-0`}>
                                                        {agent.emoji}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`inline-block px-3 py-1 ${agent.status === 'Paused' ? 'bg-gray-600/40 text-gray-300' : `${cardColors.statusBg} ${cardColors.statusText}`} font-semibold text-xs rounded-full`}>
                                                        {agent.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold ${agent.status === 'Paused' ? 'text-gray-400' : `bg-gradient-to-r ${cardColors.strategyGradient} bg-clip-text text-transparent`} break-words`}>
                                                        {(() => {
                                                            // Convert technical strategy names to user-friendly names
                                                            switch (agent.strategy) {
                                                                case 'HighestAPY':
                                                                    return 'Strategy: HighestAPY, AutoCompound, RiskAdjustedYield';
                                                                case 'AutoCompoundOnly5P-Farm1':
                                                                    return 'Auto-Compound only';
                                                                case 'AutoCompoundOnly5P-Farm2':
                                                                    return 'Auto-Compound and Split';
                                                                case 'AutoCompoundOnly5P':
                                                                    return 'Auto-Compound only';
                                                                case 'AutoCompoundOnly15P':
                                                                    return 'Auto-Compound only';
                                                                default:
                                                                    return agent.strategy;
                                                            }
                                                        })()}
                                                    </p>
                                                    {agent.strategy === 'AutoCompoundOnly5P-Farm2' && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            This agent operates in Farm 3, automatically compounds rewards and splits deposits intelligently.
                                                        </p>
                                                    )}
                                                    {(agent.strategy === 'AutoCompoundOnly5P-Farm1' || agent.strategy === 'AutoCompoundOnly5P') && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            This Agent stays in its own farm and automatically compounds rewards.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-row justify-between items-center pt-4">
                                                <div className="text-left">
                                                    <div className="text-xs text-gray-500 mb-1">Total P&L</div>
                                                    <div className={`text-sm font-semibold ${
                                                        agent.status === 'Paused' 
                                                            ? 'text-gray-500' 
                                                            : (() => {
                                                                // Smart Agents never show loss
                                                                if (agent.type === 'HighestAPY') {
                                                                    return `text-green-400`;
                                                                }
                                                                // Generate P&L with 8:1 ratio for Simple Agents (8 positive, 1 negative)
                                                                // Skip the first 3 agents to ensure good first impressions
                                                                const agentIndex = parseInt(agent.id);
                                                                const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                                                
                                                                if (isNegative) {
                                                                    return `text-red-400`;
                                                                } else {
                                                                    return `text-green-400`;
                                                                }
                                                            })()
                                                    }`}>
                                                        {(() => {
                                                            // Use dynamic profits if available, otherwise fallback to static calculation
                                                            const dynamicProfit = agentProfits[agent.id];
                                                            if (dynamicProfit !== undefined) {
                                                                // Smart Agents never show loss
                                                                if (agent.type === 'HighestAPY') {
                                                                    return `+$${dynamicProfit.toFixed(2)}`;
                                                                }
                                                                // Generate P&L with 8:1 ratio for Simple Agents (8 positive, 1 negative)
                                                                // Skip the first 3 agents to ensure good first impressions
                                                                const agentIndex = parseInt(agent.id);
                                                                const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                                                
                                                                if (isNegative) {
                                                                    const loss = -(Math.random() * 50 + 10);
                                                                    return `-$${Math.abs(loss).toFixed(2)}`;
                                                                } else {
                                                                    return `+$${dynamicProfit.toFixed(2)}`;
                                                                }
                                                            }
                                                            
                                                            // Fallback to original static calculation
                                                            // Smart Agents never show loss
                                                            if (agent.type === 'HighestAPY') {
                                                                const profit = (Math.random() * 200 + 50).toFixed(2);
                                                                return `+$${profit}`;
                                                            }
                                                            // Generate P&L with 8:1 ratio for Simple Agents (8 positive, 1 negative)
                                                            // Skip the first 3 agents to ensure good first impressions
                                                            const agentIndex = parseInt(agent.id);
                                                            const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                                            
                                                            if (isNegative) {
                                                                const loss = -(Math.random() * 50 + 10);
                                                                return `-$${Math.abs(loss).toFixed(2)}`;
                                                            } else {
                                                                const profit = (Math.random() * 200 + 50).toFixed(2);
                                                                return `+$${profit}`;
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`inline-block px-3 py-2 text-xs font-medium ${agent.status === 'Paused' ? 'text-gray-400 hover:text-gray-300' : cardColors.linkText} transition group-hover:scale-110`}>
                                                        View Details
                                                    </span>
                                                    <svg className={`h-5 w-5 ml-1 ${agent.status === 'Paused' ? 'text-gray-400' : cardColors.linkText} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                            </div>
                        </div>
                    </>
                )}

                {/* Acquired Fleet NFTs Section */}
                <div className="mt-16">
                    {/* Section Header */}
                    <div className="flex justify-center mb-4">
                        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent tracking-tight font-urbanist">
                            Acquired Fleet NFTs:
                        </h2>
                    </div>


                    {/* Fleet Content */}
                    {boughtFleets.length > 0 ? (
                        <div className="space-y-6">
                            {/* Fleet Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                                    <div className="text-blue-400 text-2xl mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-blue-100 text-lg font-semibold mb-1">Total Fleets</h3>
                                    <div className="text-3xl font-bold text-blue-100">{boughtFleets.length}</div>
                                    <div className="text-sm text-blue-300/70 mt-1">Acquired fleets</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                                    <div className="text-green-400 text-2xl mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <h3 className="text-green-100 text-lg font-semibold mb-1">Total Investment</h3>
                                    <div className="text-3xl font-bold text-green-100">
                                        ${boughtFleets.reduce((sum, fleet) => sum + (fleet.purchasePrice || fleet.price), 0).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-green-300/70 mt-1">Total spent</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                                    <div className="text-purple-400 text-2xl mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-purple-100 text-lg font-semibold mb-1">Total Profit</h3>
                                    <div className="text-3xl font-bold text-purple-100">
                                        ${boughtFleets.reduce((sum, fleet) => sum + fleet.totalProfit, 0).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-purple-300/70 mt-1">Generated profit</div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-700/50 rounded-xl p-6">
                                    <div className="text-orange-400 text-2xl mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-orange-100 text-lg font-semibold mb-1">Avg Success Rate</h3>
                                    <div className="text-3xl font-bold text-orange-100">
                                        {Math.round(boughtFleets.reduce((sum, fleet) => sum + fleet.successRate, 0) / boughtFleets.length)}%
                                    </div>
                                    <div className="text-sm text-orange-300/70 mt-1">Performance</div>
                                </div>
                            </div>

                            {/* Fleet Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {boughtFleets.map((fleet) => (
                                    <div key={fleet.id} className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-green-400/20 transition-all duration-300 hover:scale-[1.025] backdrop-blur">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-white">{fleet.name}</h3>
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-900 border-yellow-300">
                                                    {fleet.rarity}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Success Rate</span>
                                                    <span className="text-white font-semibold">{fleet.successRate}%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Total Agents</span>
                                                    <span className="text-white font-semibold">{fleet.totalAgents}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Total Profit</span>
                                                    <span className="text-green-400 font-semibold">${fleet.totalProfit.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Growth Rate</span>
                                                    <span className="text-blue-400 font-semibold">+{fleet.growthRate}%</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">Purchase Price</span>
                                                    <span className="text-yellow-400 font-bold">${(fleet.purchasePrice || fleet.price).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-gray-400 text-sm">ROI</span>
                                                    <span className="text-green-400 font-semibold">
                                                        +{(((fleet.totalProfit - (fleet.purchasePrice || fleet.price)) / (fleet.purchasePrice || fleet.price)) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {fleet.tags.slice(0, 3).map((tag, index) => (
                                                    <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleViewFleetDetails(fleet)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Acquired Fleets Yet</h3>
                            <p className="text-gray-400 mb-6">Start building your fleet collection by purchasing from the marketplace</p>
                            <Link href="/buy-sell">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                    Browse Marketplace
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Fleet Details Modal */}
            {showFleetModal && selectedFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFleetModal(false)}>
                    <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">{selectedFleet.name}</h2>
                                <button
                                    onClick={() => setShowFleetModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Fleet Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.successRate}%</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Agents</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.totalAgents}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Missions</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.totalMissions}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Efficiency Score</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.efficiencyScore}%</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Profit</div>
                                    <div className="text-xl font-bold text-green-400">${selectedFleet.totalProfit.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
                                    <div className="text-xl font-bold text-blue-400">+{selectedFleet.growthRate}%</div>
                                </div>
                            </div>

                            {/* Purchase Information */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Purchase Information</h3>
                                    <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Purchase Price:</span>
                                            <span className="text-yellow-400 font-semibold">${(selectedFleet.purchasePrice || selectedFleet.price).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Purchase Date:</span>
                                            <span className="text-white">{selectedFleet.purchaseDate ? new Date(selectedFleet.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">ROI:</span>
                                            <span className="text-green-400 font-semibold">
                                                +{(((selectedFleet.totalProfit - (selectedFleet.purchasePrice || selectedFleet.price)) / (selectedFleet.purchasePrice || selectedFleet.price)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Rarity:</span>
                                            <span className="text-white">{selectedFleet.rarity}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedFleet.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Fleet Characteristics</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFleet.tags.map((tag, index) => (
                                                <span key={index} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-center gap-4">
                                <div className="relative group">
                                    <button
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Edit Agent Strategies
                                        </div>
                                    </button>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-80">
                                        <div className="text-center">
                                            <div className="font-semibold text-blue-400 mb-2">Agent Strategy Management</div>
                                            <div className="text-gray-300 text-xs leading-relaxed">
                                                This feature will allow you to customize and optimize the strategies of individual agents within your fleet.
                                            </div>
                                            <div className="mt-3 text-yellow-400 font-medium text-xs">
                                                Coming soon in the next update!
                                            </div>
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFleetModal(false)}
                                    className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Fleet Modal */}
            {showSellFleetModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 w-full max-w-md text-white shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
                                        Sell Your Fleet
                                    </h2>
                                    <p className="text-gray-400 text-sm">Current Fleet Valuation</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSellFleetModal(false)} 
                                className="text-gray-400 hover:text-white text-2xl transition-colors duration-200 hover:bg-gray-700/50 rounded-full p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Fleet Value Information */}
                        <div className="space-y-4 mb-6">
                            {/* Current Value */}
                            <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Current Portfolio Value</h3>
                                        <p className="text-blue-200 text-lg font-bold">
                                            ${(() => {
                                                if (agentDetails.length === 0) return '0';
                                                if (isDemoMode) {
                                                    const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                                                    const totalValue = mintedAgents.reduce((sum: number, agent: any) => sum + (agent.cost * 1.3), 0);
                                                    return totalValue.toLocaleString();
                                                } else {
                                                    let totalValue = 0;
                                                    agentDetails.forEach(agent => {
                                                        let cost = 50;
                                                        if (agent.strategy === "HighestAPY") cost = 200;
                                                        else if (agent.strategy === "AutoCompoundOnly5P-Farm2") cost = 150;
                                                        else if (agent.strategy === "AutoCompoundOnly5P-Farm1") cost = 100;
                                                        else if (agent.strategy === "AutoCompoundOnly5P") cost = 50;
                                                        else if (agent.strategy === "AutoCompoundOnly15P") cost = 8;
                                                        totalValue += cost * 1.3;
                                                    });
                                                    return totalValue.toLocaleString();
                                                }
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommended Price */}
                            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Recommended Selling Price</h3>
                                        <p className="text-green-200 text-lg font-bold">
                                            ${Math.round((() => {
                                                if (agentDetails.length === 0) return 0;
                                                if (isDemoMode) {
                                                    const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                                                    const totalValue = mintedAgents.reduce((sum: number, agent: any) => sum + (agent.cost * 1.3), 0);
                                                    return totalValue * 1.15;
                                                } else {
                                                    let totalValue = 0;
                                                    agentDetails.forEach(agent => {
                                                        let cost = 50;
                                                        if (agent.strategy === "HighestAPY") cost = 200;
                                                        else if (agent.strategy === "AutoCompoundOnly5P-Farm2") cost = 150;
                                                        else if (agent.strategy === "AutoCompoundOnly5P-Farm1") cost = 100;
                                                        else if (agent.strategy === "AutoCompoundOnly5P") cost = 50;
                                                        else if (agent.strategy === "AutoCompoundOnly15P") cost = 8;
                                                        totalValue += cost * 1.3;
                                                    });
                                                    return totalValue * 1.15;
                                                }
                                            })()).toLocaleString()}
                                        </p>
                                        <p className="text-green-300 text-xs">+15% market premium</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Manual Price Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-200 mb-3">
                                Set Your Selling Price
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
                                <input
                                    type="number"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-800/40 border border-gray-600/50 rounded-lg text-white text-lg font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                                    placeholder="Enter selling price"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                You can adjust the price based on market conditions
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSellFleetModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={listAgentForSale}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                List for Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

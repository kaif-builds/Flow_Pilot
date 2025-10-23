import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import '../flow.config';
import Header from '../components/Header';
import MintAgentModal from '../components/MintAgentModal';

type FlowUser = {
  loggedIn: boolean | null;
  addr?: string | null;
}

const getUserBalanceScript = `
  import AgentNFT from 0x8b32c5ecee9fe36f
  access(all) fun main(address: Address): UFix64 {
      let account = getAccount(address)
      var totalCost: UFix64 = 0.0
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          let agentIDs = collectionRef.getIDs()
          for agentID in agentIDs {
              let nftRef = collectionRef.borrowAgent(id: agentID)
              if nftRef.strategy.strategyType == "HighestAPY" {
                  totalCost = totalCost + 200.0
              } else if nftRef.strategy.strategyType == "RiskAdjustedYield" {
                  totalCost = totalCost + 200.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly15P" {
                  totalCost = totalCost + 8.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
                  totalCost = totalCost + 100.0
              } else if nftRef.strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
                  totalCost = totalCost + 150.0
              } else {
                  totalCost = totalCost + 50.0
              }
          }
      }
      // Calculate balance by subtracting total cost from initial balance
      let initialBalance: UFix64 = 100.0
      if totalCost >= initialBalance {
          return 0.0
      } else {
          return initialBalance - totalCost
      }
  }
`;

const mintAgentTx = `
  import AgentNFT from 0x8b32c5ecee9fe36f

  transaction(strategyType: String, riskTolerance: String, allocationPercent: UFix64, timeLockDays: UInt64, paymentAmount: UFix64) {
      prepare(signer: auth(Storage, Capabilities) &Account) {
          
          // Setup collection if needed
          if signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection) == nil {
              signer.storage.save(<-AgentNFT.createEmptyCollection(), to: /storage/AgentNFTCollection)
              let _ = signer.capabilities.unpublish(/public/AgentNFTCollection)
              signer.capabilities.publish(
                  signer.capabilities.storage.issue<&AgentNFT.Collection>(/storage/AgentNFTCollection),
                  at: /public/AgentNFTCollection
              )
          }

          let collection = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
              ?? panic("Could not borrow Collection")

          // Create the Strategy struct
          let strategy = AgentNFT.Strategy(
              strategyType: strategyType,
              riskTolerance: riskTolerance,
              allocationPercent: allocationPercent,
              timeLockDays: timeLockDays
          )

          // Use public minting function
          let newNFT <- AgentNFT.mintNFT(strategy: strategy)
          let nftID = newNFT.id
          
          collection.deposit(token: <-newNFT)

          log("New Agent NFT minted with ID: ".concat(nftID.toString()).concat(" and strategy: ").concat(strategyType))
      }
  }
`;

export default function FarmsPage() {
    const [user, setUser] = useState<FlowUser>({ loggedIn: null });
    const router = useRouter();
    const [isMinting, setIsMinting] = useState(false);
    const [mintingAgentType, setMintingAgentType] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [userBalance, setUserBalance] = useState<number>(1000.0);
    const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
    
    // Modal state
    const [showMintModal, setShowMintModal] = useState(false);
    const [selectedAgentType, setSelectedAgentType] = useState<string>('');
    const [selectedAgentCost, setSelectedAgentCost] = useState<number>(0);
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');

    // Dynamic APY state for realistic market simulation
    const [farmAPYs, setFarmAPYs] = useState({
        farm1: { base: 5.0, current: 5.0, trend: 0 },
        farm2: { base: 10.0, current: 10.0, trend: 0 },
        farm3: { base: 15.0, current: 15.0, trend: 0 },
        smartAgent: { base: 25.0, current: 25.0, trend: 0 }
    });
    
    // Market simulation state
    const [marketConditions, setMarketConditions] = useState({
        volatility: 'Low',
        trend: 'Bullish',
        riskLevel: 'Low'
    });
    
    // Strategy execution notifications
    const [notifications, setNotifications] = useState<string[]>([]);
    
    // Transaction simulation state
    const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string>('');
    const [txGasFee, setTxGasFee] = useState<string>('');

    // Function to open mint modal
    const openMintModal = (agentType: string, cost: number, farmId?: string) => {
        if (!user.loggedIn) {
            console.log('⚠️ Please connect your wallet to mint agents.');
            return;
        }
        
        setSelectedAgentType(agentType);
        setSelectedAgentCost(cost);
        setSelectedFarmId(farmId || '');
        setShowMintModal(true);
    };

    // Function to handle modal confirmation and mint agent
    const handleMintConfirm = async (strategy: any) => {
        setShowMintModal(false);
        setIsMinting(true);
        const mintingType = selectedFarmId ? `${selectedAgentType}-${selectedFarmId}` : selectedAgentType;
        setMintingAgentType(mintingType);
        
        try {
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Store minted agent information in sessionStorage with strategy
                const existingAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                const newAgent = {
                    id: existingAgents.length + 1,
                    type: selectedAgentType,
                    cost: selectedAgentCost,
                    strategy: strategy,
                    timestamp: Date.now()
                };
                existingAgents.push(newAgent);
                sessionStorage.setItem('demoMintedAgents', JSON.stringify(existingAgents));
                sessionStorage.setItem('hasMintedAgents', 'true');
                
                // Update balance
                const newBalance = userBalance - selectedAgentCost;
                setUserBalance(newBalance);
                localStorage.setItem('userBalance', newBalance.toString());
                
                // Show success message in console instead of alert
                console.log(`✅ ${selectedAgentType} agent minted successfully! Cost: ${selectedAgentCost} USDC (Demo Mode)`);
                router.push('/dashboard?minted=true');
                return;
            }
            
            // For real mode, use the strategy from modal
            const txId = await fcl.mutate({
                cadence: mintAgentTx,
                args: (arg, t) => [
                    arg(strategy.strategyType, t.String),
                    arg(strategy.riskTolerance, t.String),
                    arg(strategy.allocationPercent.toString() + ".0", t.UFix64),
                    arg(strategy.timeLockDays, t.UInt64),
                    arg(selectedAgentCost.toString() + ".0", t.UFix64)
                ],
                proposer: fcl.currentUser,
                payer: fcl.currentUser,
                authorizations: [fcl.currentUser],
                limit: 1000
            });
            
            await fcl.tx(txId).onceSealed();
            
            // Store minted agent in sessionStorage (same as demo mode)
            const existingAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
            const newAgent = {
                id: existingAgents.length + 1,
                type: selectedAgentType,
                cost: selectedAgentCost,
                strategy: strategy,
                timestamp: Date.now()
            };
            existingAgents.push(newAgent);
            sessionStorage.setItem('demoMintedAgents', JSON.stringify(existingAgents));
            sessionStorage.setItem('hasMintedAgents', 'true');
            
            // Update balance after successful mint with retry logic
            let balanceUpdated = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !balanceUpdated) {
                attempts++;
                await refreshBalance();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                // Verify balance was updated correctly
                const expectedBalance = userBalance - selectedAgentCost;
                const currentBalance = parseFloat(localStorage.getItem('userBalance') || '0');
                if (Math.abs(currentBalance - expectedBalance) < 0.01) {
                    balanceUpdated = true;
                }
            }
            
            // Show success message in console instead of alert
            console.log(`✅ ${selectedAgentType} agent minted successfully! Transaction ID: ${txId}`);
            router.push('/dashboard?minted=true');
        } catch (error) {
            console.error('Minting failed:', error);
            console.error('❌ Failed to mint agent. Please try again.');
        } finally {
            setIsMinting(false);
            setMintingAgentType(null);
        }
    };

    useEffect(() => {
        console.log('🔄 Farms initializing...');
        
        // Start in demo mode for better UX
        console.log('🎭 Starting in demo mode');
        setIsDemoMode(true);
        setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
    }, []);

    // Listen for wallet connection/disconnection events
    useEffect(() => {
        const handleWalletConnected = (event: CustomEvent) => {
            setUserBalance(event.detail.balance);
            setIsDemoMode(false); // Exit demo mode when real wallet connects
            localStorage.setItem('realWalletConnected', 'true');
        };

        const handleWalletDisconnected = (event: CustomEvent) => {
            setUserBalance(event.detail.balance);
            setIsDemoMode(true); // Return to demo mode when wallet disconnects
            
            // Only clear data if we were actually connected to a real wallet
            const wasRealWalletConnected = localStorage.getItem('realWalletConnected') === 'true';
            
            if (wasRealWalletConnected) {
                console.log('🔌 Real wallet disconnected - clearing all data');
                // Clear session storage to reset agent state
                sessionStorage.removeItem('hasMintedAgents');
                sessionStorage.removeItem('demoMintedAgents');
                // Clear wallet connection flag
                localStorage.removeItem('realWalletConnected');
            } else {
                console.log('🎭 Demo mode logout - keeping agents');
                // In demo mode, don't clear agents
            }
        };

        window.addEventListener('walletConnected', handleWalletConnected as EventListener);
        window.addEventListener('walletDisconnected', handleWalletDisconnected as EventListener);

        return () => {
            window.removeEventListener('walletConnected', handleWalletConnected as EventListener);
            window.removeEventListener('walletDisconnected', handleWalletDisconnected as EventListener);
        };
    }, []);

    useEffect(() => {
        if (user.loggedIn === false && !isDemoMode) {
            router.push('/');
        }
    }, [user.loggedIn, router, isDemoMode]);

    useEffect(() => {
        console.log('🔄 Farms main data loading effect triggered');
        console.log('👤 User state:', { loggedIn: user.loggedIn, addr: user.addr });
        console.log('🎭 Demo mode:', isDemoMode);
        
        // If localStorage says real wallet connected but FCL shows no user, fallback to demo
        const localStorageSaysConnected = localStorage.getItem('realWalletConnected') === 'true';
        const fclShowsNoUser = user.loggedIn === null || user.loggedIn === false;
        
        if (localStorageSaysConnected && fclShowsNoUser) {
            console.log('🔄 Fallback: localStorage says connected but FCL shows no user - switching to demo mode');
            setIsDemoMode(true);
            setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
            localStorage.removeItem('realWalletConnected');
            return;
        }
        
        if (user.loggedIn === true && user.addr) {
            console.log('📊 Starting to fetch balance...');
            const fetchBalance = async () => {
                setBalanceLoading(true);
                try {
                    // Check localStorage first for manually reset balance
                    const storedBalance = localStorage.getItem('userBalance');
                    const isManuallyReset = localStorage.getItem('balanceManuallyReset') === 'true';
                    
                    if (storedBalance && isManuallyReset) {
                        // Use the manually reset balance and don't override it
                        const balance = parseFloat(storedBalance);
                        setUserBalance(balance);
                        setBalanceLoading(false);
                        return;
                    }
                    
                    if (isDemoMode) {
                        console.log('🎭 Fetching demo balance...');
                        // Handle demo mode balance calculation
                        const isNewSession = !sessionStorage.getItem('hasMintedAgents');
                        if (isNewSession) {
                            setUserBalance(1000.0);
                            localStorage.setItem('userBalance', '1000.0');
                        } else {
                            // Calculate balance based on minted agents in demo mode
                            const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                            let totalCost = 0;
                            for (const agent of mintedAgents) {
                                totalCost += agent.cost;
                            }
                            const newBalance = 1000.0 - totalCost;
                            setUserBalance(newBalance);
                            localStorage.setItem('userBalance', newBalance.toString());
                        }
                    } else {
                        const addressToUse = user.addr!;
                        const balance = await fcl.query({
                            cadence: getUserBalanceScript,
                            args: (arg, t) => [arg(addressToUse, t.Address)],
                        });
                        setUserBalance(parseFloat(balance.toString()));
                        localStorage.setItem('userBalance', parseFloat(balance.toString()).toString());
                        localStorage.removeItem('balanceManuallyReset'); // Clear manual reset flag when fetching from blockchain
                    }
                } catch (error) {
                    setUserBalance(0);
                } finally {
                    setBalanceLoading(false);
                }
            };
            fetchBalance();
        }
    }, [user.loggedIn, user.addr, isDemoMode]);

    // Listen for balance updates from other pages
    useEffect(() => {
        const handleStorageChange = () => {
            const storedBalance = localStorage.getItem('userBalance');
            if (storedBalance) {
                const balance = parseFloat(storedBalance);
                if (Math.abs(balance - userBalance) > 0.01) { // Use tolerance for floating point comparison
                    setUserBalance(balance);
                }
            }
        };

        // Listen for storage events
        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically for balance updates
        const intervalId = setInterval(() => {
            const storedBalance = localStorage.getItem('userBalance');
            if (storedBalance) {
                const balance = parseFloat(storedBalance);
                if (Math.abs(balance - userBalance) > 0.01) { // Use tolerance for floating point comparison
                    setUserBalance(balance);
                }
            }
        }, 1000); // Check every 1 second (reduced frequency)

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(intervalId);
        };
    }, [userBalance]);

    // Real-time market simulation and APY updates
    useEffect(() => {
        const simulateMarket = () => {
            // Generate realistic market conditions
            const marketTrend = Math.sin(Date.now() / 100000) * 0.5 + 0.5; // Market cycles
            const volatility = Math.random() * 0.4; // Random volatility 0-40%
            
            // Update market conditions
            setMarketConditions({
                volatility: volatility > 0.25 ? 'High' : volatility > 0.15 ? 'Medium' : 'Low',
                trend: marketTrend > 0.6 ? 'Bullish' : marketTrend < 0.4 ? 'Bearish' : 'Neutral',
                riskLevel: volatility > 0.2 ? 'High' : 'Low'
            });

            // Update APYs with realistic variations
            setFarmAPYs(prev => {
                const newAPYs = { ...prev };
                
                Object.keys(newAPYs).forEach(farmKey => {
                    const farm = newAPYs[farmKey as keyof typeof newAPYs];
                    const variation = (Math.random() - 0.5) * 2; // ±1% variation
                    const trendInfluence = (marketTrend - 0.5) * 0.5; // Market trend influence
                    
                    const newAPY = Math.max(1, farm.base + variation + trendInfluence);
                    const trend = newAPY > farm.current ? 1 : newAPY < farm.current ? -1 : 0;
                    
                    newAPYs[farmKey as keyof typeof newAPYs] = {
                        base: farm.base,
                        current: Math.round(newAPY * 10) / 10, // Round to 1 decimal
                        trend: trend
                    };
                });
                
                return newAPYs;
            });

            // Generate strategy execution notifications
            if (Math.random() < 0.3) { // 30% chance of notification
                const notificationTemplates = [
                    "Smart Agent: Analyzing Farm 2 APY increase (+1.2%)",
                    "Auto-compound executed: +$12.45 profit",
                    "Risk-Adjusted: Rebalancing portfolio (Market volatility: 15%)",
                    "Migration completed: Farm 1 → Farm 3 (+0.8% APY)",
                    "Yield optimization: +$8.67 additional profit",
                    "Strategy adaptation: Market trend detected",
                    "APY analysis: Farm 2 showing best returns",
                    "Risk management: Reducing exposure to volatile assets"
                ];
                
                const randomNotification = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
                setNotifications(prev => [randomNotification, ...prev.slice(0, 4)]); // Keep last 5 notifications
            }
        };

        // Run simulation every 15 seconds
        const interval = setInterval(simulateMarket, 15000);
        
        // Run initial simulation
        simulateMarket();

        return () => clearInterval(interval);
    }, []);

    const resetBalance = () => {
        setUserBalance(1000.0);
        localStorage.setItem('userBalance', '1000.0');
        localStorage.setItem('balanceManuallyReset', 'true');
    };

    const refreshBalance = async () => {
        setBalanceLoading(true);
        try {
            if (isDemoMode) {
                const isNewSession = !sessionStorage.getItem('hasMintedAgents');
                if (isNewSession) {
                    const initialBalance = 1000.0; // Consistent with dashboard
                    setUserBalance(initialBalance);
                    localStorage.setItem('userBalance', initialBalance.toString());
                    return initialBalance;
                } else {
                    // Calculate balance based on minted agents in demo mode
                    const mintedAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                    let calculatedBalance = 1000.0; // Consistent with dashboard
                    
                    mintedAgents.forEach((agent: any) => {
                        calculatedBalance -= agent.cost;
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
        } finally {
            setBalanceLoading(false);
        }
    };

    const mintAgent = async (agentType: string, cost: number, farmId?: string) => {
        // Check if user is connected
        if (!user.loggedIn) {
            console.log('⚠️ Please connect your wallet to mint agents.');
            return;
        }
        
        setIsMinting(true);
        setTxStatus('pending');
        const mintingType = farmId ? `${agentType}-${farmId}` : agentType;
        setMintingAgentType(mintingType);
        
        // Generate realistic transaction hash
        const generateTxHash = () => {
            const chars = '0123456789abcdef';
            let hash = '0x';
            for (let i = 0; i < 64; i++) {
                hash += chars[Math.floor(Math.random() * chars.length)];
            }
            return hash;
        };
        
        // Generate realistic gas fee
        const generateGasFee = () => {
            return (Math.random() * 0.05 + 0.01).toFixed(4); // 0.01 to 0.06 ETH
        };
        
        try {
            if (isDemoMode) {
                // Simulate blockchain transaction process
                setTxHash(generateTxHash());
                setTxGasFee(generateGasFee());
                
                // Add transaction notification
                const txNotification = `Transaction submitted: ${txHash.slice(0, 10)}...`;
                setNotifications(prev => [txNotification, ...prev.slice(0, 4)]);
                
                // Simulate transaction confirmation delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Store minted agent information in sessionStorage
                const existingAgents = JSON.parse(sessionStorage.getItem('demoMintedAgents') || '[]');
                const newAgent = {
                    id: existingAgents.length + 1,
                    type: agentType,
                    cost: cost,
                    timestamp: Date.now(),
                    txHash: txHash
                };
                existingAgents.push(newAgent);
                sessionStorage.setItem('demoMintedAgents', JSON.stringify(existingAgents));
                sessionStorage.setItem('hasMintedAgents', 'true');
                
                // Update balance
                const newBalance = userBalance - cost;
                setUserBalance(newBalance);
                localStorage.setItem('userBalance', newBalance.toString());
                
                // Transaction success notification
                setTxStatus('success');
                const successNotification = `Agent minted successfully! TX: ${txHash.slice(0, 10)}...`;
                setNotifications(prev => [successNotification, ...prev.slice(0, 4)]);
                
                console.log(`✅ ${agentType} agent minted successfully!\nTransaction Hash: ${txHash}\nGas Fee: ${txGasFee} ETH\nCost: ${cost} USDC (Demo Mode)`);
                router.push('/dashboard?minted=true');
                return;
            }
            
            // Define strategy parameters based on agent type
            let riskTolerance = "Medium";
            let allocationPercent = "50.0"; // Must be string with decimal point for UFix64
            let timeLockDays = 30;
            
            const txId = await fcl.mutate({
                cadence: mintAgentTx,
                args: (arg, t) => [
                    arg(agentType, t.String),
                    arg(riskTolerance, t.String),
                    arg(allocationPercent, t.UFix64),
                    arg(timeLockDays, t.UInt64),
                    arg(cost.toFixed(1), t.UFix64)
                ],
                limit: 999
            });
            await fcl.tx(txId).onceSealed();
            console.log(`✅ ${agentType} agent minted successfully! Cost: ${cost} USDC`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            let attempts = 0;
            const maxAttempts = 5;
            let balanceUpdated = false;
            while (attempts < maxAttempts && !balanceUpdated) {
                attempts++;
                const newBalance = await refreshBalance();
                const expectedBalance = userBalance - cost;
                if (Math.abs(newBalance - expectedBalance) < 0.01) {
                    balanceUpdated = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
            if (!balanceUpdated) {
                await refreshBalance();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push('/dashboard?minted=true');
        } catch (error) {
            console.error('Minting error:', error);
            console.error('❌ Failed to mint agent. Please try again.');
        } finally {
            setIsMinting(false);
            setMintingAgentType(null);
        }
    };

    if (user.loggedIn === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0D1117] to-[#111827]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-cyan-400 mx-auto mb-6"></div>
                    <p className="text-gray-200 text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#0D1117] to-[#111827] text-gray-200">
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
            
            {/* Live Market Status */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <div className={`w-2 h-2 rounded-full ${marketConditions.volatility === 'High' ? 'bg-red-400' : marketConditions.volatility === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                            <span className="text-sm text-gray-300">Market: {marketConditions.volatility} Volatility</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                            <span className={`flex items-center gap-1 text-sm ${marketConditions.trend === 'Bullish' ? 'text-green-400' : marketConditions.trend === 'Bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                                {marketConditions.trend === 'Bullish' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : marketConditions.trend === 'Bearish' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                                {marketConditions.trend}
                            </span>
                        </div>
                    </div>
                    
                    {/* Live Notifications */}
                    {notifications.length > 0 && sessionStorage.getItem('hasMintedAgents') === 'true' && (
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-green-400">Live Activity</span>
                            </div>
                            <div className="space-y-1">
                                {notifications.slice(0, 2).map((notification, index) => (
                                    <div key={index} className="text-xs text-gray-300 animate-fade-in">
                                        {notification}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Transaction Status */}
                    {txStatus !== 'idle' && (
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    txStatus === 'pending' ? 'bg-yellow-400 animate-pulse' : 
                                    txStatus === 'success' ? 'bg-green-400' : 'bg-red-400'
                                }`}></div>
                                <span className={`text-sm font-semibold ${
                                    txStatus === 'pending' ? 'text-yellow-400' : 
                                    txStatus === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {txStatus === 'pending' ? 'Transaction Pending' : 
                                     txStatus === 'success' ? 'Transaction Confirmed' : 'Transaction Failed'}
                                </span>
                            </div>
                            {txHash && (
                                <div className="text-xs text-gray-300">
                                    <div>Hash: {txHash.slice(0, 20)}...</div>
                                    {txGasFee && <div>Gas: {txGasFee} ETH</div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Responsive Wallet Balance */}
            <div className="absolute top-20 right-2 sm:right-4 z-10">
                <div className="inline-flex items-center gap-1 sm:gap-3 px-2 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl shadow-md backdrop-blur-md">
                    <span className="text-xs sm:text-base font-medium">Balance</span>
                    <span className="text-sm sm:text-lg font-bold text-cyan-300">
                        {balanceLoading ? (
                            <span className="flex items-center gap-1 sm:gap-2">
                                <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-b-2 border-cyan-300"></div> 
                                <span className="text-xs sm:text-sm">Updating...</span>
                            </span>
                        ) : (
                            `${userBalance.toFixed(2)} USDC`
                        )}
                    </span>
                </div>
            </div>
            <main className="max-w-7xl mx-auto px-4 py-4 mt-8">
                {/* Heading at the top */}
                <div className="text-center mb-4">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Web3 Yield Farms & AI Agents
                    </h1>
                    <p className="text-base text-[#9CA3AF] mb-3 max-w-xl mx-auto">
                        Deploy automated agents to optimize yield farming. Mint, manage, and launch AI-driven strategies with clarity and control.
                    </p>
                </div>
                {/* Farm Cards with Simple Agent Minting */}
                <div className="mb-4">
                    <div className="text-center mb-3">
                        <h2 className="text-2xl font-bold text-white mb-1">Yield Farms</h2>
                        <p className="text-gray-400">Deploy simple agents to automate your yield farming</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
                        {/* Farm 1 - Green Theme (Cheapest - 50 USDC) */}
                        <div className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 shadow-lg hover:shadow-green-400/20 hover:border-green-400 transition-all duration-300 hover:scale-[1.025] hover:z-10 backdrop-blur">
                            <div className="flex flex-col h-full gap-2 p-6 pb-2">
                                {/* Header Section - Fixed Height */}
                                <div className="h-32">
                                    <div className="text-center">
                                        <h3 className="text-3xl font-bold text-white mb-2">Farm 1</h3>
                                        <span className="inline-block px-4 py-2 text-sm font-semibold text-green-300 bg-green-400/10 rounded-full">
                                            #ENTRY LEVEL
                                        </span>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-base font-semibold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                                            Strategy: Auto-Compound
                                        </p>
                                        <p className="text-sm font-bold text-green-300">
                                            {farmAPYs.farm1.current}% APY • Entry Level
                                            {farmAPYs.farm1.trend === 1 && (
                                                <svg className="w-4 h-4 text-green-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            )}
                                            {farmAPYs.farm1.trend === -1 && (
                                                <svg className="w-4 h-4 text-red-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                </svg>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Description Section - Flexible */}
                                <div className="flex-1 text-center flex items-center justify-center">
                                    <p className="text-base text-gray-300">
                                        Perfect for beginners. This agent stays in Farm 1 and automatically compounds rewards every 12 hours for steady, low-risk returns.
                                    </p>
                                </div>
                                
                                {/* Cost Section - Fixed Height */}
                                <div className="h-8 flex items-center justify-center">
                                    <span className="text-yellow-400 font-bold text-lg">Cost - 50.00 USDC</span>
                                </div>
                                
                                {/* Button Section - Fixed Height */}
                                <div className="h-12">
                                    <button
                                        onClick={() => openMintModal("AutoCompoundOnly5P", 50.0, "Farm1")}
                                        disabled={isMinting || !user.loggedIn}
                                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                                            !user.loggedIn 
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                                : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm1")
                                                ? 'bg-green-600 text-white cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        {!user.loggedIn ? (
                                            'Connect Wallet'
                                        ) : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm1") ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Minting...
                                            </span>
                                        ) : (
                                            'Mint Simple Agent'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Farm 2 - Blue Theme (Middle Cost - 100 USDC) */}
                        <div className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-700/30 shadow-lg hover:shadow-blue-400/20 hover:border-blue-400 transition-all duration-300 hover:scale-[1.025] hover:z-10 backdrop-blur">
                            <div className="flex flex-col h-full gap-2 p-6 pb-2">
                                {/* Header Section - Fixed Height */}
                                <div className="h-32">
                                    <div className="text-center">
                                        <h3 className="text-3xl font-bold text-white mb-2">Farm 2</h3>
                                        <span className="inline-block px-4 py-2 text-sm font-semibold text-blue-300 bg-blue-400/10 rounded-full">
                                            #STABLE
                                        </span>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-base font-semibold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                                            Strategy: Auto-Compound
                                        </p>
                                        <p className="text-sm font-bold text-blue-300">
                                            {farmAPYs.farm2.current}% APY • Stable Returns
                                            {farmAPYs.farm2.trend === 1 && (
                                                <svg className="w-4 h-4 text-green-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            )}
                                            {farmAPYs.farm2.trend === -1 && (
                                                <svg className="w-4 h-4 text-red-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                </svg>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Description Section - Flexible */}
                                <div className="flex-1 text-center flex items-center justify-center">
                                    <p className="text-base text-gray-300">
                                        Balanced approach. This agent stays in Farm 2 and automatically compounds rewards every 6 hours for stable, moderate-risk returns.
                                    </p>
                                </div>
                                
                                {/* Cost Section - Fixed Height */}
                                <div className="h-8 flex items-center justify-center">
                                    <span className="text-yellow-400 font-bold text-lg">Cost - 100.00 USDC</span>
                                </div>
                                
                                {/* Button Section - Fixed Height */}
                                <div className="h-12">
                                    <button
                                        onClick={() => openMintModal("AutoCompoundOnly5P-Farm1", 100.0, "Farm2")}
                                        disabled={isMinting || !user.loggedIn}
                                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                                            !user.loggedIn 
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                                : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm1-Farm2")
                                                ? 'bg-blue-600 text-white cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {!user.loggedIn ? (
                                            'Connect Wallet'
                                        ) : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm1-Farm2") ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Minting...
                                            </span>
                                        ) : (
                                            'Mint Simple Agent'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Farm 3 - Purple Theme (Most Expensive - 150 USDC) */}
                        <div className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 shadow-lg hover:shadow-purple-400/20 hover:border-purple-400 transition-all duration-300 hover:scale-[1.025] hover:z-10 backdrop-blur">
                            <div className="flex flex-col h-full gap-2 p-6 pb-2">
                                {/* Header Section - Fixed Height */}
                                <div className="h-32">
                                    <div className="text-center">
                                        <h3 className="text-3xl font-bold text-white mb-2">Farm 3</h3>
                                        <span className="inline-block px-4 py-2 text-sm font-semibold text-purple-300 bg-purple-400/10 rounded-full">
                                            #PREMIUM
                                        </span>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-base font-semibold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                                            Strategy: Auto-Compound and Split
                                        </p>
                                        <p className="text-sm font-bold text-purple-300">
                                            {farmAPYs.farm3.current}% APY • High Returns
                                            {farmAPYs.farm3.trend === 1 && (
                                                <svg className="w-4 h-4 text-green-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            )}
                                            {farmAPYs.farm3.trend === -1 && (
                                                <svg className="w-4 h-4 text-red-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                </svg>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Description Section - Flexible */}
                                <div className="flex-1 text-center flex items-center justify-center">
                                    <p className="text-base text-gray-300">
                                        Premium agent that stays locked to Farm 3. Auto-compounds rewards and automatically sends a percentage of each claimed reward to a separate savings vault for enhanced yield optimization.
                                    </p>
                                </div>
                                
                                {/* Cost Section - Fixed Height */}
                                <div className="h-8 flex items-center justify-center">
                                    <span className="text-yellow-400 font-bold text-lg">Cost - 150.00 USDC</span>
                                </div>
                                
                                {/* Button Section - Fixed Height */}
                                <div className="h-12">
                                    <button
                                        onClick={() => openMintModal("AutoCompoundOnly5P-Farm2", 150.0, "Farm3")}
                                        disabled={isMinting || !user.loggedIn}
                                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                                            !user.loggedIn 
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                                : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm2-Farm3")
                                                ? 'bg-purple-600 text-white cursor-not-allowed'
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                    >
                                        {!user.loggedIn ? (
                                            'Connect Wallet'
                                        ) : (isMinting && mintingAgentType === "AutoCompoundOnly5P-Farm2-Farm3") ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Minting...
                                            </span>
                                        ) : (
                                            'Mint Premium Agent'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Smart Agent - Red Theme */}
                        <div className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 to-pink-900/20 border border-red-700/30 shadow-lg hover:shadow-red-400/20 hover:border-red-400 transition-all duration-300 hover:scale-[1.025] hover:z-10 backdrop-blur smart-agent-pulse">
                            <div className="flex flex-col gap-2 p-6 pb-2 h-full">
                                {/* Header Section */}
                                <div className="text-center">
                                    <h3 className="text-3xl font-bold text-white mb-2">Smart Agent</h3>
                                    <span className="inline-block px-4 py-2 text-sm font-semibold text-red-300 bg-red-400/10 rounded-full">
                                        AI-POWERED
                                    </span>
                                </div>

                                {/* Strategy Text */}
                                <div className="text-center mb-2">
                                    <p className="text-base font-semibold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-2">
                                        Strategy: HighestAPY, AutoCompound, RiskAdjustedYield
                                    </p>
                                </div>

                                {/* Features Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-red-800/30 rounded-lg">
                                        <div className="text-red-300 font-bold text-lg">
                                            {farmAPYs.smartAgent.current}%
                                            {farmAPYs.smartAgent.trend === 1 && (
                                                <svg className="w-4 h-4 text-green-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            )}
                                            {farmAPYs.smartAgent.trend === -1 && (
                                                <svg className="w-4 h-4 text-red-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="text-red-200 text-xs">Expected APY</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-800/30 rounded-lg">
                                        <div className="text-red-300 font-bold text-lg">94.2%</div>
                                        <div className="text-red-200 text-xs">Success Rate</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="text-left">
                                    <p className="text-sm text-gray-300 mb-4">
                                        Automatically hunts for the highest APY across all farms and migrates your funds for maximum yield, auto-compounding and sophisticated risk-adjusted yield optimization strategies.
                                    </p>
                                </div>

                                {/* Cost and Button */}
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <span className="text-yellow-400 font-bold text-lg">Cost - 200.00 USDC</span>
                                    </div>
                                    <button
                                        onClick={() => openMintModal("HighestAPY", 200.0)}
                                        disabled={isMinting || !user.loggedIn}
                                        className={`w-full py-4 rounded-xl text-lg font-bold text-white transition duration-300 shadow-lg ${
                                            !user.loggedIn 
                                                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                                : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 hover:scale-105'
                                        }`}
                                    >
                                        {!user.loggedIn ? (
                                            'Connect Wallet'
                                        ) : (isMinting && mintingAgentType === "HighestAPY") ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Minting Smart Agent...
                                            </span>
                                        ) : (
                                            'Mint Smart Agent'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full shadow-md backdrop-blur-md">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[#9CA3AF] text-sm">Smart Agents automate your yield — your DeFi, optimized.</span>
                    </div>
                </div>
            </main>
            
            {/* Mint Agent Modal */}
            <MintAgentModal
                isOpen={showMintModal}
                onClose={() => setShowMintModal(false)}
                agentType={selectedAgentType}
                agentCost={selectedAgentCost}
                farmId={selectedFarmId}
                onConfirm={handleMintConfirm}
            />
        </div>
    );
}

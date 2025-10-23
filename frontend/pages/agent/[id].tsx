import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import '../../flow.config'; // Ensure FCL config is loaded
import Header from '../../components/Header'; // Adjust path if needed
import ManageStrategyModal from '../../components/ManageStrategyModal'; // Import Modal

// Define types (ensure AgentStrategy matches modal and contract)
type FlowUser = { loggedIn: boolean | null; addr?: string | null; }
type PerformanceMetrics = { /* ... */ }

// Ensure FinancialMetrics includes totalProfit
type FinancialMetrics = {
    totalStaked: number; currentAPY: number; annualRewards: number;
    monthlyRewards: number; dailyRewards: number; totalProfit: number; // Added totalProfit
    profitPercentage: number; stakedFarm1: number; stakedFarm2: number; stakedFarm3: number;
}

// Define AgentStrategy type (matches contract)
type AgentStrategy = {
  strategyType: string;
  riskTolerance: string;
  allocationPercent: number;
  timeLockDays: number;
}

// Define AgentDetails type
type AgentDetails = {
    id: string; type: string; strategy: AgentStrategy; // Use the struct type
    description: string; emoji: string; status: string;
}

// --- Cadence Scripts ---
const getAgentsScript = `
  import AgentNFT from 0xf8d6e0586b0a20c7
  access(all) fun main(address: Address): [UInt64] {
      let account = getAccount(address)
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          return collectionRef.getIDs()
      }
      return []
  }
`;

const getAgentDetailsScript = `
  import AgentNFT from 0xf8d6e0586b0a20c7

  // Script to get agent details - returns a dictionary with agent data
  access(all) fun main(address: Address, agentID: UInt64): {String: String}? {
      let account = getAccount(address)
      if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
          // Avoid panics by confirming the ID exists before borrowing
          let ids = collectionRef.getIDs()
          var found: Bool = false
          for id in ids { if id == agentID { found = true } }
          if !found { return nil }
          let nftRef = collectionRef.borrowAgent(id: agentID)
          return {
              "strategyType": nftRef.strategy.strategyType,
              "riskTolerance": nftRef.strategy.riskTolerance,
              "allocationPercent": nftRef.strategy.allocationPercent.toString(),
              "timeLockDays": nftRef.strategy.timeLockDays.toString()
          }
      }
      return nil
  }
`;

// Update Strategy Transaction Code (as string)
const updateStrategyTx = `
    import AgentNFT from 0xf8d6e0586b0a20c7
    import FungibleToken from 0xFungibleToken

    // Transaction to update agent strategy
    transaction(agentID: UInt64, newStrategyType: String, newRisk: String, newAllocationPercent: UFix64, newTimeLockDays: UInt64) {

        prepare(signer: auth(Storage) &Account) {
            let collectionRef = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
                ?? panic("Could not borrow Agent Collection")

            // Borrow a mutable reference using borrowAgent
            let agentRef = collectionRef.borrowAgent(id: agentID)

            // Create the new Strategy struct
            let newStrategy = AgentNFT.Strategy(
                strategyType: newStrategyType,
                riskTolerance: newRisk,
                allocationPercent: newAllocationPercent,
                timeLockDays: newTimeLockDays
            )

            // Call the update function on the NFT
            agentRef.updateStrategy(newStrategy: newStrategy)

            log("Strategy updated for Agent #".concat(agentID.toString()))
        }
    }
`;


// --- (getFinancialMetricsScript remains the same - using mock) ---
const getFinancialMetricsScript = ` /* ... your mock script ... */ `;

export default function AgentDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [user, setUser] = useState<FlowUser>({ loggedIn: null });
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
    const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
    const [showPerformance, setShowPerformance] = useState(false);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    // Use AgentStrategy | null for currentStrategy state
    const [currentStrategy, setCurrentStrategy] = useState<AgentStrategy | null>(null);
    // Pause Agent state
    const [isPaused, setIsPaused] = useState(false);
    // Automation state
    // Analytics modal state
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

    useEffect(() => {
        // Always start connected for better UX
        setIsDemoMode(true);
        setUser({ loggedIn: true, addr: "0xf8d6e0586b0a20c7" });
    }, []);

    useEffect(() => {
        // Only redirect if user is explicitly logged out (not just null)
        if (user.loggedIn === false && !isDemoMode) { 
            router.push('/'); 
        }
    }, [user.loggedIn, router, isDemoMode]);

    // Fetch agent details (strategy) and financial metrics
    useEffect(() => {
        if (user.loggedIn === true && user.addr && id && router.isReady) {
            setIsLoadingDetails(true);
            const agentIdString = Array.isArray(id) ? id[0] : id;
            
            // Validate agent ID
            if (!agentIdString || agentIdString === 'undefined' || agentIdString === 'null') {
                console.error("Invalid agent ID:", agentIdString);
                setAgentDetails(null);
                setIsLoadingDetails(false);
                return;
            }
            
            const agentIdNum = parseInt(agentIdString, 10); // Use numeric ID for script
            
            // Validate parsed number
            if (isNaN(agentIdNum) || agentIdNum < 0) {
                console.error("Invalid agent ID number:", agentIdString, "parsed as:", agentIdNum);
                setAgentDetails(null);
                setIsLoadingDetails(false);
                return;
            }

            const fetchAllDetails = async () => {
                const addressToUse = isDemoMode ? "0xf8d6e0586b0a20c7" : user.addr!;
                let fetchedStrategyData: any = null; // Use 'any' temporarily for raw query result

                // Demo Mode: Use session data instead of chain
                if (isDemoMode) {
                    const stored = sessionStorage.getItem('demoMintedAgents');
                    const agents = stored ? JSON.parse(stored) : [];
                    const found = agents.find((a: any) => Number(a.id) === agentIdNum);
                    if (!found) {
                        setAgentDetails(null);
                        setCurrentStrategy(null);
                        setIsLoadingDetails(false);
                        return;
                    }
                    
                    // Check if agent is paused
                    const pausedAgents = JSON.parse(sessionStorage.getItem('pausedAgents') || '[]');
                    const isAgentPaused = pausedAgents.includes(agentIdString);
                    setIsPaused(isAgentPaused);
                    
                    const stratType = found.type as string;
                    const strategy: AgentStrategy = {
                        strategyType: stratType,
                        riskTolerance: stratType === 'HighestAPY' ? 'Medium' : 'Medium',
                        allocationPercent: stratType === 'AutoCompoundOnly15P' ? 50.0 : 50.0,
                        timeLockDays: 30
                    };
                    setCurrentStrategy(strategy);
                    const agentType = stratType === 'HighestAPY' ? 'Smart Agent' : 'Simple Agent';
                    const desc = stratType === 'HighestAPY' ? 'Moves funds...' : 'Compounds rewards...';
                    const emoji = stratType === 'HighestAPY' ? '🧠' : '🔄';
                    setAgentDetails({ id: agentIdString, strategy: strategy, type: agentType, description: desc, emoji: emoji, status: isAgentPaused ? 'Paused' : 'Active' });
                    setIsLoadingDetails(false);
                    return;
                }

                // Fetch Strategy Details with timeout (on-chain)
                try {
                    console.log(`Fetching strategy for agent ID: ${agentIdNum}`);
                    // Verify ownership first
                    const ownedIds: number[] = await fcl.query({
                        cadence: getAgentsScript,
                        args: (arg, t) => [arg(addressToUse, t.Address)],
                    });
                    if (!ownedIds.map((x) => Number(x)).includes(agentIdNum)) {
                        console.warn("Agent ID not owned by address:", agentIdNum, ownedIds);
                        setAgentDetails(null);
                        setCurrentStrategy(null);
                        setIsLoadingDetails(false);
                        return;
                    }
                    
                    // Add timeout to prevent hanging
                    const queryPromise = fcl.query({
                        cadence: getAgentDetailsScript,
                        args: (arg, t) => [arg(addressToUse, t.Address), arg(agentIdNum.toString(), t.UInt64)],
                    });
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Query timeout')), 10000)
                    );
                    
                    fetchedStrategyData = await Promise.race([queryPromise, timeoutPromise]);

                    if (fetchedStrategyData) {
                         // Convert numeric strings before creating the typed object
                         const strategy: AgentStrategy = {
                             strategyType: fetchedStrategyData.strategyType,
                             riskTolerance: fetchedStrategyData.riskTolerance,
                             allocationPercent: parseFloat(fetchedStrategyData.allocationPercent),
                             timeLockDays: parseInt(fetchedStrategyData.timeLockDays, 10)
                         };
                        setCurrentStrategy(strategy); // <-- Set the strategy state

                         // Construct AgentDetails for display
                         let agentType = strategy.strategyType === "HighestAPY" ? "Smart Agent" : "Simple Agent";
                         let desc = strategy.strategyType === "HighestAPY" ? "Moves funds..." : "Compounds rewards...";
                         let emoji = strategy.strategyType === "HighestAPY" ? "🧠" : "🔄";
                         setAgentDetails({
                            id: agentIdString, strategy: strategy, type: agentType,
                            description: desc, emoji: emoji, status: "Active"
                         });

                    } else {
                        console.error("Strategy details not found for ID:", agentIdString);
                        setAgentDetails(null); setCurrentStrategy(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch agent strategy:", error);
                    setAgentDetails(null);
                    setCurrentStrategy(null);
                }

                // Fetch Financial Metrics (Mock)
                try {
                     setFinancialMetrics({
                         totalStaked: 1000,
                         currentAPY: 12.5,
                         annualRewards: 125,
                         monthlyRewards: 10.42,
                         dailyRewards: 0.34,
                         totalProfit: 45.67,
                         profitPercentage: 4.57,
                         stakedFarm1: 400,
                         stakedFarm2: 350,
                         stakedFarm3: 250
                     });
                } catch (error) {
                     console.error("Failed to fetch financial metrics:", error);
                     setFinancialMetrics(null);
                }
                finally { setIsLoadingDetails(false); }
            };
            fetchAllDetails();
        }
    }, [user.loggedIn, user.addr, id, isDemoMode, router.isReady]);

    // ... (fetchPerformanceMetrics remains the same) ...
    const fetchPerformanceMetrics = async () => { /* ... */ };

    // --- Pause/Unpause Agent Functionality ---
    const handlePauseAgent = () => {
        const agentIdString = Array.isArray(id) ? id[0] : id;
        if (!agentIdString) return;
        
        const pausedAgents = JSON.parse(sessionStorage.getItem('pausedAgents') || '[]');
        
        if (isPaused) {
            // Unpause agent
            const updatedPausedAgents = pausedAgents.filter((id: string) => id !== agentIdString);
            sessionStorage.setItem('pausedAgents', JSON.stringify(updatedPausedAgents));
            setIsPaused(false);
            if (agentDetails) {
                setAgentDetails({...agentDetails, status: 'Active'});
            }
        } else {
            // Pause agent
            const updatedPausedAgents = [...pausedAgents, agentIdString];
            sessionStorage.setItem('pausedAgents', JSON.stringify(updatedPausedAgents));
            setIsPaused(true);
            if (agentDetails) {
                setAgentDetails({...agentDetails, status: 'Paused'});
            }
        }
    };

     // --- Updated handleSaveStrategy ---
     const handleSaveStrategy = async (newStrategy: AgentStrategy) => {
        console.log("Attempting to save strategy:", newStrategy);
        setIsModalOpen(false); // Close modal immediately for better UX

        // Check if user is connected
        if (!user.loggedIn) {
            console.log('⚠️ Please connect your wallet to update agent strategies.');
            return;
        }

       
        try {
            const agentIdString = Array.isArray(id) ? id[0] : id;
            
            // Validate agent ID
            if (!agentIdString || agentIdString === 'undefined' || agentIdString === 'null') {
                console.error("Invalid agent ID in update strategy:", agentIdString);
                console.log("⚠️ Invalid agent ID. Please try again.");
                return;
            }
            
            const agentIdNum = parseInt(agentIdString, 10);
            
            // Validate parsed number
            if (isNaN(agentIdNum) || agentIdNum < 0) {
                console.error("Invalid agent ID number in update strategy:", agentIdString, "parsed as:", agentIdNum);
                console.log("⚠️ Invalid agent ID. Please try again.");
                return;
            }
            
             // Ensure allocation is formatted correctly for UFix64
            const allocationStr = newStrategy.allocationPercent.toFixed(1); // e.g., "50.0"

            if (isDemoMode) {
                // Simulate in demo mode
                 await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
                 console.log("Demo mode: Strategy update simulated.");
                 console.log("✅ Strategy Saved! (Demo Mode)");
                 // Update local state visually
                 setCurrentStrategy(newStrategy);
                 if(agentDetails) setAgentDetails({...agentDetails, strategy: newStrategy});

            } else {
                 // Real transaction for logged-in users
                const txId = await fcl.mutate({
                    cadence: updateStrategyTx,
                    args: (arg, t) => [
                        arg(agentIdNum.toString(), t.UInt64),
                        arg(newStrategy.strategyType, t.String),
                        arg(newStrategy.riskTolerance, t.String),
                        arg(allocationStr, t.UFix64),
                        arg(newStrategy.timeLockDays.toString(), t.UInt64) // Pass UInt64 as string
                    ],
                    limit: 999
                });
                console.log("Update strategy transaction sent:", txId);
                await fcl.tx(txId).onceSealed();
                console.log("✅ Strategy updated successfully on chain!");
                // Update local state visually after confirmation
                setCurrentStrategy(newStrategy);
                if(agentDetails) setAgentDetails({...agentDetails, strategy: newStrategy});
            }

        } catch (error) {
            console.error("Failed to save strategy:", error);
            console.error("❌ Failed to save strategy. See console for details.");
            // Optionally revert local state if tx fails
            // setCurrentStrategy(agentDetails?.strategy || null);
        }
     };

    // Loading UI
    if (!router.isReady || user.loggedIn === null || isLoadingDetails) {
       return (
           <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white flex items-center justify-center">
               <div className="text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                   <p className="text-gray-300">Loading agent details...</p>
               </div>
           </div>
       );
    }

    // Error UI
     if (!agentDetails || !currentStrategy) {
       return (
           <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white flex items-center justify-center">
               <div className="text-center">
                   <div className="text-red-400 text-6xl mb-4">⚠️</div>
                   <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
                   <p className="text-gray-300 mb-6">The agent with ID {id} could not be found or loaded.</p>
                   <button 
                       onClick={() => router.push('/dashboard')}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                   >
                       Back to Dashboard
                   </button>
               </div>
           </div>
       );
    }

    const pnlIsPositive = financialMetrics ? financialMetrics.totalProfit >= 0 : false;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white">
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
                {/* Page Header with Total P&L in corner */}
                <div className="relative mb-8">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Agent Details
                        </h1>
                        <p className="text-base text-[#9CA3AF] mb-3 max-w-xl mx-auto">
                            Manage Strategy and View Your Agent's Performance
                        </p>
                    </div>
                    
                    {/* Total P&L in top-right corner */}
                    <div className="absolute top-0 right-0">
                        <div className="rounded-2xl bg-gray-800/80 border border-gray-700 shadow-lg p-4 backdrop-blur-sm">
                            <div>
                                <div className="text-gray-400 text-xs">Total P&L</div>
                                <div className={`text-xl font-bold ${
                                    (() => {
                                        // Smart Agents never show loss
                                        if (agentDetails?.strategy.strategyType === 'HighestAPY') {
                                            return 'text-green-400';
                                        }
                                        // Generate P&L with same logic as dashboard for Simple Agents
                                        const agentIndex = parseInt(agentDetails.id);
                                        const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                        return isNegative ? 'text-red-400' : 'text-green-400';
                                    })()
                                }`}>
                                    {(() => {
                                        // Smart Agents never show loss
                                        if (agentDetails?.strategy.strategyType === 'HighestAPY') {
                                            const profit = (Math.random() * 200 + 50).toFixed(2);
                                            return `+$${profit}`;
                                        }
                                        // Generate P&L with same logic as dashboard for Simple Agents
                                        const agentIndex = parseInt(agentDetails.id);
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
                                <div className={`text-xs font-semibold ${
                                    (() => {
                                        // Smart Agents never show loss
                                        if (agentDetails?.strategy.strategyType === 'HighestAPY') {
                                            return 'text-green-400';
                                        }
                                        // Generate P&L with same logic as dashboard for Simple Agents
                                        const agentIndex = parseInt(agentDetails.id);
                                        const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                        return isNegative ? 'text-red-400' : 'text-green-400';
                                    })()
                                }`}>
                                    {(() => {
                                        // Smart Agents never show loss
                                        if (agentDetails?.strategy.strategyType === 'HighestAPY') {
                                            const profitPercent = (Math.random() * 15 + 5).toFixed(1);
                                            return `+${profitPercent}%`;
                                        }
                                        // Generate percentage with same logic as dashboard for Simple Agents
                                        const agentIndex = parseInt(agentDetails.id);
                                        const isNegative = agentIndex >= 3 && agentIndex % 8 === 3; // Every 8th agent starting from index 3
                                        
                                        if (isNegative) {
                                            const lossPercent = -(Math.random() * 5 + 1).toFixed(1);
                                            return `${lossPercent}%`;
                                        } else {
                                            const profitPercent = (Math.random() * 15 + 5).toFixed(1);
                                            return `+${profitPercent}%`;
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agent Strategy Info */}
                <div className="mb-6">
                    <p className="text-lg text-gray-300"><span className="font-medium text-gray-100">Strategy:</span> {agentDetails.strategy.strategyType}</p>
                </div>

                {/* Action Buttons - Separated */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">

                    {/* View Analytics Button */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-xl p-6 hover:border-blue-600/70 transition-all duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-blue-100 mb-2">Analytics</h3>
                            <p className="text-blue-300/70 text-base mb-4">View detailed performance metrics</p>
                            
                            {/* Quick Stats Preview */}
                            <div className="bg-blue-800/30 rounded-lg p-3 mb-4">
                                <div className="text-blue-200 text-sm font-bold mb-2">Performance Overview</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center">
                                        <div className="text-blue-100 text-lg font-bold">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '94.2%' : '91.5%'}
                                        </div>
                                        <div className="text-blue-200 text-sm font-semibold">Success Rate</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-blue-100 text-lg font-bold">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '2.3m' : '1.2m'}
                                        </div>
                                        <div className="text-blue-200 text-sm font-semibold">Avg Time</div>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowAnalyticsModal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold text-base transition-colors duration-200"
                            >
                                View Analytics
                            </button>
                        </div>
                    </div>

                    {/* Edit Strategy Button */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-xl p-6 hover:border-purple-600/70 transition-all duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-purple-100 mb-2">Strategy</h3>
                            <p className="text-purple-300/70 text-base mb-4">Modify agent strategy</p>
                            
                            {/* Current Strategy Preview */}
                            <div className="bg-purple-800/30 rounded-lg p-3 mb-4">
                                <div className="text-purple-200 text-sm font-bold mb-2">Current Configuration</div>
                                <div className="text-center">
                                    <div className="text-purple-100 text-lg font-bold mb-1">
                                        {agentDetails?.strategy.strategyType === 'HighestAPY' ? 'Smart Agent' : 
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? 'Farm 2 (10% APY)' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? 'Farm 3 (15% APY)' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P' ? 'Farm 1 (5% APY)' : 'Simple Agent'}
                                    </div>
                                    <div className="text-purple-300/70 text-sm font-semibold">
                                        Risk: {agentDetails?.strategy.riskTolerance || 'Medium'} • 
                                        Allocation: {agentDetails?.strategy.allocationPercent || 50}%
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-bold text-base transition-colors duration-200"
                            >
                                Edit Strategy
                            </button>
                        </div>
                    </div>

                    {/* Custom Strategies Button */}
                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-700/50 rounded-xl p-6 hover:border-orange-600/70 transition-all duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-orange-100 mb-2">Custom Strategies</h3>
                            <p className="text-orange-300/70 text-base mb-4">Create personalized DeFi automation</p>
                            <div className="bg-orange-800/30 border border-orange-600/50 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-orange-200 font-bold text-sm">Coming Soon</span>
                                </div>
                            </div>
                            <button 
                                disabled
                                className="w-full bg-orange-600/50 text-orange-200 px-4 py-3 rounded-lg font-bold text-base cursor-not-allowed opacity-60"
                            >
                                Add Custom Strategy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pause Agent Section */}
                <div className="mb-10">
                    <div className="bg-gradient-to-br from-gray-800/20 to-gray-700/20 border border-gray-600/50 rounded-xl p-6 hover:border-gray-500/70 transition-all duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-100 mb-2">Agent Control</h3>
                            <p className="text-gray-300/70 text-base mb-4">
                                {isPaused ? 'Agent is currently paused' : 'Temporarily pause agent operations'}
                            </p>
                            
                            {/* Current Status Preview */}
                            <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                                <div className="text-gray-200 text-sm font-bold mb-2">Current Status</div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                                    <span className={`font-semibold ${isPaused ? 'text-orange-300' : 'text-green-300'}`}>
                                        {isPaused ? 'Paused' : 'Active'}
                                    </span>
                                </div>
                                <p className="text-gray-300/70 text-sm mt-1">
                                    {isPaused ? 'Agent operations are suspended' : 'Agent is running normally'}
                                </p>
                            </div>
                            
                            <button 
                                onClick={handlePauseAgent}
                                className={`w-full px-4 py-3 rounded-lg font-bold text-base transition-colors duration-200 ${
                                    isPaused 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                            >
                                {isPaused ? 'Resume Agent' : 'Pause Agent'}
                            </button>
                        </div>
                    </div>
                </div>


                {/* Farm Distribution */}
                {/* ... */}

                {/* Performance Section */}
                {/* ... */}
            </main>

            {/* --- ANALYTICS MODAL --- */}
            {showAnalyticsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#10182a] to-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Agent Analytics</h2>
                                <p className="text-gray-400">Detailed performance metrics for {agentDetails?.type}</p>
                            </div>
                            <button
                                onClick={() => setShowAnalyticsModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Analytics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {/* APY Performance Card */}
                                <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-green-400 text-2xl">📈</div>
                                        <div className="text-green-400 text-sm font-medium">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '+2.1%' : 
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? '+0.8%' :
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? '+1.2%' : '+0.5%'}
                                        </div>
                                    </div>
                                    <h3 className="text-green-100 text-lg font-semibold mb-1">Current APY</h3>
                                    <p className="text-green-300/70 text-sm mb-2">Annual percentage yield</p>
                                    <div className="text-3xl font-bold text-green-100">
                                        {agentDetails?.strategy.strategyType === 'HighestAPY' ? '18.7%' : 
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? '10.8%' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? '15.2%' : '5.5%'}
                                    </div>
                                    <div className="text-sm text-green-300/70 mt-1">Live rate</div>
                                </div>

                                {/* Compound Frequency Card */}
                                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-blue-400 text-2xl">🔄</div>
                                        <div className="text-blue-400 text-sm font-medium">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? 'Daily' : 'Every 6h'}
                                        </div>
                                    </div>
                                    <h3 className="text-blue-100 text-lg font-semibold mb-1">Compound Frequency</h3>
                                    <p className="text-blue-300/70 text-sm mb-2">Auto-compound interval</p>
                                    <div className="text-3xl font-bold text-blue-100">
                                        {agentDetails?.strategy.strategyType === 'HighestAPY' ? '24h' : 
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? '6h' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? '8h' : '12h'}
                                    </div>
                                    <div className="text-sm text-blue-300/70 mt-1">Next compound</div>
                                </div>

                                {/* Total Staked Card */}
                                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-purple-400 text-2xl">💰</div>
                                        <div className="text-green-400 text-sm font-medium">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '+15.3%' : '+8.7%'}
                                        </div>
                                    </div>
                                    <h3 className="text-purple-100 text-lg font-semibold mb-1">Total Staked</h3>
                                    <p className="text-purple-300/70 text-sm mb-2">Current position</p>
                                    <div className="text-3xl font-bold text-purple-100">
                                        {agentDetails?.strategy.strategyType === 'HighestAPY' ? '2,847 USDC' : 
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? '1,156 USDC' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? '1,789 USDC' : '856 USDC'}
                                    </div>
                                    <div className="text-sm text-purple-300/70 mt-1">Including rewards</div>
                                </div>

                                {/* Risk Level Card */}
                                <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-700/50 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-orange-400 text-2xl">⚠️</div>
                                        <div className={`text-sm font-medium ${
                                            agentDetails?.strategy.strategyType === 'HighestAPY' ? 'text-red-400' :
                                            agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? 'text-green-400' :
                                            agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? 'text-yellow-400' : 'text-orange-400'
                                        }`}>
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? 'High' :
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? 'Low' :
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? 'Medium' : 'High'}
                                        </div>
                                    </div>
                                    <h3 className="text-orange-100 text-lg font-semibold mb-1">Risk Level</h3>
                                    <p className="text-orange-300/70 text-sm mb-2">Strategy risk assessment</p>
                                    <div className="text-3xl font-bold text-orange-100">
                                        {agentDetails?.strategy.strategyType === 'HighestAPY' ? '8.2' : 
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? '2.1' :
                                         agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? '5.4' : '7.8'}
                                    </div>
                                    <div className="text-sm text-orange-300/70 mt-1">Out of 10</div>
                                </div>
                            </div>

                            {/* Performance Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Profit Trend Chart */}
                                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">Profit Trend</h3>
                                    <div className="h-64 flex items-end justify-between gap-2">
                                        {Array.from({ length: 14 }, (_, i) => {
                                            // Generate varied profit data with proper scaling
                                            const baseProfit = agentDetails?.strategy.strategyType === 'HighestAPY' ? 80 : 
                                                            agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm1' ? 50 : 
                                                            agentDetails?.strategy.strategyType === 'AutoCompoundOnly5P-Farm2' ? 65 : 40;
                                            
                                            // Create random variations
                                            const randomVariation = (Math.random() - 0.5) * 60; // ±30 variation
                                            const sineVariation = Math.sin(i * 0.8) * 20; // Some wave pattern
                                            
                                            // Calculate profit with proper range
                                            const profit = Math.max(5, baseProfit + randomVariation + sineVariation);
                                            
                                            // Scale height properly - max profit around 140 should give max height
                                            const maxExpectedProfit = 140;
                                            const height = Math.min((profit / maxExpectedProfit) * 200, 200);
                                            
                                            return (
                                                <div key={i} className="flex flex-col items-center flex-1">
                                                    <div 
                                                        className="bg-gradient-to-t from-green-600 to-green-400 rounded-t w-full transition-all duration-300 hover:from-green-500 hover:to-green-300"
                                                        style={{ 
                                                            height: `${height}px` 
                                                        }}
                                                        title={`Day ${i + 1}: $${profit.toFixed(0)} profit`}
                                                    ></div>
                                                    <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 text-sm text-gray-400 text-center">
                                        Daily profit over the last 14 days
                                    </div>
                                </div>

                                {/* Activity Timeline */}
                                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                                    <div className="space-y-4">
                                        {(() => {
                                            // Generate appropriate activities based on agent type
                                            if (agentDetails?.strategy.strategyType === 'HighestAPY') {
                                                // Smart Agent activities - reflecting actual backend functionality
                                                return [
                                                    { action: 'Rewards claimed from current farm', time: '2 hours ago', profit: '+$18.45', status: 'success' },
                                                    { action: 'APY analysis completed (Farm 1: 10%, Farm 2: 15%, Farm 3: 5%)', time: '1 day ago', profit: '+$32.67', status: 'success' },
                                                    { action: 'Best APY farm selected (Farm 2: 15%)', time: '3 days ago', profit: '+$12.90', status: 'success' },
                                                    { action: 'Rewards deposited to highest APY farm', time: '5 days ago', profit: '+$25.45', status: 'success' },
                                                    { action: 'Auto-compound cycle completed', time: '1 week ago', profit: '+$8.67', status: 'success' }
                                                ];
                                            } else if (agentDetails?.strategy.strategyType === 'RiskAdjustedYield') {
                                                // Risk-Adjusted Yield activities - reflecting actual backend functionality
                                                return [
                                                    { action: 'Rewards claimed from current farm', time: '2 hours ago', profit: '+$15.20', status: 'success' },
                                                    { action: 'Market volatility analysis (30%)', time: '1 day ago', profit: '+$28.45', status: 'success' },
                                                    { action: 'Risk-adjusted calculation completed', time: '3 days ago', profit: '+$11.80', status: 'success' },
                                                    { action: 'Best risk-adjusted farm selected', time: '5 days ago', profit: '+$22.15', status: 'success' },
                                                    { action: 'Rewards deposited to optimal farm', time: '1 week ago', profit: '+$7.90', status: 'success' }
                                                ];
                                            } else {
                                                // Simple Agent activities
                                                return [
                                                    { action: 'Auto-compound executed', time: '2 hours ago', profit: '+$12.34', status: 'success' },
                                                    { action: 'Rewards claimed', time: '1 day ago', profit: '+$8.67', status: 'success' },
                                                    { action: 'Compound cycle completed', time: '3 days ago', profit: '+$15.90', status: 'success' },
                                                    { action: 'Yield harvest', time: '5 days ago', profit: '+$23.45', status: 'success' },
                                                    { action: 'Farm rewards collected', time: '1 week ago', profit: '+$18.67', status: 'success' }
                                                ];
                                            }
                                        })().map((activity, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                    <div>
                                                        <p className="text-white font-medium">{activity.action}</p>
                                                        <p className="text-gray-400 text-sm">{activity.time}</p>
                                                    </div>
                                                </div>
                                                <div className="text-green-400 font-semibold">{activity.profit}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Performance Breakdown */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border border-indigo-700/50 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Strategy Performance Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-indigo-400 text-3xl mb-2">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '🧠' : 
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly15P' ? '🛡️' : '🔄'}
                                        </div>
                                        <h4 className="text-indigo-100 font-semibold mb-1">Strategy Type</h4>
                                        <p className="text-indigo-300/70 text-sm">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? 'Smart Agent (Highest APY)' : 
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly15P' ? 'Simple Agent (15% Compound)' : 'Simple Agent (5% Compound)'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-indigo-400 text-3xl mb-2">📈</div>
                                        <h4 className="text-indigo-100 font-semibold mb-1">Average APY</h4>
                                        <p className="text-indigo-300/70 text-sm">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '15.2%' : 
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly15P' ? '8.7%' : '5.4%'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-indigo-400 text-3xl mb-2">⏱️</div>
                                        <h4 className="text-indigo-100 font-semibold mb-1">Execution Time</h4>
                                        <p className="text-indigo-300/70 text-sm">
                                            {agentDetails?.strategy.strategyType === 'HighestAPY' ? '2.3 minutes' : 
                                             agentDetails?.strategy.strategyType === 'AutoCompoundOnly15P' ? '1.8 minutes' : '1.2 minutes'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --- END ANALYTICS MODAL --- */}

            {/* --- RENDER THE MODAL --- */}
            {currentStrategy && ( // Only render if strategy is loaded
                <ManageStrategyModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    agentId={id}
                    // Pass the full strategy object
                    initialStrategy={currentStrategy}
                    // Pass the save handler
                    onSave={handleSaveStrategy}
                    // Pass the agent type
                    agentType={agentDetails?.type}
                />
            )}
            {/* --- END MODAL --- */}
        </div>
    );
}
// FILE: cadence/transactions/auto_compound.cdc

import FungibleToken from "../contracts/FungibleToken.cdc"
import MockUSDC from "../contracts/MockUSDC.cdc"
import MockFarm from "../contracts/MockFarm.cdc"
import MockFarm2 from "../contracts/MockFarm2.cdc"
import MockFarm3 from "../contracts/MockFarm3.cdc"
import AgentNFT from "../contracts/AgentNFT.cdc"

// This transaction takes the ID of the agent to compound for.
transaction(agentID: UInt64) {

    // References we'll need in the prepare phase
    let agentRef: &AgentNFT.NFT
    let signerAddress: Address
    let farmRefs: {Address: &{FungibleToken.Receiver}} // Store references to all farms

    prepare(signer: auth(Storage, Capabilities) &Account) {
        let collectionRef = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
            ?? panic("Could not borrow Agent Collection")
        self.agentRef = collectionRef.borrowAgent(id: agentID)
        self.signerAddress = signer.address
        self.farmRefs = {}
        
        // Borrow Receiver Capabilities for all farms
        // Note: Assumes Receiver Caps published at these paths in setup
        let farm1Cap = signer.capabilities.borrow<&{FungibleToken.Receiver}>(/public/MockFarmReceiver) 
                       ?? panic("Could not borrow MockFarm Receiver Cap") 
        let farm2Cap = signer.capabilities.borrow<&{FungibleToken.Receiver}>(/public/MockFarm2Receiver) 
                       ?? panic("Could not borrow MockFarm2 Receiver Cap")
        let farm3Cap = signer.capabilities.borrow<&{FungibleToken.Receiver}>(/public/MockFarm3Receiver) 
                       ?? panic("Could not borrow MockFarm3 Receiver Cap")
        
        // Use the main account address as keys for now. Replace if farms deployed elsewhere.
        self.farmRefs[0xf8d6e0586b0a20c7] = farm1Cap 
        // For now, using the same address for all farms since they're deployed to the same account
        // In a real implementation, these would be different addresses
        self.farmRefs[0xf8d6e0586b0a20c7] = farm2Cap 
        self.farmRefs[0xf8d6e0586b0a20c7] = farm3Cap
    }

    execute {
        log("Executing auto-compound for Agent #".concat(agentID.toString()))
        log("Agent Strategy Type: ".concat(self.agentRef.strategy.strategyType))

        // --- Claim Rewards ---
        // Assume agent is in MockFarm for now. Needs refinement.
        let currentFarmAddress: Address = 0xf8d6e0586b0a20c7 
        let currentFarm = getAccount(currentFarmAddress).contracts.borrow<&MockFarm>(name: "MockFarm")
                         ?? panic("Could not borrow current farm contract")
        
        let rewardsVault <- currentFarm.claimRewards(userAddress: self.signerAddress)
        let rewardAmount = rewardsVault.balance
        log("Claimed rewards. Amount: ".concat(rewardAmount.toString()))

        // --- Decide Where to Deposit ---
        var targetFarmAddress: Address = currentFarmAddress 

        if self.agentRef.strategy.strategyType == "HighestAPY" {
            log("HighestAPY strategy selected. Checking APYs...")
            
            // Hardcoded APYs for demo purposes
            let farm1APY: UFix64 = 0.10 
            let farm2APY: UFix64 = 0.15 
            let farm3APY: UFix64 = 0.05 
            
            // Find the farm with the highest APY
            var highestApy: UFix64 = farm1APY
            var bestFarmAddress: Address = currentFarmAddress
            
            if farm2APY > highestApy {
                highestApy = farm2APY
                bestFarmAddress = 0xf8d6e0586b0a20c7 // MockFarm2 address (same for now)
            }
            
            if farm3APY > highestApy {
                highestApy = farm3APY
                bestFarmAddress = 0xf8d6e0586b0a20c7 // MockFarm3 address (same for now)
            }
            
            log("Best APY found: ".concat(highestApy.toString()).concat(" at address: ").concat(bestFarmAddress.toString()))
            targetFarmAddress = bestFarmAddress
        } else if self.agentRef.strategy.strategyType == "RiskAdjustedYield" {
            log("RiskAdjustedYield strategy selected. Analyzing risk-adjusted returns...")
            
            // Simulate market volatility (0.0 = low volatility, 1.0 = high volatility)
            let marketVolatility: UFix64 = 0.3 // Simulated low volatility for demo
            
            // Hardcoded APYs for demo purposes
            let farm1APY: UFix64 = 0.10  // Stable farm
            let farm2APY: UFix64 = 0.15  // High yield farm
            let farm3APY: UFix64 = 0.05  // Conservative farm
            
            // Risk-adjusted calculation: APY - (volatility * risk_penalty)
            let riskPenalty: UFix64 = 0.05
            let farm1RiskAdjusted: UFix64 = farm1APY - (marketVolatility * riskPenalty)
            let farm2RiskAdjusted: UFix64 = farm2APY - (marketVolatility * riskPenalty * 2.0) // Higher penalty for high yield
            let farm3RiskAdjusted: UFix64 = farm3APY - (marketVolatility * riskPenalty * 0.5) // Lower penalty for conservative
            
            // Find the farm with the best risk-adjusted return
            var bestRiskAdjusted: UFix64 = farm1RiskAdjusted
            var bestFarmAddress: Address = currentFarmAddress
            
            if farm2RiskAdjusted > bestRiskAdjusted {
                bestRiskAdjusted = farm2RiskAdjusted
                bestFarmAddress = 0xf8d6e0586b0a20c7 // MockFarm2 address (same for now)
            }
            
            if farm3RiskAdjusted > bestRiskAdjusted {
                bestRiskAdjusted = farm3RiskAdjusted
                bestFarmAddress = 0xf8d6e0586b0a20c7 // MockFarm3 address (same for now)
            }
            
            log("Best risk-adjusted return: ".concat(bestRiskAdjusted.toString()).concat(" at address: ").concat(bestFarmAddress.toString()))
            log("Market volatility: ".concat(marketVolatility.toString()))
            targetFarmAddress = bestFarmAddress
        } else {
            log("AutoCompoundOnly strategy selected. Depositing to current farm.")
        }

        // --- Deposit Rewards ---
        // Get the receiver capability for the target farm
        let targetFarmReceiver = self.farmRefs[targetFarmAddress] 
                                ?? panic("Could not find receiver reference for target farm")

        // Deposit the rewards vault into the target farm
        targetFarmReceiver.deposit(from: <-rewardsVault)

        log("Rewards successfully deposited to farm at ".concat(targetFarmAddress.toString()))
    }
}
// FILE: cadence/contracts/AgentNFT.cdc

// Import necessary contracts using relative paths
import FungibleToken from "./FungibleToken.cdc"

access(all) contract AgentNFT {

    access(all) var totalSupply: UInt64

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event AgentMinted(id: UInt64, strategy: Strategy, cost: UFix64)
    access(all) event AgentStrategyUpdated(id: UInt64)

    // --- Strategy Struct ---
    access(all) struct Strategy {
        access(all) let strategyType: String
        access(all) let riskTolerance: String
        access(all) let allocationPercent: UFix64
        access(all) let timeLockDays: UInt64

        init(strategyType: String, riskTolerance: String, allocationPercent: UFix64, timeLockDays: UInt64) {
            pre {
                allocationPercent >= 0.0 && allocationPercent <= 100.0 : "Allocation must be between 0.0 and 100.0"
                // Basic check for risk tolerance values
                (riskTolerance == "Low" || riskTolerance == "Medium" || riskTolerance == "High") : "Invalid risk tolerance"
            }
            self.strategyType = strategyType
            self.riskTolerance = riskTolerance
            self.allocationPercent = allocationPercent
            self.timeLockDays = timeLockDays
        }
    }

    // --- Agent NFT Resource ---
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) var strategy: Strategy

        access(all) fun updateStrategy(newStrategy: Strategy) {
            self.strategy = newStrategy
            emit AgentStrategyUpdated(id: self.id)
        }

        init(initID: UInt64, strategy: Strategy) {
            self.id = initID
            self.strategy = strategy
        }
    }

    // --- Collection Resource ---
    access(all) resource Collection {
        access(all) var ownedNFTs: @{UInt64: AgentNFT.NFT}

        access(all) fun withdraw(withdrawID: UInt64): @AgentNFT.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("NFT not found")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @AgentNFT.NFT) {
            let nft <- token
            let id = nft.id
            let oldToken <- self.ownedNFTs[id] <- nft
            if self.owner?.address != nil {
                emit Deposit(id: id, to: self.owner?.address)
            }
            destroy oldToken
        }

        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // Borrow a mutable reference to our specific AgentNFT.NFT resource
        access(all) fun borrowAgent(id: UInt64): &AgentNFT.NFT {
             if self.ownedNFTs[id] == nil {
                 panic("NFT does not exist in the collection")
             }
            // Correctly borrow the reference without extra checks needed here
            return &self.ownedNFTs[id] as &AgentNFT.NFT? ?? panic("Could not borrow agent reference")
        }

        init() {
            self.ownedNFTs <- {}
        }
    }

    // Return the concrete Collection type
    access(all) fun createEmptyCollection(): @AgentNFT.Collection {
        return <- create Collection()
    }

    // --- Minter Resource ---
    access(all) resource Minter {
        // Demo minting function that doesn't require payment
        access(all) fun mintNFTDemo(strategy: Strategy): @AgentNFT.NFT {
            let newID = AgentNFT.totalSupply
            let newNFT <- create NFT(initID: newID, strategy: strategy)
            AgentNFT.totalSupply = AgentNFT.totalSupply + 1
            
            // Calculate cost for logging purposes
            let simpleCost15P: UFix64 = 8.0
            let smartCost: UFix64 = 200.0
            let simpleCost5P: UFix64 = 50.0
            let farm1Cost: UFix64 = 100.0
            let farm2Cost: UFix64 = 150.0

            var requiredCost = simpleCost5P
            if strategy.strategyType == "HighestAPY" {
                requiredCost = smartCost
            } else if strategy.strategyType == "RiskAdjustedYield" {
                requiredCost = smartCost
            } else if strategy.strategyType == "AutoCompoundOnly15P" {
                 requiredCost = simpleCost15P
            } else if strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
                 requiredCost = farm1Cost
            } else if strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
                 requiredCost = farm2Cost
            }
            
            emit AgentMinted(id: newID, strategy: strategy, cost: requiredCost)
            return <-newNFT
        }
    }

    // Public minting function that doesn't require Minter resource
    access(all) fun mintNFT(strategy: Strategy): @AgentNFT.NFT {
        let newID = AgentNFT.totalSupply
        let newNFT <- create NFT(initID: newID, strategy: strategy)
        AgentNFT.totalSupply = AgentNFT.totalSupply + 1
        
        // Calculate cost for logging purposes
        let simpleCost15P: UFix64 = 8.0
        let smartCost: UFix64 = 200.0
        let simpleCost5P: UFix64 = 50.0
        let farm1Cost: UFix64 = 100.0
        let farm2Cost: UFix64 = 150.0

        var requiredCost = simpleCost5P
        if strategy.strategyType == "HighestAPY" {
            requiredCost = smartCost
        } else if strategy.strategyType == "RiskAdjustedYield" {
            requiredCost = smartCost
        } else if strategy.strategyType == "AutoCompoundOnly15P" {
             requiredCost = simpleCost15P
        } else if strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
             requiredCost = farm1Cost
        } else if strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
             requiredCost = farm2Cost
        }
        
        emit AgentMinted(id: newID, strategy: strategy, cost: requiredCost)
        return <-newNFT
    }

    init() {
        self.totalSupply = 0
        self.account.storage.save(<-create Minter(), to: /storage/AgentNFTMinter)
        emit ContractInitialized()
    }
}
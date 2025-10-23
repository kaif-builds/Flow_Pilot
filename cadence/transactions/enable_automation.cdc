// enable_automation.cdc
// Transaction to enable Forte Actions automation for an agent

import AgentNFT from "../contracts/AgentNFT.cdc"
import ForteTransactionScheduler from "../contracts/ForteTransactionScheduler.cdc"

transaction(agentID: UInt64) {
    
    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // Get the agent NFT
        let collectionRef = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
            ?? panic("Could not borrow Agent Collection")
        
        let agentRef = collectionRef.borrowAgent(id: agentID)
        
        // Get or create user scheduler
        if signer.storage.borrow<&ForteTransactionScheduler.UserScheduler>(from: /storage/ForteTransactionSchedulerUser) == nil {
            let userScheduler <- ForteTransactionScheduler.createUserScheduler()
            signer.storage.save(<-userScheduler, to: /storage/ForteTransactionSchedulerUser)
            
            // Publish capability
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&ForteTransactionScheduler.UserScheduler>(/storage/ForteTransactionSchedulerUser),
                at: /public/ForteTransactionSchedulerUser
            )
        }
        
        let userScheduler = signer.storage.borrow<&ForteTransactionScheduler.UserScheduler>(from: /storage/ForteTransactionSchedulerUser)
            ?? panic("Could not borrow User Scheduler")
        
        // Determine schedule based on agent strategy
        var scheduleInterval: UFix64 = 3600.0 // Default: 1 hour
        
        if agentRef.strategy.strategyType == "HighestAPY" {
            scheduleInterval = 300.0 // Smart Agents: 5 minutes
        } else if agentRef.strategy.strategyType == "RiskAdjustedYield" {
            scheduleInterval = 600.0 // Risk-adjusted: 10 minutes
        } else if agentRef.strategy.strategyType == "AutoCompoundOnly15P" {
            scheduleInterval = 1800.0 // Premium Simple: 30 minutes
        } else if agentRef.strategy.strategyType == "AutoCompoundOnly5P-Farm1" {
            scheduleInterval = 3600.0 // Farm 1: 1 hour
        } else if agentRef.strategy.strategyType == "AutoCompoundOnly5P-Farm2" {
            scheduleInterval = 3600.0 // Farm 2: 1 hour
        } else {
            scheduleInterval = 7200.0 // Simple Agents: 2 hours
        }
        
        // Calculate next execution time
        let currentTime = getCurrentBlock().timestamp
        let nextExecutionTime = currentTime + scheduleInterval
        
        // Create the auto-compound transaction string
        let autoCompoundTransaction = "transaction(agentID: UInt64) { prepare(signer: auth(Storage, Capabilities) &Account) { log(\"Auto-compound executed for Agent \".concat(agentID.toString())); } }"
        
        // Schedule the transaction
        let scheduledID = userScheduler.scheduleTransaction(
            priority: ForteTransactionScheduler.Priority.Medium,
            scheduledAt: nextExecutionTime,
            transactionData: autoCompoundTransaction
        )
        
        log("Automation enabled for Agent ".concat(agentID.toString()).concat(" with ID: ").concat(scheduledID.toString()))
        log("Next execution scheduled for: ".concat(nextExecutionTime.toString()))
    }
    
    execute {
        log("Agent automation setup completed successfully")
    }
}

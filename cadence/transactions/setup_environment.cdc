// FILE: cadence/transactions/setup_environment.cdc
// Updated to work with current contract state and Forte Actions

import AgentNFT from "../contracts/AgentNFT.cdc"
import ForteTransactionScheduler from "../contracts/ForteTransactionScheduler.cdc"

transaction {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // Set up Agent NFT Collection if it doesn't exist
        if signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection) == nil {
            signer.storage.save(<-AgentNFT.createEmptyCollection(), to: /storage/AgentNFTCollection)
            let _ = signer.capabilities.unpublish(/public/AgentNFTCollection)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&AgentNFT.Collection>(/storage/AgentNFTCollection),
                at: /public/AgentNFTCollection
            )
            log("Agent NFT Collection created and published")
        } else {
            log("Agent NFT Collection already exists")
        }
        
        // Set up ForteTransactionScheduler User Scheduler if it doesn't exist
        if signer.storage.borrow<&ForteTransactionScheduler.UserScheduler>(from: /storage/ForteTransactionSchedulerUser) == nil {
            let userScheduler <- ForteTransactionScheduler.createUserScheduler()
            signer.storage.save(<-userScheduler, to: /storage/ForteTransactionSchedulerUser)
            
            // Publish capability
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&ForteTransactionScheduler.UserScheduler>(/storage/ForteTransactionSchedulerUser),
                at: /public/ForteTransactionSchedulerUser
            )
            log("ForteTransactionScheduler User Scheduler created and published")
        } else {
            log("ForteTransactionScheduler User Scheduler already exists")
        }
        
        log("Environment setup complete - Agent NFT and Forte Actions functionality ready")
        log("Note: MockUSDC vault setup skipped due to recovered contract state")
        log("Balance tracking uses dynamic calculation based on minted agents")
    }

    execute {
        // No actions needed in execute phase for this setup
    }
}
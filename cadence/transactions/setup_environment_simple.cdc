// FILE: cadence/transactions/setup_environment_simple.cdc
// Simplified setup that works with current contract state

import AgentNFT from "../contracts/AgentNFT.cdc"

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
        
        log("Environment setup complete - Agent NFT functionality ready")
    }

    execute {
        // No actions needed in execute phase
    }
}

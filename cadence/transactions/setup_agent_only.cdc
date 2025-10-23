import AgentNFT from "../contracts/AgentNFT.cdc"

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Set up Agent NFT Collection
        if signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection) == nil {
            signer.storage.save(<-AgentNFT.createEmptyCollection(), to: /storage/AgentNFTCollection)
            let _ = signer.capabilities.unpublish(/public/AgentNFTCollection)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&AgentNFT.Collection>(/storage/AgentNFTCollection),
                at: /public/AgentNFTCollection
            )
            log("Agent NFT Collection set up successfully")
        } else {
            log("Agent NFT Collection already exists")
        }
    }
}

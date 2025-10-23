import AgentNFT from "../contracts/AgentNFT.cdc"

// This script reads the IDs of an account's Agent NFTs
access(all) fun main(address: Address): [UInt64] {
    // Get the public account object for the specified address
    let account = getAccount(address)

    // Check if the account has an AgentNFT collection capability
    if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
        // Return the array of NFT IDs from the collection
        return collectionRef.getIDs()
    } else {
        // Return empty array if no collection exists
        return []
    }
}
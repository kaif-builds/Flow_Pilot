import AgentNFT from "../contracts/AgentNFT.cdc"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    // Start with base balance
    var balance: UFix64 = 100.0
    
    // Get the user's agent collection
    if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
        let agentIDs = collectionRef.getIDs()
        
        // Subtract the cost of each minted agent from the balance
        for agentID in agentIDs {
            let nftRef = collectionRef.borrowAgent(id: agentID)
            
            // Subtract the minting cost based on agent type
            if nftRef.strategy.strategyType == "HighestAPY" {
                balance = balance - 15.0
            } else if nftRef.strategy.strategyType == "RiskAdjustedYield" {
                balance = balance - 15.0
            } else if nftRef.strategy.strategyType == "AutoCompoundOnly15P" {
                balance = balance - 8.0
            } else {
                balance = balance - 3.0
            }
        }
    }
    
    return balance
}

// FILE: cadence/scripts/get_agent_details.cdc

import AgentNFT from "../contracts/AgentNFT.cdc"

// This script gets the details of a specific agent NFT
access(all) fun main(address: Address, agentID: UInt64): {String: String} {
    let account = getAccount(address)
    
    if let collectionRef = account.capabilities.borrow<&AgentNFT.Collection>(/public/AgentNFTCollection) {
        let nftRef = collectionRef.borrowAgent(id: agentID)
        
        // Determine agent type based on strategy
        var agentType: String = ""
        var strategyDescription: String = ""
        var agentEmoji: String = ""
        
        if nftRef.strategy.strategyType == "HighestAPY" {
            agentType = "Smart Agent"
            strategyDescription = "Automatically finds and moves to the farm with the highest APY"
            agentEmoji = "🧠"
        } else if nftRef.strategy.strategyType == "RiskAdjustedYield" {
            agentType = "Smart Agent"
            strategyDescription = "Intelligently balances yield optimization with risk management"
            agentEmoji = "⚖️"
        } else {
            agentType = "Simple Agent"
            strategyDescription = "Automatically compounds rewards in the current farm"
            agentEmoji = "🔄"
        }
        
        return {
            "id": agentID.toString(),
            "type": agentType,
            "strategy": nftRef.strategy.strategyType,
            "description": strategyDescription,
            "emoji": agentEmoji,
            "status": "Active"
        }
    } else {
        panic("Agent NFT not found")
    }
}
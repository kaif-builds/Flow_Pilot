// FILE: cadence/transactions/update_strategy.cdc

import AgentNFT from "../contracts/AgentNFT.cdc"

transaction(agentID: UInt64, newStrategyType: String, newRisk: String, newAllocation: UFix64, newTimeLock: UInt64) {

    prepare(signer: auth(Storage) &Account) {
        // Borrow the user's NFT Collection
        let collectionRef = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
            ?? panic("Could not borrow Agent Collection")

        // Borrow a mutable reference to the specific Agent NFT
        let agent = collectionRef.borrowAgent(id: agentID)

        // Create the new Strategy struct
        let newStrategy = AgentNFT.Strategy(
            strategyType: newStrategyType,
            riskTolerance: newRisk,
            allocationPercent: newAllocation,
            timeLockDays: newTimeLock
        )

        // Call the update function on the NFT
        agent.updateStrategy(newStrategy: newStrategy)

        log("Strategy updated for Agent #".concat(agentID.toString()))
    }
}
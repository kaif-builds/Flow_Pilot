// FILE: cadence/transactions/mint_agent.cdc

import AgentNFT from "../contracts/AgentNFT.cdc"
import MockUSDC from "../contracts/MockUSDC.cdc"
import FungibleToken from "../contracts/FungibleToken.cdc"

// Transaction to mint a new agent NFT
transaction(strategyType: String, riskTolerance: String, allocationPercent: UFix64, timeLockDays: UInt64, paymentAmount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        // Setup collection if needed (same as before)
        if signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection) == nil {
            signer.storage.save(<-AgentNFT.createEmptyCollection(), to: /storage/AgentNFTCollection)
            let _ = signer.capabilities.unpublish(/public/AgentNFTCollection)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&AgentNFT.Collection>(/storage/AgentNFTCollection),
                at: /public/AgentNFTCollection
            )
        }

        let collection = signer.storage.borrow<&AgentNFT.Collection>(from: /storage/AgentNFTCollection)
            ?? panic("Could not borrow Collection")

        // Create the Strategy struct
        let strategy = AgentNFT.Strategy(
            strategyType: strategyType,
            riskTolerance: riskTolerance,
            allocationPercent: allocationPercent,
            timeLockDays: timeLockDays
        )

        // Mint the NFT using the public minting function
        let newNFT <- AgentNFT.mintNFT(strategy: strategy)
        let nftID = newNFT.id
        
        collection.deposit(token: <-newNFT)

        log("New Agent NFT minted with ID: ".concat(nftID.toString()).concat(" and strategy: ").concat(strategyType))
    }
}
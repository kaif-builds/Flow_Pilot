import FungibleToken from "../contracts/FungibleToken.cdc"
import MockUSDC from "../contracts/MockUSDC.cdc"

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Set up MockUSDC vault if it doesn't exist
        if signer.storage.borrow<&MockUSDC.Vault>(from: /storage/MockUSDCVault) == nil {
            signer.storage.save(<-MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>()), to: /storage/MockUSDCVault)
            
            // Publish the receiver capability
            let _ = signer.capabilities.unpublish(/public/MockUSDCReceiver)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{FungibleToken.Receiver, FungibleToken.Balance}>(/storage/MockUSDCVault),
                at: /public/MockUSDCReceiver
            )
            log("MockUSDC vault created and receiver published")
        } else {
            log("MockUSDC vault already exists")
        }
    }
    
    execute {
        log("MockUSDC setup complete")
    }
}

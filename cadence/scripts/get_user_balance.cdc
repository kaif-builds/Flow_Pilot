import FungibleToken from "../contracts/FungibleToken.cdc"
import MockUSDC from "../contracts/MockUSDC.cdc"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    if let vaultRef = account.capabilities.borrow<&MockUSDC.Vault>(/public/MockUSDCReceiver) {
        return vaultRef.balance
    } else {
        // Return demo balance when vault doesn't exist
        return 100.0
    }
}

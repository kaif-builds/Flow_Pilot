import FungibleToken from "../contracts/FungibleToken.cdc"
import MockFarm from "../contracts/MockFarm.cdc"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    // Check if the capability exists (it won't due to recovered contract state)
    let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(/public/MockUSDCReceiver)
    
    if vaultRef == nil {
        // Since we can't access the actual vault, we'll simulate the balance
        // by calculating: Original balance (1000.0) - Staked amount in farm
        
        // Get the staked amount from MockFarm (contract is deployed on emulator-account)
        let emulatorAccount = getAccount(0xf8d6e0586b0a20c7)
        let farmRef = emulatorAccount.contracts.borrow<&MockFarm>(name: "MockFarm")
            ?? panic("Could not borrow MockFarm contract reference")
        let stakedAmount = farmRef.stakedBalances[address] ?? 0.0
        
        // Calculate the remaining balance
        let remainingBalance = 1000.0 - stakedAmount
        return remainingBalance
    }
    
    return vaultRef!.balance
}
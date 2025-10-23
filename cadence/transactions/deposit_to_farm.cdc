// FILE: cadence/transactions/deposit_to_farm.cdc

import FungibleToken from "../contracts/FungibleToken.cdc"
import MockUSDC from "../contracts/MockUSDC.cdc"
import MockFarm from "../contracts/MockFarm.cdc"

transaction(amount: UFix64) {

    // These declarations are now correctly INSIDE the transaction block.
    let farmRef: &MockFarm
    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        // Get a reference to the deployed MockFarm contract
        self.farmRef = signer.contracts.borrow<&MockFarm>(name: "MockFarm")
            ?? panic("Could not borrow a reference to the MockFarm contract")
        
        // Save the signer's address to use in the execute phase
        self.signerAddress = signer.address
    }

    execute {
        // Use the direct deposit function to work around vault authorization issues
        self.farmRef.depositDirect(userAddress: self.signerAddress, amount: amount)

        log("Successfully deposited ".concat(amount.toString()).concat(" MockUSDC into the farm."))
    }
}
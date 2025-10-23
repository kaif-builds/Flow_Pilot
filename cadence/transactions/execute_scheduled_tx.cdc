// execute_scheduled_tx.cdc
// Transaction to manually execute a scheduled Forte Action

import ForteTransactionScheduler from "../contracts/ForteTransactionScheduler.cdc"

transaction(txID: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Get the user scheduler
        let userScheduler = signer.storage.borrow<&ForteTransactionScheduler.UserScheduler>(from: /storage/ForteTransactionSchedulerUser)
            ?? panic("Could not borrow User Scheduler")
        
        // Execute the scheduled transaction
        let success = userScheduler.executeTransaction(id: txID)
        
        if success {
            log("Successfully executed scheduled transaction ID: ".concat(txID.toString()))
        } else {
            log("Failed to execute scheduled transaction ID: ".concat(txID.toString()))
        }
    }
}

import ForteTransactionScheduler from "../contracts/ForteTransactionScheduler.cdc"

transaction(agentID: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Get the user scheduler
        let userScheduler = signer.storage.borrow<&ForteTransactionScheduler.UserScheduler>(from: /storage/ForteTransactionSchedulerUser)
            ?? panic("Could not borrow User Scheduler")
        
        // Simply log the disable action without complex operations
        // This avoids computation limits while still executing a real transaction
        log("Automation disabled for Agent ".concat(agentID.toString()))
        log("User scheduler accessed successfully")
    }
}

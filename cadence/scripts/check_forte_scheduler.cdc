// check_forte_scheduler.cdc
// Script to check Forte Actions scheduler status

import ForteTransactionScheduler from "../contracts/ForteTransactionScheduler.cdc"

access(all) fun main(userAddress: Address): String {
    let account = getAccount(userAddress)
    
    // Try to borrow the user scheduler
    if let userScheduler = account.capabilities.borrow<&ForteTransactionScheduler.UserScheduler>(/public/ForteTransactionSchedulerUser) {
        let scheduledTransactions = userScheduler.getAllScheduledTransactions()
        
        var result = "Forte Actions Status:\n"
        result = result.concat("Total Scheduled Transactions: ").concat(scheduledTransactions.length.toString()).concat("\n")
        
        for tx in scheduledTransactions {
            result = result.concat("ID: ").concat(tx.id.toString()).concat(" | Priority: ").concat(tx.priority.rawValue.toString()).concat(" | Scheduled At: ").concat(tx.scheduledAt.toString()).concat("\n")
        }
        
        return result
    } else {
        return "No Forte Actions scheduler found for this user"
    }
}
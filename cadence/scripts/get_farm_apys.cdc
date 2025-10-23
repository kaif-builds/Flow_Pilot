// FILE: cadence/scripts/get_farm_apys.cdc

// This script returns the current (mock) APYs for our farms.
// In a real app, this would read data from the farm contracts.

access(all) fun main(): {Address: UFix64} {
    // Replace these addresses with the actual addresses where your farms
    // get deployed if they are different from the emulator-account.
    // For now, we assume they are all on the same account.
    let farm1Address: Address = 0xf8d6e0586b0a20c7
    let farm2Address: Address = 0xf8d6e0586b0a20c7 // Assuming deployed to same account
    let farm3Address: Address = 0xf8d6e0586b0a20c7 // Assuming deployed to same account

    // Hardcoded APYs for the demo
    let farm1APY: UFix64 = 0.10 // 10%
    let farm2APY: UFix64 = 0.15 // 15%
    let farm3APY: UFix64 = 0.05 // 5%

    return {
        farm1Address: farm1APY,
        farm2Address: farm2APY,
        farm3Address: farm3APY
    }
}
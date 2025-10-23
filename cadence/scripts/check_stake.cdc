// FILE: cadence/scripts/check_stake.cdc

import MockFarm from "../contracts/MockFarm.cdc"

// This script checks the staked balance of an account in the MockFarm.
access(all) fun main(address: Address): UFix64 {
    return MockFarm.stakedBalances[address] ?? 0.0
}
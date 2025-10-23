// FILE: cadence/contracts/MockFarm3.cdc

import FungibleToken from "./FungibleToken.cdc"
import MockUSDC from "./MockUSDC.cdc"

// Renamed to MockFarm3
access(all) contract MockFarm3 {
    access(all) var stakedBalances: {Address: UFix64}
    access(self) var rewardsVault: @MockUSDC.Vault?

    access(all) resource Admin {
        access(all) fun depositRewards(from: @MockUSDC.Vault) {
            if let vault = &MockFarm3.rewardsVault as &MockUSDC.Vault? {
                vault.deposit(from: <-from)
            } else {
                destroy from
                panic("Rewards vault not initialized")
            }
        }
        
        access(all) fun initializeRewardsVault(vault: @MockUSDC.Vault) {
            if MockFarm3.rewardsVault == nil {
                MockFarm3.rewardsVault <-! vault
            } else {
                destroy vault
                panic("Rewards vault already initialized")
            }
        }
    }

    access(all) fun deposit(from: @{FungibleToken.Vault}) {
        let vault <- from as! @MockUSDC.Vault
        let userAddress = vault.owner!.address
        let currentBalance = MockFarm3.stakedBalances[userAddress] ?? 0.0
        MockFarm3.stakedBalances[userAddress] = currentBalance + vault.balance
        destroy vault
    }
    
    access(all) fun depositDirect(userAddress: Address, amount: UFix64) {
        let currentBalance = MockFarm3.stakedBalances[userAddress] ?? 0.0
        MockFarm3.stakedBalances[userAddress] = currentBalance + amount
    }

    access(all) fun claimRewards(userAddress: Address): @{FungibleToken.Vault} {
        let stakedAmount = self.stakedBalances[userAddress] ?? 0.0
        
        if stakedAmount == 0.0 {
            return <-MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        }
        
        // CHANGED: Reward rate is now 5%
        let rewardAmount = stakedAmount * 0.05
        
        let rewardVault <- MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        log("Calculated reward: ".concat(rewardAmount.toString()).concat(" for user: ").concat(userAddress.toString()))
        return <-rewardVault
    }

    init() {
        self.stakedBalances = {}
        self.rewardsVault <- nil
        // Use a different storage path to avoid conflicts
        self.account.storage.save(<-create Admin(), to: /storage/MockFarm3Admin)
    }
}
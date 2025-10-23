// FILE: cadence/contracts/MockFarm2.cdc

import FungibleToken from "./FungibleToken.cdc"
import MockUSDC from "./MockUSDC.cdc"

// Renamed to MockFarm2
access(all) contract MockFarm2 { 
    access(all) var stakedBalances: {Address: UFix64}
    access(self) var rewardsVault: @MockUSDC.Vault?

    access(all) resource Admin {
        access(all) fun depositRewards(from: @MockUSDC.Vault) {
            if let vault = &MockFarm2.rewardsVault as &MockUSDC.Vault? {
                vault.deposit(from: <-from)
            } else {
                destroy from
                panic("Rewards vault not initialized")
            }
        }
        
        access(all) fun initializeRewardsVault(vault: @MockUSDC.Vault) {
            if MockFarm2.rewardsVault == nil {
                MockFarm2.rewardsVault <-! vault
            } else {
                destroy vault
                panic("Rewards vault already initialized")
            }
        }
    }

    access(all) fun deposit(from: @{FungibleToken.Vault}) {
        let vault <- from as! @MockUSDC.Vault
        let userAddress = vault.owner!.address
        let currentBalance = MockFarm2.stakedBalances[userAddress] ?? 0.0
        MockFarm2.stakedBalances[userAddress] = currentBalance + vault.balance
        destroy vault
    }
    
    access(all) fun depositDirect(userAddress: Address, amount: UFix64) {
        let currentBalance = MockFarm2.stakedBalances[userAddress] ?? 0.0
        MockFarm2.stakedBalances[userAddress] = currentBalance + amount
    }

    access(all) fun claimRewards(userAddress: Address): @{FungibleToken.Vault} {
        let stakedAmount = self.stakedBalances[userAddress] ?? 0.0
        
        if stakedAmount == 0.0 {
            return <-MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        }
        
        // CHANGED: Reward rate is now 15%
        let rewardAmount = stakedAmount * 0.15
        
        let rewardVault <- MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        log("Calculated reward: ".concat(rewardAmount.toString()).concat(" for user: ").concat(userAddress.toString()))
        return <-rewardVault
    }

    init() {
        self.stakedBalances = {}
        self.rewardsVault <- nil
        // Use a different storage path to avoid conflicts
        self.account.storage.save(<-create Admin(), to: /storage/MockFarm2Admin) 
    }
}
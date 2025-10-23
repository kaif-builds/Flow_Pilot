import FungibleToken from "./FungibleToken.cdc"
import MockUSDC from "./MockUSDC.cdc"

access(all) contract MockFarm {
    access(all) var stakedBalances: {Address: UFix64}
    access(self) var rewardsVault: @MockUSDC.Vault?

    access(all) resource Admin {
        access(all) fun depositRewards(from: @MockUSDC.Vault) {
            if let vault = &MockFarm.rewardsVault as &{FungibleToken.Receiver}? {
                vault.deposit(from: <-from)
            } else {
                destroy from
                panic("Rewards vault not initialized")
            }
        }
        
        access(all) fun initializeRewardsVault(vault: @MockUSDC.Vault) {
            if MockFarm.rewardsVault == nil {
                MockFarm.rewardsVault <-! vault
            } else {
                destroy vault
                panic("Rewards vault already initialized")
            }
        }
    }

    
    // Direct deposit function to work around MockUSDC recovered state
    access(all) fun depositDirect(userAddress: Address, amount: UFix64) {
        let currentBalance = MockFarm.stakedBalances[userAddress] ?? 0.0
        MockFarm.stakedBalances[userAddress] = currentBalance + amount
    }

    access(all) fun claimRewards(userAddress: Address): @{FungibleToken.Vault} {
        let stakedAmount = self.stakedBalances[userAddress] ?? 0.0
        
        // If user has no staked amount, return empty vault
        if stakedAmount == 0.0 {
            return <-MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        }
        
        // Calculate 10% reward
        let rewardAmount = stakedAmount * 0.10
        
        // Create a new vault with the reward amount
        // Since we can't easily create MockUSDC tokens, we'll create an empty vault for demo
        // In a real implementation, this would withdraw from the rewards vault
        let rewardVault <- MockUSDC.createEmptyVault(vaultType: Type<@MockUSDC.Vault>())
        
        // Log the reward calculation for transparency
        log("Calculated reward: ".concat(rewardAmount.toString()).concat(" for user: ").concat(userAddress.toString()))
        
        return <-rewardVault
    }

    init() {
        self.stakedBalances = {}
        // Initialize rewards vault as nil - it will be set up later by admin
        self.rewardsVault <- nil
        self.account.storage.save(<-create Admin(), to: /storage/MockFarmAdmin)
    }
}
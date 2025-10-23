access(all) contract interface FungibleToken {
    access(all) var totalSupply: UFix64
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
    access(all) event TokensDeposited(amount: UFix64, to: Address?)

    access(all) resource interface Provider {
        access(all) fun withdraw(amount: UFix64): @{FungibleToken.Vault}
    }
    access(all) resource interface Receiver {
        access(all) fun deposit(from: @{FungibleToken.Vault})
    }
    access(all) resource interface Balance {
        access(all) var balance: UFix64
    }
    access(all) resource interface Vault: Provider, Receiver, Balance {}
    access(all) fun createEmptyVault(vaultType: Type): @{FungibleToken.Vault}
}
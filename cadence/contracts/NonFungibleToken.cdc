// FILE: cadence/contracts/NonFungibleToken.cdc

access(all) contract interface NonFungibleToken {
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    access(all) resource interface INFT {
        access(all) let id: UInt64
    }
    // This interface was missing before.
    access(all) resource interface NFT: INFT {}

    access(all) resource interface Provider {
        access(all) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT}
    }
    access(all) resource interface Receiver {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
    }
    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) fun getIDs(): [UInt64]
        access(all) fun borrowNFT(id: UInt64): &{NonFungibleToken.INFT}
    }
    access(all) resource interface Collection: Provider, Receiver, CollectionPublic {}

    access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection}
}
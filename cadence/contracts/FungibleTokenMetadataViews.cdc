// FungibleTokenMetadataViews.cdc
// Simplified FungibleTokenMetadataViews contract for emulator

import MetadataViews from "./MetadataViews.cdc"
import FungibleToken from "./FungibleToken.cdc"

access(all) contract FungibleTokenMetadataViews {

    /// FTView provides a standard view of fungible token metadata
    access(all) struct FTView {
        access(all) let ftDisplay: FTDisplay?
        access(all) let ftVaultData: FTVaultData?
        
        init(ftDisplay: FTDisplay?, ftVaultData: FTVaultData?) {
            self.ftDisplay = ftDisplay
            self.ftVaultData = ftVaultData
        }
    }
    
    /// FTDisplay provides display information for fungible tokens
    access(all) struct FTDisplay {
        access(all) let name: String
        access(all) let symbol: String
        access(all) let description: String
        access(all) let externalURL: MetadataViews.ExternalURL?
        access(all) let logos: MetadataViews.Medias?
        access(all) let socials: {String: MetadataViews.ExternalURL}
        
        init(
            name: String,
            symbol: String,
            description: String,
            externalURL: MetadataViews.ExternalURL?,
            logos: MetadataViews.Medias?,
            socials: {String: MetadataViews.ExternalURL}
        ) {
            self.name = name
            self.symbol = symbol
            self.description = description
            self.externalURL = externalURL
            self.logos = logos
            self.socials = socials
        }
    }
    
    /// FTVaultData provides vault information for fungible tokens
    access(all) struct FTVaultData {
        access(all) let storagePath: StoragePath
        access(all) let receiverPath: PublicPath
        access(all) let metadataPath: PublicPath
        access(all) let receiverLinkedType: Type
        access(all) let metadataLinkedType: Type
        access(all) let createEmptyVaultFunction: AnyStruct
        
        init(
            storagePath: StoragePath,
            receiverPath: PublicPath,
            metadataPath: PublicPath,
            receiverLinkedType: Type,
            metadataLinkedType: Type,
            createEmptyVaultFunction: AnyStruct
        ) {
            self.storagePath = storagePath
            self.receiverPath = receiverPath
            self.metadataPath = metadataPath
            self.receiverLinkedType = receiverLinkedType
            self.metadataLinkedType = metadataLinkedType
            self.createEmptyVaultFunction = createEmptyVaultFunction
        }
    }
    
    /// TotalSupply provides total supply information for fungible tokens
    access(all) struct TotalSupply {
        access(all) let totalSupply: UFix64
        
        init(totalSupply: UFix64) {
            self.totalSupply = totalSupply
        }
    }
    
    init() {}
}
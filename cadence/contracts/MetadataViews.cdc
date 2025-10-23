// MetadataViews.cdc
// Simplified MetadataViews contract for emulator

access(all) contract MetadataViews {

    /// A file stored at a URL
    access(all) struct HTTPFile {
        access(all) let url: String
        
        init(url: String) {
            self.url = url
        }
    }
    
    /// A file stored on IPFS
    access(all) struct IPFSFile {
        access(all) let hash: String
        access(all) let path: String?
        
        init(hash: String, path: String?) {
            self.hash = hash
            self.path = path
        }
    }
    
    /// A file stored on Arweave
    access(all) struct ArweaveFile {
        access(all) let transactionId: String
        
        init(transactionId: String) {
            self.transactionId = transactionId
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct DecentralizedFile {
        access(all) let url: String
        access(all) let hash: String
        access(all) let type: String
        
        init(url: String, hash: String, type: String) {
            self.url = url
            self.hash = hash
            self.type = type
        }
    }
    
    /// A file stored on a centralized storage system
    access(all) struct CentralizedFile {
        access(all) let url: String
        access(all) let type: String
        
        init(url: String, type: String) {
            self.url = url
            self.type = type
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct GenericFile {
        access(all) let url: String
        access(all) let type: String
        
        init(url: String, type: String) {
            self.url = url
            self.type = type
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct Media {
        access(all) let file: AnyStruct
        access(all) let mediaType: String
        
        init(file: AnyStruct, mediaType: String) {
            self.file = file
            self.mediaType = mediaType
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct Medias {
        access(all) let items: [Media]
        
        init(items: [Media]) {
            self.items = items
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct ExternalURL {
        access(all) let url: String
        
        init(url: String) {
            self.url = url
        }
    }
    
    /// A file stored on a decentralized storage system
    access(all) struct ExternalURLs {
        access(all) let items: [ExternalURL]
        
        init(items: [ExternalURL]) {
            self.items = items
        }
    }
    
    init() {}
}
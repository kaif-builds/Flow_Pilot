import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import '../flow.config';

// Define types for marketplace data
type FleetNFT = {
    id: string;
    name: string;
    owner: string;
    price: number;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    totalAgents: number;
    successRate: number;
    totalMissions: number;
    efficiencyScore: number;
    totalProfit: number;
    growthRate: number;
    imageUrl: string;
    isForSale: boolean;
    isOwnedByUser: boolean;
    createdAt: string;
    lastActivity: string;
    tags: string[];
};

type SortOption = 'price' | 'performance' | 'rarity' | 'growth' | 'newest';
type FilterOption = 'all' | 'for-sale' | 'rare' | 'epic' | 'legendary';

export default function BuySellPage() {
    const router = useRouter();
    const [fleets, setFleets] = useState<FleetNFT[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('performance');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFleet, setSelectedFleet] = useState<FleetNFT | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [purchasedFleets, setPurchasedFleets] = useState<Set<string>>(new Set());
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Mock data generation
    // Function to load marketplace data
    const loadMarketplaceData = () => {
        const mockFleets: FleetNFT[] = Array.from({ length: 16 }, (_, i) => {
            const rarities: Array<'Common' | 'Rare' | 'Epic' | 'Legendary'> = 
                ['Common', 'Rare', 'Epic', 'Legendary'];
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];
            
            const basePrice = {
                'Common': 1000,
                'Rare': 5000,
                'Epic': 15000,
                'Legendary': 50000
            }[rarity];

            const tags = [
                'DeFi', 'Yield Farming', 'Auto-Compound', 'High APY', 'Low Risk',
                'Smart Strategy', 'Multi-Chain', 'Staking', 'Liquidity', 'Arbitrage'
            ];

            return {
                id: `fleet-nft-${i + 1}`,
                name: `Genesis Fleet ${i + 1}`,
                owner: `0x${Math.random().toString(16).substr(2, 8)}`,
                price: basePrice + Math.random() * basePrice * 0.5,
                rarity,
                totalAgents: Math.floor(Math.random() * 100) + 10,
                successRate: Math.round((Math.random() * 30 + 70) * 10) / 10,
                totalMissions: Math.floor(Math.random() * 2000) + 100,
                efficiencyScore: Math.round((Math.random() * 20 + 80) * 10) / 10,
                totalProfit: Math.random() * 50000 + 5000,
                growthRate: Math.round((Math.random() * 40 - 10) * 10) / 10, // Can be negative
                imageUrl: `/api/placeholder/300/200?text=Fleet+${i + 1}`,
                isForSale: Math.random() > 0.3,
                isOwnedByUser: i === 5, // Simulate user owning one fleet
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                tags: tags.slice(0, Math.floor(Math.random() * 3) + 2)
            };
        });

        // Load agent fleet listings from localStorage
        const agentListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]');
        console.log('Agent listings found:', agentListings);
        
        // Convert agent listings to FleetNFT format
        const agentFleetNFTs: FleetNFT[] = agentListings.map((listing: any) => ({
            id: listing.id,
            name: listing.seller === 'You' ? 'Your Agent Fleet' : `🤖 ${listing.name}`, // Show "Your Agent Fleet" for owned listings
            owner: listing.seller,
            price: listing.price,
            rarity: listing.rarity as 'Common' | 'Rare' | 'Epic' | 'Legendary',
            totalAgents: listing.totalAgents,
            successRate: Math.round((85 + Math.random() * 10) * 10) / 10, // High success rate for AI agents
            totalMissions: Math.floor(Math.random() * 500) + 100,
            efficiencyScore: Math.round((90 + Math.random() * 8) * 10) / 10,
            totalProfit: listing.price * 0.3, // Estimated profit
            growthRate: Math.round((15 + Math.random() * 20) * 10) / 10,
            imageUrl: '/api/placeholder/300/200?text=AI+Agents',
            isForSale: true,
            isOwnedByUser: listing.seller === 'You', // Mark as owned by user
            createdAt: listing.listedAt,
            lastActivity: listing.listedAt,
            tags: [...listing.tags, '🤖 AI Fleet'] // Add AI Fleet tag
        }));

        console.log('Agent fleet NFTs created:', agentFleetNFTs);

        // Combine mock fleets with agent listings
        setFleets([...mockFleets, ...agentFleetNFTs]);
        setIsLoading(false);
    };

    useEffect(() => {
        // Simulate loading delay
        setTimeout(() => {
            loadMarketplaceData();
            setIsInitialized(true);
        }, 1200);
        
        // Listen for storage changes to refresh when new listings are added
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'marketplaceListings' && isInitialized) {
                console.log('Marketplace listings updated, refreshing...');
                loadMarketplaceData();
            }
        };
        
        // Listen for custom marketplace update events
        const handleMarketplaceUpdate = (e: CustomEvent) => {
            if (isInitialized) {
                console.log('Marketplace update event received:', e.detail);
                loadMarketplaceData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('marketplaceUpdated', handleMarketplaceUpdate as EventListener);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('marketplaceUpdated', handleMarketplaceUpdate as EventListener);
        };
    }, [isInitialized]);

    // Load purchased fleets from localStorage
    useEffect(() => {
        const loadPurchasedFleets = () => {
            try {
                const boughtFleets = JSON.parse(localStorage.getItem('boughtFleets') || '[]');
                const purchasedIds = new Set<string>(boughtFleets.map((fleet: any) => fleet.id as string));
                setPurchasedFleets(purchasedIds);
            } catch (error) {
                console.error('Error loading purchased fleets:', error);
                setPurchasedFleets(new Set());
            }
        };

        loadPurchasedFleets();

        // Listen for storage changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'boughtFleets') {
                loadPurchasedFleets();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getCardTheme = (index: number) => {
        const themes = [
            { bg: 'from-green-900/20 to-emerald-900/20', border: 'border-green-700/30', hover: 'hover:border-green-400', shadow: 'hover:shadow-green-400/20' },
            { bg: 'from-blue-900/20 to-cyan-900/20', border: 'border-blue-700/30', hover: 'hover:border-blue-400', shadow: 'hover:shadow-blue-400/20' },
            { bg: 'from-purple-900/20 to-pink-900/20', border: 'border-purple-700/30', hover: 'hover:border-purple-400', shadow: 'hover:shadow-purple-400/20' },
            { bg: 'from-red-900/20 to-pink-900/20', border: 'border-red-700/30', hover: 'hover:border-red-400', shadow: 'hover:shadow-red-400/20' },
        ];
        return themes[index % themes.length];
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Common': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
            case 'Rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
            case 'Epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
            case 'Legendary': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    const getRarityIcon = (rarity: string) => {
        switch (rarity) {
            case 'Common': 
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                );
            case 'Rare': 
                return (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                );
            case 'Epic': 
                return (
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                );
            case 'Legendary': 
                return (
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                );
            default: 
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                );
        }
    };

    const getGrowthColor = (growth: number) => {
        if (growth > 0) return 'text-green-400';
        if (growth < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const sortFleets = (fleets: FleetNFT[], sortBy: SortOption) => {
        return [...fleets].sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return b.price - a.price;
                case 'performance':
                    return (b.successRate + b.efficiencyScore) - (a.successRate + a.efficiencyScore);
                case 'rarity':
                    const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
                    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                case 'growth':
                    return b.growthRate - a.growthRate;
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default:
                    return 0;
            }
        });
    };

    const filterFleets = (fleets: FleetNFT[], filterBy: FilterOption) => {
        switch (filterBy) {
            case 'for-sale':
                return fleets.filter(fleet => fleet.isForSale);
            case 'rare':
                return fleets.filter(fleet => fleet.rarity === 'Rare');
            case 'epic':
                return fleets.filter(fleet => fleet.rarity === 'Epic');
            case 'legendary':
                return fleets.filter(fleet => fleet.rarity === 'Legendary');
            default:
                return fleets;
        }
    };

    const handleBuyFleet = (fleet: FleetNFT) => {
        setSelectedFleet(fleet);
        setShowWalletModal(true);
    };

    const handleSellFleet = (fleet: FleetNFT) => {
        setSelectedFleet(fleet);
        setShowModal(true);
    };

    const handleViewFleet = (fleet: FleetNFT) => {
        router.push(`/agent/${fleet.id}`);
    };

    // Handle wallet selection
    const handleWalletSelect = (wallet: string) => {
        setSelectedWallet(wallet);
        setShowWalletModal(false);
        setShowConfirmModal(true);
    };

    // Handle purchase confirmation
    const handlePurchaseConfirm = () => {
        if (selectedFleet) {
            // Simulate purchase process
            console.log(`Purchasing ${selectedFleet.name} with ${selectedWallet}`);
            
            // Save bought fleet to localStorage
            const boughtFleets = JSON.parse(localStorage.getItem('boughtFleets') || '[]');
            const fleetToAdd = {
                ...selectedFleet,
                purchaseDate: new Date().toISOString(),
                purchasePrice: selectedFleet.price,
                isOwnedByUser: true,
                isForSale: false
            };
            
            boughtFleets.push(fleetToAdd);
            localStorage.setItem('boughtFleets', JSON.stringify(boughtFleets));
            
            // Add to purchased fleets set
            setPurchasedFleets(prev => new Set([...prev, selectedFleet.id]));
            
            // Show success message
            console.log(`✅ Successfully purchased ${selectedFleet.name} for $${selectedFleet.price.toLocaleString()}!`);
            
            // Close modals and reset state
            setShowConfirmModal(false);
            setSelectedWallet(null);
            setSelectedFleet(null);
        }
    };

    const filteredAndSortedFleets = sortFleets(filterFleets(fleets, filterBy), sortBy);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white">
            <Header />
            
            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                Buy/Sell Marketplace
                            </h1>
                            <p className="text-gray-300 text-lg">Trade Agent Fleet NFTs with performance-based pricing</p>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/30 shadow-lg hover:shadow-blue-400/20 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Total Listed</h3>
                                        <p className="text-xs text-gray-400">Available for sale</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-blue-400 font-medium">Live</div>
                                    <div className="text-xs text-gray-500">Market</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {fleets.filter(f => f.isForSale).length}
                            </div>
                            <div className="text-sm text-gray-300">Fleet NFTs</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 shadow-lg hover:shadow-green-400/20 hover:border-green-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30">
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wide">Avg Price</h3>
                                        <p className="text-xs text-gray-400">Market average</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        5.2%
                                    </div>
                                    <div className="text-xs text-gray-500">24h</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {formatCurrency(fleets.reduce((sum, f) => sum + f.price, 0) / fleets.length)}
                            </div>
                            <div className="text-sm text-gray-300">USDC</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 shadow-lg hover:shadow-purple-400/20 hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
                                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Avg Growth</h3>
                                        <p className="text-xs text-gray-400">Performance trend</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs text-purple-400 font-medium">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        12.8%
                                    </div>
                                    <div className="text-xs text-gray-500">7d</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {formatPercentage(fleets.reduce((sum, f) => sum + f.growthRate, 0) / fleets.length)}
                            </div>
                            <div className="text-sm text-gray-300">Growth Rate</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-700/30 shadow-lg hover:shadow-yellow-400/20 hover:border-yellow-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-400/30">
                                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-yellow-300 uppercase tracking-wide">Legendary</h3>
                                        <p className="text-xs text-gray-400">Premium fleets</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-yellow-400 font-medium">Rare</div>
                                    <div className="text-xs text-gray-500">Tier</div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {fleets.filter(f => f.rarity === 'Legendary').length}
                            </div>
                            <div className="text-sm text-gray-300">Available</div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                </div>

                {/* Filters and Sorting */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All Fleets' },
                                { key: 'for-sale', label: 'For Sale' },
                                { key: 'rare', label: 'Rare+' }
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setFilterBy(filter.key as FilterOption)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        filterBy === filter.key
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="performance">Performance</option>
                                <option value="price">Price</option>
                                <option value="rarity">Rarity</option>
                                <option value="growth">Growth Rate</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fleet Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-10">
                    {filteredAndSortedFleets.map((fleet, index) => {
                        const theme = getCardTheme(index);
                        const isOwnedAgentFleet = fleet.isOwnedByUser && fleet.name.includes('Your Agent Fleet');
                        
                        return (
                        <div 
                            key={fleet.id}
                            className={`bg-gradient-to-br ${
                                isOwnedAgentFleet 
                                    ? 'from-orange-900/30 to-red-900/30 border-orange-500/50 hover:border-orange-400/70 hover:shadow-orange-400/20' 
                                    : `${theme.bg} border ${theme.border} ${theme.hover} ${theme.shadow}`
                            } rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.025] backdrop-blur ${
                                isOwnedAgentFleet ? 'ring-2 ring-orange-400/30' : ''
                            }`}
                        >
                            {/* Fleet Info */}
                            <div className="p-6">
                                <h3 className={`text-lg font-semibold mb-4 ${
                                    isOwnedAgentFleet 
                                        ? 'text-orange-300 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent' 
                                        : 'text-white'
                                }`}>{fleet.name}</h3>
                                
                                {/* Performance Metrics */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Success Rate</span>
                                        <span className="text-green-400 font-medium">{formatPercentage(fleet.successRate)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Efficiency</span>
                                        <span className="text-blue-400 font-medium">{formatPercentage(fleet.efficiencyScore)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Growth</span>
                                        <span className={`font-medium ${getGrowthColor(fleet.growthRate)}`}>
                                            {formatPercentage(fleet.growthRate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Agents</span>
                                        <span className="text-gray-300">{fleet.totalAgents}</span>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {isOwnedAgentFleet && (
                                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                            OWNED
                                        </span>
                                    )}
                                    {fleet.tags.slice(0, isOwnedAgentFleet ? 1 : 2).map((tag, index) => (
                                        <span key={index} className={`px-2 py-1 rounded text-xs ${
                                            isOwnedAgentFleet 
                                                ? 'bg-orange-800/50 text-orange-200' 
                                                : 'bg-gray-700 text-gray-300'
                                        }`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    <div className={`text-2xl font-bold ${
                                        isOwnedAgentFleet 
                                            ? 'text-orange-300' 
                                            : 'text-white'
                                    }`}>{formatCurrency(fleet.price)}</div>
                                    <div className={`text-sm ${
                                        isOwnedAgentFleet 
                                            ? 'text-orange-400' 
                                            : 'text-gray-400'
                                    }`}>Current Price</div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setSelectedFleet(fleet);
                                            setShowModal(true);
                                        }}
                                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                                            isOwnedAgentFleet 
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {isOwnedAgentFleet ? 'Manage Fleet' : 'View Fleet'}
                                    </button>
                                    
                                    {isOwnedAgentFleet ? (
                                        <button
                                            onClick={() => {
                                                // Remove from marketplace
                                                const updatedListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]')
                                                    .filter((listing: any) => listing.id !== fleet.id);
                                                localStorage.setItem('marketplaceListings', JSON.stringify(updatedListings));
                                                loadMarketplaceData();
                                                console.log('✅ Fleet removed from marketplace!');
                                                
                                                // Dispatch event to update dashboard
                                                window.dispatchEvent(new CustomEvent('marketplaceUpdated'));
                                            }}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Remove from Sale
                                        </button>
                                    ) : fleet.isForSale ? (
                                        purchasedFleets.has(fleet.id) ? (
                                            <div className="w-full bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium text-center">
                                                Purchased
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleBuyFleet(fleet)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Buy Fleet
                                            </button>
                                        )
                                    ) : (
                                        <div className="w-full bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium text-center">
                                            Not For Sale
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredAndSortedFleets.length === 0 && (
                    <div className="text-center py-20">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-to-br from-gray-700/30 to-gray-600/30 rounded-xl border border-gray-600/50">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No fleets found</h3>
                        <p className="text-gray-400">Try adjusting your filters or check back later for new listings.</p>
                    </div>
                )}

                {/* Privacy Notice */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-2">Strategy Privacy</h4>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Fleet strategies remain private to their owners. Only aggregated performance metrics 
                                are displayed publicly. Detailed strategy configurations are not revealed during 
                                the buying/selling process to maintain competitive advantages.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Transaction Modal */}
            {showModal && selectedFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">
                                {selectedFleet.isOwnedByUser ? 'Manage Your Fleet' : 'Buy Fleet'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <div className="text-center mb-4">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30">
                                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                </div>
                                <h4 className="text-lg font-semibold text-white">{selectedFleet.name}</h4>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getRarityColor(selectedFleet.rarity)}`}>
                                    {selectedFleet.rarity}
                                </div>
                            </div>
                            
                            <div className="text-center mb-4">
                                <div className="text-3xl font-bold text-white">{formatCurrency(selectedFleet.price)}</div>
                                <div className="text-sm text-gray-400">Transaction Price</div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                                {selectedFleet.isOwnedByUser ? 'Confirm Sale' : 'Confirm Purchase'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Fleet Details Modal */}
            {showModal && selectedFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">{selectedFleet.name}</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Fleet Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.successRate}%</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Agents</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.totalAgents}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Missions</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.totalMissions}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Efficiency Score</div>
                                    <div className="text-xl font-bold text-white">{selectedFleet.efficiencyScore}%</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Profit</div>
                                    <div className="text-xl font-bold text-green-400">${selectedFleet.totalProfit.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
                                    <div className="flex items-center gap-1 text-xl font-bold text-blue-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        {selectedFleet.growthRate}%
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Fleet Information</h3>
                                    <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Owner:</span>
                                            <span className="text-white">{selectedFleet.owner}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Created:</span>
                                            <span className="text-white">{selectedFleet.createdAt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Activity:</span>
                                            <span className="text-white">{selectedFleet.lastActivity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <span className="text-white">
                                                {selectedFleet.isForSale ? 'For Sale' : 'Not For Sale'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedFleet.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFleet.tags.map((tag, index) => (
                                                <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-3">
                                {selectedFleet.isOwnedByUser ? (
                                    <button
                                        onClick={() => {
                                            // Remove from marketplace
                                            const updatedListings = JSON.parse(localStorage.getItem('marketplaceListings') || '[]')
                                                .filter((listing: any) => listing.id !== selectedFleet.id);
                                            localStorage.setItem('marketplaceListings', JSON.stringify(updatedListings));
                                            loadMarketplaceData();
                                            setShowModal(false);
                                            alert('Fleet removed from marketplace!');
                                        }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Remove from Sale
                                    </button>
                                ) : selectedFleet.isForSale ? (
                                    <button
                                        onClick={() => handleBuyFleet(selectedFleet)}
                                        disabled={purchasedFleets.has(selectedFleet.id)}
                                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                                            purchasedFleets.has(selectedFleet.id)
                                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        {purchasedFleets.has(selectedFleet.id) ? 'Purchased' : 'Buy Fleet'}
                                    </button>
                                ) : (
                                    <div className="flex-1 bg-gray-600 text-gray-300 px-6 py-3 rounded-lg font-medium text-center">
                                        Not For Sale
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Wallet Selection Modal */}
            {showWalletModal && selectedFleet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWalletModal(false)}>
                    <div className="bg-gray-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Choose Wallet</h2>
                                <button
                                    onClick={() => setShowWalletModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleWalletSelect('Blocto')}
                                    className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <img 
                                        src="https://play-lh.googleusercontent.com/ObaxdmAwin-r5gXw-74g9Fv1njrBAC6p2ZwhgmCaIMoqnyn37xV0ZKCCBN55pOlE_-Am"
                                        alt="Blocto"
                                        className="w-8 h-8 object-contain"
                                    />
                                    <div className="text-left">
                                        <div className="font-medium text-white">Blocto</div>
                                        <div className="text-sm text-gray-400">0x1234...5678</div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => handleWalletSelect('Lilico')}
                                    className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <img 
                                        src="https://pbs.twimg.com/profile_images/1570492461449097216/QlJDnu-F_400x400.jpg"
                                        alt="Lilico"
                                        className="w-8 h-8 object-contain"
                                    />
                                    <div className="text-left">
                                        <div className="font-medium text-white">Lilico</div>
                                        <div className="text-sm text-gray-400">0xabcd...efgh</div>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => handleWalletSelect('Dapper')}
                                    className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <img 
                                        src="https://cdn.prod.website-files.com/5bf4437b68f8b29e67b7ebdc/61a159f8899a41507bc46bcb_feature%20image%20dapper%20post.png"
                                        alt="Dapper"
                                        className="w-8 h-8 object-contain"
                                    />
                                    <div className="text-left">
                                        <div className="font-medium text-white">Dapper</div>
                                        <div className="text-sm text-gray-400">0x9876...5432</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Confirmation Modal */}
            {showConfirmModal && selectedFleet && selectedWallet && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-gray-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Fleet</div>
                                    <div className="font-semibold text-white">{selectedFleet.name}</div>
                                </div>
                                
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Price</div>
                                    <div className="font-semibold text-green-400">${selectedFleet.price.toLocaleString()}</div>
                                </div>
                                
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Wallet</div>
                                    <div className="font-semibold text-white">{selectedWallet}</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePurchaseConfirm}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

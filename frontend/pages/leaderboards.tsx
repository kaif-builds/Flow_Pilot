import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import '../flow.config';

// Define types for leaderboard data
type FleetPerformance = {
    id: string;
    name: string;
    owner: string;
    totalAgents: number;
    successRate: number;
    totalMissions: number;
    efficiencyScore: number;
    totalProfit: number;
    rank: number;
    badge: 'Gold' | 'Silver' | 'Bronze' | 'Elite' | 'Rising';
    lastActivity: string;
    isPrivate: boolean;
};

type LeaderboardCategory = 'overall' | 'successRate' | 'efficiency' | 'missions' | 'profit';

export default function LeaderboardsPage() {
    const router = useRouter();
    const [fleets, setFleets] = useState<FleetPerformance[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('overall');
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserFleet, setCurrentUserFleet] = useState<FleetPerformance | null>(null);

    // Mock data generation
    useEffect(() => {
        const generateMockData = () => {
            const mockFleets: FleetPerformance[] = Array.from({ length: 50 }, (_, i) => {
                const badges: Array<'Gold' | 'Silver' | 'Bronze' | 'Elite' | 'Rising'> = 
                    ['Gold', 'Silver', 'Bronze', 'Elite', 'Rising'];
                
                return {
                    id: `fleet-${i + 1}`,
                    name: `DeFi Fleet ${i + 1}`,
                    owner: `0x${Math.random().toString(16).substr(2, 8)}`,
                    totalAgents: Math.floor(Math.random() * 20) + 5,
                    successRate: Math.random() * 30 + 70,
                    totalMissions: Math.floor(Math.random() * 5000) + 100,
                    efficiencyScore: Math.random() * 20 + 80,
                    totalProfit: Math.random() * 100000 + 10000,
                    rank: i + 1,
                    badge: badges[Math.floor(Math.random() * badges.length)],
                    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    isPrivate: Math.random() > 0.7
                };
            });

            // Sort by overall performance (weighted score)
            mockFleets.sort((a, b) => {
                const scoreA = (a.successRate * 0.3) + (a.efficiencyScore * 0.3) + (a.totalMissions / 100 * 0.2) + (a.totalProfit / 10000 * 0.2);
                const scoreB = (b.successRate * 0.3) + (b.efficiencyScore * 0.3) + (b.totalMissions / 100 * 0.2) + (b.totalProfit / 10000 * 0.2);
                return scoreB - scoreA;
            });

            // Update ranks
            mockFleets.forEach((fleet, index) => {
                fleet.rank = index + 1;
            });

            // Set current user's fleet (simulate being rank 15)
            const userFleet = mockFleets[14];
            if (userFleet) {
                userFleet.name = 'My DeFi Fleet';
                userFleet.isPrivate = false;
                setCurrentUserFleet(userFleet);
            }

            setFleets(mockFleets);
            setIsLoading(false);
        };

        // Simulate loading delay
        setTimeout(generateMockData, 1500);
    }, [selectedCategory]);

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

    const getBadgeColor = (badge: string) => {
        switch (badge) {
            case 'Gold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'Silver': return 'text-gray-300 bg-gray-300/10 border-gray-300/30';
            case 'Bronze': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
            case 'Elite': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
            case 'Rising': return 'text-green-400 bg-green-400/10 border-green-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    const getBadgeIcon = (badge: string) => {
        switch (badge) {
            case 'Gold': return '●';
            case 'Silver': return '●';
            case 'Bronze': return '●';
            case 'Elite': return '◆';
            case 'Rising': return '▲';
            default: return '●';
        }
    };

    const getRankColor = (rank: number) => {
        if (rank <= 3) return 'text-yellow-400';
        if (rank <= 10) return 'text-blue-400';
        if (rank <= 25) return 'text-green-400';
        return 'text-gray-400';
    };

    const getRankIcon = (rank: number) => {
        return rank.toString();
    };

    const sortFleets = (category: LeaderboardCategory) => {
        const sortedFleets = [...fleets].sort((a, b) => {
            switch (category) {
                case 'successRate':
                    return b.successRate - a.successRate;
                case 'efficiency':
                    return b.efficiencyScore - a.efficiencyScore;
                case 'missions':
                    return b.totalMissions - a.totalMissions;
                case 'profit':
                    return b.totalProfit - a.totalProfit;
                default:
                    return a.rank - b.rank;
            }
        });
        
        // Update rank numbers based on new sorting
        sortedFleets.forEach((fleet, index) => {
            fleet.rank = index + 1;
        });
        
        return sortedFleets;
    };

    const categories = [
        { key: 'overall', label: 'Overall', icon: '' },
        { key: 'successRate', label: 'Success Rate', icon: '' },
        { key: 'efficiency', label: 'Efficiency', icon: '' },
        { key: 'missions', label: 'Missions', icon: '' },
        { key: 'profit', label: 'Profit', icon: '' }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading leaderboards...</p>
                </div>
            </div>
        );
    }

    const sortedFleets = sortFleets(selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white">
            <Header />
            
            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Leaderboards
                    </h1>
                    <p className="text-gray-300 text-lg">Global fleet performance rankings and competitive metrics</p>
                </div>

                {/* Current User Fleet Card */}
                {currentUserFleet && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl font-bold text-blue-400">{getRankIcon(currentUserFleet.rank)}</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-100">Your Fleet</h3>
                                        <p className="text-blue-300/70">Rank {currentUserFleet.rank} • {currentUserFleet.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-100">{formatPercentage(currentUserFleet.successRate)}</div>
                                    <div className="text-blue-300/70 text-sm">Success Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Selector */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category.key}
                                onClick={() => setSelectedCategory(category.key as LeaderboardCategory)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    selectedCategory === category.key
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 3 Podium */}
                <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 text-center">Top Performers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {sortedFleets.slice(0, 3).map((fleet, index) => (
                            <div 
                                key={fleet.id}
                                className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg ${
                                    index === 0 ? 'bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-700/30 shadow-lg hover:shadow-emerald-400/20 hover:border-emerald-400' :
                                    index === 1 ? 'bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 shadow-lg hover:shadow-cyan-400/20 hover:border-cyan-400' :
                                    'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 shadow-lg hover:shadow-purple-400/20 hover:border-purple-400'
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg border ${
                                                index === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-400/30' :
                                                index === 1 ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30' :
                                                'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30'
                                            }`}>
                                                <svg className={`w-5 h-5 ${
                                                    index === 0 ? 'text-emerald-400' :
                                                    index === 1 ? 'text-cyan-400' :
                                                    'text-purple-400'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className={`text-xs font-semibold uppercase tracking-wide ${
                                                    index === 0 ? 'text-emerald-300' :
                                                    index === 1 ? 'text-cyan-300' :
                                                    'text-purple-300'
                                                }`}>
                                                    Rank #{fleet.rank}
                                                </h3>
                                                <p className="text-xs text-gray-400">{fleet.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-medium ${
                                                index === 0 ? 'text-emerald-400' :
                                                index === 1 ? 'text-cyan-400' :
                                                'text-purple-400'
                                            }`}>
                                                {formatPercentage(fleet.successRate)}
                                            </div>
                                            <div className="text-xs text-gray-500">Success Rate</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {fleet.totalMissions.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-300">Total Missions</div>
                                </div>
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                    index === 0 ? 'bg-gradient-to-r from-emerald-500/5 to-green-500/5' :
                                    index === 1 ? 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5' :
                                    'bg-gradient-to-r from-purple-500/5 to-pink-500/5'
                                }`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Fleet Rankings</h3>
                        <div className="text-sm text-gray-400">
                            Showing {sortedFleets.length} fleets
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Rank</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Fleet</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Agents</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Success Rate</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Missions</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Profit</th>
                                    <th className="text-center py-3 px-4 text-gray-300 font-medium">Badge</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFleets.map((fleet, index) => (
                                    <tr 
                                        key={fleet.id} 
                                        className={`border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors ${
                                            fleet.id === currentUserFleet?.id ? 'bg-blue-900/20' : ''
                                        }`}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-lg ${getRankColor(fleet.rank)}`}>
                                                    {fleet.rank}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <div className="text-white font-medium">{fleet.name}</div>
                                                <div className="text-gray-400 text-sm">{fleet.owner.slice(0, 6)}...{fleet.owner.slice(-4)}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-gray-300">{fleet.totalAgents}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-green-400 font-medium">{formatPercentage(fleet.successRate)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-gray-300">{fleet.totalMissions.toLocaleString()}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-yellow-400 font-medium">{formatCurrency(fleet.totalProfit)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(fleet.badge)}`}>
                                                <span>{getBadgeIcon(fleet.badge)}</span>
                                                {fleet.badge}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Privacy Notice */}
                <div className="mt-8 group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/30 shadow-lg hover:shadow-blue-400/20 hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] backdrop-blur-lg">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg border border-blue-400/30">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Privacy & Strategy Protection</h4>
                                <p className="text-xs text-gray-400">Fleet strategies remain private</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Fleet strategies and detailed configurations remain private to their respective owners. 
                            Only aggregated performance metrics are displayed publicly to maintain competitive advantage 
                            while fostering healthy competition through transparent rankings.
                        </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                

             
                </div>
            </main>
        </div>
    );
}


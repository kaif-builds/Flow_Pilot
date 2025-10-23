import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import '../flow.config';

// Define types for analytics data
type AgentPerformance = {
    id: string;
    strategyType: string;
    totalProfit: number;
    successRate: number;
    transactions: number;
    efficiency: number;
    lastActivity: string;
};

type FleetMetrics = {
    totalAgents: number;
    activeAgents: number;
    totalProfit: number;
    averageSuccessRate: number;
    totalTransactions: number;
    averageEfficiency: number;
};

type TimeSeriesData = {
    date: string;
    profit: number;
    transactions: number;
    activeAgents: number;
};

export default function AnalyticsPage() {
    const router = useRouter();
    const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics | null>(null);
    const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
    const [isLoading, setIsLoading] = useState(true);
    
    // Live analytics state
    const [liveUpdates, setLiveUpdates] = useState<{
        lastUpdate: string;
        activeStrategies: number;
        marketSentiment: 'Bullish' | 'Bearish' | 'Neutral';
        volatility: 'Low' | 'Medium' | 'High';
    }>({
        lastUpdate: new Date().toLocaleTimeString(),
        activeStrategies: 0,
        marketSentiment: 'Bullish',
        volatility: 'Low'
    });
    
    const [liveNotifications, setLiveNotifications] = useState<string[]>([]);

    // Mock data generation
    useEffect(() => {
        const generateMockData = () => {
            // Fleet metrics - vary based on timeframe
            let fleetMetrics: FleetMetrics;
            if (selectedTimeframe === '7d') {
                fleetMetrics = {
                    totalAgents: 6,
                    activeAgents: 5,
                    totalProfit: 78.45,
                    averageSuccessRate: 96.8,
                    totalTransactions: 42,
                    averageEfficiency: 91.2
                };
            } else if (selectedTimeframe === '30d') {
                fleetMetrics = {
                    totalAgents: 8,
                    activeAgents: 7,
                    totalProfit: 442.21,
                    averageSuccessRate: 94.2,
                    totalTransactions: 156,
                    averageEfficiency: 89.7
                };
            } else { // 90d
                fleetMetrics = {
                    totalAgents: 12,
                    activeAgents: 11,
                    totalProfit: 1187.63,
                    averageSuccessRate: 92.5,
                    totalTransactions: 423,
                    averageEfficiency: 87.3
                };
            }

            // Agent performance data - vary based on timeframe
            let agentCount = fleetMetrics.totalAgents;
            let profitMultiplier = 1;
            let transactionMultiplier = 1;
            
            if (selectedTimeframe === '7d') {
                profitMultiplier = 0.2;
                transactionMultiplier = 0.3;
            } else if (selectedTimeframe === '30d') {
                profitMultiplier = 1;
                transactionMultiplier = 1;
            } else { // 90d
                profitMultiplier = 2.7;
                transactionMultiplier = 2.7;
            }
            
            const mockAgentPerformance: AgentPerformance[] = Array.from({ length: agentCount }, (_, i) => ({
                id: `Agent-${i + 1}`,
                strategyType: ['HighestAPY', 'AutoCompoundOnly5P-Farm1', 'AutoCompoundOnly5P-Farm2', 'AutoCompoundSplit-Farm2'][i % 4],
                totalProfit: (Math.random() * 80 + 15) * profitMultiplier,
                successRate: Math.random() * 10 + 90,
                transactions: Math.floor((Math.random() * 25 + 8) * transactionMultiplier),
                efficiency: Math.random() * 15 + 85,
                lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            }));

            // Time series data - vary based on timeframe
            let daysToShow = 30;
            let timeSeriesProfitMultiplier = 1;
            let timeSeriesTransactionMultiplier = 1;
            let timeSeriesAgentMultiplier = 1;
            
            if (selectedTimeframe === '7d') {
                daysToShow = 7;
                timeSeriesProfitMultiplier = 0.2;
                timeSeriesTransactionMultiplier = 0.3;
                timeSeriesAgentMultiplier = 0.75;
            } else if (selectedTimeframe === '30d') {
                daysToShow = 30;
                timeSeriesProfitMultiplier = 1;
                timeSeriesTransactionMultiplier = 1;
                timeSeriesAgentMultiplier = 1;
            } else { // 90d
                daysToShow = 90;
                timeSeriesProfitMultiplier = 1.8;
                timeSeriesTransactionMultiplier = 1.5;
                timeSeriesAgentMultiplier = 1.2;
            }
            
            const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: daysToShow }, (_, i) => ({
                date: new Date(Date.now() - (daysToShow - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                profit: (Math.random() * 15 + 5) * timeSeriesProfitMultiplier,
                transactions: Math.floor((Math.random() * 8 + 3) * timeSeriesTransactionMultiplier),
                activeAgents: Math.floor((Math.random() * 3 + 6) * timeSeriesAgentMultiplier)
            }));

            setFleetMetrics(fleetMetrics);
            setAgentPerformance(mockAgentPerformance);
            setTimeSeriesData(mockTimeSeriesData);
            setIsLoading(false);
        };

        // Simulate loading delay
        setTimeout(generateMockData, 1000);
    }, [selectedTimeframe]);

    // Live analytics simulation
    useEffect(() => {
        const simulateLiveAnalytics = () => {
            // Update live metrics
            setLiveUpdates(prev => ({
                lastUpdate: new Date().toLocaleTimeString(),
                activeStrategies: Math.floor(Math.random() * 15) + 5,
                marketSentiment: ['Bullish', 'Bearish', 'Neutral'][Math.floor(Math.random() * 3)] as 'Bullish' | 'Bearish' | 'Neutral',
                volatility: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High'
            }));

            // Generate live notifications
            if (Math.random() < 0.3) { // 30% chance
                const notificationTemplates = [
                    "New performance data available",
                    "Strategy optimization completed",
                    "Market trend analysis updated",
                    "Real-time metrics refreshed",
                    "Risk assessment completed",
                    "Profit calculation updated",
                    "Portfolio rebalancing detected",
                    "Analytics report generated"
                ];
                
                const randomNotification = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
                setLiveNotifications(prev => [randomNotification, ...prev.slice(0, 4)]); // Keep last 5 notifications
            }

            // Update agent performance data with small variations
            setAgentPerformance(prev => prev.map(agent => ({
                ...agent,
                totalProfit: agent.totalProfit + (Math.random() - 0.5) * 2,
                successRate: Math.max(0, Math.min(100, agent.successRate + (Math.random() - 0.5) * 1)),
                transactions: agent.transactions + Math.floor(Math.random() * 2),
                efficiency: Math.max(0, Math.min(100, agent.efficiency + (Math.random() - 0.5) * 0.5))
            })));

            // Update fleet metrics
            setFleetMetrics(prev => prev ? {
                ...prev,
                totalProfit: prev.totalProfit + (Math.random() - 0.5) * 5,
                averageSuccessRate: Math.max(0, Math.min(100, prev.averageSuccessRate + (Math.random() - 0.5) * 0.5)),
                totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 3),
                averageEfficiency: Math.max(0, Math.min(100, prev.averageEfficiency + (Math.random() - 0.5) * 0.3))
            } : prev);
        };

        // Run simulation every 25 seconds
        const interval = setInterval(simulateLiveAnalytics, 25000);
        
        // Run initial simulation
        simulateLiveAnalytics();

        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getStrategyColor = (strategyType: string) => {
        return 'text-white';
    };

    const getStrategyIcon = (strategyType: string) => {
        switch (strategyType) {
            case 'HighestAPY': return (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            );
            case 'AutoCompoundOnly5P-Farm1': return (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
            case 'AutoCompoundOnly5P-Farm2': return (
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
            case 'AutoCompoundSplit-Farm2': return (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
            default: return (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#10182a] via-gray-900 to-black text-white">
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>
            <Header />
            
            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-300 text-lg">Track performance and optimize your agent strategies</p>
                </div>

                {/* Timeframe Selector */}
                <div className="mb-8">
                    <div className="flex gap-2">
                        {(['7d', '30d', '90d'] as const).map((timeframe) => (
                            <button
                                key={timeframe}
                                onClick={() => setSelectedTimeframe(timeframe)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedTimeframe === timeframe
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Analytics Status */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-400">Live Data</span>
                        </div>
                        <div className="text-xs text-gray-300">Last update: {liveUpdates.lastUpdate}</div>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-1">Active Strategies</div>
                        <div className="text-lg font-bold text-blue-400">{liveUpdates.activeStrategies}</div>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-1">Market Sentiment</div>
                        <div className={`flex items-center gap-2 text-lg font-bold ${
                            liveUpdates.marketSentiment === 'Bullish' ? 'text-green-400' : 
                            liveUpdates.marketSentiment === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                            {liveUpdates.marketSentiment === 'Bullish' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            ) : liveUpdates.marketSentiment === 'Bearish' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                            {liveUpdates.marketSentiment}
                        </div>
                    </div>
                    
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-300 mb-1">Volatility</div>
                        <div className={`text-lg font-bold ${
                            liveUpdates.volatility === 'High' ? 'text-red-400' : 
                            liveUpdates.volatility === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                            {liveUpdates.volatility}
                        </div>
                    </div>
                </div>

                {/* Live Notifications */}
                {liveNotifications.length > 0 && (
                    <div className="mb-8 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-blue-400">Live Analytics Updates</span>
                        </div>
                        <div className="space-y-2">
                            {liveNotifications.slice(0, 3).map((notification, index) => (
                                <div key={index} className="text-sm text-gray-300 animate-fade-in">
                                    {notification}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fleet Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-blue-400 text-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                12%
                            </div>
                        </div>
                        <h3 className="text-blue-100 text-lg font-semibold mb-1">Total Agents</h3>
                        <p className="text-blue-300/70 text-sm mb-2">Active fleet size</p>
                        <div className="text-3xl font-bold text-blue-100">{fleetMetrics?.totalAgents}</div>
                        <div className="text-sm text-blue-300/70 mt-1">{fleetMetrics?.activeAgents} active</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-green-400 text-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                8.5%
                            </div>
                        </div>
                        <h3 className="text-green-100 text-lg font-semibold mb-1">Total Profit</h3>
                        <p className="text-green-300/70 text-sm mb-2">Cumulative earnings</p>
                        <div className="text-3xl font-bold text-green-100">{formatCurrency(fleetMetrics?.totalProfit || 0)}</div>
                        <div className="text-sm text-green-300/70 mt-1">This {selectedTimeframe}</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-purple-400 text-2xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                3.2%
                            </div>
                        </div>
                        <h3 className="text-purple-100 text-lg font-semibold mb-1">Success Rate</h3>
                        <p className="text-purple-300/70 text-sm mb-2">Average performance</p>
                        <div className="text-3xl font-bold text-purple-100">{formatPercentage(fleetMetrics?.averageSuccessRate || 0)}</div>
                        <div className="text-sm text-purple-300/70 mt-1">Across all agents</div>
                    </div>
                </div>

                {/* Performance Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Profit Trend Chart */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Profit Trend</h3>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {timeSeriesData.slice(-14).map((data, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div 
                                        className="bg-gradient-to-t from-green-600 to-green-400 rounded-t w-full transition-all duration-300 hover:from-green-500 hover:to-green-300"
                                        style={{ 
                                            height: `${Math.min((data.profit / (selectedTimeframe === '90d' ? 25 : selectedTimeframe === '7d' ? 15 : 20)) * 200, 200)}px` 
                                        }}
                                        title={`${data.date}: ${formatCurrency(data.profit)}`}
                                    ></div>
                                    <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                                        {new Date(data.date).getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-400 text-center">
                            Daily profit over the last 14 days
                        </div>
                    </div>

                    {/* Transaction Volume Chart */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Transaction Volume</h3>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {timeSeriesData.slice(-14).map((data, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div 
                                        className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t w-full transition-all duration-300 hover:from-blue-500 hover:to-blue-300"
                                        style={{ 
                                            height: `${Math.min((data.transactions / (selectedTimeframe === '90d' ? 12 : selectedTimeframe === '7d' ? 8 : 10)) * 200, 200)}px` 
                                        }}
                                        title={`${data.date}: ${data.transactions} transactions`}
                                    ></div>
                                    <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                                        {new Date(data.date).getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-400 text-center">
                            Daily transaction count over the last 14 days
                        </div>
                    </div>
                </div>

                {/* Agent Performance Table */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Top Performing Agents</h3>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                            View All Agents →
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Agent</th>
                                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Strategy</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Profit</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Success Rate</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Transactions</th>
                                    <th className="text-right py-3 px-4 text-gray-300 font-medium">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentPerformance.slice(0, 8).map((agent, index) => (
                                    <tr key={agent.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <span className="text-white font-medium">{agent.id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getStrategyIcon(agent.strategyType)}</span>
                                                <span className={`font-medium ${getStrategyColor(agent.strategyType)}`}>
                                                    {agent.strategyType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-green-400 font-medium">{formatCurrency(agent.totalProfit)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-white font-medium">{formatPercentage(agent.successRate)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-gray-300">{agent.transactions}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-blue-400 font-medium">{formatPercentage(agent.efficiency)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Strategy Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {['HighestAPY', 'AutoCompoundOnly5P-Farm1', 'AutoCompoundOnly5P-Farm2', 'AutoCompoundSplit-Farm2'].map((strategy) => {
                        const strategyAgents = agentPerformance.filter(a => a.strategyType === strategy);
                        const avgProfit = strategyAgents.length > 0 ? strategyAgents.reduce((sum, a) => sum + a.totalProfit, 0) / strategyAgents.length : 0;
                        const avgSuccessRate = strategyAgents.length > 0 ? strategyAgents.reduce((sum, a) => sum + a.successRate, 0) / strategyAgents.length : 0;
                        
                        const strategyNames = {
                            'HighestAPY': 'Smart Agent',
                            'AutoCompoundOnly5P-Farm1': 'Farm 1 Agent',
                            'AutoCompoundOnly5P-Farm2': 'Farm 2 Agent',
                            'AutoCompoundSplit-Farm2': 'Farm 3 Agent'
                        };
                        
                        return (
                            <div key={strategy} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <h4 className="text-lg font-semibold text-white">{strategyNames[strategy as keyof typeof strategyNames]}</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Agents</span>
                                        <span className="text-white font-medium">{strategyAgents.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Avg Profit</span>
                                        <span className="text-green-400 font-medium">{formatCurrency(avgProfit)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Success Rate</span>
                                        <span className="text-blue-400 font-medium">{formatPercentage(avgSuccessRate)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Efficiency Metrics</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Average Efficiency</span>
                                    <span className="text-white font-medium">{formatPercentage(fleetMetrics?.averageEfficiency || 0)}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                                        style={{ width: `${fleetMetrics?.averageEfficiency || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Total Transactions</span>
                                    <span className="text-white font-medium">{fleetMetrics?.totalTransactions.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                                        style={{ width: `${Math.min((fleetMetrics?.totalTransactions || 0) / 200 * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                View Agent Dashboard
                            </button>
                            <button 
                                onClick={() => router.push('/farms')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Explore Farms
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

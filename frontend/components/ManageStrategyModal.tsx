'use client';
import React, { useState, useEffect } from 'react';

// Define the Strategy type (should match the contract struct)
type AgentStrategy = {
  strategyType: string;
  riskTolerance: string;
  allocationPercent: number;
  timeLockDays: number;
}

// Update props to use the AgentStrategy type
interface ManageStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | string[] | undefined;
  initialStrategy: AgentStrategy; // Now expects the full object
  onSave: (newStrategy: AgentStrategy) => void; // Now expects the full object
  agentType?: string; // Add agent type to determine if it's a smart agent
}

const ManageStrategyModal: React.FC<ManageStrategyModalProps> = ({
  isOpen,
  onClose,
  agentId,
  initialStrategy,
  onSave, // Use the passed onSave function
  agentType, // Add agentType parameter
}) => {
  // Use state for each parameter based on the initialStrategy object
  const [strategyType, setStrategyType] = useState(initialStrategy.strategyType);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(() => {
    // Initialize with current strategy if it's a Smart Agent
    if (agentType === 'Smart Agent' && initialStrategy.strategyType) {
      return [initialStrategy.strategyType];
    }
    return [];
  });
  const [allocation, setAllocation] = useState(initialStrategy.allocationPercent);
  const [risk, setRisk] = useState(initialStrategy.riskTolerance);
  const [timeLock, setTimeLock] = useState(initialStrategy.timeLockDays.toString()); // Keep as string for input

  // Update local state if the initial strategy object changes
  useEffect(() => {
    setStrategyType(initialStrategy.strategyType);
    setAllocation(initialStrategy.allocationPercent);
    setRisk(initialStrategy.riskTolerance);
    setTimeLock(initialStrategy.timeLockDays.toString());
    
    // Update selected strategies for Smart Agents
    if (agentType === 'Smart Agent' && initialStrategy.strategyType) {
      setSelectedStrategies([initialStrategy.strategyType]);
    }
  }, [initialStrategy, agentType]);

  // Handle strategy checkbox changes for Smart Agents
  const handleStrategyChange = (strategy: string, checked: boolean) => {
    if (checked) {
      setSelectedStrategies(prev => [...prev, strategy]);
    } else {
      setSelectedStrategies(prev => prev.filter(s => s !== strategy));
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    // For Smart Agents, use the first selected strategy as the primary strategy
    // In a real implementation, you might want to handle multiple strategies differently
    const primaryStrategy = agentType === 'Smart Agent' && selectedStrategies.length > 0 
      ? selectedStrategies[0] 
      : strategyType;
    
    // Construct the new strategy object from the current state
    const newStrategy: AgentStrategy = {
      strategyType: primaryStrategy,
      riskTolerance: risk,
      allocationPercent: allocation,
      timeLockDays: parseInt(timeLock) || 0, // Convert timelock back to number, default to 0
    };
    console.log(`Saving new strategy for Agent #${agentId}:`, newStrategy);
    console.log(`Selected strategies for Smart Agent:`, selectedStrategies);
    onSave(newStrategy); // Pass the full new strategy object back
    // onClose(); // Let the parent component close the modal after save logic
  };

  return (
    <>
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-2 sm:p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-3 sm:p-4 md:p-6 w-full max-w-sm sm:max-w-md md:max-w-md text-white shadow-2xl animate-fade-in-scale max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Strategy Configuration
                </h2>
                <p className="text-gray-400 text-sm">Agent #{agentId} • Advanced Settings</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white text-2xl transition-colors duration-200 hover:bg-gray-700/50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Strategy Type Selection - Only for Smart Agents */}
          {agentType === 'Smart Agent' ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <label className="text-lg font-semibold text-gray-200">
                  Strategy Selection
                </label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="highestAPY"
                    checked={selectedStrategies.includes('HighestAPY')}
                    onChange={(e) => handleStrategyChange('HighestAPY', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="highestAPY" className="text-white font-semibold cursor-pointer text-lg">
                        Highest APY Hunter
                      </label>
                      <p className="text-sm text-gray-400">Automatically finds and migrates to highest yield farms</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="riskAdjusted"
                    checked={selectedStrategies.includes('RiskAdjustedYield')}
                    onChange={(e) => handleStrategyChange('RiskAdjustedYield', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="riskAdjusted" className="text-white font-semibold cursor-pointer text-lg">
                        Risk-Adjusted Yield Optimizer
                      </label>
                      <p className="text-sm text-gray-400">Balances risk and reward for optimal returns</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-200 font-semibold">
                    Selected Strategies: {
                      selectedStrategies.length > 0 
                        ? selectedStrategies.map(strategy => 
                            strategy === 'HighestAPY' ? 'Highest APY Hunter' : 'Risk-Adjusted Yield Optimizer'
                          ).join(' + ')
                        : 'None selected'
                    }
                  </p>
                </div>
                <p className="text-xs text-blue-300">
                  Smart Agents can combine multiple strategies for enhanced performance.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-blue-300">
                      Auto-Compound Strategy
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      Simple agents automatically compound rewards in their assigned farm.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Allocation Percentage Slider */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <label htmlFor="allocation" className="text-lg font-semibold text-gray-200">
                Allocation: <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">{allocation}%</span>
              </label>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
              <input
                type="range"
                id="allocation"
                min="0"
                max="100"
                step="1"
                value={allocation}
                onChange={(e) => setAllocation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #06b6d4 ${allocation}%, #374151 ${allocation}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-3">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Conservative
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Aggressive
                </span>
              </div>
            </div>
          </div>

          {/* Risk Tolerance Buttons */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <label className="text-lg font-semibold text-gray-200">Risk Tolerance</label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  level: "Low", 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ), 
                  color: "from-green-500 to-emerald-600", 
                  bg: "from-green-900/20 to-emerald-900/20", 
                  border: "border-green-700/30" 
                },
                { 
                  level: "Medium", 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ), 
                  color: "from-yellow-500 to-orange-600", 
                  bg: "from-yellow-900/20 to-orange-900/20", 
                  border: "border-yellow-700/30" 
                },
                { 
                  level: "High", 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ), 
                  color: "from-red-500 to-pink-600", 
                  bg: "from-red-900/20 to-pink-900/20", 
                  border: "border-red-700/30" 
                }
              ].map(({ level, icon, color, bg, border }) => (
                <button
                  key={level}
                  onClick={() => setRisk(level)}
                  className={`py-4 px-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    risk === level
                      ? `bg-gradient-to-r ${bg} border ${border} text-white shadow-lg scale-105`
                      : 'bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:bg-gray-700/40 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg ${risk === level ? `bg-gradient-to-r ${color}` : 'bg-gray-700'}`}>
                      {icon}
                    </div>
                    <div className={risk === level ? `bg-gradient-to-r ${color} bg-clip-text text-transparent` : ''}>
                      {level}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Lock Input */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <label htmlFor="timeLock" className="text-lg font-semibold text-gray-200">
                Time Lock <span className="text-sm text-gray-400 font-normal">(Optional)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="number"
                id="timeLock"
                min="0"
                placeholder="e.g., 30"
                value={timeLock}
                onChange={(e) => setTimeLock(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl py-4 px-4 pr-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-lg"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 font-medium text-sm">
                days
              </span>
            </div>
            <div className="mt-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400">
                  Lock your funds for additional yield rewards. Longer locks typically offer higher APY.
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Button */}
          <div className="mb-8 text-center">
            <button disabled className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 text-blue-300 text-sm py-3 px-6 rounded-xl opacity-50 cursor-not-allowed transition-all duration-200 flex items-center gap-2 mx-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Strategy Manually (Coming Soon)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Strategy
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageStrategyModal;
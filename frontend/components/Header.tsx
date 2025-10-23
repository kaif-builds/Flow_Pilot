'use client';
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import Link from 'next/link';
import WalletSelector from './WalletSelector';

// We'll define a simple type for the user object we care about.
type FlowUser = {
  loggedIn: boolean | null;
  addr?: string | null;
}

// Handler function to convert FCL CurrentUser to FlowUser
const handleUserChange = (currentUser: any) => {
  const flowUser: FlowUser = {
    loggedIn: currentUser?.loggedIn ?? false,
    addr: currentUser?.addr ?? null
  };
  return flowUser;
};

export default function Header() {
  const [user, setUser] = useState<FlowUser>({ loggedIn: false, addr: null });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to FCL user changes with proper type conversion
    fcl.currentUser.subscribe((currentUser) => {
      setUser(handleUserChange(currentUser));
    });
  }, []);

  useEffect(() => {
    // Update connection status based on user state
    setIsConnected(user.loggedIn === true);
  }, [user.loggedIn]);

  const handleLogout = async () => {
    try {
      await fcl.unauthenticate();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear wallet-related data
    localStorage.removeItem('userBalance');
    localStorage.removeItem('balanceManuallyReset');
    localStorage.removeItem('realWalletConnected');
    
    // Clear bought fleets and marketplace listings
    localStorage.removeItem('boughtFleets');
    localStorage.removeItem('marketplaceListings');
    
    // Only clear agents if we were connected to a real wallet
    const wasRealWalletConnected = localStorage.getItem('realWalletConnected') === 'true';
    if (wasRealWalletConnected) {
      console.log('🔌 Real wallet logout - clearing agents');
      // Clear session storage to remove all minted agents
      sessionStorage.removeItem('demoMintedAgents');
      sessionStorage.removeItem('hasMintedAgents');
      sessionStorage.removeItem('pausedAgents');
    } else {
      console.log('🎭 Demo mode logout - keeping agents');
      // In demo mode, keep all agent data, only clear paused state
      sessionStorage.removeItem('pausedAgents');
    }
    
    // Dispatch wallet disconnected event to update all components
    window.dispatchEvent(new CustomEvent('walletDisconnected', { detail: { balance: 0 } }));
    
    // Refresh the current page to reset all state
    window.location.reload();
  };

  const isAuthenticated = user.loggedIn === true || isConnected;

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-b from-[#10182a] via-gray-900 to-black/70 shadow-lg border-b border-[#21273a]/50 backdrop-blur">
      <nav className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 flex items-center justify-between h-14 sm:h-16">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center gap-1 sm:gap-2 font-extrabold text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-blue-400 via-brand-primary to-green-300 bg-clip-text text-transparent tracking-tight drop-shadow-sm hover:opacity-90 transition">
            <span className="inline-block align-middle drop-shadow">⚡</span>
            Flow Pilot
          </Link>
        </div>
        
        {/* Navigation Links - positioned closer to center-right */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 lg:gap-4">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm lg:text-base rounded-xl font-medium bg-gradient-to-r from-[#1f2741] to-[#212b48] text-blue-100 hover:bg-blue-700/40 hover:text-white transition"
            >
              Dashboard
            </Link>
            <Link
              href="/farms"
              className="px-3 py-2 text-sm lg:text-base rounded-xl font-medium bg-gradient-to-r from-[#1f2741] to-[#212b48] text-blue-100 hover:bg-blue-700/40 hover:text-white transition"
            >
              Farms
            </Link>
            <Link
              href="/analytics"
              className="px-3 py-2 text-sm lg:text-base rounded-xl font-medium bg-gradient-to-r from-[#1f2741] to-[#212b48] text-blue-100 hover:bg-blue-700/40 hover:text-white transition"
            >
              Analytics
            </Link>
            <Link
              href="/leaderboards"
              className="px-3 py-2 text-sm lg:text-base rounded-xl font-medium bg-gradient-to-r from-[#1f2741] to-[#212b48] text-blue-100 hover:bg-blue-700/40 hover:text-white transition"
            >
              Leaderboards
            </Link>
            <Link
              href="/buy-sell"
              className="px-3 py-2 text-sm lg:text-base rounded-xl font-medium bg-gradient-to-r from-[#1f2741] to-[#212b48] text-blue-100 hover:bg-blue-700/40 hover:text-white transition"
            >
              Buy/Sell
            </Link>
            
            {/* Wallet Selector - right after navigation links */}
            <WalletSelector />
            
            {/* Logout button */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden sm:block ml-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-3 lg:px-5 rounded-lg shadow-md transition text-sm lg:text-base"
              >
                Logout
              </button>
            )}
        </div>
        
        {/* Mobile menu button - show on small screens */}
        <div className="md:hidden">
          <button className="px-2 py-1 text-blue-100 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

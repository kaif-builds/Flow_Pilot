'use client';
import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';

export default function WalletSelector() {
  const [user, setUser] = useState({ loggedIn: false, addr: null });
  const [isConnecting, setIsConnecting] = useState(false);

  // Handler function to convert FCL CurrentUser to our user state
  const handleUserChange = (currentUser: any) => {
    const userState = {
      loggedIn: currentUser?.loggedIn ?? false,
      addr: currentUser?.addr ?? null
    };
    setUser(userState);
  };

  useEffect(() => {
    // Subscribe to user changes with proper type conversion
    fcl.currentUser.subscribe(handleUserChange);
  }, []);

  // Handle wallet connection state changes
  useEffect(() => {
    if (user.loggedIn && user.addr) {
      console.log('🎉 Wallet connected via FCL subscription:', user.addr);
      
      // Dispatch wallet connected event with 1000 USDC balance
      window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { balance: 1000.0 } 
      }));
      
      // Update localStorage
      localStorage.setItem('userBalance', '1000');
      localStorage.setItem('realWalletConnected', 'true');
    }
  }, [user.loggedIn, user.addr]);

  const handleConnectWallet = async () => {
    console.log('🔄 Starting wallet connection...');
    setIsConnecting(true);
    try {
      console.log('🔗 Calling fcl.authenticate()...');
      const result = await fcl.authenticate();
      console.log('✅ Wallet connected successfully!', result);
      
      // Dispatch wallet connected event with 1000 USDC balance
      window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { balance: 1000.0 } 
      }));
      
      // Update localStorage
      localStorage.setItem('userBalance', '1000');
      localStorage.setItem('realWalletConnected', 'true');
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);

      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        console.error('Unknown error type. Error object:', error);
      }
      console.log('🏁 Connection attempt finished');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fcl.unauthenticate();
      console.log('Wallet disconnected successfully!');
      
      // Only clear wallet-related data, keep demo data intact
      localStorage.setItem('userBalance', '0');
      localStorage.removeItem('balanceManuallyReset');
      localStorage.removeItem('realWalletConnected');
      
      // Trigger custom event
      window.dispatchEvent(new CustomEvent('walletDisconnected', { detail: { balance: 0 } }));
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <div className="relative">
      {user.loggedIn ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="hidden sm:inline">Connected</span>
            <span className="sm:hidden">✓</span>
          </div>
          <div className="text-xs text-gray-300 hidden">
            {typeof user.addr === 'string' && user.addr
              ? `${(user.addr as string).slice(0, 6)}...${(user.addr as string).slice(-4)}`
              : 'Unknown'}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="hidden sm:inline">Disconnect</span>
            <span className="sm:hidden">×</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg ${
            isConnecting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

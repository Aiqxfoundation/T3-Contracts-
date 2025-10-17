export interface TronLinkWallet {
  ready: boolean;
  address: string | null;
  tronWeb: any;
}

export const checkTronLink = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).tronWeb;
};

export const getTronLinkAddress = async (): Promise<string | null> => {
  if (!checkTronLink()) {
    throw new Error('TronLink wallet not found. Please install TronLink extension.');
  }

  const tronWeb = (window as any).tronWeb;
  
  if (!tronWeb.ready) {
    throw new Error('TronLink is not ready. Please unlock your wallet.');
  }

  if (!tronWeb.defaultAddress || !tronWeb.defaultAddress.base58) {
    throw new Error('Please connect your TronLink wallet');
  }

  return tronWeb.defaultAddress.base58;
};

export const requestTronLinkConnection = async (): Promise<{ address: string; network: 'mainnet' | 'testnet' }> => {
  if (!checkTronLink()) {
    throw new Error('TronLink wallet not found. Please install TronLink extension from https://www.tronlink.org/');
  }

  const tronWeb = (window as any).tronWeb;
  
  try {
    const res = await tronWeb.request({ method: 'tron_requestAccounts' });
    
    if (!res || res.code !== 200) {
      throw new Error('Failed to connect to TronLink. Please approve the connection request.');
    }

    const address = tronWeb.defaultAddress.base58;
    const fullNode = tronWeb.fullNode.host;
    const network = fullNode.includes('shasta') ? 'testnet' : 'mainnet';

    return { address, network };
  } catch (error: any) {
    console.error('TronLink connection error:', error);
    throw new Error(error.message || 'Failed to connect to TronLink');
  }
};

export const getTronLinkNetwork = (): 'mainnet' | 'testnet' | null => {
  if (!checkTronLink()) return null;
  
  const tronWeb = (window as any).tronWeb;
  const fullNode = tronWeb?.fullNode?.host || '';
  
  if (fullNode.includes('shasta')) return 'testnet';
  if (fullNode.includes('trongrid.io')) return 'mainnet';
  
  return null;
};

export const watchTronLinkAccount = (callback: (address: string | null) => void) => {
  if (!checkTronLink()) return;

  const tronWeb = (window as any).tronWeb;
  
  const checkAccount = () => {
    const address = tronWeb?.defaultAddress?.base58 || null;
    callback(address);
  };

  const interval = setInterval(checkAccount, 1000);
  
  return () => clearInterval(interval);
};

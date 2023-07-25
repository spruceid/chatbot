import React, { createContext, useContext, useEffect, useState } from 'react';
import { SSX } from '@spruceid/ssx';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig, WalletClient } from 'wagmi';
import { useWalletClient, useDisconnect } from 'wagmi';

import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { providers } from 'ethers';

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum],
  [
    publicProvider()
  ]
);
const { connectors } = getDefaultWallets({
  appName: 'Chatbot',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

export interface SSXContextInterface {
  /** SSX Instance. */
  ssx: SSX | undefined;
  /** SSX Instance loading state. */
  signingIn: boolean;
}

/** Default, uninitialized context. */
const SSXContext = createContext<SSXContextInterface>({
  ssx: undefined,
  signingIn: false,
});

const SSXParent = ({ children }: { children: any }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
      {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

/** SSX Provider Component. */
export const SSXChild = ({ children }: { children: any }) => {
  // const { data: signer } = useSigner();
  const { data: client } = useWalletClient()

  const { disconnect } = useDisconnect()

  const [ssx, setSSX] = useState<SSX | undefined>(undefined);
  const [signingIn, setSigningIn] = useState<boolean>(false);


  const watchSigner = async () => {
    if (client) {
      const signer = walletClientToEthers5Signer(client)

      /* 
      We verify SSX here to prevent a new sign in when changing the account.
      If you want to sign in when the account changes, remove this return.
      */
      if (ssx) return;

      setSigningIn(true);

      const ssxConfig = {
        siweConfig: {
          statement: 'Sign into ChatBot!',
        },
        modules: {
          storage: {
            prefix: 'chatbot',
            autoCreateNewOrbit: false,
          },
        },
        providers: {
          web3: {
            driver: signer?.provider
          },
        },
      };

      try {
        const ssxInstance = new SSX(ssxConfig);
        setSSX(ssxInstance);
      } catch (e) {
        console.error(e);
        disconnect();
      }
      setSigningIn(false);
    } else {
      try {
        await ssx?.signOut();
      } catch (e) {
        // User rejected the connection after the wallet selection on web3modal
      }
      setSSX(undefined);
      setSigningIn(false);
    }
  }

  useEffect(() => {
    watchSigner();
  }, [client])

  const SSXProviderValue: SSXContextInterface = {
    ssx,
    signingIn,
  };

  return (
    <>
      <SSXContext.Provider value={SSXProviderValue}>
        {children}
      </SSXContext.Provider>
    </>
  );
};

/** Hook for accessing SSX instance and state. */
export const useSSX = (): SSXContextInterface => {
  return useContext(SSXContext);
};

export const SSXProvider = ({ children }: { children: any }) => {
  return (
    <SSXParent>
      <SSXChild>{children}</SSXChild>
    </SSXParent>
  );
};


export function walletClientToEthers5Signer(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}
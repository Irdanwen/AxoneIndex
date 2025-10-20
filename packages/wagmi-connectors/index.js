const unavailable = (name) => () => {
  throw new Error(`@wagmi/connectors stub: the "${name}" connector is not available in this build.`);
};

export { createConnector, injected, mock } from '@wagmi/core';
export const version = '5.9.4-axone.1';

export const baseAccount = unavailable('baseAccount');
export const coinbaseWallet = unavailable('coinbaseWallet');
export const gemini = unavailable('gemini');
export const metaMask = unavailable('metaMask');
export const safe = unavailable('safe');
export const walletConnect = unavailable('walletConnect');

export { createConnector, injected, mock } from '@wagmi/core';
export type { InjectedParameters, MockParameters } from '@wagmi/core';

export const version: string;

export type BaseAccountParameters = never;
export type CoinbaseWalletParameters = never;
export type GeminiParameters = never;
export type MetaMaskParameters = never;
export type SafeParameters = never;
export type WalletConnectParameters = never;

export const baseAccount: (...args: never[]) => never;
export const coinbaseWallet: (...args: never[]) => never;
export const gemini: (...args: never[]) => never;
export const metaMask: (...args: never[]) => never;
export const safe: (...args: never[]) => never;
export const walletConnect: (...args: never[]) => never;

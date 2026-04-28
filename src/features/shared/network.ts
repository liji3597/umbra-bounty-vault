import { z } from 'zod';

export type SupportedWalletNetwork = 'devnet' | 'mainnet';
export type WalletNetwork = SupportedWalletNetwork | 'unsupported';

export const supportedWalletNetworkSchema = z.enum(['devnet', 'mainnet']) satisfies z.ZodType<SupportedWalletNetwork>;

import { z } from 'zod';

import type { WalletNetwork } from '@/providers/WalletProvider';

export const supportedWalletNetworkSchema = z.enum(['devnet', 'mainnet']) satisfies z.ZodType<
  Exclude<WalletNetwork, 'unsupported'>
>;

export type SupportedWalletNetwork = z.infer<typeof supportedWalletNetworkSchema>;

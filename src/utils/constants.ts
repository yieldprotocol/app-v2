import { ethers, BigNumber } from 'ethers';

/* constants */
export const MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_128 = '0xffffffffffffffffffffffffffffffff';

export const SECONDS_PER_YEAR: number = (365 * 24 * 60 * 60);
export const ETH_BYTES = ethers.utils.formatBytes32String('ETH-A');
export const CHAI_BYTES = ethers.utils.formatBytes32String('CHAI');
export const ONE_RAY_BN = BigNumber.from('1000000000000000000000000000');
export const ONE_WEI_BN = BigNumber.from('1000000000000000000');

export const ETH_BASED_ASSETS = ['0x455448000000', 'ETH_B_forexample'];
export const DAI_BASED_ASSETS = ['0x444149000000'];

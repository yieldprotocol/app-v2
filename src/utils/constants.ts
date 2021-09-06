import { ethers, BigNumber } from 'ethers';

/* constants */
export const MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_128 = '0xffffffffffffffffffffffffffffffff';

export const ZERO_BN = ethers.constants.Zero;
export const ONE_BN = ethers.constants.One;
export const MINUS_ONE_BN = ethers.constants.One.mul(-1);

export const ONE_RAY_BN = BigNumber.from('1000000000000000000000000000');
export const ONE_WEI_BN = BigNumber.from('1000000000000000000');

export const SECONDS_PER_YEAR: number = 365 * 24 * 60 * 60;

export const ETH_BYTES = ethers.utils.formatBytes32String('ETH-A');
export const CHAI_BYTES = ethers.utils.formatBytes32String('CHAI');

export const CHI = ethers.utils.formatBytes32String('chi');
export const RATE = ethers.utils.formatBytes32String('rate');

export const WETH = '0x455448000000';
export const DAI = '0x444149000000';
export const USDC = '0x555344430000';

export const ETH_BASED_ASSETS = ['0x455448000000', ethers.utils.formatBytes32String('ETH').slice(0, 14)];
export const DAI_BASED_ASSETS = ['0x444149000000'];

export const BLANK_VAULT = '0x000000000000000000000000';
export const BLANK_SERIES = '0x000000000000'

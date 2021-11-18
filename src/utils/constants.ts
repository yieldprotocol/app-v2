import { ethers, BigNumber } from 'ethers';

/* constants */
export const MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_128 = '0xffffffffffffffffffffffffffffffff';

export const ZERO_BN = ethers.constants.Zero;
export const ONE_BN = ethers.constants.One;
export const MINUS_ONE_BN = ethers.constants.One.mul(-1);

export const WAD_RAY_BN = BigNumber.from('1000000000000000000000000000');
export const WAD_BN = BigNumber.from('1000000000000000000');

export const SECONDS_PER_YEAR: number = 365 * 24 * 60 * 60;

export const ETH_BYTES = ethers.utils.formatBytes32String('ETH-A');
export const CHAI_BYTES = ethers.utils.formatBytes32String('CHAI');

export const CHI = ethers.utils.formatBytes32String('chi');
export const RATE = ethers.utils.formatBytes32String('rate');

export const WETH =  '0x303000000000' // '0x455448000000';
export const DAI = '0x303100000000'; // 0x444149000000';
export const USDC = '0x303200000000'; // '0x555344430000';
export const WBTC = '0x303300000000';
export const stETH = '0x303400000000';
export const wstETH = '0x303500000000';
export const LINK = '0x303600000000';

export const BLANK_ADDRESS = ethers.constants.AddressZero;
export const BLANK_VAULT = '0x000000000000000000000000';
export const BLANK_SERIES = '0x000000000000'

export const ETH_BASED_ASSETS = [WETH, ethers.utils.formatBytes32String('ETH').slice(0, 14), '0x455448000000'];

export const DAI_PERMIT_ASSETS = [DAI, '0x444149000000'];
export const NON_PERMIT_ASSETS = ['WBTC', 'LINK'];

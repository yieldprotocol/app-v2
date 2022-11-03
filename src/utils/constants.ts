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

export const BLANK_ADDRESS = ethers.constants.AddressZero;
export const BLANK_VAULT = '0x000000000000000000000000';
export const BLANK_SERIES = '0x000000000000';

export const EULER_SUPGRAPH_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet';

export const CAULDRON = 'Cauldron';
export const WITCH = 'Witch';
export const LADLE = 'Ladle';
export const WRAP_ETHER_MODULE = 'WrapEtherModule';

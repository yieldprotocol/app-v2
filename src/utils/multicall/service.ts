import { JsonRpcProvider } from '@ethersproject/providers';
// eslint-disable-next-line import/no-named-as-default
import EthersMulticall from './ethers';
import { MULTICALL_ADDRESSES } from './addresses';
import { Multicall__factory } from '../../contracts';

export class MulticallService {
  private readonly provider: JsonRpcProvider;

  constructor(provider: JsonRpcProvider) {
    this.provider = provider;
  }

  getMulticall(chainId: number) {
    const multicallAddress = MULTICALL_ADDRESSES[chainId || 1];
    if (!multicallAddress) throw new Error(`Multicall not supported on network id "${chainId}"`);

    const contract = Multicall__factory.connect(multicallAddress, this.provider);
    return new EthersMulticall(contract);
  }
}

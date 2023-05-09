import useSWR from 'swr';
import { Address, useBalance } from 'wagmi';
import useAccountPlus from '../useAccountPlus';
import useDefaultProvider from '../useDefaultProvider';
import { useContext } from 'react';
import { MulticallContext } from '../../contexts/MutlicallContext';
import useFork from '../useFork';
import { VYToken__factory } from '../../contracts';
import { ChainContext } from '../../contexts/ChainContext';

const useVYTokenBaseVal = (vyTokenAddress: string) => {
  const { multicall: _multicall, forkMulticall } = useContext(MulticallContext);
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);
  const provider = useDefaultProvider();
  const { useForkedEnv, provider: forkProvider, forkUrl } = useFork();
  const { address: account } = useAccountPlus();
  const { data: vyTokenBal } = useBalance({ address: account, token: vyTokenAddress as Address });

  const providerToUse = useForkedEnv && forkProvider ? forkProvider : provider;
  const multicall = useForkedEnv ? forkMulticall : _multicall;

  const get = async () => {
    const contract = multicall?.wrap(VYToken__factory.connect(vyTokenAddress, providerToUse))!;
    if (!vyTokenBal) return;

    return await contract.previewRedeem(vyTokenBal.value);
  };

  const key = ['vyTokenBaseVal', vyTokenAddress, forkUrl, useForkedEnv, account, assetRootMap];
  const { data, isLoading, isValidating } = useSWR(key, get);

  return { data, isLoading: isLoading || isValidating, key };
};

export default useVYTokenBaseVal;

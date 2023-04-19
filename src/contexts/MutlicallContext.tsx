import { ReactNode, createContext } from 'react';
import { EthersMulticall, MulticallService } from '@yield-protocol/ui-multicall/src';
import useDefaultProvider from '../hooks/useDefaultProvider';
import useFork from '../hooks/useFork';
import useChainId from '../hooks/useChainId';

const MulticallContext = createContext<{
  multicall: EthersMulticall | undefined;
  forkMulticall: EthersMulticall | undefined;
}>({ multicall: undefined, forkMulticall: undefined });

const MulticallProvider = ({ children }: { children: ReactNode }) => {
  const chainId = useChainId();
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv } = useFork();

  const multicallService = new MulticallService(provider);
  const forkMulticallService = new MulticallService(forkProvider!);
  const multicall = multicallService.getMulticall(chainId);
  const forkMulticall = forkMulticallService.getMulticall(chainId);

  if (!multicall) throw new Error('Multicall not initialized');
  if (useForkedEnv && !forkMulticall) throw new Error('Forked Multicall not initialized');

  return <MulticallContext.Provider value={{ multicall, forkMulticall }}>{children}</MulticallContext.Provider>;
};

export { MulticallContext };
export default MulticallProvider;

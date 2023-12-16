import { ReactNode, createContext } from 'react';
import { EthersMulticall, MulticallService } from '@yield-protocol/ui-multicall';
import useDefaultProvider from '../hooks/useDefaultProvider';
import useFork from '../hooks/useFork';
import { useNetwork } from 'wagmi';


const MulticallContext = createContext<{
  multicall: EthersMulticall | undefined;
  forkMulticall: EthersMulticall | undefined;
}>({ multicall: undefined, forkMulticall: undefined });

const MulticallProvider = ({ children }: { children: ReactNode }) => {
  const {chain} = useNetwork();
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv } = useFork();

  const multicallService = new MulticallService(provider);
  const forkMulticallService = new MulticallService(forkProvider!);
  const multicall = multicallService.getMulticall(chain?.id || 1);
  const forkMulticall = forkMulticallService.getMulticall(chain?.id || 1);

  if (!multicall) throw new Error('Multicall not initialized');
  if (useForkedEnv && !forkMulticall) throw new Error('Forked Multicall not initialized');

  return <MulticallContext.Provider value={{ multicall, forkMulticall }}>{children}</MulticallContext.Provider>;
};

export { MulticallContext };
export default MulticallProvider;

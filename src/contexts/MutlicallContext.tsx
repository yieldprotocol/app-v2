import { ReactNode, createContext } from 'react';
import { MulticallService } from '@yield-protocol/ui-multicall/src';
import useDefaultProvider from '../hooks/useDefaultProvider';
import useFork from '../hooks/useFork';

const MulticallContext = createContext<{
  multicall: MulticallService | undefined;
  forkMulticall: MulticallService | undefined;
}>({ multicall: undefined, forkMulticall: undefined });

const MulticallProvider = ({ children }: { children: ReactNode }) => {
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv } = useFork();

  const multicall = new MulticallService(provider);
  const forkMulticall = new MulticallService(forkProvider!);

  if (!multicall) throw new Error('Multicall not initialized');
  if (useForkedEnv && !forkMulticall) throw new Error('Forked Multicall not initialized');

  return <MulticallContext.Provider value={{ multicall, forkMulticall }}>{children}</MulticallContext.Provider>;
};

export { MulticallContext };
export default MulticallProvider;

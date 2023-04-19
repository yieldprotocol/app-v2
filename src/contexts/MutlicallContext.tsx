import { ReactNode, createContext } from 'react';
import { MulticallService } from '@yield-protocol/ui-multicall/src';
import useDefaultProvider from '../hooks/useDefaultProvider';
import useFork from '../hooks/useFork';

const MulticallContext = createContext({});

const MulticallProvider = ({ children }: { children: ReactNode }) => {
  const provider = useDefaultProvider();
  const { provider: forkProvider } = useFork();

  const multicall = new MulticallService(provider);
  const forkMulticall = new MulticallService(forkProvider!);

  return <MulticallContext.Provider value={{ multicall, forkMulticall }}>{children}</MulticallContext.Provider>;
};

export { MulticallContext };
export default MulticallProvider;

import { base, Grommet } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { useColorScheme } from '../hooks/useColorScheme';
import { yieldTheme } from '../themes';

const GrommetProviderForSSR = ({ children } : { children:any }) => {
  const colorScheme = useColorScheme();
  return (
    <Grommet theme={deepMerge(base, yieldTheme) as any} themeMode={colorScheme} full>
      {children}
    </Grommet>
  );
};

export default GrommetProviderForSSR;

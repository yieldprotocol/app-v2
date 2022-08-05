import { Box, ThemeContext } from 'grommet';
import { useContext } from 'react';
import styled from 'styled-components';
import { useColorScheme } from '../../hooks/useColorScheme';

const LineStyled = styled(Box)`
  width: 100%;
  height: 0.5px;
  background: ${(props) => props.color ?? '#262626'};
`;

const Line = () => {
  const theme = useColorScheme();
  const globalTheme = useContext<any>(ThemeContext);
  const { gradient } = globalTheme.global.colors;
  return <LineStyled color={theme === 'dark' ? gradient.dark : gradient.light} />;
};

export default Line;

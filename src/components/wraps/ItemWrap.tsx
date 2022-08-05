import { Box, Stack, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { GiMedalSkull } from 'react-icons/gi';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

function ItemWrap({
  action,
  index,
  warn,
  liquidated,
  children,
}: {
  children: any;
  index: number;
  warn?:boolean|undefined;
  liquidated?: boolean | undefined;
  action: () => void;
}) {
  return (
    <StyledBox
      animation={{ type: 'fadeIn', delay: index * 100, duration: 1500 }}
      hoverIndicator={{ elevation: 'large', background: 'lightBackground' }}
      onClick={() => action()}
      round="xsmall"
      elevation="xsmall"
      flex={false}
      fill="horizontal"
      background="lightBackground"
    >
      <Stack anchor="top-right">
        {children}
        {liquidated && (
          <Box pad="xsmall">
            <Text color="error">
              <GiMedalSkull />
            </Text>
          </Box>
        )}
        {warn && (
          <Box pad="xsmall">
            <Text color="warning">
              <FiAlertTriangle />
            </Text>
          </Box>
        )}
      </Stack>
    </StyledBox>
  );
}

export default ItemWrap;

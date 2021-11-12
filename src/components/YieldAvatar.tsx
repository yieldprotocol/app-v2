import React, { useContext } from 'react';
import styled from 'styled-components';
import multiavatar from '@multiavatar/multiavatar';
import { Avatar, Box } from 'grommet';
import { useColorScheme } from '../hooks/useColorScheme';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.5);
  }
`;

function YieldAvatar(props: any) {

  const colorScheme = useColorScheme();
  const _avatar = multiavatar(props.address.concat(21));
  const _size = props.size.toString().concat('em');

  return (
    <StyledBox>
      <Avatar border={{ color: colorScheme === 'dark' ? '#FFF' : '#000' }} size={_size || '2em'}>
        <Box width="100%" height="100%" pad="2px">
          {
            // eslint-disable-next-line react/no-danger
            <span dangerouslySetInnerHTML={{ __html: _avatar }} />
          }
        </Box>
      </Avatar>
    </StyledBox>
  );
}

export default YieldAvatar;

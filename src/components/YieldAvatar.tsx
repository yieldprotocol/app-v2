import React, { useContext } from 'react';
import styled from 'styled-components';
import multiavatar from '@multiavatar/multiavatar';
import { Avatar, Box, Image } from 'grommet';
import { UserContext } from '../contexts/UserContext';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.75);
  }
`;

function YieldAvatar(props: any) {
  const {
    userState: { dudeSalt },
  } = useContext(UserContext);

  const _avatar = multiavatar(props.address.concat(dudeSalt));

  const _size = props.size.toString().concat('em');
  const _outerSize = (props.size + 0.5).toString().concat('em');

  return (
    <StyledBox>
      <Avatar border={{ color: '#000' }} size={_size || '2em'} hoverIndicator={{ elevation: 'small' }}>
        <Box width="100%" height="100%" pad="2px">
          <span dangerouslySetInnerHTML={{ __html: _avatar }} />
        </Box>
      </Avatar>
    </StyledBox>
  );
}

export default YieldAvatar;

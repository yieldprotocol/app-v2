import React from 'react';
import multiavatar from '@multiavatar/multiavatar';
import { Avatar, Box, Image } from 'grommet';

function YieldAvatar(props: any) {
  const _avatar = multiavatar(props.address);
  const _size = props.size.toString().concat('em');
  const _outerSize = (props.size + 0.5).toString().concat('em');

  return (
    <Avatar border={{ color: '#000' }} size={_outerSize || '2.5em'}>
      <Avatar size={_size || '2em'}>
        <Box width="100%">
          <span dangerouslySetInnerHTML={{ __html: _avatar }} />
        </Box>
      </Avatar>
    </Avatar>
  );
}

export default YieldAvatar;

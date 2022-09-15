import styled from 'styled-components';
import multiavatar from '@multiavatar/multiavatar';
import { Avatar, Box, Image } from 'grommet';

import { useColorScheme } from '../hooks/useColorScheme';
import { useEnsAvatar } from 'wagmi';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.5);
  }
`;

function YieldAvatar(props: any) {

  const {data} = useEnsAvatar();

  const colorScheme = useColorScheme();
  const _avatar = multiavatar(props.address.concat(21));
  const _size = props.size.toString().concat('em');

  return (
    <StyledBox>
      <Avatar border={{ color: colorScheme === 'dark' ? '#FFF' : '#000' }} size={_size || '2em'}>
        <Box width="100%" height="100%" pad={data ? undefined : '2px'}>
          {
            // eslint-disable-next-line react/no-danger
            data ? (
              <Image src={data} alt="ens-avatar" />
            ) : (
              <span dangerouslySetInnerHTML={{ __html: _avatar }} />
            )
          }
        </Box>
      </Avatar>
    </StyledBox>
  );
}

export default YieldAvatar;

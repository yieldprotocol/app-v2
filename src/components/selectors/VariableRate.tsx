import { useContext } from 'react';
import { Avatar, Box, Text } from 'grommet';
import styled from 'styled-components';
import { UserContext } from '../../contexts/UserContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import YieldMark from '../logos/YieldMark';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  background: 0.3s ease-in-out;
  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

const ShineyBox = styled(Box)`
  position: relative;
  overflow: hidden;

  :before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    opacity: 0;
    border: 1px solid rgba(255, 255, 255, 0.5);
    transform: rotate(30deg);
    background: rgba(255, 255, 255, 0.13);
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.5) 77%,
      rgba(255, 255, 255, 0.75) 92%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  ${StyledBox}:hover &::before {
    opacity: 1;
    top: -30%;
    left: -10%;
    transition-property: left, top, opacity;
    transition-duration: 0.7s, 0.7s, 0.15s;
    transition-timing-function: ease;
    animation: shine 2s forwards;
  }

  @keyframes shine {
    0% {
      transform: translateX(-50%) translateY(-50%) rotate(30deg);
      opacity: 0;
    }
    50% {
      transform: translateX(50%) translateY(50%) rotate(30deg);
      opacity: 1;
    }
    100% {
      transform: translateX(200%) translateY(200%) rotate(30deg);
      opacity: 0;
    }
  }
`;

const VariableRate = () => {
  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext);

  const {
    userState: { selectedVR },
    userActions: { setSelectedVR },
  } = useContext(UserContext);

  return (
    <StyledBox
      key={'vr'}
      round="large"
      background={selectedVR ? 'purple' : '#00000007'}
      elevation="xsmall"
      onClick={() => setSelectedVR(true)}
      className="VR-container"
    >
      <Box pad="medium" width="small" direction="row" gap="small" fill>
        <Box direction="row" gap="small" fill>
          <Avatar
            background={
              darkMode
                ? 'linear-gradient(90deg, rgba(30,42,217,1) 15%, rgba(121,0,255,1) 78%)'
                : '-webkit-linear-gradient(95deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)'
            }
            style={{}}
          >
            <YieldMark colors={darkMode ? ['white'] : ['black']} />
          </Avatar>
          <Box align="center" fill="vertical" justify="center">
            <Box direction="row">
              <Text size="small" color={'text-weak'}>
                Variable Rate
              </Text>
            </Box>

            <Text size="xsmall" color={'text-weak'}>
              Indefinite
            </Text>
          </Box>
        </Box>

        <ShineyBox
          round
          background="-webkit-linear-gradient(95deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)"
          pad={{ horizontal: 'small', vertical: 'xsmall' }}
          style={{ position: 'absolute', marginTop: '-2em', marginLeft: '18em' }}
          elevation="small"
        >
          <Text size="small" color="white" textAlign="center">
            NEW
          </Text>
        </ShineyBox>

        <Box fill align="end" width="small" className="thisHereBox">
          <Box style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <Text size="1.5em" color={darkMode ? 'white' : 'black'}>
              {2.7} <Text size="small">% {'APR'}</Text>
            </Text>
          </Box>
        </Box>
      </Box>
    </StyledBox>
  );
};

export default VariableRate;

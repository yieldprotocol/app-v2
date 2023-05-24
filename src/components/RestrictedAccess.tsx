import { FiAlertOctagon } from 'react-icons/fi';
import { Box, Text } from 'grommet';
import styled, { CSSProperties } from 'styled-components';
import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

interface BlurredBoxProps {
  darkMode: boolean;
  style?: CSSProperties;
}

const BlurredBox = styled(Box)<BlurredBoxProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) => (props.darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)')};
  backdrop-filter: blur(${(props) => (props.darkMode ? '0.08rem' : '0.1rem')});
  z-index: 100;
  border: ${(props) => (props.darkMode ? '3px solid white' : '3px solid black')};
  border-radius: 2px;
`;

export const RestrictedAccess = () => {
  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext);

  return (
    <BlurredBox darkMode={darkMode} id="restricted" height="100%" style={{ position: 'absolute' }}>
      {/* // <BlurredBox darkMode={darkMode} id="restricted"> */}
      <Box height="100%" align="center" justify="center">
        <Box align="center">
          <FiAlertOctagon size="2em" color={darkMode ? 'white' : 'black'} />
          <Text margin="medium" color={darkMode ? 'white' : 'black'}>
            Functionality restricted
          </Text>
        </Box>
      </Box>
    </BlurredBox>
  );
};

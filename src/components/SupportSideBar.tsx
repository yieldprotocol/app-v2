import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useEffect } from 'react';
import SupportSettings from './settings/SupportSettings';

function SupportSideBar() {
  const [show, setShow] = React.useState(false);
  
  const handleKeyPress = useCallback((event: any) => {
    if (event.altKey === true) {
      event.key === 'ß' && setShow(true);
    }
  }, []); 
  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);
    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <>
      {show && (
        <Layer
          modal={false}
          responsive={true}
          full="vertical"
          position="right"
          style={{ minWidth: '600px', maxWidth: '600px' }}
          onClickOutside={() => setShow(false)}
          onEsc={() => setShow(false)}
        >
          <Box fill width="400px" background="lightBackground" elevation="xlarge" style={{ overflow: 'auto' }}>
            <Box pad={{ horizontal: 'medium', vertical: 'xlarge' }} background="gradient-transparent" gap="medium">
              <Text size="large" color="text">
                Support & Developer Toolbox
              </Text>
            </Box>
            <Box pad={{ horizontal: 'medium', vertical: 'medium' }} gap="medium">
              <SupportSettings />
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
}

export default SupportSideBar;

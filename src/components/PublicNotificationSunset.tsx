import { useState } from 'react';
import { Box, Text } from 'grommet';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotificationSunset = ({ children }: PublicNotificationProps) => {

  const [showTerms, setShowTerms] = useState<boolean>(false);
  const showTermsModal = () => {
    setShowTerms(!showTerms);
  };

  return (
    <>
      <Box direction="row" align="center" justify="between">
        <Box direction="column" border={{ size: 'small' }} pad="small" gap="small" align="center" round="xsmall">
          <Box gap="small" align="center">
            <Box gap="xsmall" align="center">
              <Box>
                <Text size="medium" weight={'bold'}>
                  Important Notice:
                </Text>
              </Box>
              <Box>
                <Text size="medium" weight={'normal'} textAlign="center">
                  Yield Protocol has been permanently shut down.
                </Text>
              </Box>
            </Box>
            <Text size="xsmall" textAlign="center" weight={'normal'}>
              The Yield Protocol was officially discontinued on the 31st of December 2023, and support was discontinued on the 31st of January 2024.
              {/*               
              {' '}Contact us on our{' '}
              <a
                target="_blank"
                href="https://discord.gg/JAFfDj5"
                style={{ color: 'rgb(255,255,255)', cursor: 'pointer' }}
              >
                discord channel
              </a>{' '}
              with any support issues until 31 January 2024. */}
            </Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PublicNotificationSunset;

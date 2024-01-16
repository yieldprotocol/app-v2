import { useState } from 'react';
import { Box, Text, Button } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import useChainId from '../hooks/useChainId';
import TermsModal from './TermsModal';
import useUpgradeTokens from '../hooks/actionHooks/useUpgradeTokens';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotificationSunset = ({ children }: PublicNotificationProps) => {
  const chainId = useChainId();
  const { hasUpgradeable, isUpgrading, upgradeAllStrategies } = useUpgradeTokens();
  const [showTerms, setShowTerms] = useState<boolean>(false);

  const showTermsModal = () => {
    setShowTerms(!showTerms);
  };

  const confirmUpgrade = (hasAcceptedTerms: boolean) => {
    if (!hasAcceptedTerms) {
      return;
    }
    upgradeAllStrategies(hasAcceptedTerms);
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
                <Text size="medium" weight={'normal'}>
                  Yield Protocol Shutting Down
                </Text>
              </Box>
            </Box>
            <Text size="xsmall" textAlign="center" weight={'normal'}>
              As of 31st of December 2023, the Yield Protocol will be officially discontinued.
            {/* </Text> */}
            {/* <Text size="xsmall" textAlign="center" weight={'normal'}> */}
            {' '}Contact us on our{' '}
              <a
                target="_blank"
                href="https://discord.gg/JAFfDj5"
                style={{ color: 'rgb(255,255,255)', cursor: 'pointer' }}
              >
                discord channel
              </a>{' '}
              with any support issues until 31 January 2024.
            </Text>
          </Box>
        </Box>
        <TermsModal isOpen={showTerms} onClose={() => showTermsModal()} onConfirm={confirmUpgrade} />
      </Box>
    </>
  );
};

export default PublicNotificationSunset;

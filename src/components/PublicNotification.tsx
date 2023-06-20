import { useState } from 'react';
import { Box, Text, Button } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import useChainId from '../hooks/useChainId';
import TermsModal from './TermsModal';
import useUpgradeTokens from '../hooks/actionHooks/useUpgradeTokens';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotification = ({ children }: PublicNotificationProps) => {
  const chainId = useChainId();
  const { hasUpgradeable } = useUpgradeTokens();
  const [showTerms, setShowTerms] = useState<boolean>(false);

  const showTermsModal = () => {
    setShowTerms(!showTerms);
  };

  return (
    <>
      {chainId === 1 && hasUpgradeable ? (
        <Box direction="row" align="center" justify="between">
          <Box direction="column" border={{ size: 'small' }} pad="small" gap="small" align="center" round="xsmall">
            <Box gap="small" align="center">
              <Box direction="row" gap="xsmall" align="center">
                <Text size="medium">
                  <FiAlertTriangle />
                </Text>
                <Text size="medium" weight={'bold'}>
                  Action Required
                </Text>
              </Box>
              <Text size="small" textAlign="center">
                As a consequence of the Euler hack, your strategy tokens need to be upgraded
              </Text>
            </Box>
            <Button
              fill
              label="Upgrade"
              onClick={() => {
                showTermsModal();
              }}
            />
          </Box>
          <TermsModal isOpen={showTerms} onClose={() => showTermsModal()} />
        </Box>
      ) : null}
    </>
  );
};

export default PublicNotification;

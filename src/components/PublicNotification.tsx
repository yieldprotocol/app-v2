import { useContext, useState, useEffect } from 'react';
import { Box, ResponsiveContext, Text, Button } from 'grommet';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import useChainId from '../hooks/useChainId';
import TermsModal from './TermsModal';
import useUpgradeTokens from '../hooks/actionHooks/useUpgradeTokens';
import useAccountPlus from '../hooks/useAccountPlus';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotification = ({ children }: PublicNotificationProps) => {
  const chainId = useChainId();
  const { address } = useAccountPlus();
  const { upgradeTokens, accountProofs } = useUpgradeTokens();

  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false);

  const showTermsModal = () => {
    setShowTerms(!showTerms);
  };

  return (
    <>
      {chainId === 1 && accountProofs?.size ? (
        <Box direction="row" align="center" justify="between">
          <Box direction="column" border={{ size: 'small' }} pad="small" gap="small" align="center" round="xsmall">
            <Box direction="row" gap="small">
              <Text size="large">
                <FiAlertTriangle />
              </Text>
              <Text size="xsmall">
                Action Required: As a consequence of the Euler hack, your lending position needs to be upgraded
              </Text>
            </Box>
            <Button
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

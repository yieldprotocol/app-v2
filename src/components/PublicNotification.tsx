import { use, useState } from 'react';
import { Box, Text, Button } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';

import TermsModal from './TermsModal';
import useUpgradeTokens from '../hooks/actionHooks/useUpgradeTokens';
import { useNetwork } from 'wagmi';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotification = ({ children }: PublicNotificationProps) => {
  const {chain} = useNetwork();

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
      {chain?.id === 1 && hasUpgradeable ? (
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
              <Text size="xsmall" textAlign="center" weight={'normal'}>
                As a consequence of the Euler hack, your strategy tokens need to be upgraded.{' '}
                <a
                  target="_blank"
                  href="https://yield-protocol.medium.com/b678cf5de3af"
                  style={{ color: 'rgb(255,255,255)', cursor: 'pointer' }}
                >
                  Learn more
                </a>
              </Text>
            </Box>
            <Button
              fill
              label={isUpgrading ? 'Upgrading' : 'Upgrade'}
              onClick={() => {
                showTermsModal();
              }}
              disabled={isUpgrading}
            />
          </Box>
          <TermsModal isOpen={showTerms} onClose={() => showTermsModal()} onConfirm={confirmUpgrade} />
        </Box>
      ) : null}
    </>
  );
};

export default PublicNotification;

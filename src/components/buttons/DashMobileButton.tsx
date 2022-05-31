import { useRouter } from 'next/router';
import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';

function DashMobileButton({ transparent }: { transparent?: boolean }) {
  const router = useRouter();
  const {
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);

  return account ? (
    <Box
      align="center"
      direction="row"
      elevation="small"
      onClick={() => router.push(`/dashboard`)}
      background={transparent ? 'gradient-transparent' : 'gradient'}
      pad="xsmall"
      round
    >
      <Text size="xsmall" color="background">
        Positions
      </Text>
    </Box>
  ) : null;
}

DashMobileButton.defaultProps = { transparent: false };

export default DashMobileButton;

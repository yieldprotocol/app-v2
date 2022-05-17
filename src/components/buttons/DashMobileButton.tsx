import { useRouter } from 'next/router';
import { Box, Text } from 'grommet';
import { useAccount } from 'wagmi';

function DashMobileButton({ transparent }: { transparent?: boolean }) {
  const router = useRouter();
  const { data: _account } = useAccount();
  const account = _account?.address;

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

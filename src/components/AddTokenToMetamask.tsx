import { useState } from 'react';
import { Box, Button } from 'grommet';
import { FiPlusCircle } from 'react-icons/fi';
import { useConnect } from 'wagmi';

interface ITokenData {
  address: string | undefined;
  symbol: string | undefined;
  decimals: number | undefined;
  image?: string;
}

const AddTokenToMetamsk = ({ address, symbol, decimals, image }: ITokenData) => {
  const { activeConnector } = useConnect();

  const [, setSuccess] = useState<boolean>(false);
  const [, setFailed] = useState<boolean>(false);

  const handleAddToken = () => {
    activeConnector
      .watchAsset({
        address,
        symbol,
        image,
      })
      .then((good: any) => {
        if (good) setSuccess(true);
      })
      .catch((error: any) => setFailed(true));
  };

  return activeConnector?.name === 'MetaMask' ? (
    <Box align="center">
      <Button plain color="brand" hoverIndicator={{}} onClick={() => handleAddToken()} icon={<FiPlusCircle />} />
    </Box>
  ) : null;
};

AddTokenToMetamsk.defaultProps = {
  image: '',
};

export default AddTokenToMetamsk;

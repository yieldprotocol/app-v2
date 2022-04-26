import { useContext, useEffect, useState } from 'react';
import { Box, Button } from 'grommet';
import { FiPlusCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

interface ITokenData {
  address: string | undefined;
  symbol: string | undefined;
  decimals: number | undefined;
  image?: string;
}

const AddTokenToMetamsk = ({ address, symbol, decimals, image }: ITokenData) => {
  const {
    chainState: {
      connection: { provider },
    },
  } = useContext(ChainContext);
  const [metamask, setMetamask] = useState<any>(null);
  const [, setSuccess] = useState<boolean>(false);
  const [, setFailed] = useState<boolean>(false);

  const handleAddToken = () => {
    metamask
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol,
            decimals,
            image,
          },
        },
      })
      .then((good: any) => {
        if (good) setSuccess(true);
      })
      .catch((error: any) => setFailed(true));
  };

  useEffect(() => {
    if (provider) {
      if (provider.connection.url === 'metamask') {
        setMetamask(provider.provider);
      }
    }
  }, [provider]);

  return metamask ? (
    <Box align="center">
      <Button plain color="brand" hoverIndicator={{}} onClick={() => handleAddToken()} icon={<FiPlusCircle />} />
    </Box>
  ) : null;
};

AddTokenToMetamsk.defaultProps = {
  image: '',
};

export default AddTokenToMetamsk;

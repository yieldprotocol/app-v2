import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';

interface ITokenData {
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
}

const AddTokenToMetamsk = ({ address, symbol, decimals, image }: ITokenData) => {
  const { chainState: provider } = useContext(ChainContext);
  const [metamask, setMetamask] = useState<any>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

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
      const { provider: _provider } = provider;
      if (_provider && _provider.connection.url === 'metamask') {
        const { provider: _prov } = _provider;
        setMetamask(_prov);
      }
    }
  }, [provider]);

  return metamask ? (
    <Box round="xsmall" align="center" pad="small" onClick={() => handleAddToken()}>
      <Text size="xsmall">Add To Metamask</Text>
    </Box>
  ) : null;
};

AddTokenToMetamsk.defaultProps = {
  address: '0xd00981105e61274c8a5cd5a88fe7e037d935b513',
  symbol: 'TUT',
  decimals: 18,
  image: 'http://placekitten.com/200/300',
};

export default AddTokenToMetamsk;

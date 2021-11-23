import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

export const useEns = () => {
  const {
    chainState: {
      connection: { account, provider, chainId },
    },
  } = useContext(ChainContext);

  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatarUrl, setEnsAvatarUrl] = useState<string | null>(null);

  const avatarImageUrl = (name: string) => `https://metadata.ens.domains/mainnet/avatar/${name}`;

  useEffect(() => {
    if (provider && ethers.utils.isAddress(account) && Number(chainId) === 1) {
      (async () => {
        try {
          // get ens name
          const _ensName = await provider.lookupAddress(account);
          setEnsName(await provider.lookupAddress(account));

          // get ens avatar uri
          if (_ensName) {
            const resolver = await (provider as ethers.providers.JsonRpcProvider).getResolver(_ensName);
            const avatar = await resolver?.getText('avatar');
            avatar && setEnsAvatarUrl(avatarImageUrl(_ensName));
          } else {
            setEnsName(null);
            setEnsAvatarUrl(null);
          }
        } catch (e) {
          setEnsName(null);
          setEnsAvatarUrl(null);
          console.log(e);
        }
      })();
    }
  }, [account, provider, chainId]);

  return { ensName, ensAvatarUrl };
};

import { useEffect, useState } from 'react';
import { Anchor, Box, Button, Collapsible, Layer, Text } from 'grommet';
import { FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const SanctionedAddressError = () => {
  const { disconnect } = useDisconnect();

  const [showError, setShowError] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);

  const [approvedAddresses, setApprovedAddresses] = useState<string[]>([]);
  const [sanctionInfo, setSanctionInfo] = useState<{name:string, description:string, category:string, url:string}>();

  const { address: account } = useAccount({
    onConnect: async ({ address, isReconnected }) => {
      if (address && approvedAddresses.includes(address)) {
        console.log('Approved Addresses ', approvedAddresses);
      }
      if (address && !approvedAddresses.includes(address)) {
        try {
          console.log('Checking the account for any sanctions.');
          await fetch(
            // `https://public.chainalysis.com/api/v1/address/0xLNwgtMxcKUQ51dw7bQL1yPQjBVZh6QEqsd`, // sanction test account
            `https://public.chainalysis.com/api/v1/address/${account}`,
            {
              headers: {
                'Access-Control-Request-Method':"*",
                'Access-Control-Allow-Origin':"*",
                'X-API-Key': process.env.CHAIN_ANALYSIS_KEY || '',
                Accept: 'application/json',
              },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.identifications.length > 0) {
                /* sanctioned error */
                setShowError(true);
                setSanctionInfo(data.identifications[0]);
                console.log( data.identifications)
              } else {
                /* set the account as ok for this session */
                setApprovedAddresses([...approvedAddresses, address]);
              }
            });
        } catch (e) {
          console.log('Error getting sanctions information', e);
        }
      }
    },
  });

  return (
    <>
      {showError && (
        <Layer>
          <Box pad="medium" round="small" gap="medium" align="center" width="600px">
            <FiAlertCircle size="2em" /> <Text size="large"> Sanctioned Address</Text>
            <Text size="small"> {account} </Text>
            <Text size="small">The account is restricted from interacting with this platform. </Text>
            <Button
              label="Disconnect wallet"
              onClick={() => {
                setShowError(false);
                disconnect();
              }}
            />
            <Text size="xsmall">
              Sanctioned entities refer to entities listed on economic/trade embargo lists, such as by the US, EU, or
              UN, with which anyone subject to those jurisdictions is prohibited from dealing. Currently, this includes
              the Specially Designated Nationals (SDN) list† of the US Department of the Treasury’s Office of Foreign
              Assets Control (OFAC).
            </Text>
            <Box onClick={()=> setShowMore(!showMore) }>
              {!showMore ? <FiChevronDown/> : <FiChevronUp/> }
            </Box>
            <Collapsible open={showMore}  >
              <Box gap='small'>
              <Text size='xsmall'>{sanctionInfo?.name}</Text>
              <Text size='xsmall'>{sanctionInfo?.description}</Text>
              <Box><Anchor href={sanctionInfo?.url} label={sanctionInfo?.url}  /></Box>
              </Box>   
            </Collapsible>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default SanctionedAddressError;

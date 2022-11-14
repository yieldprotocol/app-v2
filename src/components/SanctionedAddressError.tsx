import { useEffect, useState } from 'react';
import { Anchor, Box, Button, Collapsible, Layer, Text } from 'grommet';
import { FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAccount, useDisconnect, useProvider } from 'wagmi';
import { ethers } from 'ethers';

const SanctionedAddressError = () => {
  const { disconnect } = useDisconnect();
  const provider = useProvider();

  const [showError, setShowError] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);

  const [approvedAddresses, setApprovedAddresses] = useState<string[]>([]);
  const [sanctionInfo, setSanctionInfo] = useState<{
    name: string;
    description: string;
    category: string;
    url: string;
  }>();

  const chainalysisContract = new ethers.Contract(chainalysisAddress, chainalysisABI, provider);

  const { address: account } = useAccount({
    onConnect: async ({ address, isReconnected }) => {
      
      if (address && approvedAddresses.includes(address)) {
        console.log('Pre-approved address: ', approvedAddresses); // or remove this  
      }
      if (address && !approvedAddresses.includes(address)) {
        try {
          console.log('Checking the account address for any sanctions.');
          // const isSanctioned = await chainalysisContract.isSanctioned('0x7F367cC41522cE07553e823bf3be79A889DEbe1B'); // for testing
          const isSanctioned = await chainalysisContract.isSanctioned(address)
          if (isSanctioned) {
            setShowError(true);
            console.log('Account ', address, 'is sanctioned.');
          } else {
            setApprovedAddresses([...approvedAddresses, address]);
            console.log('No sanctions.');
          }

          /**
           * Extra info via API ?
           */
          // await fetch(
          //   // `https://public.chainalysis.com/api/v1/address/0xLNwgtMxcKUQ51dw7bQL1yPQjBVZh6QEqsd`, // sanction test account
          //   `https://public.chainalysis.com/api/v1/address/${account}`,
          //   {
          //     headers: {
          //       'Access-Control-Allow-Headers': '*,Access-Control-Allow-Origin,X-API-Key  ',
          //       'Access-Control-Allow-Origin': "*",
          //       'X-API-Key': process.env.CHAIN_ANALYSIS_KEY || '',
          //       Accept: 'application/json',
          //     },
          //   }
          // )
          //   .then((response) => response.json())
          //   .then((data) => {
          //     if (data.identifications.length > 0) {
          //       /* Sanctioned error */
          //       setShowError(true);
          //       setSanctionInfo(data.identifications[0]);
          //       console.log( data.identifications)
          //     } else {
          //       /* set the account as ok for this session */
          //       setApprovedAddresses([...approvedAddresses, address]);
          //     }
          //   });
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

            {sanctionInfo && (
              <>
                <Box onClick={() => setShowMore(!showMore)}>{!showMore ? <FiChevronDown /> : <FiChevronUp />}</Box>
                <Collapsible open={showMore}>
                  <Box gap="small">
                    <Text size="xsmall">{sanctionInfo?.name}</Text>
                    <Text size="xsmall">{sanctionInfo?.description}</Text>
                    <Box>
                      <Anchor href={sanctionInfo?.url} label={sanctionInfo?.url} />
                    </Box>
                  </Box>
                </Collapsible>
              </>
            )}
          </Box>
        </Layer>
      )}
    </>
  );
};

export default SanctionedAddressError;

const chainalysisAddress = '0x40C57923924B5c5c5455c48D93317139ADDaC8fb';
const chainalysisABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'NonSanctionedAddress',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'SanctionedAddress',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'addrs',
        type: 'address[]',
      },
    ],
    name: 'SanctionedAddressesAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'addrs',
        type: 'address[]',
      },
    ],
    name: 'SanctionedAddressesRemoved',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'newSanctions',
        type: 'address[]',
      },
    ],
    name: 'addToSanctionsList',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'isSanctioned',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'isSanctionedVerbose',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'removeSanctions',
        type: 'address[]',
      },
    ],
    name: 'removeFromSanctionsList',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

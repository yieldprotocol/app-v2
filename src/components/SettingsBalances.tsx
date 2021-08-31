import React, { useContext, useState } from 'react';
import { Box, DropButton, Table, TableHeader, TableCell, TableRow, Text, TableBody } from 'grommet';
import { FiX } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { IAsset } from '../types';
import AddTokenToMetamask from './AddTokenToMetamask';
import YieldBalances from './YieldBalances';

const DropContent = ({ assetMap }: { assetMap: any }) => (
  <Box pad="small">
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell scope="col">
            <Text size="xsmall"> </Text>
          </TableCell>
          <TableCell scope="col">
            <Text size="xsmall">Asset</Text>
          </TableCell>
          <TableCell scope="col">
            <Text size="xsmall">Balance</Text>
          </TableCell>
          <TableCell scope="col">
            <Text size="xsmall">Add To Metamask</Text>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...assetMap.values()].map((asset: IAsset) => (
          <TableRow key={asset.address}>
            <TableCell>
              <Text size="small">{asset.image}</Text>
            </TableCell>
            <TableCell>
              <Text size="small">{asset.symbol}</Text>
            </TableCell>
            <TableCell>
              <Text size="small">{asset.balance_}</Text>
            </TableCell>
            <TableCell>
              <AddTokenToMetamask address={asset.address} symbol={asset.symbol} decimals={18} image="" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

const SettingsBalances = () => {
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const [open, setOpen] = useState<boolean>(false);

  const onOpen = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  return (
    <Box pad="medium">
      <DropButton
        open={open}
        onOpen={onOpen}
        onClose={onClose}
        dropContent={<DropContent assetMap={assetMap} />}
        dropProps={{ align: { top: 'bottom' } }}
      >
        <YieldBalances />
      </DropButton>
    </Box>
  );
};

export default SettingsBalances;

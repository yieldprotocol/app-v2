import React, { useContext, useState } from 'react';
import { Box, DropButton, Table, TableHeader, TableCell, TableRow, Text, TableBody } from 'grommet';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { IAsset } from '../types';
import AddTokenToMetamask from './AddTokenToMetamask';
import YieldBalances from './YieldBalances';
import BoxWrap from './wraps/BoxWrap';

const StyledTableCell = styled(TableCell)`
  padding: 0.3rem 0.5rem;
  span {
    svg {
      vertical-align: middle;
    }
  }
`;

const DropContent = ({ assetMap }: { assetMap: any }) => (
  <Box pad="small" round='xsmall'>
    <Table>
      <TableHeader>
        <TableRow>
          <StyledTableCell plain>
            <Text size="xsmall"> </Text>
          </StyledTableCell>
          <StyledTableCell plain>
            <Text size="xsmall"> </Text>
          </StyledTableCell>
          <StyledTableCell plain>
            <Text size="xsmall"> </Text>
          </StyledTableCell>
          <StyledTableCell align="center" plain>
            <Text color="gray" size="xsmall">
              Add To Metamask
            </Text>
          </StyledTableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...assetMap.values()].map((asset: IAsset) => (
          <TableRow key={asset.address}>
            <StyledTableCell plain>
              <Text size="medium">{asset.image}</Text>
            </StyledTableCell>
            <StyledTableCell plain>
              <Text size="small" color="gray">
                {asset.symbol}
              </Text>
            </StyledTableCell>
            <StyledTableCell plain>
              <Text size="small">{asset.balance_}</Text>
            </StyledTableCell>
            <StyledTableCell plain>
              <AddTokenToMetamask address={asset.address} symbol={asset.symbol} decimals={asset.decimals} image="" />
            </StyledTableCell>
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
    <Box pad="medium" hoverIndicator={{ background: 'hover' }}>
      <BoxWrap>
        <DropButton
          open={open}
          onOpen={onOpen}
          onClose={onClose}
          dropContent={<DropContent assetMap={assetMap} />}
          dropProps={{ align: { top: 'bottom', right: 'right' } }}
          // hoverIndicator={{ border: 'tailwind-blue-50' }}
          style={{ borderRadius: '6px' }}
        >
          <YieldBalances />
        </DropButton>
      </BoxWrap>
    </Box>
  );
};

export default SettingsBalances;

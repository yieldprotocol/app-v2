import { useContext, useState } from 'react';
import { Box, DropButton, Table, TableHeader, TableCell, TableRow, Text, TableBody } from 'grommet';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { IAsset, IUserContext } from '../types';
import AddTokenToMetamask from './AddTokenToMetamask';
import YieldBalances from './YieldBalances';
import BoxWrap from './wraps/BoxWrap';
import { ZERO_BN } from '../utils/constants';
import Logo from './logos/Logo';

const StyledTableCell = styled(TableCell)`
  padding: 0.5rem 0.5rem;
  span {
    svg {
      vertical-align: middle;
    }
  }
`;

const DropContent = ({ assetMap }: { assetMap: Map<string, IAsset> }) => (
  <Box pad="small" background="hoverBackground">
    <Table>
      <TableHeader>
        <TableRow>
          <StyledTableCell plain>
            <Text size="xsmall" />
          </StyledTableCell>
          <StyledTableCell plain>
            <Text size="xsmall" />
          </StyledTableCell>
          <StyledTableCell plain>
            <Text size="xsmall" />
          </StyledTableCell>
          <StyledTableCell align="center" plain>
            <Text color="text" size="xsmall">
              Add To Metamask
            </Text>
          </StyledTableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...assetMap.values()]
          .filter((asset) => asset.showToken)
          .filter((asset) => asset.balance.gt(ZERO_BN))
          .map((asset) => (
            <TableRow key={asset.id}>
              <StyledTableCell plain>
                <Logo image={asset.image} />
              </StyledTableCell>
              <StyledTableCell plain align="left">
                <Text size="small" color="text">
                  {asset.displaySymbol}
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
  } = useContext(UserContext) as IUserContext;

  const [open, setOpen] = useState<boolean>(false);
  const hasBalance = [...assetMap.values()].find((a) => +a.balance_ > 0);
  return (
    <Box pad="medium">
      <BoxWrap>
        <DropButton
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          dropContent={hasBalance ? <DropContent assetMap={assetMap} /> : <></>}
          dropProps={{ align: { top: 'bottom', right: 'right' }, round: 'small' }}
        >
          <YieldBalances />
        </DropButton>
      </BoxWrap>
    </Box>
  );
};

export default SettingsBalances;

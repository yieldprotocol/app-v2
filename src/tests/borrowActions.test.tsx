import React, { useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { render, fireEvent, waitFor } from './test-utils';
import { useBorrowActions } from '../hooks/borrowActions';
import { IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';

function TestBorrowComponent() {
  const { borrow, repay, rollDebt } = useBorrowActions();
  const { userState } = useContext(UserContext);
  const { chainState, chainActions } = useContext(ChainContext);
  const { selectedIlkId } = userState;
  const { provider, chainLoading, web3Active, chainId } = chainState;

  const testConnection = useWeb3React<ethers.providers.Web3Provider>();
  const {
    connector,
    library,
    account,
    activate,
    deactivate,
    active,
    error,
  } = testConnection;

  const handleBorrow = (vault:IVault|undefined, input: string, collInput: string) => {
    borrow(vault, collInput, input);
  };

  React.useEffect(() => {
    !web3Active && chainActions.connectTest();
  }, [chainActions, web3Active]);

  React.useEffect(() => {
    account && console.log(account);
  }, [account]);

  return (
    <div>
      <div> Selected Ilk: { selectedIlkId }</div>

      <div> Account: {account}</div>

      <button onClick={() => borrow(undefined, '10', '10')} type="button">Borrow</button>
      <button onClick={() => handleBorrow(undefined, '10', '10')} type="button">Repay</button>
      <button onClick={() => handleBorrow(undefined, '10', '10')} type="button">rollDebt</button>
    </div>);
}

test('Borrow Dai', async () => {

  const borrower = render(<TestBorrowComponent />);
  const borrowButton = await borrower.findByText('Borrow');

  // waitFor(() => fireEvent.click(borrowButton));
  // fireEvent.click(borrowButton);

  expect(borrower.getByText('Selected Ilk: 0x455448000000')).toBeInTheDocument();
});

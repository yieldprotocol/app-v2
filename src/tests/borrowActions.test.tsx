import React from 'react';
import { act, render, fireEvent } from './test-utils';
import App from '../App';
import Borrow from '../views/Borrow';
import { useBorrowActions } from '../hooks/borrowActions';
import { IVault } from '../types';

function TestBorrowComponent() {
  const { borrow, repay, rollDebt } = useBorrowActions();

  const handleBorrow = (vault:IVault|undefined, input: string, collInput: string) => {
    borrow(vault, collInput, input);
  };

  return (
    <div>
      <button onClick={() => borrow(undefined, '10', '10')} type="button">Borrow</button>
      <button onClick={() => handleBorrow(undefined, '10', '10')} type="button">Repay</button>
      <button onClick={() => handleBorrow(undefined, '10', '10')} type="button">rollDebt</button>
    </div>);
}

test('Borrow Dai', async () => {
  const borrower = render(<TestBorrowComponent />);
  const borrowButton = await borrower.findByText('Borrow');

  fireEvent.click(borrowButton);

  expect(1 + 2).toBe(3);
  // console.log(borrowButton);

  // borrower.find('button').simulate('click') )
  // expect(1 + 2).toBe(3);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});

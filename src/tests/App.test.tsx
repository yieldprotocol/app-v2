import React from 'react';
import { act, render } from './test-utils';
import App from '../App';

test('Renders app with providers', () => {
  render(<App />);
  // console.log();
  // act(() => {
  //   render(<App />);
  // });
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});

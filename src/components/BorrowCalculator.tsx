import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, DateInput, Grid, RangeInput, ResponsiveContext, Stack, Text, TextInput, Tip } from 'grommet';
import { format, differenceInCalendarDays } from 'date-fns';
import { FiInfo } from 'react-icons/fi';
import CenterPanelWrap from './wraps/CenterPanelWrap';
import { UserContext } from '../contexts/UserContext';
import { useApr } from '../hooks/useApr';
import { ActionType } from '../types';
import { cleanValue, nFormatter } from '../utils/appUtils';
import InputWrap from './wraps/InputWrap';

interface ICalculator {
  initialBorrow?: string;
}

const Calculator = ({ initialBorrow }: ICalculator) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    userState: { assetMap, seriesMap, selectedSeriesId, selectedBaseId },
  } = useContext(UserContext);
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const formatDate = (date: any) => format(new Date(date), 'dd MMMM yyyy');

  // const INITIAL_BORROW_AMOUNT = '10000';
  const today = new Date();
  const [borrowInput, setBorrowInput] = useState<string | undefined>(initialBorrow);
  const [borrowDateInput, setBorrowDateInput] = useState<any>(today.toISOString());
  const [borrowDate, setBorrowDate] = useState<any>(formatDate(borrowDateInput));

  const selectedSeriesMaturity = new Date(selectedSeries.maturity * 1000);
  const INITIAL_REPAY_DATE_INPUT = selectedSeriesMaturity.toISOString();
  const [initialRepayAmount, setInitialRepayAmount] = useState<string>('');
  const [initialInterestOwed, setInitialInterestOwed] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayDateInput, setRepayDateInput] = useState<any>(INITIAL_REPAY_DATE_INPUT);
  const [repayDate, setRepayDate] = useState<string>(selectedSeries.fullDate);
  const [repayDateInputError, setRepayDateInputError] = useState<string | null>(null);

  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);
  const [interestRateInput, setInterestRateInput] = useState<string | undefined>(apr);
  const [effectiveAPR, setEffectiveAPR] = useState<string | undefined>(apr);

  const handleReset = () => {
    setInterestRateInput(apr);
    setRepayDateInput(INITIAL_REPAY_DATE_INPUT);
    setBorrowInput(initialBorrow);
  };

  const _fyTokensSold = (
    borrowed: string | undefined,
    interestRate: string | undefined,
    borrowedDate: Date,
    maturity: Date
  ) => Number(borrowed) * (1 + Number(interestRate) / 100) ** (differenceInCalendarDays(maturity, borrowedDate) / 365);

  const _fyTokenCost = (interestRate: string | undefined, payDate: Date, maturity: Date) =>
    1 / (1 + Number(interestRate) / 100) ** (differenceInCalendarDays(maturity, payDate) / 365);

  const _getEffectiveAPR = (borrowed: string | undefined, amountRepaid: string, borrowedDate: Date, payDate: Date) =>
    (Number(amountRepaid) / Number(borrowed)) ** (365 / differenceInCalendarDays(payDate, borrowedDate)) - 1;

  useEffect(() => {
    const _repayAmount = cleanValue(
      (Number(borrowInput) * (1 + Number(apr) / 100)).toString(),
      selectedBase?.digitFormat!
    );
    setRepayAmount(_repayAmount);
  }, [apr, borrowInput, selectedBase]);

  useEffect(() => {
    ((input) => {
      try {
        setRepayDate(formatDate(repayDateInput));
      } catch (error) {
        console.log(error);
      }
    })();
  }, [repayDateInput]);

  useEffect(() => {
    // number of fyTokens sold at initial borrow date
    const fyTokensSold = _fyTokensSold(borrowInput, apr, new Date(borrowDateInput), selectedSeriesMaturity);
    const fyTokenCostAtRepay = _fyTokenCost(interestRateInput, new Date(repayDateInput), selectedSeriesMaturity);
    const amountRepaid = (fyTokensSold * fyTokenCostAtRepay).toString();

    const _effectiveAPR = _getEffectiveAPR(
      borrowInput,
      amountRepaid,
      new Date(borrowDateInput),
      new Date(repayDateInput)
    );
    const formattedAPR = _effectiveAPR ? (_effectiveAPR * 100).toString() : apr;
    setEffectiveAPR(formattedAPR);

    setInitialRepayAmount(fyTokensSold.toString());
    setRepayAmount(amountRepaid);

    const _initialInterestOwed = (fyTokensSold - Number(borrowInput)).toString();
    setInitialInterestOwed(_initialInterestOwed);
  }, [apr, borrowDateInput, repayDateInput, selectedSeriesMaturity, interestRateInput, borrowInput, initialBorrow]);

  return (
    <CenterPanelWrap>
      <Box
        round="small"
        pad="medium"
        background={{ color: 'rgb(247, 248, 250)' }}
        gap="medium"
        border={{ color: '#DBEAFE', size: 'xsmall', side: 'right' }}
      >
        <Box direction="row" justify="between" align="center">
          <Text size="small">Amount To Borrow</Text>
          <InputWrap action={() => null} isError={null}>
            <TextInput
              plain
              type="number"
              placeholder="Enter amount"
              value={borrowInput}
              onChange={(event: any) => setBorrowInput(cleanValue(event.target.value))}
              autoFocus={!mobile}
            />
          </InputWrap>
        </Box>
        <Box gap="medium">
          <Box direction="row" gap="xsmall">
            <Text>Pay @ maturity on</Text>
            <Text weight={900}>{selectedSeries.fullDate}</Text>
          </Box>
          <Box direction="row" justify="center" gap="xlarge">
            <Box
              gap="xsmall"
              background="tailwind-blue-50"
              round="xsmall"
              pad="medium"
              border={{ color: 'tailwind-blue' }}
              justify="center"
            >
              <Text size="small">Total Amount</Text>
              <Text size="xlarge" color="#10B981">
                ${nFormatter(Number(initialRepayAmount) || 0, selectedBase.digitFormat!)}
              </Text>
            </Box>
            <Box gap="small">
              <Box gap="xsmall">
                <Text size="xsmall">Interest Owed</Text>
                <Text size="large" color="#10B981">
                  ${nFormatter(Number(initialInterestOwed) || 0, selectedBase.digitFormat!)}
                </Text>
              </Box>
              <Box gap="xsmall">
                <Text size="xsmall">Interest Rate</Text>
                <Text size="large" color="#10B981">
                  {cleanValue(apr, 2)}%
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box round="small" pad="medium" background={{ color: 'rgb(255, 255, 255)' }} gap="small">
        <Box gap="xsmall">
          <Text size="medium" color="tailwind-blue" alignSelf="start">
            Want to pay early?
          </Text>

          <Box direction="row" justify="between">
            <Box direction="row" gap="xxsmall" align="center">
              <Text size="xsmall">Select Repayment Date</Text>
              <Box direction="row" align="center" hoverIndicator={{ background: 'tailwind-blue-50' }}>
                {repayDateInputError && (
                  <Text size="small" color="#EF4444">
                    {repayDateInputError}
                  </Text>
                )}
                <Box onClick={() => null} hoverIndicator={{ color: 'tailwind-blue-50' }} round="xsmall">
                  <DateInput value={repayDateInput} onChange={({ value }) => setRepayDateInput(value)} />
                </Box>
              </Box>
            </Box>

            <Box justify="end" align="center">
              <Box direction="row" align="center" gap="xsmall">
                <Text size="xsmall">Interest Rate</Text>
                <Tip
                  plain
                  content={
                    <Box pad="small" gap="small" width={{ max: 'small' }} background="#374151" round="small">
                      <Text size="xsmall">interest rate changes will affect how much you pay when paying early</Text>
                    </Box>
                  }
                  dropProps={{ align: { left: 'right' } }}
                >
                  <Button plain icon={<FiInfo size="1rem" />} />
                </Tip>
              </Box>

              <Box gap="small" align="center">
                <Box width="10rem">
                  <InputWrap action={() => null} isError={null} width="small">
                    <TextInput
                      size="small"
                      plain
                      type="number"
                      placeholder="Enter amount"
                      value={interestRateInput}
                      onChange={(event: any) => setInterestRateInput(cleanValue(event.target.value))}
                      autoFocus={false}
                    />
                    %
                  </InputWrap>
                  <RangeInput
                    value={interestRateInput}
                    onChange={(event) => setInterestRateInput(event.target.value)}
                    min="0"
                    max="10"
                    step={0.1}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box gap="medium">
          <Box direction="row" gap="xsmall">
            <Text>Pay on</Text>
            <Text weight={900}>{repayDate}</Text>
          </Box>
          <Box direction="row" justify="center" gap="xlarge">
            <Box
              gap="xsmall"
              background="tailwind-blue-50"
              round="xsmall"
              pad="medium"
              border={{ color: 'tailwind-blue' }}
              justify="center"
            >
              <Text size="small">Total Amount</Text>
              <Text size="xlarge" color="#10B981">
                ${nFormatter(Number(repayAmount) || 0, selectedBase.digitFormat!)}
              </Text>
            </Box>
            <Box gap="small">
              <Box gap="xsmall">
                <Text size="xsmall">Interest Owed</Text>
                <Text size="large" color="#10B981">
                  ${nFormatter(Number(repayAmount) - Number(borrowInput), selectedBase.digitFormat!)}
                </Text>
              </Box>
              <Box gap="xsmall">
                <Text size="xsmall">Effective Interest Rate</Text>
                <Text size="Large" color={Number(effectiveAPR) <= Number(apr) + 0.01 ? '#10B981' : '#EF4444'}>
                  {cleanValue(effectiveAPR, 2)}%
                </Text>
              </Box>
            </Box>
          </Box>
          <Box align="end">
            <Box
              height="2rem"
              onClick={handleReset}
              background="tailwind-blue"
              round="xsmall"
              justify="center"
              pad="xsmall"
            >
              <Text size="xsmall">Reset</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </CenterPanelWrap>
  );
};

Calculator.defaultProps = { initialBorrow: '10000' };

export default Calculator;

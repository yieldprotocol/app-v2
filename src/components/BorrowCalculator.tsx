import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, DateInput, Grid, RangeInput, ResponsiveContext, Text, TextInput, Tip } from 'grommet';
import { format, compareAsc, subDays, differenceInCalendarDays } from 'date-fns';
import { FiInfo } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { useApr } from '../hooks/aprHook';
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

  const { apr, minApr, maxApr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);
  const [interestRate, setInterestRate] = useState<string>(apr || '');
  const [effectiveAPR, setEffectiveAPR] = useState<string>(apr || '');

  const handleReset = () => {
    apr && setInterestRate(apr);
    setRepayDateInput(INITIAL_REPAY_DATE_INPUT);
    setBorrowInput(initialBorrow);
  };

  const _fyTokensSold = (
    borrowed: string | undefined,
    interest: string | undefined,
    borrowedDate: Date,
    maturity: Date
  ) => Number(borrowed) * (1 + Number(interest) / 100) ** (differenceInCalendarDays(maturity, borrowedDate) / 365);

  const _fyTokenCost = (interest: string | undefined, payDate: Date, maturity: Date) =>
    1 / (1 + Number(interest) / 100) ** (differenceInCalendarDays(maturity, payDate) / 365);

  const _getEffectiveAPR = (borrowed: string | undefined, amountRepaid: string, borrowedDate: Date, payDate: Date) => {
    const _apr =
      (Number(amountRepaid) / Number(borrowed)) ** (365 / differenceInCalendarDays(payDate, borrowedDate)) - 1;
    return _apr;
  };

  useEffect(() => {
    const borrowAmount = cleanValue(
      (Number(borrowInput) * (1 + Number(apr) / 100)).toString(),
      selectedBase?.digitFormat!
    );
    setRepayAmount(borrowAmount);
    apr && setInterestRate(apr);
  }, [apr, borrowInput, selectedBase]);

  useEffect(() => {
    // [-1, 0].includes(compareAsc(new Date(borrowDateInput), new Date(repayDateInput))) &&
    // [-1, 0].includes(compareAsc(new Date(repayDateInput), new Date(selectedSeriesMaturity)))
    //   ? setRepayDateInputError(null)
    //   : setRepayDateInputError('Please choose a valid date');
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
    const fyTokenCostAtRepay = _fyTokenCost(interestRate, new Date(repayDateInput), selectedSeriesMaturity);
    const amountRepaid = (fyTokensSold * fyTokenCostAtRepay).toString();
    const _effectiveAPR = _getEffectiveAPR(
      borrowInput,
      amountRepaid,
      new Date(borrowDateInput),
      new Date(repayDateInput)
    );
    const formattedAPR = (_effectiveAPR * 100).toString();

    setEffectiveAPR(formattedAPR);
    setInitialRepayAmount(fyTokensSold.toString());
    setRepayAmount(amountRepaid);
    setInitialInterestOwed((fyTokensSold - Number(borrowInput)).toString());
  }, [apr, borrowDateInput, repayDateInput, selectedSeriesMaturity, interestRate, borrowInput, initialBorrow]);

  return (
    <Box direction="row" width="large" justify="between">
      <Box round="small" basis="40%" pad="large" background={{ color: 'rgb(247, 248, 250)' }} gap="medium">
        <Box gap="small">
          <Text size="small">Borrowed Amount</Text>
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
        <Box gap="small">
          <Text size="small">Select Repayment Date</Text>
          <DateInput format="mm/dd/yyyy" value={repayDateInput} onChange={({ value }) => setRepayDateInput(value)} />
          {repayDateInputError && (
            <Text size="small" color="#EF4444">
              {repayDateInputError}
            </Text>
          )}
        </Box>

        <Box gap="small">
          <Box direction="row" gap="xsmall">
            <Text size="small">Interest Rate</Text>
            <Tip
              plain
              content={
                <Box pad="small" gap="small" width={{ max: 'small' }} background="#374151" round="small">
                  <Text size="xsmall">early payment is subject to market changes in interest rates</Text>
                </Box>
              }
              dropProps={{ align: { left: 'right' } }}
            >
              <Button plain icon={<FiInfo />} />
            </Tip>
          </Box>
          <Box direction="row">
            <Box direction="row" gap="small" align="center">
              <RangeInput
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
                min="0"
                max="10"
                step={0.01}
              />
              <InputWrap action={() => null} isError={null} width="small">
                <TextInput
                  size="small"
                  plain
                  type="number"
                  placeholder="Enter amount"
                  value={interestRate}
                  onChange={(event: any) => setInterestRate(cleanValue(event.target.value))}
                  autoFocus={!mobile}
                />
              </InputWrap>
              %
            </Box>
          </Box>
          <Button size="small" label="Reset" onClick={() => handleReset()} />
        </Box>
      </Box>

      <Box round="small" basis="60%" pad="large" background={{ color: 'rgb(255, 255, 255)' }} gap="medium">
        <Grid
          columns={['auto', 'auto']}
          gap="medium"
          justify={INITIAL_REPAY_DATE_INPUT === repayDateInput ? 'center' : 'stretch'}
        >
          <Box gap="medium">
            <Box>Pay At Maturity</Box>
            <Box gap="xsmall">
              <Text size="small">Total</Text>
              <Text size="xlarge" color="#10B981">
                ${nFormatter(Number(initialRepayAmount) || 0, selectedBase.digitFormat!)}
              </Text>
              <Text size="xsmall" color="#111827">{`Paid On ${selectedSeries.fullDate}`}</Text>
            </Box>
            <Box gap="medium">
              <Box gap="xsmall">
                <Text size="small">Interest Owed</Text>
                <Text size="xlarge" color="#10B981">
                  ${nFormatter(Number(initialInterestOwed) || 0, selectedBase.digitFormat!)}
                </Text>
              </Box>
              <Box gap="xsmall">
                <Text size="xsmall">@Maturity Interest Rate</Text>
                <Text size="large" color="#10B981">
                  {cleanValue(apr, 2)}%
                </Text>
              </Box>
            </Box>
          </Box>

          {INITIAL_REPAY_DATE_INPUT !== repayDateInput && (
            <Box gap="medium">
              <Box>Repay Early</Box>
              <Box gap="xsmall">
                <Text size="small">Total</Text>
                <Text size="xlarge" color="#10B981">
                  ${nFormatter(Number(repayAmount), selectedBase.digitFormat!)}
                </Text>
                <Text size="xsmall" color="#111827">{`Paid On ${repayDate}`}</Text>
              </Box>
              <Box gap="medium">
                <Box gap="xsmall">
                  <Text size="small">Interest Owed</Text>
                  <Text size="xlarge" color="#10B981">
                    ${nFormatter(Number(repayAmount) - Number(borrowInput), selectedBase.digitFormat!)}
                  </Text>
                </Box>
                <Box gap="xsmall">
                  <Box direction="row" gap="xsmall">
                    <Text size="xsmall">Effective Interest Rate</Text>
                    <Tip
                      plain
                      content={
                        <Box pad="small" gap="small" width={{ max: 'small' }} background="#374151" round="small">
                          <Text size="xsmall">{`if the interest rate when you repay is at ${interestRate}%`}</Text>
                        </Box>
                      }
                      dropProps={{ align: { right: 'left' } }}
                    >
                      <Button plain icon={<FiInfo />} />
                    </Tip>
                  </Box>
                  <Text size="large" color={Number(effectiveAPR) < Number(apr) ? '#10B981' : '#EF4444'}>
                    {cleanValue(effectiveAPR, 2)}%
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

Calculator.defaultProps = { initialBorrow: '10000' };

export default Calculator;

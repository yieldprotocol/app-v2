import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import ActionButtonGroup from '../components/ActionButtonGroup';
import AssetSelector from '../components/selectors/AssetSelector';
import InfoBite from '../components/InfoBite';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const [inputValue, setInputValue] = useState<string>();
  const [closeInputValue, setCloseInputValue] = useState<string>();
  const [rollInputValue, setRollInputValue] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxLend, setMaxLend] = useState<string|undefined>();
  const [maxClose, setMaxClose] = useState<string|undefined>();

  const [lendError, setLendError] = useState<string|null>(null);
  const [closeError, setCloseError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const { lend, closePosition, rollPosition } = useLendActions();

  /* Check max available lend */
  useEffect(() => {
    activeAccount &&
      (async () => {
        /* Checks asset selection and sets the max available value */
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
  }, [activeAccount, inputValue, selectedBase, setMaxLend]);

  /* Check max available to close/roll */
  useEffect(() => {
    /* Checks series selection and sets the max close available value */
    const max = selectedSeries?.fyTokenBalance;
    if (max) setMaxClose(ethers.utils.formatEther(max)?.toString());
  }, [closeInputValue, rollInputValue, selectedSeries]);

  /* CHECK for any lendInput errors/warnings */
  useEffect(() => {
    if (activeAccount && (inputValue || inputValue === '')) {
      /* 1. Check if input exceeds balance */
      if (maxLend && parseFloat(inputValue) > parseFloat(maxLend)) setLendError('Amount exceeds balance');
      /* 2. Check if input is higher than collateralization rate */
      else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setLendError(null);
      }
    }
  }, [activeAccount, inputValue, maxLend, setLendError]);

  /* CHECK for any closeInput or rollInput errors/warnings */
  useEffect(() => {
    if (activeAccount && (closeInputValue || closeInputValue === '')) {
      /* 1. Check if input exceeds balance */
      if (maxClose && parseFloat(closeInputValue) > parseFloat(maxClose)) setCloseError('Amount exceeds available fyToken balance');
      /* 2. Check if input is higher than collateralization rate */
      else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setCloseError(null);
      }
    }
    if (activeAccount && (rollInputValue || rollInputValue === '')) {
      /* 1. Check if input exceeds balance */
      if (maxClose && parseFloat(rollInputValue) > parseFloat(maxClose)) setRollError('Amount exceeds available fyToken balance');
      /* 2. Check if input is higher than collateralization rate */
      else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [activeAccount, closeInputValue, rollInputValue, maxLend, setLendError]);

  const handleLend = () => {
    // !lendDisabled &&
    selectedSeries && lend(inputValue, selectedSeries);
  };
  const handleClosePosition = () => {
    // !lendDisabled &&
    selectedSeries && closePosition(closeInputValue, selectedSeries);
  };
  const handleRollPosition = () => {
    // !lendDisabled &&
    selectedSeries && rollToSeries && rollPosition(rollInputValue, selectedSeries, rollToSeries);
  };

  return (
    <MainViewWrap>

      <SectionWrap title="1. Asset to Lend" subtitle="Choose an asset and period to lend for">
        <Box direction="row" gap="small" fill="horizontal">
          <InputWrap action={() => console.log('maxAction')} isError={lendError}>
            <TextInput
              plain
              type="number"
              placeholder="Enter amount"
              value={inputValue || ''}
              onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setInputValue(maxLend)}
              disabled={maxLend === '0'}
            />
          </InputWrap>
          <Box basis={mobile ? '50%' : '35%'}>
            <AssetSelector />
          </Box>
        </Box>
      </SectionWrap>

      <SectionWrap title={`2. Select a series ${mobile ? '' : '(maturity date)'} `}>
        <SeriesSelector />
        <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
          {
            selectedSeries?.baseId === selectedBaseId &&
            <InfoBite label="FYToken balance" value={selectedSeries?.fyTokenBalance_!} />
          }
        </Box>
      </SectionWrap>

      <ActionButtonGroup buttonList={[
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Supply ${inputValue || ''} ${selectedBase?.symbol || ''}`} </Text>}
          key="primary"
          onClick={() => handleLend()}
        />,
        // <Button
        //   secondary
        //   label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
        //   key="secondary"
        //   onClick={() => handleClosePosition()}
        // />,
      ]}
      />

      <SectionWrap
        title="Close position"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box direction="row" gap="small" fill="horizontal" align="center">
          <InputWrap action={() => console.log('maxAction')} isError={closeError}>
            <TextInput
              plain
              type="number"
              placeholder={`${selectedBase?.symbol} to reclaim`}
              value={closeInputValue || ''}
              onChange={(event:any) => setCloseInputValue(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setCloseInputValue(maxClose)}
              disabled={maxClose === '0.0'}
            />
          </InputWrap>
          {/* <Text> {selectedBase?.symbol} </Text> */}
        </Box>

        <ActionButtonGroup buttonList={[
          <Button
            secondary
            label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
            key="secondary"
            onClick={() => handleClosePosition()}
          />,
        ]}
        />
      </SectionWrap>

      <SectionWrap
        title="Roll Position to:"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >

        <Box direction="row" gap="small" fill="horizontal" align="center">
          <InputWrap action={() => console.log('maxAction')} isError={rollError}>
            <TextInput
              plain
              type="number"
              placeholder={`${selectedBase?.symbol} to roll`}
              value={rollInputValue || ''}
              onChange={(event:any) => setRollInputValue(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setRollInputValue(maxClose)}
              disabled={maxClose === '0.0'}
            />
          </InputWrap>
          {/* <Text> {selectedBase?.symbol} </Text> */}
        </Box>

        <Box gap="small" fill="horizontal" direction="row" align="center">

          <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

          <Box basis="35%">
            <ActionButtonGroup buttonList={[
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                key="primary"
                onClick={() => handleRollPosition()}
              />,
            ]}
            />
          </Box>
        </Box>
      </SectionWrap>

    </MainViewWrap>
  );
};

export default Lend;

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
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  const [lendInput, setLendInput] = useState<string>();
  const [closeInput, setCloseInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();

  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxLend, setMaxLend] = useState<string|undefined>();
  const [maxClose, setMaxClose] = useState<string|undefined>();

  const [lendError, setLendError] = useState<string|null>(null);
  const [closeError, setCloseError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */

  const { lend, closePosition, rollPosition } = useLendActions();

  /* LOCAL FNS */

  const handleLend = () => {
    // !lendDisabled &&
    selectedSeries && lend(lendInput, selectedSeries);
  };
  const handleClosePosition = () => {
    // !lendDisabled &&
    selectedSeries && closePosition(closeInput, selectedSeries);
  };
  const handleRollPosition = () => {
    // !lendDisabled &&
    selectedSeries && rollToSeries && rollPosition(rollInput, selectedSeries, rollToSeries);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
    }
  }, [activeAccount, lendInput, selectedBase, setMaxLend]);

  useEffect(() => {
    /* Checks series selection and sets the max close available value */
    const max = selectedSeries?.fyTokenBalance;
    if (max) setMaxClose(ethers.utils.formatEther(max)?.toString());
  }, [closeInput, rollInput, selectedSeries]);

  /* WATCH FOR WARNINGS AND ERRORS */

  useEffect(() => {
    /* lendInput errors */
    if (activeAccount && (lendInput || lendInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxLend && parseFloat(lendInput) > parseFloat(maxLend)) setLendError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(lendInput) < 0) setLendError('Amount should be expressed as a positive value');
      /* 2. next Check */
      else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setLendError(null);
      }
    }
  }, [activeAccount, lendInput, maxLend, setLendError]);

  useEffect(() => {
    /* closeInput errors */
    if (activeAccount && (closeInput || closeInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(closeInput) > parseFloat(maxClose)) setCloseError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */
      else if (closeInput && !selectedSeriesId) setCloseError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(closeInput) < 0) setCloseError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setCloseError(null);
      }
    }
    /* rollInput errors */
    if (activeAccount && (rollInput || rollInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(rollInput) > parseFloat(maxClose)) setRollError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */
      else if (rollInput && !selectedSeriesId) setRollError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(rollInput) < 0) setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [activeAccount, closeInput, rollInput, maxClose, selectedSeriesId]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    (!activeAccount || !lendInput || !selectedSeriesId || lendError) ? setLendDisabled(true) : setLendDisabled(false);
  }, [lendInput, activeAccount, lendError, selectedSeriesId]);

  useEffect(() => {
    (!activeAccount || !closeInput || closeError) ? setCloseDisabled(true) : setCloseDisabled(false);
  }, [closeInput, activeAccount, closeError]);

  useEffect(() => {
    (!activeAccount || !rollInput || rollError) ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError]);

  return (
    <MainViewWrap>

      <SectionWrap title="1. Asset to Lend">

        <Box direction="row" gap="small" fill="horizontal" align="start">
          <InputWrap action={() => console.log('maxAction')} isError={lendError}>
            <TextInput
              plain
              type="number"
              placeholder="Enter amount"
              value={lendInput || ''}
              onChange={(event:any) => setLendInput(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setLendInput(maxLend)}
              disabled={maxLend === '0'}
            />
          </InputWrap>
          <Box basis={mobile ? '50%' : '35%'}>
            <AssetSelector />
          </Box>
        </Box>
      </SectionWrap>

      <SectionWrap title="2. Select a series">
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
          label={<Text size={mobile ? 'small' : undefined}> {`Supply ${lendInput || ''} ${selectedBase?.symbol || ''}`} </Text>}
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
        title=" [ Close position ]"
      >
        <Box direction="row" gap="small" fill="horizontal" align="start">
          <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!selectedSeriesId}>
            <TextInput
              plain
              type="number"
              placeholder="fyToken Amount" // {`${selectedBase?.symbol} to reclaim`}
              value={closeInput || ''}
              onChange={(event:any) => setCloseInput(cleanValue(event.target.value))}
              disabled={!selectedSeriesId}
            />
            <MaxButton
              action={() => setCloseInput(maxClose)}
              disabled={maxClose === '0.0' || !selectedSeriesId}
            />
          </InputWrap>
        </Box>

        <ActionButtonGroup buttonList={[
          <Button
            secondary
            label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
            key="secondary"
            onClick={() => handleClosePosition()}
            disabled={maxClose === '0.0' || !selectedSeriesId}
          />,
        ]}
        />
      </SectionWrap>

      <SectionWrap
        title="[ Roll Position ]"
      >

        <Box direction="row" gap="small" fill="horizontal" align="start">
          <InputWrap action={() => console.log('maxAction')} isError={rollError} disabled={!selectedSeriesId}>
            <TextInput
              plain
              type="number"
              placeholder="fyToken Amount" // {`${selectedBase?.symbol} to roll`}
              value={rollInput || ''}
              onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
              disabled={!selectedSeriesId}
            />
            <MaxButton
              action={() => setRollInput(maxClose)}
              disabled={maxClose === '0.0' || !selectedSeriesId}
            />
          </InputWrap>
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
                disabled={maxClose === '0.0' || !selectedSeriesId}
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

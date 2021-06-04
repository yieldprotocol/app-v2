import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import ActionButtonGroup from '../components/ActionButtonGroup';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';
import InfoBite from '../components/InfoBite';

const LendPosition = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  const [closeInput, setCloseInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxClose, setMaxClose] = useState<string|undefined>();

  const [closeError, setCloseError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [redeemDisabled, setRedeemDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { closePosition, rollPosition, redeem } = useLendActions();

  /* LOCAL FNS */
  const handleClosePosition = () => {
    !closeDisabled &&
    closePosition(closeInput, selectedSeries!);
    setCloseInput('');
  };
  const handleRollPosition = () => {
    !rollDisabled &&
    rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
    setRollInput('');
  };
  const handleRedeem = () => {
    redeem(selectedSeries!, undefined);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* Checks series selection and sets the max close available value */
    const max = selectedSeries?.fyTokenBalance;
    if (max) setMaxClose(ethers.utils.formatEther(max)?.toString());
  }, [closeInput, rollInput, selectedSeries]);

  /* WATCH FOR WARNINGS AND ERRORS */
  useEffect(() => {
    /* closeInput errors */
    if (activeAccount && (closeInput || closeInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(closeInput) > parseFloat(maxClose)) setCloseError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */
      else if (closeInput && !selectedSeries) setCloseError('No base series selected');
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
      else if (rollInput && !selectedSeries) setRollError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(rollInput) < 0) setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [activeAccount, closeInput, rollInput, maxClose, selectedSeries]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    (
      !activeAccount ||
      !closeInput ||
      closeError
    ) ? setCloseDisabled(true) : setCloseDisabled(false);
  }, [closeInput, activeAccount, closeError]);

  useEffect(() => {
    (
      !activeAccount ||
      !rollInput ||
      !rollToSeries ||
      rollError
    ) ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError, rollToSeries]);

  return (
    <>
      <Box fill>

        <Box height="150px">
          <Text size="large">  {selectedSeries?.id} </Text>
          <Box justify="between" gap="small" fill="horizontal" direction="row-responsive">
            {
                selectedSeries?.baseId === selectedBase?.id &&
                <InfoBite label="FYToken balance (Base value at maturity)" value={selectedSeries?.fyTokenBalance_!} />
              }
          </Box>
        </Box>

        <Tabs justify="start" activeIndex={tabIndex} onActive={onActive}>
          <Tab title="Close Position">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              <Box fill>
                <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!selectedSeries}>
                  <TextInput
                    plain
                    type="number"
                    placeholder="fyToken Amount" // {`${selectedBase?.symbol} to reclaim`}
                    value={closeInput || ''}
                    onChange={(event:any) => setCloseInput(cleanValue(event.target.value))}
                    disabled={!selectedSeries}
                  />
                  <MaxButton
                    action={() => setCloseInput(maxClose)}
                    disabled={maxClose === '0.0' || !selectedSeries}
                  />
                </InputWrap>
              </Box>
            </Box>
          </Tab>

          <Tab title="Roll Position">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              <Box fill>
                <InputWrap action={() => console.log('maxAction')} isError={rollError} disabled={!selectedSeries}>
                  <TextInput
                    plain
                    type="number"
                    placeholder="fyToken Amount" // {`${selectedBase?.symbol} to roll`}
                    value={rollInput || ''}
                    onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
                    disabled={!selectedSeries}
                  />
                  <MaxButton
                    action={() => setRollInput(maxClose)}
                    disabled={maxClose === '0.0' || !selectedSeries}
                  />
                </InputWrap>
              </Box>
            </Box>

            <Box gap="small" fill="horizontal" direction="row" align="center">
              <SeriesSelector
                selectSeriesLocally={(series:ISeries) => setRollToSeries(series)}
                action={ActionType.LEND}
              />
            </Box>

          </Tab>
        </Tabs>
      </Box>

      <ActionButtonGroup>
        {selectedSeries?.seriesIsMature &&
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> Redeem </Text>}
            onClick={() => handleRedeem()}
          />}

        {
          tabIndex === 0 &&
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
            onClick={() => handleClosePosition()}
            disabled={closeDisabled}
          />
          }

        {
          tabIndex === 1 &&
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
            onClick={() => handleRollPosition()}
            disabled={rollDisabled}
          />
}
      </ActionButtonGroup>
    </>
  );
};

export default LendPosition;

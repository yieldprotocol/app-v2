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
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';
import InfoBite from '../components/InfoBite';
import ActiveTransaction from '../components/ActiveTransaction';
import { getTxCode } from '../utils/appUtils';
import TabWrap from '../components/wraps/TabWrap';

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

  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0, 0, 0]);
  const handleStepper = (back:boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x:any, i:number) => (i === tabIndex ? x + step : x));
    setStepPosition(newStepArray);
  };

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

  /* internal stateful components */
  const NextButton = () => <Button
    secondary
    label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
    onClick={() => handleStepper()}
    key="next"
  />;

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

    <Box fill gap="large">
      <Box height="300px" gap="large">
        <Box direction="row" gap="xsmall">
          <Box
            round="large"
            background={`linear-gradient(90deg, ${selectedSeries && assetMap.get(selectedSeries.baseId)?.color} 40%, white 75%)`}
            pad={{ vertical: 'xsmall', left: 'xsmall', right: 'medium' }}
            align="start"
          >
            {selectedSeries && assetMap.get(selectedSeries.baseId)?.image}
          </Box>
          <Text size="large">  {selectedSeries?.displayName} </Text>
        </Box>

        <Box justify="between" gap="small" fill="horizontal" direction="row-responsive">
          {
                selectedSeries?.baseId === selectedBase?.id &&
                <InfoBite label="FYToken balance: " value={selectedSeries?.fyTokenBalance_!} />
              }
        </Box>
      </Box>

      <SectionWrap title="Lending Actions">
        <Box round="xsmall" border={{ color: '#EEE' }} pad="small">
          <Tabs justify="start" activeIndex={tabIndex} onActive={onActive}>
            <TabWrap title="Close Position">
              {stepPosition[0] === 0 ?

                <Box pad={{ vertical: 'medium' }}>
                  <Box>
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
                :
                <Box gap="medium" pad="small">
                  <Box onClick={() => handleStepper(true)}>
                    <Text>Back</Text>
                  </Box>
                  <ActiveTransaction txCode={getTxCode(ActionCodes.CLOSE_POSITION, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>Close {closeInput} {selectedBase?.symbol}
                        from the {selectedSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>}

              <ActionButtonGroup>
                {
                    stepPosition[0] === 0 ?
                      <NextButton />
                      :
                      <Button
                        primary
                        label={<Text size={mobile ? 'small' : undefined}> {`Close ${closeInput || ''}`} </Text>}
                        onClick={() => handleClosePosition()}
                        disabled={closeDisabled}
                      />
                  }
              </ActionButtonGroup>
            </TabWrap>

            <TabWrap title="Roll Position">
              {stepPosition[1] === 0 ?
                <Box pad={{ vertical: 'medium' }} gap="small">
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

                  <Box gap="small" fill="horizontal" direction="row" align="center">
                    <SeriesSelector
                      selectSeriesLocally={(series:ISeries) => setRollToSeries(series)}
                      actionType={ActionType.LEND}
                    />
                  </Box>
                </Box>
                :
                <Box gap="large" pad="small">
                  <Box onClick={() => handleStepper(true)}>
                    <Text>Back</Text>
                  </Box>
                  <ActiveTransaction txCode={getTxCode(ActionCodes.ROLL_POSITION, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>
                        Roll {rollInput} {selectedBase?.symbol}
                        from {selectedSeries?.displayName} to the {rollToSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>}

              <ActionButtonGroup>
                {
                    stepPosition[1] === 0 ?
                      <NextButton />
                      :
                      <Button
                        primary
                        label={<Text size={mobile ? 'small' : undefined}> {`Roll ${rollInput || ''}`} </Text>}
                        onClick={() => handleRollPosition()}
                        disabled={rollDisabled}
                      />
                  }
              </ActionButtonGroup>

            </TabWrap>
          </Tabs>

        </Box>

      </SectionWrap>

    </Box>
  );
};

export default LendPosition;

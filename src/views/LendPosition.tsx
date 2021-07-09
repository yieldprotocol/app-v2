import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Select, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { abbreviateHash, cleanValue, getTxCode } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendHooks';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import InfoBite from '../components/InfoBite';
import ActiveTransaction from '../components/ActiveTransaction';
import TabWrap from '../components/wraps/TabWrap';
import BackButton from '../components/buttons/BackButton';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';

const LendPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });

  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0, 0, 0]);

  const [closeInput, setCloseInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);

  const [maxClose, setMaxClose] = useState<string | undefined>();

  const [closeError, setCloseError] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [redeemDisabled, setRedeemDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { closePosition, rollPosition, redeem } = useLendActions();

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleClosePosition = () => {
    !closeDisabled && closePosition(closeInput, selectedSeries!);
    setCloseInput('');
  };
  const handleRollPosition = () => {
    !rollDisabled && rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
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
      if (maxClose && parseFloat(closeInput) > parseFloat(maxClose))
        setCloseError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */ else if (closeInput && !selectedSeries)
        setCloseError('No base series selected');
      /* 2. Check if input is above zero */ else if (parseFloat(closeInput) < 0)
        setCloseError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setCloseError(null);
      }
    }
    /* rollInput errors */
    if (activeAccount && (rollInput || rollInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(rollInput) > parseFloat(maxClose))
        setRollError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */ else if (rollInput && !selectedSeries)
        setRollError('No base series selected');
      /* 2. Check if input is above zero */ else if (parseFloat(rollInput) < 0)
        setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setRollError(null);
      }
    }
  }, [activeAccount, closeInput, rollInput, maxClose, selectedSeries]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    !activeAccount || !closeInput || closeError ? setCloseDisabled(true) : setCloseDisabled(false);
  }, [closeInput, activeAccount, closeError]);

  useEffect(() => {
    !activeAccount || !rollInput || !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError, rollToSeries]);

  return (
    <CenterPanelWrap>
      <Box fill pad="large" gap="medium">
        <Box height={{ min: '50%' }} gap="medium">
          <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
            <Box direction="row" align="center" gap="medium">
              <PositionAvatar position={selectedSeries!} />
              <Box>
                <Text size={mobile ? 'large' : 'xlarge'}> {selectedSeries?.displayName} </Text>
                <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 5)}</Text>
              </Box>
            </Box>
          </Box>

          <SectionWrap>
            <Box gap="xsmall" pad="xsmall">
              {/* <InfoBite label="Vault debt + interest:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} icon={<FiTrendingUp />} /> */}
              <InfoBite label="FYToken balance: " value={selectedSeries?.fyTokenBalance_!} />
            </Box>
          </SectionWrap>
        </Box>

        <SectionWrap title="Vault Actions">
          <Box elevation="xsmall" round="xsmall">
            <Select
              plain
              options={[
                { text: 'Close Position', index: 0 },
                { text: 'Roll Position', index: 1 },
              ]}
              labelKey="text"
              valueKey="index"
              value={actionActive}
              onChange={({ option }) => setActionActive(option)}
            />
          </Box>

          {actionActive.index === 0 && (
            <>
              {stepPosition[0] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!selectedSeries}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="fyToken Amount" // {`${selectedBase?.symbol} to reclaim`}
                      value={closeInput || ''}
                      onChange={(event: any) => setCloseInput(cleanValue(event.target.value))}
                      disabled={!selectedSeries}
                    />
                    <MaxButton
                      action={() => setCloseInput(maxClose)}
                      disabled={maxClose === '0.0' || !selectedSeries}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <Box gap="large">
                  <ActiveTransaction txCode={getTxCode(ActionCodes.CLOSE_POSITION, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>
                        Close {closeInput} {selectedBase?.symbol}
                        from the {selectedSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>
              )}
            </>
          )}

          {actionActive.index === 1 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box pad={{ vertical: 'medium' }} fill="horizontal" direction="row" align="center">
                  <SeriesSelector
                    selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                    actionType={ActionType.LEND}
                    cardLayout={false}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <Box gap="large">
                  <ActiveTransaction txCode={getTxCode(ActionCodes.ROLL_POSITION, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>
                        Roll {rollInput} {selectedBase?.symbol}
                        from {selectedSeries?.displayName} to the {rollToSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>
              )}
            </>
          )}
        </SectionWrap>
      </Box>

      <ActionButtonGroup>
        {stepPosition[actionActive.index] === 0 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
          />
        )}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && (
          <Box gap="small" direction="row-responsive" pad={{ horizontal: 'large' }}>
            <BackButton action={() => handleStepper(true)} />
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> {`Close ${closeInput || ''}`} </Text>}
              onClick={() => handleClosePosition()}
              disabled={closeDisabled}
            />
          </Box>
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && (
          <Box gap="small" direction="row" pad={{ horizontal: 'large' }}>
            <BackButton action={() => handleStepper(true)} />
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> {`Roll ${rollInput || ''}`} </Text>}
              onClick={() => handleRollPosition()}
              disabled={rollDisabled}
            />
          </Box>
        )}
      </ActionButtonGroup>
    </CenterPanelWrap>
  );
};

export default LendPosition;

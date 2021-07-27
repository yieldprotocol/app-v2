import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Select, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { FiArrowRight, FiClock, FiLogOut, FiMinusCircle, FiPlusCircle, FiTrendingUp } from 'react-icons/fi';

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
import BackButton from '../components/buttons/BackButton';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';
import CancelButton from '../components/buttons/CancelButton';
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import ExitButton from '../components/buttons/ExitButton';
import { useInputValidation } from '../hooks/inputValidationHook';

const LendPosition = ({ close }: { close: () => void }) => {
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

  // const [closeError, setCloseError] = useState<string | null>(null);
  // const [rollError, setRollError] = useState<string | null>(null);

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [redeemDisabled, setRedeemDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { closePosition, rollPosition, redeem } = useLendActions();

  /* input validation hoooks */
  const { inputError: closeError } = useInputValidation(
    closeInput, 
    ActionCodes.CLOSE_POSITION, 
    selectedSeries, 
    [ 0, maxClose ]
  );

  const { inputError: rollError } = useInputValidation(
    rollInput,
    ActionCodes.ROLL_POSITION,
    selectedSeries,
    [0, maxClose]
  );


  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleClosePosition = () => {
    !closeDisabled && closePosition(closeInput, selectedSeries!);
  };

  const handleRollPosition = () => {
    !rollDisabled && rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
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


  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !closeInput || closeError ? setCloseDisabled(true) : setCloseDisabled(false);
    !rollInput || !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [closeInput, closeError, rollInput, rollToSeries, rollError]);


  return (
    <CenterPanelWrap>
      <Box fill pad="large" gap="medium">
        <Box height={{ min: '250px' }} gap="medium">
          <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
            <Box direction="row" align="center" gap="medium">
              <PositionAvatar position={selectedSeries!} />
              <Box>
                <Text size={mobile ? 'medium' : 'large'}> {selectedSeries?.displayName} </Text>
                <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 5)}</Text>
              </Box>
            </Box>
            <ExitButton action={() => close()} />

          </Box>

          <SectionWrap>
            <Box gap="small">
              {/* <InfoBite label="Vault debt + interest:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} icon={<FiTrendingUp />} /> */}
              <InfoBite
                label="Portfolio value at Maturity"
                value={`${selectedSeries?.fyTokenBalance_!} ${selectedBase?.symbol!}`}
                icon={<FiTrendingUp />}
              />
              <InfoBite
                label="Current value"
                value={`${selectedSeries?.fyTokenBalance_!} `}
                icon={selectedBase?.image}
              />
              <InfoBite
                label="Maturity date:"
                value={`${selectedSeries?.fullDate}`}
                icon={<FiClock color={selectedSeries?.color} />}
              />
            </Box>
          </SectionWrap>
        </Box>

        <Box height={{ min: '250px' }}>
          <Box elevation="xsmall" round="xsmall">
            <Select
              plain
              dropProps={{ round: 'xsmall' }}
              options={[
                { text: 'Close Position', index: 0 },
                { text: 'Roll Position', index: 1 },
                { text: 'View Trade History', index: 2 },
                { text: 'Redeem', index: 3 },
              ]}
              labelKey="text"
              valueKey="index"
              value={actionActive}
              onChange={({ option }) => setActionActive(option)}
              disabled={[3]}
            />
          </Box>

          {actionActive.index === 0 && (
            <Box>
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
                      clearAction = {() => setCloseInput('')}
                      showingMax= { !!closeInput && closeInput === maxClose }
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <ActiveTransaction txCode={getTxCode(ActionCodes.CLOSE_POSITION, selectedSeriesId)} pad>
                  <SectionWrap
                    title="Review your remove transaction"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                    <InfoBite
                      label="Close Position"
                      icon={<FiArrowRight />}
                      value={`${closeInput} ${selectedBase?.symbol}`}
                    />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 1 && (
            <Box margin={{ top:'medium' }}>
              {stepPosition[actionActive.index] === 0 && (
                <Box align="center" fill gap='medium'>
                  <Box fill >
                    <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!selectedSeries}>
                      <TextInput
                        plain
                        type="number"
                        placeholder="fyToken amount to roll" // {`${selectedBase?.symbol} to reclaim`}
                        value={rollInput || ''}
                        onChange={(event: any) => setRollInput(cleanValue(event.target.value))}
                        disabled={!selectedSeries}
                      />
                      <MaxButton
                        action={() => setRollInput(maxClose)}
                        disabled={maxClose === '0.0' || !selectedSeries}
                        clearAction = {() => setRollInput('')}
                        showingMax= { !!rollInput && rollInput === maxClose }
                      />
                    </InputWrap>
                  </Box>
                  <Box fill>
                  <SeriesSelector
                    selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                    actionType={ActionType.LEND}
                    cardLayout={false}
                  />
                  </Box>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction txCode={getTxCode(ActionCodes.ROLL_POSITION, selectedSeriesId)} pad>
                  <SectionWrap
                    title="Review your roll transaction"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                    <InfoBite 
                      label="Roll To Series" 
                      icon={<FiArrowRight />}
                      value={` Roll  ${rollInput} ${selectedBase?.symbol} to ${rollToSeries?.displayName}`} 
                    />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 2 && <YieldHistory seriesOrVault={selectedSeries!} view={['TRADE']} />}
        </Box>
      </Box>

      <ActionButtonGroup pad>
        {stepPosition[actionActive.index] === 0 && actionActive.index !== 2 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
            disabled={
              (actionActive.index === 0 && closeDisabled) ||
              (actionActive.index === 1 && rollDisabled)
            }
          />
        )}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Close ${closeInput || ''}`} </Text>}
            onClick={() => handleClosePosition()}
            disabled={closeDisabled}
          />
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Roll ${rollInput || ''}`} </Text>}
            onClick={() => handleRollPosition()}
            disabled={rollDisabled}
          />
        )}
      </ActionButtonGroup>
    </CenterPanelWrap>
  );
};

export default LendPosition;

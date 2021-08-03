import React, { useContext, useState, useEffect } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { FiArrowRight, FiClock, FiLogOut, FiMinusCircle, FiPercent, FiPlusCircle } from 'react-icons/fi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { abbreviateHash, cleanValue, getTxCode, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import InfoBite from '../components/InfoBite';
import { usePoolActions } from '../hooks/poolHooks';
import { useTx } from '../hooks/useTx';
import ActiveTransaction from '../components/ActiveTransaction';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';

import YieldMark from '../components/logos/YieldMark';
import CancelButton from '../components/buttons/CancelButton';
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import ExitButton from '../components/buttons/ExitButton';
import { useInputValidation } from '../hooks/inputValidationHook';

const PoolPosition = ({ close }: { close: () => void }) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  const [removeInput, setRemoveInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);
  const [maxRemove, setMaxRemove] = useState<string | undefined>();

  // const [removeError, setRemoveError] = useState<string | null>(null);
  // const [rollError, setRollError] = useState<string | null>(null);

  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  // multi-tracking stepper
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  /* HOOK FNS */
  const { removeLiquidity, rollLiquidity } = usePoolActions();

  /* TX data */
  const { tx: removeTx } = useTx(ActionCodes.REMOVE_LIQUIDITY);
  const { tx: rollTx } = useTx(ActionCodes.ROLL_LIQUIDITY);

  /* input validation hoooks */
  const { inputError: removeError } = useInputValidation(removeInput, ActionCodes.REMOVE_LIQUIDITY, selectedSeries, [
    0,
    maxRemove,
  ]);

  const { inputError: rollError } = useInputValidation(rollInput, ActionCodes.ROLL_LIQUIDITY, selectedSeries, [
    0,
    maxRemove,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleRemove = () => {
    // !removeDisabled &&
    console.log(selectedSeries?.displayName);
    selectedSeries && removeLiquidity(removeInput!, selectedSeries);
  };
  const handleRoll = () => {
    // !rollDisabled &&
    selectedSeries && rollToSeries && rollLiquidity(rollInput!, selectedSeries, rollToSeries);
  };

  /* SET MAX VALUES */
  useEffect(() => {
    /* Checks the max available to roll or move */
    const max = selectedSeries?.poolTokens;
    if (max) setMaxRemove(ethers.utils.formatEther(max).toString());
  }, [rollInput, selectedSeries, setMaxRemove]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError ? setRemoveDisabled(true) : setRemoveDisabled(false);
    !rollInput || !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [activeAccount, removeError, removeInput, rollError, rollInput, rollToSeries]);

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
                label="Liquidity Balance"
                value={cleanValue(selectedSeries?.poolTokens_, selectedBase?.digitFormat!)}
                icon={<YieldMark height="1em" startColor={selectedSeries?.startColor} />}
              />
              {/* <InfoBite 
                label="Total Pool Liquidity"
                value={cleanValue(selectedSeries?.totalSupply_, 2)}
                icon={<BiCoinStack />}
              /> */}
              <InfoBite
                label="Pool percentage"
                value={`${cleanValue(selectedSeries?.poolPercent, 4)} %  of ${nFormatter(
                  parseFloat(selectedSeries?.totalSupply_!),
                  2
                )}`}
                icon={<FiPercent />}
              />
              <InfoBite label="Maturity date:" value={`${selectedSeries?.fullDate}`} icon={<FiClock />} />
            </Box>
          </SectionWrap>
        </Box>

        <Box height={{ min: '300px' }}>
          <Box elevation="xsmall" round="xsmall">
            <Select
              plain
              dropProps={{ round: 'xsmall' }}
              options={[
                { text: 'Remove Liquidity', index: 0 },
                { text: 'Roll Liquidiy', index: 1 },
                { text: 'Transaction History', index: 2 },
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
                <Box margin={{ top: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={removeError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Tokens to remove"
                      value={removeInput || ''}
                      onChange={(event: any) => setRemoveInput(cleanValue(event.target.value))}
                    />
                    <MaxButton
                      action={() => setRemoveInput(maxRemove)}
                      disabled={maxRemove === '0.0'}
                      clearAction={() => setRemoveInput('')}
                      showingMax={!!removeInput && removeInput === maxRemove}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <ActiveTransaction txCode={removeTx.txCode} pad>
                  <SectionWrap
                    title="Review your remove transaction"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Remove Liquidity"
                        icon={<FiArrowRight />}
                        value={`${cleanValue(removeInput, selectedBase?.digitFormat!)} liquidity tokens`}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 1 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box margin={{ top: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={rollError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Tokens to roll"
                      value={rollInput || ''}
                      onChange={(event: any) => setRollInput(cleanValue(event.target.value))}
                    />
                    <MaxButton
                      action={() => setRollInput(maxRemove)}
                      disabled={maxRemove === '0.0'}
                      clearAction={() => setRollInput('')}
                      showingMax={!!rollInput && rollInput === maxRemove}
                    />
                  </InputWrap>
                  <SeriesSelector
                    selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                    actionType={ActionType.POOL}
                    cardLayout={false}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction txCode={rollTx.txCode} pad>
                  <SectionWrap
                    title="Review your roll transaction"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Roll Liquidity"
                        icon={<FiArrowRight />}
                        value={`${cleanValue(rollInput, selectedBase?.digitFormat!)} Liquidity Tokens to ${
                          rollToSeries?.displayName
                        } `}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 2 && <YieldHistory seriesOrVault={selectedSeries!} view={['POOL']} />}
        </Box>
      </Box>

      <ActionButtonGroup pad>
        {stepPosition[actionActive.index] === 0 && actionActive.index !== 2 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
            disabled={(actionActive.index === 0 && removeDisabled) || (actionActive.index === 1 && rollDisabled)}
          />
        )}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={
              <Text size={mobile ? 'small' : undefined}>
                {`Remov${removeTx.pending ? 'ing' : 'e'} ${
                  nFormatter(Number(removeInput), selectedBase?.digitFormat!) || ''
                } tokens`}
              </Text>
            }
            onClick={() => handleRemove()}
            disabled={removeDisabled || removeTx.pending}
          />
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={
              <Text size={mobile ? 'small' : undefined}>
                {`Roll${rollTx.pending ? 'ing' : ''} ${
                  nFormatter(Number(rollInput), selectedBase?.digitFormat!) || ''
                } tokens`}
              </Text>
            }
            onClick={() => handleRoll()}
            disabled={rollDisabled || rollTx.pending}
          />
        )}
      </ActionButtonGroup>
    </CenterPanelWrap>
  );
};

export default PoolPosition;

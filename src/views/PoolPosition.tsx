import React, { useContext, useState, useEffect } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory, useParams } from 'react-router-dom';
import { FiArrowRight, FiClock, FiPercent } from 'react-icons/fi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { abbreviateHash, cleanValue, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import InfoBite from '../components/InfoBite';
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
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';
import { useRemoveLiquidity } from '../hooks/actionHooks/useRemoveLiquidity';
import { useRollLiquidity } from '../hooks/actionHooks/useRollLiquidity';

const PoolPosition = ({ close }: { close: () => void }) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const history = useHistory();
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, seriesMap, assetMap, seriesLoading } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId || idFromUrl);
  const selectedBase = assetMap.get(selectedSeries?.baseId!);

  /* LOCAL STATE */
  const [removeInput, setRemoveInput] = useState<string | undefined>(undefined);
  const [rollInput, setRollInput] = useState<string | undefined>(undefined);
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
  const removeLiquidity = useRemoveLiquidity();
  const rollLiquidity = useRollLiquidity();

  /* TX data */
  const { tx: removeTx, resetTx: resetRemoveTx } = useTx(ActionCodes.REMOVE_LIQUIDITY, selectedSeries?.id);
  const { tx: rollTx, resetTx: resetRollTx } = useTx(ActionCodes.ROLL_LIQUIDITY, selectedSeries?.id);

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

  const resetInputs = (actionCode: ActionCodes) => {
    if (actionCode === ActionCodes.REMOVE_LIQUIDITY) setRemoveInput(undefined);
    if (actionCode === ActionCodes.ROLL_LIQUIDITY) setRollInput(undefined);
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

  /* INTERNAL COMPONENTS */
  const CompletedTx = (props: any) => (
    <>
      <NextButton
        // size="xsmall"
        label={<Text size={mobile ? 'xsmall' : undefined}>Go back</Text>}
        onClick={() => {
          props.resetTx();
          handleStepper(true);
          resetInputs(props.actionCode);
        }}
      />
      {/* {props.tx.failed && <EtherscanButton txHash={props.tx.txHash} />} */}
    </>
  );

  return (
    <>
      {selectedSeries && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            <Box fill pad={mobile ? 'medium' : 'large'} gap="medium">
              <Box height={{ min: '250px' }} gap="medium">
                <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={selectedSeries!} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedSeries?.displayName} </Text>
                      <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 5)}</Text>
                    </Box>
                  </Box>
                  <ExitButton action={() => history.goBack()} />
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    {/* <InfoBite label="Vault debt + interest:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} icon={<FiTrendingUp />} /> */}

                    <InfoBite
                      label="Liquidity Balance"
                      value={cleanValue(selectedSeries?.poolTokens_, selectedBase?.digitFormat!)}
                      icon={<YieldMark height="1em" startColor={selectedSeries?.startColor} />}
                      loading={seriesLoading}
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
                      loading={seriesLoading}
                    />
                    <InfoBite label="Maturity date:" value={`${selectedSeries?.fullDate}`} icon={<FiClock />} />
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions">
                  <Box elevation="xsmall" round="xsmall">
                    <Select
                      plain
                      dropProps={{ round: 'xsmall' }}
                      options={[
                        { text: 'Remove Liquidity', index: 0 },
                        { text: 'Roll Liquidity', index: 1 },
                        { text: 'View Transaction History', index: 2 },
                      ]}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => setActionActive(option)}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[0] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="medium">
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
                      <ActiveTransaction pad tx={removeTx}>
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
                      <Box margin={{ top: 'medium' }} gap="medium">
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
                      <ActiveTransaction pad tx={rollTx}>
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
                  errorLabel={(actionActive.index === 0 && removeError) || (actionActive.index === 1 && rollError)}
                />
              )}

              {actionActive.index === 0 &&
                stepPosition[actionActive.index] !== 0 &&
                !(removeTx.success || removeTx.failed) && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Remov${removeTx.processActive ? 'ing' : 'e'} ${
                          cleanValue(removeInput, selectedBase?.digitFormat!) || ''
                        } tokens`}
                      </Text>
                    }
                    onClick={() => handleRemove()}
                    disabled={removeDisabled || removeTx.processActive}
                  />
                )}

              {actionActive.index === 1 &&
                stepPosition[actionActive.index] !== 0 &&
                !( removeTx.success || removeTx.failed || rollTx.success || rollTx.failed) && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Roll${rollTx.processActive ? 'ing' : ''} ${
                          cleanValue(rollInput, selectedBase?.digitFormat!) || ''
                        } tokens`}
                      </Text>
                    }
                    onClick={() => handleRoll()}
                    disabled={rollDisabled || rollTx.processActive}
                  />
                )}

              {stepPosition[actionActive.index] === 1 &&
                actionActive.index === 0 &&
                !removeTx.processActive &&
                (removeTx.success || removeTx.failed) && (
                  <CompletedTx tx={removeTx} resetTx={resetRemoveTx} actionCode={ActionCodes.REMOVE_LIQUIDITY} />
                )}

              {stepPosition[actionActive.index] === 1 &&
                actionActive.index === 1 &&
                !rollTx.processActive &&
                (rollTx.success || rollTx.failed) && (
                  <CompletedTx tx={rollTx} resetTx={resetRollTx} actionCode={ActionCodes.ROLL_LIQUIDITY} />
                )}
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default PoolPosition;

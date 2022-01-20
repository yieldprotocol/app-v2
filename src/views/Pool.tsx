import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, RadioButtonGroup, ResponsiveContext, Text, TextInput, CheckBox, Tip, Layer } from 'grommet';
import { FiInfo, FiPercent } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import { MdAutorenew } from 'react-icons/md';
import { cleanValue, nFormatter } from '../utils/appUtils';
import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, AddLiquidityType, IUserContext, IUserContextState, ProcessStage, TxState } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import StrategyPositionSelector from '../components/selectors/StrategyPositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';
import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';
import NextButton from '../components/buttons/NextButton';
import TransactButton from '../components/buttons/TransactButton';
import { useInputValidation } from '../hooks/useInputValidation';
import AltText from '../components/texts/AltText';
import YieldCardHeader from '../components/YieldCardHeader';
import { useAddLiquidity } from '../hooks/actionHooks/useAddLiquidity';
import StrategySelector from '../components/selectors/StrategySelector';
import ColorText from '../components/texts/ColorText';
import { usePoolHelpers } from '../hooks/viewHelperHooks/usePoolHelpers';
import { useProcess } from '../hooks/useProcess';
import StrategyItem from '../components/positionItems/StrategyItem';
import DashMobileButton from '../components/buttons/DashMobileButton';

import YieldNavigation from '../components/YieldNavigation';

function Pool() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedBase, selectedStrategy, strategyMap } = userState;

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [poolInput, setPoolInput] = useState<string | undefined>(undefined);
  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);
  const [poolMethod, setPoolMethod] = useState<AddLiquidityType>(AddLiquidityType.BUY); // BUY default
  const [stepPosition, setStepPosition] = useState<number>(0);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(false);

  /* HOOK FNS */
  const addLiquidity = useAddLiquidity();
  const { maxPool, poolPercentPreview, canBuyAndPool, matchingVault } = usePoolHelpers(poolInput);

  /* input validation hooks */
  const { inputError: poolError } = useInputValidation(
    poolInput,
    ActionCodes.ADD_LIQUIDITY,
    selectedStrategy?.currentSeries || null,
    [0, maxPool]
  );

  const { txProcess: poolProcess, resetProcess } = useProcess(ActionCodes.ADD_LIQUIDITY, selectedStrategy?.id!);

  /* LOCAL ACTION FNS */
  const handleAdd = () => {
    console.log('POOLING METHOD: ', poolMethod, 'Matching vault', matchingVault?.id);
    const _method = !canBuyAndPool ? AddLiquidityType.BORROW : poolMethod; // double check
    selectedStrategy && addLiquidity(poolInput!, selectedStrategy, _method, matchingVault);
  };

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !activeAccount || !poolInput || poolError || !selectedStrategy ? setPoolDisabled(true) : setPoolDisabled(false);
    !poolInput || poolError || !selectedStrategy ? setStepDisabled(true) : setStepDisabled(false);
  }, [poolInput, activeAccount, poolError, selectedStrategy]);

  const resetInputs = useCallback(() => {
    setPoolInput(undefined);
    setStepPosition(0);
    resetProcess();
  }, [resetProcess]);

  useEffect(() => {
    poolProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs();
  }, [poolProcess, resetInputs]);

  useEffect(() => {
    canBuyAndPool ? setPoolMethod(AddLiquidityType.BUY) : setPoolMethod(AddLiquidityType.BORROW);
  }, [canBuyAndPool]);

  return (
    <MainViewWrap>
      {mobile && <DashMobileButton transparent={!!poolInput} />}
      {!mobile && (
        <PanelWrap>
          <YieldNavigation sideNavigation={true} />
          <YieldInfo />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedStrategy?.currentSeries}>
        <Box height="100%" pad={mobile ? 'medium' : { top: 'large', horizontal: 'large' }}>
          {stepPosition === 0 && (
            <Box fill gap="large">
              <YieldCardHeader>
                <Box gap={mobile ? undefined : 'xsmall'}>
                  <ColorText size={mobile ? 'medium' : '2rem'}>PROVIDE LIQUIDITY</ColorText>
                  <AltText color="text-weak" size="xsmall">
                    Pool tokens for{' '}
                    <Text size="small" color="text">
                      variable returns
                    </Text>{' '}
                    based on protocol usage.
                  </AltText>
                </Box>
              </YieldCardHeader>

              <Box gap="large">
                <SectionWrap>
                  <Box direction="row-responsive" gap="small">
                    <Box basis={mobile ? '50%' : '60%'}>
                      <InputWrap action={() => console.log('maxAction')} isError={poolError}>
                        <TextInput
                          plain
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter Amount"
                          value={poolInput || ''}
                          onChange={(event: any) =>
                            setPoolInput(cleanValue(event.target.value, selectedBase?.decimals))
                          }
                        />
                        <MaxButton
                          action={() => setPoolInput(maxPool)}
                          disabled={maxPool === '0'}
                          clearAction={() => setPoolInput('')}
                          showingMax={!!poolInput && poolInput === maxPool}
                        />
                      </InputWrap>
                    </Box>

                    <Box basis={mobile ? '50%' : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>
                <StrategySelector inputValue={poolInput} setOpen={toggleModal} open={modalOpen} />
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="medium">
              <YieldCardHeader>
                {poolProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                  <BackButton action={() => setStepPosition(0)} />
                ) : (
                  <Box pad="1em" />
                )}
              </YieldCardHeader>

              <ActiveTransaction full txProcess={poolProcess}>
                <Box gap="large">
                  <SectionWrap>
                    <Box
                      gap="small"
                      pad={{ horizontal: 'large', vertical: 'medium' }}
                      round="xsmall"
                      animation={{ type: 'zoomIn', size: 'small' }}
                    >
                      <InfoBite
                        label="Maximum Amount to Pool"
                        icon={<BiMessageSquareAdd />}
                        value={`${cleanValue(poolInput, selectedBase?.digitFormat!)} ${selectedBase?.displaySymbol}`}
                      />
                      <InfoBite label="Strategy" icon={<MdAutorenew />} value={`${selectedStrategy?.name}`} />
                      <InfoBite
                        label="Strategy Ownership"
                        icon={<FiPercent />}
                        value={`${cleanValue(poolPercentPreview, 2)}%`}
                      />
                    </Box>
                  </SectionWrap>
                  <SectionWrap>
                    <Box direction="row" justify="between" fill align="center">
                      {!mobile && (
                        <Box direction="row" gap="xsmall">
                          <Tip
                            content={
                              <Box gap="small">
                                <Text size="xsmall">Buy & Pool: provide liquidity using {selectedBase?.symbol}.</Text>
                                <Box>
                                  <Text size="xsmall">
                                    Borrow & Pool: provide liquidity by borrowing fy{selectedBase?.symbol} using{' '}
                                    {selectedBase?.symbol}.
                                  </Text>
                                  <Text size="xsmall">Typically used when providing a large amount of liquidity.</Text>
                                </Box>
                              </Box>
                            }
                            dropProps={{
                              align: { bottom: 'top', right: 'left' },
                            }}
                          >
                            <Box direction="row">
                              <Text size="xsmall">Pooling method:</Text>
                              <FiInfo size=".75rem" />
                            </Box>
                          </Tip>
                        </Box>
                      )}
                      <RadioButtonGroup
                        name="strategy"
                        options={[
                          { label: <Text size="xsmall">Buy & pool</Text>, value: 'BUY', disabled: !canBuyAndPool },
                          { label: <Text size="xsmall">Borrow & Pool</Text>, value: 'BORROW' },
                        ]}
                        value={poolMethod}
                        onChange={(event: any) => setPoolMethod(event.target.value)}
                        direction="row"
                        justify="between"
                      />
                    </Box>
                  </SectionWrap>
                </Box>
              </ActiveTransaction>
            </Box>
          )}

          {stepPosition === 1 && !poolProcess?.processActive && (
            <CheckBox
              pad={{ vertical: 'small' }}
              label={
                <Text size="xsmall">
                  I understand that providing liquidity into Yield Protocol may result in impermanent loss, result in
                  the payment of fees, and that under certain conditions I may not be able to withdraw all liquidity on
                  demand.
                </Text>
              }
              checked={disclaimerChecked}
              onChange={() => setDisclaimerChecked(!disclaimerChecked)}
            />
          )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.SUCCESSFUL && (
              <Box pad="small" gap="small" height="auto">
                <Text size="small"> View strategy Position: </Text>
                <StrategyItem strategy={strategyMap.get(selectedStrategy?.id!)!} index={0} condensed />
              </Box>
            )}
        </Box>

        <ActionButtonGroup pad>
          {stepPosition !== 1 && (
            <NextButton
              secondary
              label={<Text size={mobile ? 'small' : undefined}>Next Step</Text>}
              onClick={() => setStepPosition(stepPosition + 1)}
              disabled={stepDisabled || !selectedStrategy}
              errorLabel={poolError}
            />
          )}
          {stepPosition === 1 && poolProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
            <TransactButton
              primary
              label={
                !activeAccount ? (
                  'Connect Wallet'
                ) : (
                  <Text size={mobile ? 'small' : undefined}>
                    {`Pool${poolProcess?.processActive ? `ing` : ''} ${
                      nFormatter(Number(poolInput), selectedBase?.digitFormat!) || ''
                    } ${selectedBase?.displaySymbol || ''}`}
                  </Text>
                )
              }
              onClick={() => handleAdd()}
              disabled={poolDisabled || poolProcess?.processActive || !disclaimerChecked}
            />
          )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.SUCCESSFUL && (
              <NextButton
                label={<Text size={mobile ? 'small' : undefined}>Add more liquidity</Text>}
                onClick={() => resetInputs()}
              />
            )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.FAILED && (
              <NextButton
                label={<Text size={mobile ? 'small' : undefined}>Report and go back</Text>}
                onClick={() => resetInputs()}
              />
            )}
        </ActionButtonGroup>
      </CenterPanelWrap>

      {!mobile && (
        <PanelWrap right basis="40%">
          <StrategyPositionSelector />
        </PanelWrap>
      )}
    </MainViewWrap>
  );
}

export default Pool;

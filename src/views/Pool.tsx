import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, RadioButtonGroup, ResponsiveContext, Text, TextInput, Tip } from 'grommet';
import { FiPercent } from 'react-icons/fi';
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
import { ActionCodes, ActionType, AddLiquidityType, IUserContext, ProcessStage, TxState } from '../types';
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
import { usePoolHelpers } from '../hooks/actionHelperHooks/usePoolHelpers';
import { useProcess } from '../hooks/useProcess';
import StrategyItem from '../components/positionItems/StrategyItem';
import DashMobileButton from '../components/buttons/DashMobileButton';
import SeriesOrStrategySelectorModal from '../components/selectors/SeriesOrStrategySelectorModal';

function Pool() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, selectedBaseId, selectedStrategyAddr, strategyMap } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedStrategy = strategyMap.get(selectedStrategyAddr!);

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [poolInput, setPoolInput] = useState<string | undefined>(undefined);
  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);
  const [poolMethod, setPoolMethod] = useState<AddLiquidityType>(AddLiquidityType.BUY); // BUY default
  const [stepPosition, setStepPosition] = useState<number>(0);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const addLiquidity = useAddLiquidity();
  const { maxPool, poolPercentPreview, canBuyAndPool } = usePoolHelpers(poolInput);

  /* input validation hooks */
  const { inputError: poolError } = useInputValidation(
    poolInput,
    ActionCodes.ADD_LIQUIDITY,
    selectedStrategy?.currentSeries,
    [0, maxPool]
  );

  const { txProcess: poolProcess, resetProcess } = useProcess(ActionCodes.ADD_LIQUIDITY, selectedStrategy?.id);

  /* LOCAL ACTION FNS */
  const handleAdd = () => {
    console.log('POOLING METHOD: ', poolMethod);
    const _method = !canBuyAndPool ? AddLiquidityType.BORROW : poolMethod; // double check
    selectedStrategy && addLiquidity(poolInput!, selectedStrategy, _method);
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
          <Box margin={{ top: '35%' }} />
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
                {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                <SectionWrap>
                  <Box direction="row-responsive" gap="small">
                    <Box basis={mobile ? '50%' : '60%'}>
                      <InputWrap action={() => console.log('maxAction')} isError={poolError}>
                        <TextInput
                          plain
                          type="number"
                          placeholder="Enter amount"
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

                {mobile ? (
                  <SeriesOrStrategySelectorModal
                    inputValue={poolInput!}
                    actionType={ActionType.POOL}
                    open={modalOpen}
                    setOpen={toggleModal}
                  />
                ) : (
                  <SectionWrap
                    title={
                      strategyMap.size > 0 ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} strategy` : ''
                    }
                  >
                    <StrategySelector inputValue={poolInput} />
                  </SectionWrap>
                )}
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="large">
              <YieldCardHeader>
                {poolProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                  <BackButton action={() => setStepPosition(0)} />
                ) : (
                  <Box pad="1em" />
                )}
              </YieldCardHeader>

              <SectionWrap>
                <Box direction="row" justify="between" fill align="center">
                  {!mobile && (
                    <Box direction="row" gap="xsmall">
                      <Text size="small">Pooling method:</Text>
                      {/* <Tip
                              content={<Text size="xsmall">some info</Text>}
                              dropProps={{ align: { bottom: 'top' } }}
                            >
                              <Text size="small">
                                <FiInfo />
                              </Text>
                            </Tip> */}
                    </Box>
                  )}
                  <RadioButtonGroup
                    name="strategy"
                    options={[
                      { label: <Text size="small"> Buy & pool</Text>, value: 'BUY', disabled: !canBuyAndPool },
                      { label: <Text size="small"> Borrow & Pool </Text>, value: 'BORROW' },
                    ]}
                    value={poolMethod}
                    onChange={(event: any) => setPoolMethod(event.target.value)}
                    direction="row"
                    justify="between"
                  />
                </Box>
              </SectionWrap>

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
                        label="Amount to pool"
                        icon={<BiMessageSquareAdd />}
                        value={`${cleanValue(poolInput, selectedBase?.digitFormat!)} ${selectedBase?.symbol}`}
                      />
                      <InfoBite label="Strategy" icon={<MdAutorenew />} value={`${selectedStrategy?.name}`} />
                      {/* <InfoBite
                        label="Amount of liquidity tokens recieved"
                        icon={<BiCoinStack />}
                        value={`${'[todo]'} Liquidity tokens`}
                      /> */}
                      <InfoBite
                        label="Strategy Ownership"
                        icon={<FiPercent />}
                        value={`${cleanValue(poolPercentPreview, 2)}%`}
                      />
                    </Box>
                  </SectionWrap>
                </Box>
              </ActiveTransaction>
            </Box>
          )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.SUCCESSFUL && (
              <Box pad="large" gap="small">
                <Text size="small"> View strategy Position: </Text>
                <StrategyItem strategy={selectedStrategy!} index={0} condensed />
              </Box>
            )}
        </Box>

        <ActionButtonGroup pad>
          {stepPosition !== 1 && (
            <NextButton
              secondary
              label={<Text size={mobile ? 'small' : undefined}>Next step</Text>}
              onClick={() => setStepPosition(stepPosition + 1)}
              disabled={stepDisabled}
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
                    } ${selectedBase?.symbol || ''}`}
                  </Text>
                )
              }
              onClick={() => handleAdd()}
              disabled={poolDisabled || poolProcess?.processActive}
            />
          )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.SUCCESSFUL && (
              <>
                {/* <PositionListItem series={selectedSeries!} actionType={ActionType.POOL} /> */}
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Add more Liquidity</Text>}
                  onClick={() => resetInputs()}
                />
              </>
            )}

          {stepPosition === 1 &&
            poolProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            poolProcess?.tx.status === TxState.FAILED && (
              <>
                {/* <PositionListItem series={selectedSeries!} actionType={ActionType.POOL} /> */}
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Report and go back</Text>}
                  onClick={() => resetInputs()}
                />
              </>
            )}
        </ActionButtonGroup>
      </CenterPanelWrap>

      {!mobile && (
        <PanelWrap right basis="40%">
          {/* <YieldLiquidity input={poolInput} /> */}
          <StrategyPositionSelector />
        </PanelWrap>
      )}
    </MainViewWrap>
  );
}

export default Pool;

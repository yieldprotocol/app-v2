import { useCallback, useContext, useEffect, useState } from 'react';
import { Box, RadioButtonGroup, ResponsiveContext, Text, TextInput, CheckBox, Tip } from 'grommet';
import { FiInfo, FiPercent, FiZap } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import { MdAutorenew } from 'react-icons/md';
import { cleanValue, nFormatter } from '../../utils/appUtils';
import AssetSelector from '../selectors/AssetSelector';
import MainViewWrap from '../wraps/MainViewWrap';
import InputWrap from '../wraps/InputWrap';
import InfoBite from '../InfoBite';
import ActionButtonGroup from '../wraps/ActionButtonWrap';
import SectionWrap from '../wraps/SectionWrap';
import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, AddLiquidityType, IUserContext, IUserContextState, ProcessStage, TxState } from '../../types';
import MaxButton from '../buttons/MaxButton';
import PanelWrap from '../wraps/PanelWrap';
import CenterPanelWrap from '../wraps/CenterPanelWrap';
import StrategyPositionSelector from '../selectors/StrategyPositionSelector';
import ActiveTransaction from '../ActiveTransaction';
import YieldInfo from '../YieldInfo';
import BackButton from '../buttons/BackButton';
import NextButton from '../buttons/NextButton';
import TransactButton from '../buttons/TransactButton';
import { useInputValidation } from '../../hooks/useInputValidation';
import AltText from '../texts/AltText';
import YieldCardHeader from '../YieldCardHeader';
import { useAddLiquidity } from '../../hooks/actionHooks/useAddLiquidity';
import StrategySelector from '../selectors/StrategySelector';
import ColorText from '../texts/ColorText';
import { usePoolHelpers } from '../../hooks/viewHelperHooks/usePoolHelpers';
import { useProcess } from '../../hooks/useProcess';
import StrategyItem from '../positionItems/StrategyItem';

import YieldNavigation from '../YieldNavigation';
import Line from '../elements/Line';
import { useAccount } from 'wagmi';

function Pool() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { selectedBase, selectedStrategy, strategyMap } = userState;

  const { address: activeAccount } = useAccount();

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [poolInput, setPoolInput] = useState<string | undefined>(undefined);
  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);
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
    if (poolDisabled) return;

    setPoolDisabled(true);
    addLiquidity(
      poolInput,
      selectedStrategy,
      canBuyAndPool ? AddLiquidityType.BUY : AddLiquidityType.BORROW,
      matchingVault
    );
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

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap basis="30%">
          <YieldNavigation sideNavigation={true} />
          <StrategyPositionSelector />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedStrategy?.currentSeries}>
        <Box id="topsection">
          {stepPosition === 0 && (
            <Box fill gap="large" height="100%" pad={mobile ? 'medium' : { top: 'large', horizontal: 'large' }}>
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

              <Box gap="medium">
                <Box direction="row-responsive">
                  <Box basis={mobile ? '50%' : '60%'}>
                    <InputWrap action={() => console.log('maxAction')} isError={poolError}>
                      <TextInput
                        plain
                        type="number"
                        inputMode="decimal"
                        placeholder="Enter amount"
                        value={poolInput || ''}
                        onChange={(event: any) => setPoolInput(cleanValue(event.target.value, selectedBase?.decimals))}
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

                <SectionWrap
                  title={
                    strategyMap.size > 0
                      ? `Recomended ${selectedBase?.displaySymbol}${selectedBase && '-based'} strategy`
                      : ''
                  }
                >
                  <Box flex={false}>
                    <StrategySelector inputValue={poolInput} setOpen={toggleModal} open={modalOpen} />
                  </Box>
                </SectionWrap>
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <>
              <Box
                background="gradient-transparent"
                round={{ corner: 'top', size: 'xsmall' }}
                pad="medium"
                gap="medium"
                height={{ min: '350px' }}
              >
                <YieldCardHeader>
                  {poolProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                    <BackButton action={() => setStepPosition(0)} />
                  ) : (
                    <Box pad="1em" />
                  )}
                </YieldCardHeader>

                <ActiveTransaction full txProcess={poolProcess}>
                  <Box
                    gap="small"
                    pad={{ horizontal: 'medium', vertical: 'medium' }}
                    animation={{ type: 'zoomIn', size: 'small' }}
                    flex={false}
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
                    {selectedStrategy.currentSeries.poolAPY && (
                      <InfoBite
                        label="Pool APY"
                        icon={<FiZap />}
                        value={`${cleanValue(selectedStrategy.currentSeries.poolAPY, 2)}%`}
                        labelInfo="Estimated APY based on the current Euler supply APY"
                      />
                    )}
                  </Box>
                </ActiveTransaction>
              </Box>

              <Line />
            </>
          )}
        </Box>

        <Box id="midSection" gap="small">
          {stepPosition === 1 && !poolProcess?.processActive && (
            <CheckBox
              pad={{ vertical: 'small', horizontal: 'large' }}
              label={
                <Text size="xsmall" weight="lighter">
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
              <Box pad="large" gap="small">
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
        <PanelWrap right>
          <Box />
          <YieldInfo />
        </PanelWrap>
      )}
    </MainViewWrap>
  );
}

export default Pool;

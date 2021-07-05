import React, { useContext, useState, useEffect } from 'react';
import { Avatar, base, Box, Button, Collapsible, Layer, Menu, ResponsiveContext, Stack, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory } from 'react-router-dom';

import { FiMoreVertical } from 'react-icons/fi';

import { cleanValue } from '../utils/displayUtils';
import { UserContext } from '../contexts/UserContext';

import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { ActionCodes, ActionType, IAsset, ISeries, IUserContext, IVault } from '../types';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { useCollateralActions, useCollateralization } from '../hooks/collateralHooks';
import { useBorrowActions } from '../hooks/borrowHooks';
import SeriesSelector from '../components/selectors/SeriesSelector';
import MaxButton from '../components/buttons/MaxButton';
import TabWrap from '../components/wraps/TabWrap';
import ActiveTransaction from '../components/ActiveTransaction';
import { getTxCode } from '../utils/appUtils';
import BackButton from '../components/buttons/BackButton';
import PositionAvatar from '../components/PositionAvatar';

const Vault = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, vaultMap, selectedVaultId } = userState;
  // const { setSelectedVault } = userActions;

  const selectedVault: IVault|undefined = vaultMap.get(selectedVaultId!);
  const vaultBase: IAsset|undefined = assetMap.get(selectedVault?.baseId!);
  const vaultIlk: IAsset|undefined = assetMap.get(selectedVault?.ilkId!);
  const vaultSeries: ISeries|undefined = seriesMap.get(selectedVault?.seriesId!);

  const {
    collateralizationPercent,
  } = useCollateralization(selectedVault?.art.toString(), selectedVault?.ink.toString(), selectedVault);

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

  const [availableVaults, setAvailableVaults] = useState<IVault[]>();

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [borrowInput, setBorrowInput] = useState<any>(undefined);
  const [collatInput, setCollatInput] = useState<any>(undefined);

  const [addCollatInput, setAddCollatInput] = useState<any>(undefined);
  const [removeCollatInput, setRemoveCollatInput] = useState<any>(undefined);

  const [rollInput, setRollInput] = useState<any>(undefined);
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxRepay, setMaxRepay] = useState<string|undefined>();
  const [maxCollat, setMaxCollat] = useState<string|undefined>();

  const [repayError, setRepayError] = useState<string|null>(null);
  const [borrowError, setBorrowError] = useState<string|null>(null);
  const [addCollatError, setAddCollatError] = useState<string|null>(null);
  const [removeCollatError, setRemoveCollatError] = useState<string|null>(null);

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);

  const [showMore, setShowMore] = useState<boolean>(false);
  // const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { repay, borrow, rollDebt } = useBorrowActions();
  const { addCollateral, removeCollateral } = useCollateralActions();

  /* LOCAL FNS */
  const handleRepay = () => {
    selectedVault &&
    repay(selectedVault, repayInput?.toString());
    setRepayInput('');
  };

  const handleBorrow = () => {
    selectedVault &&
    borrow(selectedVault, borrowInput, '0');
    setBorrowInput('');
  };

  const handleCollateral = (action: 'ADD'|'REMOVE') => {
    const remove: boolean = (action === 'REMOVE');
    if (selectedVault) {
      !remove && addCollateral(selectedVault, addCollatInput);
      remove && removeCollateral(selectedVault, removeCollatInput);
    }
    setCollatInput('');
  };

  const handleRoll = () => {
    rollToSeries && selectedVault &&
    rollDebt(selectedVault, rollToSeries);
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
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = (_maxToken && selectedVault?.art.gt(_maxToken)) ? _maxToken : selectedVault?.art;

        _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
        // if (_max?.gt(ZERO_BN)) {
        //   _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
        // } else {
        //   setMaxRepay(undefined);
        // }
      })();
    }
  }, [activeAccount, selectedVault?.art, vaultBase, setMaxRepay]);

  useEffect(() => {
    /* CHECK collateral selection and sets the max available collateral */
    activeAccount &&
    (async () => {
      const _max = await vaultIlk?.getBalance(activeAccount);
      _max && setMaxCollat(ethers.utils.formatEther(_max)?.toString());
    })();
  }, [activeAccount, vaultIlk, setMaxCollat]);

  /* WATCH FOR WARNINGS AND ERRORS */

  /* CHECK for any repay input errors/warnings */
  useEffect(() => {
    if (repayInput || repayInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxRepay && parseFloat(repayInput) > parseFloat(maxRepay)) setRepayError('Repay amount exceeds maximum available');
      /* 3. next check */
      else if (maxRepay && parseFloat(maxRepay) === 0) setRepayError('Zero token balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(repayInput) < 0) setRepayError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRepayError(null);
      }
    }
  }, [repayInput, maxRepay, setRepayError]);

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (addCollatInput || addCollatInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxCollat && parseFloat(addCollatInput) > parseFloat(maxCollat)) setAddCollatError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(collatInput) < 0) setAddCollatError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setAddCollatError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setAddCollatError(null);
      }
    }
  }, [addCollatInput, maxCollat, setAddCollatError]);

  /* ACTION DISABLING LOGIC */

  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    (!repayInput || repayError) ? setRepayDisabled(true) : setRepayDisabled(false);
  },
  [repayInput, repayError, collatInput]);

  /* EXTRA INITIATIONS */

  useEffect(() => {
    setAvailableVaults(Array.from(vaultMap.values())); // add some filtering here

    /* set global series, base and ilk */
    selectedVault && userActions.setSelectedSeries(selectedVault.seriesId);
    selectedVault && userActions.setSelectedBase(selectedVault.baseId);
    selectedVault && userActions.setSelectedIlk(selectedVault.ilkId);
  }, [vaultMap, selectedVault]);

  return (
    <Box gap="large">
      <Box height="300px" gap="large">
        <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
          <Box direction="row" align="center" gap="small">

            <PositionAvatar position={selectedVault!} />

            <Box>
              <Text size={mobile ? 'large' : 'xlarge'}> {selectedVault?.displayName} </Text>
              <Text size="small"> {selectedVault?.id} </Text>
            </Box>
          </Box>

          <Menu
            label={<Box pad="xsmall" alignSelf="end" fill><Text size="xsmall" color="brand"> <FiMoreVertical /> </Text></Box>}
            dropProps={{
              align: { top: 'bottom', left: 'left' },
              elevation: 'xlarge',
            }}
            icon={false}
            items={
                ['Delete Vault', 'Transfer vault'].map((x:any) => (
                  { label: <Text size="small"> {x} </Text>, onClick: () => console.log(x) }
                )) || []
              }
            onSelect={(x:any) => console.log(x)}
          />
        </Box>

        <SectionWrap>
          <Box gap="medium">
            <InfoBite label="Vault debt:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} />
            <InfoBite label="Collateral posted:" value={`${selectedVault?.ink_} ${vaultIlk?.symbol}`} />
            <InfoBite label="Maturity date:" value={`${vaultSeries?.displayName}`} />
            <InfoBite label="Collateralization Ratio:" value={`${collateralizationPercent} %`} />
          </Box>
        </SectionWrap>
      </Box>

      <SectionWrap title="Vault Actions">
        <Box
          round="xsmall"
          height="400px"
          pad="xsmall"
          elevation="small"
        >
          <Tabs justify="start" activeIndex={tabIndex} onActive={onActive}>

            <TabWrap title="repay">
              {stepPosition[0] === 0 ?
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={repayError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Enter amount to Repay"
                      // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                      value={repayInput || ''}
                      onChange={(event:any) => setRepayInput(cleanValue(event.target.value))}
                    />
                    <MaxButton
                      action={() => setRepayInput(maxRepay)}
                    />
                  </InputWrap>
                </Box>
                :
                <Box gap="large">
                  <ActiveTransaction txCode={(selectedVault && getTxCode(ActionCodes.REPAY, selectedVault?.id)) || ''}>
                    <SectionWrap title="Review your transaction">
                      <Text>Repay {repayInput} {vaultBase?.symbol} debt from {selectedVault?.displayName} </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>}

              <ActionButtonGroup>
                {
                    stepPosition[0] === 0 ?
                      <NextButton />
                      :
                      <Box gap="small">
                        <BackButton action={() => handleStepper(true)} />
                        <Button
                          primary
                          label={<Text size={mobile ? 'small' : undefined}> {`Repay ${repayInput || ''} Dai`} </Text>}
                          onClick={() => handleRepay()}
                          disabled={repayDisabled}
                        />
                      </Box>
                  }
              </ActionButtonGroup>
            </TabWrap>

            <TabWrap title="Roll Debt">
              {
                stepPosition[1] === 0 ?
                  <Box pad={{ vertical: 'medium' }} fill="horizontal" direction="row" align="center">
                    <SeriesSelector
                      selectSeriesLocally={(series:ISeries) => setRollToSeries(series)}
                      actionType={ActionType.BORROW}
                      cardLayout={false}
                    />
                  </Box>
                  :
                  <Box gap="large">
                    <ActiveTransaction txCode={(selectedVault && getTxCode(ActionCodes.ROLL_DEBT, selectedVault?.id)) || ''}>
                      <SectionWrap title="Review your transaction">
                        <Text>
                          Roll {rollInput} {vaultBase?.symbol} debt
                          from {selectedVault?.displayName} to the {rollToSeries?.displayName} series.
                        </Text>
                      </SectionWrap>
                    </ActiveTransaction>
                  </Box>
              }
              <ActionButtonGroup>
                { stepPosition[1] === 0 ?
                  <NextButton />
                  :
                  <Box gap="small">
                    <BackButton action={() => handleStepper(true)} />
                    <Button
                      primary
                      label={<Text size={mobile ? 'small' : undefined}> Roll debt </Text>}
                      onClick={() => handleRoll()}
                    />
                  </Box>}
              </ActionButtonGroup>
            </TabWrap>

            <TabWrap title="Manage Collateral">
              { tabIndex === 2 &&
                stepPosition[2] === 0 ?
                  <Box pad={{ vertical: 'medium' }}>
                    <Box direction="row" gap="small" align="center">
                      <Box>
                        <InputWrap action={() => console.log('maxAction')} isError={addCollatError}>
                          <TextInput
                            plain
                            type="number"
                            placeholder="ADD"
                            value={addCollatInput || ''}
                            onChange={(event:any) => setAddCollatInput(cleanValue(event.target.value))}
                          />
                        </InputWrap>
                      </Box>
                      <Text> or </Text>
                      <Box>
                        <InputWrap action={() => console.log('maxAction')} isError={removeCollatError}>
                          <TextInput
                            plain
                            type="number"
                            placeholder="REMOVE"
                            value={removeCollatInput || ''}
                            onChange={(event:any) => setRemoveCollatInput(cleanValue(event.target.value))}
                          />
                        </InputWrap>
                      </Box>
                    </Box>
                  </Box>
                :
                  <Box gap="large">
                    <ActiveTransaction txCode={(selectedVault && getTxCode(ActionCodes.ROLL_DEBT, selectedVault?.id)) || ''}>
                      <SectionWrap title="Review your transaction">
                        {addCollatInput &&
                          <Text>
                            Add {addCollatInput} {vaultIlk?.symbol} collateral
                          </Text>}
                        {removeCollatInput &&
                          <Text>
                            Remove {removeCollatInput} {vaultIlk?.symbol} collateral
                          </Text>}
                      </SectionWrap>
                    </ActiveTransaction>
                  </Box>}

              <ActionButtonGroup>
                { stepPosition[2] !== 1 && <NextButton /> }
                { stepPosition[2] === 1 &&
                    addCollatInput &&

                    <Box gap="small">
                      <BackButton action={() => handleStepper(true)} />
                      <Button
                        primary
                        label={<Text size={mobile ? 'small' : undefined}> Add </Text>}
                        onClick={() => handleCollateral('ADD')}
                      />
                    </Box>}
                { stepPosition[2] === 1 &&
                    removeCollatInput &&
                    <Box gap="small">
                      <BackButton action={() => handleStepper(true)} />
                      <Button
                        primary
                        label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
                        onClick={() => handleCollateral('REMOVE')}
                      />
                    </Box>}
              </ActionButtonGroup>

            </TabWrap>

            <TabWrap title="Borrow More" disabled={vaultSeries?.seriesIsMature}>
              {stepPosition[3] === 0 ?
                <Box pad={{ vertical: 'medium' }}>
                  <Box fill>
                    <InputWrap action={() => console.log('maxAction')} isError={borrowError}>
                      <TextInput
                        plain
                        type="number"
                        placeholder="Enter extra amount to Borrow"
                    // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                        value={borrowInput || ''}
                        onChange={(event:any) => setBorrowInput(cleanValue(event.target.value))}
                      />
                    </InputWrap>
                  </Box>
                </Box>
                :
                <Box gap="large">
                  <ActiveTransaction txCode={(selectedVault && getTxCode(ActionCodes.ROLL_DEBT, selectedVault?.id)) || ''}>
                    <SectionWrap title="Review your transaction">
                      <Text>Borrow {borrowInput}
                        {vaultBase?.symbol} from the {vaultSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>}
              <ActionButtonGroup>
                { stepPosition[3] === 0 ?
                  <NextButton />
                  :
                  <Box gap="small">
                    <BackButton action={() => handleStepper(true)} />
                    <Button
                      primary
                      label={<Text size={mobile ? 'small' : undefined}> Borrow more </Text>}
                      onClick={() => handleBorrow()}
                    />
                  </Box>}
              </ActionButtonGroup>
            </TabWrap>

          </Tabs>

        </Box>
      </SectionWrap>
    </Box>
  );
};

export default Vault;

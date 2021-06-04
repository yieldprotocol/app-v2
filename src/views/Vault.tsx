import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, Collapsible, Layer, Menu, ResponsiveContext, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory } from 'react-router-dom';

import { FiMoreVertical } from 'react-icons/fi';

import { cleanValue } from '../utils/displayUtils';
import { UserContext } from '../contexts/UserContext';

import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { IAsset, ISeries, IUserContext, IVault } from '../types';

import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';
import { useCollateralActions } from '../hooks/collateralActions';
import { useBorrowActions } from '../hooks/borrowActions';
import SeriesSelector from '../components/selectors/SeriesSelector';
import MaxButton from '../components/MaxButton';

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

  /* LOCAL STATE */
  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  const [availableVaults, setAvailableVaults] = useState<IVault[]>();

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [borrowInput, setBorrowInput] = useState<any>(undefined);
  const [collatInput, setCollatInput] = useState<any>(undefined);

  const [rollInput, setRollInput] = useState<any>(undefined);
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxRepay, setMaxRepay] = useState<string|undefined>();
  const [maxCollat, setMaxCollat] = useState<string|undefined>();

  const [repayError, setRepayError] = useState<string|null>(null);
  const [borrowError, setBorrowError] = useState<string|null>(null);
  const [collatError, setCollatError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

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
      !remove && addCollateral(selectedVault, collatInput);
      remove && removeCollateral(selectedVault, collatInput);
    }
    setCollatInput('');
  };
  const handleRoll = () => {
    rollToSeries && selectedVault &&
    rollDebt(selectedVault, rollToSeries);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = (_maxToken && selectedVault?.art.gt(_maxToken)) ? _maxToken : selectedVault?.art;
        _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
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
      if (maxRepay && parseFloat(repayInput) > parseFloat(maxRepay)) setRepayError('Repay amount exceeds debt');
      /* 2. Check if input is above zero */
      else if (parseFloat(repayInput) < 0) setRepayError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setRepayError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setRepayError(null);
      }
    }
  }, [repayInput, maxRepay, setRepayError]);

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (collatInput || collatInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxCollat && parseFloat(collatInput) > parseFloat(maxCollat)) setCollatError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(collatInput) < 0) setCollatError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setCollatError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setCollatError(null);
      }
    }
  }, [collatInput, maxCollat, setCollatError]);

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
    <>

      <Box>
        <Box gap="medium" height="150px">
          <Box direction="row-responsive" justify="between" fill="horizontal" align="center">

            <Box direction="row" align="center" fill>
              <Text size={mobile ? 'small' : 'medium'}> {selectedVault?.id} </Text>
              <Menu
                label={<Box pad="xsmall" alignSelf="end" fill><Text size="xsmall" color="brand"> Change Vault </Text></Box>}
                dropProps={{
                  align: { top: 'bottom', left: 'left' },
                  elevation: 'xlarge',
                }}
                icon={false}
                items={
                availableVaults?.map((x:any) => (
                  { label: <Text size="small"> {x.id} </Text>, onClick: () => userActions.setSelectedVault(x.id) }
                )) || []
              }
                onSelect={(x:any) => console.log(x)}
              />
            </Box>

            <Menu
              label={<Box pad="xsmall" alignSelf="end" fill><Text size="xsmall" color="brand"> <FiMoreVertical /> </Text></Box>}
              dropProps={{
                align: { top: 'bottom', left: 'left' },
                elevation: 'xlarge',
              }}
              icon={false}
              items={
                ['Delete Vault', 'transfer vault', 'repay all'].map((x:any) => (
                  { label: <Text size="small"> {x} </Text>, onClick: () => console.log(x) }
                )) || []
              }
              onSelect={(x:any) => console.log(x)}
            />

          </Box>

          <SectionWrap>
            <Box direction="row-responsive" gap="medium" justify="evenly">
              <InfoBite label="Vault debt:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} />
              <InfoBite label="Collateral posted:" value={`${selectedVault?.ink_} ${vaultIlk?.symbol}`} />
              <InfoBite label="Maturity date:" value={`${vaultSeries?.displayName}`} />
            </Box>
          </SectionWrap>

        </Box>

        <Tabs justify="start" activeIndex={tabIndex} onActive={onActive}>

          <Tab title="Repay Debt">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              <Box fill>
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
            </Box>
          </Tab>

          <Tab title="Roll Debt">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              {/* <Box>
                <InputWrap action={() => console.log('maxAction')} isError={rollError}>
                  <TextInput
                    plain
                    type="number"
                    placeholder="Debt to roll"
                    value={rollInput || ''}
                    onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
                  />
                  <MaxButton
                    action={() => setRollInput(maxRepay)}
                    disabled={maxRepay === '0.0'}
                  />
                </InputWrap>
              </Box> */}
            </Box>
            <Box gap="small" fill="horizontal" direction="row" align="center">
              <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />
            </Box>
          </Tab>

          <Tab title="Manage Collateral">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              <Box fill>
                <InputWrap action={() => console.log('maxAction')} isError={collatError}>
                  <TextInput
                    plain
                    type="number"
                    placeholder="Amount to add/remove"
                    // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                    value={collatInput || ''}
                    onChange={(event:any) => setCollatInput(cleanValue(event.target.value))}
                  />
                </InputWrap>
              </Box>
            </Box>
            TODO: handle moving collateral between series
          </Tab>

          {!vaultSeries?.seriesIsMature &&
          <Tab title="Borrow More">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
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
          </Tab>}

        </Tabs>
      </Box>

      <ActionButtonGroup>
        { tabIndex === 0 &&
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Repay ${repayInput || ''} Dai`} </Text>}
          onClick={() => handleRepay()}
          disabled={repayDisabled}
        />}
        { tabIndex === 1 &&
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
          onClick={() => handleBorrow()}
        />}

        { tabIndex === 2 &&
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> Add </Text>}
          onClick={() => handleCollateral('ADD')}
        />}

        { tabIndex === 2 &&
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
          onClick={() => handleCollateral('REMOVE')}
        />}

        { tabIndex === 3 &&
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> Borrow More </Text>}
          onClick={() => handleRoll()}
        />}

      </ActionButtonGroup>

    </>

  );
};

export default Vault;

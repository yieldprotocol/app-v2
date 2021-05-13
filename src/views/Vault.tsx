import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, Menu, ResponsiveContext, Text, TextInput } from 'grommet';

import { ethers } from 'ethers';
import { cleanValue } from '../utils/displayUtils';
import { UserContext } from '../contexts/UserContext';

import MainViewWrap from '../components/wraps/MainViewWrap';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { IAsset, ISeries, IUserContext, IVault } from '../types';

import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { useCollateralActions } from '../hooks/collateralActions';
import { useBorrowActions } from '../hooks/borrowActions';
import SeriesSelector from '../components/selectors/SeriesSelector';
import MaxButton from '../components/MaxButton';

const Vault = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, vaultMap, selectedVaultId, selectedSeriesId } = userState;
  const { setSelectedVault } = userActions;

  const activeVault: IVault|undefined = vaultMap.get(selectedVaultId!);
  const selectedBase: IAsset|undefined = assetMap.get(activeVault?.baseId!);
  const selectedIlk: IAsset|undefined = assetMap.get(activeVault?.ilkId!);
  const selectedSeries: ISeries|undefined = seriesMap.get(activeVault?.seriesId!);

  /* LOCAL STATE */

  const [availableVaults, setAvailableVaults] = useState<IVault[]>();

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [borrowInput, setBorrowInput] = useState<any>(undefined);
  const [collatInput, setCollatInput] = useState<any>(undefined);
  const [rollInput, setRollInput] = useState<string>();

  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxRepay, setMaxRepay] = useState<string|undefined>();
  const [maxCollat, setMaxCollat] = useState<string|undefined>();

  const [repayError, setRepayError] = useState<string|null>(null);
  const [borrowError, setBorrowError] = useState<string|null>(null);
  const [collatError, setCollatError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */

  const { repay, borrow, rollDebt } = useBorrowActions();
  const { addCollateral, removeCollateral } = useCollateralActions();

  /* LOCAL FNS */

  const handleRepay = () => {
    activeVault &&
    repay(activeVault, repayInput?.toString());
  };
  const handleBorrow = () => {
    activeVault &&
    borrow(activeVault, borrowInput, '0');
  };
  const handleCollateral = (action: 'ADD'|'REMOVE') => {
    const remove: boolean = (action === 'REMOVE');
    if (activeVault) {
      !remove && addCollateral(activeVault, collatInput);
      remove && removeCollateral(activeVault, collatInput);
    }
  };
  const handleRoll = () => {
    rollToSeries && activeVault &&
    rollDebt(activeVault, rollToSeries, '0');
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await selectedBase?.getBalance(activeAccount);
        const _max = (_maxToken && activeVault?.art.gt(_maxToken)) ? _maxToken : activeVault?.art;
        _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
      })();
    }
  }, [activeAccount, activeVault?.art, selectedBase, setMaxRepay]);

  useEffect(() => {
    /* CHECK collateral selection and sets the max available collateral */
    activeAccount &&
    (async () => {
      const _max = await selectedIlk?.getBalance(activeAccount);
      _max && setMaxCollat(ethers.utils.formatEther(_max)?.toString());
    })();
  }, [activeAccount, selectedIlk, setMaxCollat]);

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

  /* CHECK for any roll debt input errors/warnings */
  useEffect(() => {
    if (rollInput || rollInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxRepay && parseFloat(rollInput) > parseFloat(maxRepay)) setRollError('Roll Amount exceeds debt');
      /* 2. Check if input is above zero */
      else if (parseFloat(rollInput) < 0) setRollError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setRollError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [rollInput, maxRepay, setRollError]);

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
    (!rollInput || rollError) ? setRollDisabled(true) : setRollDisabled(false);
  },
  [repayInput, repayError, collatInput, rollInput, rollError]);

  /* EXTRA INITIATIONS */

  useEffect(() => {
    setAvailableVaults(Array.from(vaultMap.values())); // add some filtering here
  }, [vaultMap, activeVault]);

  return (
    <MainViewWrap fullWidth>
      <Box gap="medium">
        <Box direction="row-responsive" gap="medium" justify="between" fill="horizontal">
          <Box direction="row" align="center" justify="between">
            <Text size={mobile ? 'small' : 'medium'}> {activeVault?.id} </Text>
            <Menu
              label={<Box pad="xsmall" alignSelf="end" fill><Text size="xsmall" color="brand"> Change Vault </Text></Box>}
              dropProps={{
                align: { top: 'bottom', left: 'left' },
                elevation: 'xlarge',
              }}
              icon={false}
              items={
                availableVaults?.map((x:any) => (
                  { label: <Text size="small"> {x.id} </Text>, onClick: () => setSelectedVault(x.id) }
                )) || []
              }
              onSelect={(x:any) => console.log(x)}
            />
          </Box>

          <Box direction="row" justify="between" gap="small">
            <Text size="small"> Maturity date: </Text>
            <Text size="small"> { selectedSeries?.displayName } </Text>
          </Box>
        </Box>

        <InfoBite label="Vault debt:" value={`${activeVault?.art_} ${selectedBase?.symbol}`} />
        <InfoBite label="Collateral posted:" value={`${activeVault?.ink_} ${selectedIlk?.symbol}`} />

      </Box>

      <MainViewWrap>

        <SectionWrap title="[ Repay debt ]">

          <Box gap="small" fill="horizontal" direction="row" align="center">
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

          <ActionButtonGroup buttonList={[
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> {`Repay ${repayInput || ''} Dai`} </Text>}
              key="primary"
              onClick={() => handleRepay()}
              disabled={repayDisabled}
            />,
          ]}
          />

        </SectionWrap>

        <SectionWrap title="[ Roll Position ]">

          <Box direction="row" gap="small" fill="horizontal" align="start">
            <InputWrap action={() => console.log('maxAction')} isError={rollError}>
              <TextInput
                plain
                type="number"
                placeholder="fyToken Amount" // {`${selectedBase?.symbol} to roll`}
                value={rollInput || ''}
                onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
              />
              <MaxButton
                action={() => setRollInput(maxRepay)}
              />
            </InputWrap>
          </Box>

          <Box gap="small" fill="horizontal" direction="row" align="center">

            <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

            <Box basis="35%">
              <ActionButtonGroup buttonList={[
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                  key="primary"
                  onClick={() => handleRoll()}
                  disabled={rollDisabled}
                />,
              ]}
              />
            </Box>
          </Box>
        </SectionWrap>

        <SectionWrap title="[ Borrow more ]">

          <Box gap="small" fill="horizontal" direction="row" align="center">
            <InputWrap basis="65%" action={() => console.log('maxAction')} isError={borrowError}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Enter amount to Borrow" />}
                // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                value={borrowInput || ''}
                onChange={(event:any) => setBorrowInput(cleanValue(event.target.value))}
              />
            </InputWrap>
            <Box basis="35%">
              <ActionButtonGroup buttonList={[
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Borrow </Text>}
                  key="primary"
                  onClick={() => handleBorrow()}
                />,
              ]}
              />
            </Box>
          </Box>
        </SectionWrap>

        <SectionWrap
          title="[ Manage Collateral ]"
        >

          <Box gap="small" fill="horizontal" direction="row" align="center">
            <InputWrap basis="65%" action={() => console.log('maxAction')} isError={collatError}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Amount to add/remove" />}
                // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                value={collatInput || ''}
                onChange={(event:any) => setCollatInput(cleanValue(event.target.value))}
              />
            </InputWrap>
            <Box basis="35%">
              <ActionButtonGroup buttonList={[
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Add </Text>}
                  key="primary"
                  onClick={() => handleCollateral('ADD')}
                />,
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
                  key="secondary"
                  onClick={() => handleCollateral('REMOVE')}
                />,

              ]}
              />
            </Box>
          </Box>
        </SectionWrap>

      </MainViewWrap>

    </MainViewWrap>
  );
};

export default Vault;

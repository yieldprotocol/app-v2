import React, { useContext, useState, useRef, useEffect } from 'react';
import { Box, Button, Collapsible, Menu, ResponsiveContext, Text, TextInput } from 'grommet';

import { useHistory } from 'react-router-dom';
import { cleanValue } from '../utils/displayUtils';

import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';

import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { IAsset, ISeries, IUserContext, IVault } from '../types';

import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { useActions } from '../hooks/actionHooks';

const Vault = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  // const routerHistory = useHistory();

  /* state from context */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, vaultMap, selectedVaultId } = userState;
  const { setSelectedVault } = userActions;

  const activeVault: IVault|undefined = vaultMap.get(selectedVaultId!);
  const base: IAsset|undefined = assetMap.get(activeVault?.baseId!);
  const ilk: IAsset|undefined = assetMap.get(activeVault?.ilkId!);
  const series: ISeries|undefined = seriesMap.get(activeVault?.seriesId!);

  /* local state */
  const [availableVaults, setAvailableVaults] = useState<IVault[]>();

  const [inputValue, setInputValue] = useState<any>(undefined);
  const [borrowInput, setBorrowInput] = useState<any>(undefined);
  const [collateralInput, setCollateralInput] = useState<any>(undefined);

  const { repay, borrow, addRemoveCollateral } = useActions();

  /* init effects */
  useEffect(() => {
    setAvailableVaults(Array.from(vaultMap.values())); // add some filtering here
  }, [vaultMap, activeVault]);

  const handleRepay = () => {
    activeVault &&
    repay(activeVault, inputValue?.toString());
  };
  const handleBorrowMore = () => {
    activeVault &&
    borrow(activeVault, borrowInput, '0');
  };
  const handleCollateral = (action: 'ADD'|'REMOVE') => {
    const removeCollateral: boolean = (action === 'REMOVE');
    if (activeVault) {
      addRemoveCollateral(activeVault, collateralInput, removeCollateral);
    }
  };

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
            <Text size="small"> { series?.displayName } </Text>
          </Box>
        </Box>

        <InfoBite label="Vault debt:" value={`${activeVault?.art_} ${base?.symbol}`} />
        <InfoBite label="Collateral posted:" value={`${activeVault?.ink_} ${ilk?.symbol}`} />

      </Box>

      <MainViewWrap>
        <SectionWrap>
          <Box gap="small" fill="horizontal">
            <InputWrap basis="65%" action={() => console.log('maxAction')}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Enter amount to Repay" />}
                // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                value={inputValue || ''}
                onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
              />
              <Box onClick={() => console.log('max clicked ')} pad="xsmall">
                <Text size="xsmall" color="text">MAX</Text>
              </Box>
            </InputWrap>
          </Box>
        </SectionWrap>

        <ActionButtonGroup buttonList={[
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Repay ${inputValue || ''} Dai`} </Text>}
            key="primary"
            onClick={() => handleRepay()}
          />,

          <Button
            secondary
            label={<Text size={mobile ? 'small' : undefined}> Roll Debt </Text>}
            key="secondary"
          />,
          // <Button
          //   label={mobile ? <Text size="xsmall"> Borrow more </Text> : <Text>Borrow more & add additional collateral</Text>}
          //   style={{ border: 0 }}
          //   onClick={() => routerHistory.push('/borrow', { from: 'vault' })}
          //   key="tertiary"
          // />,
        ]}
        />

        <SectionWrap
          title="Borrow more"
          border={{
            color: 'grey',
            style: 'dashed',
            side: 'all',
          }}
        >
          <Box gap="small" fill="horizontal" direction="row" align="center">
            <InputWrap basis="65%" action={() => console.log('maxAction')}>
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
                  onClick={() => handleBorrowMore()}
                />,
              ]}
              />
            </Box>
          </Box>
        </SectionWrap>

        <SectionWrap
          title="Manage Collateral"
          border={{
            color: 'grey',
            style: 'dashed',
            side: 'all',
          }}
        >

          <Box gap="small" fill="horizontal" direction="row" align="center">
            <InputWrap basis="65%" action={() => console.log('maxAction')}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Amount to add/remove" />}
                // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                value={collateralInput || ''}
                onChange={(event:any) => setCollateralInput(cleanValue(event.target.value))}
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

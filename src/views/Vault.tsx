import React, { useContext, useState, useRef, useEffect } from 'react';
import { Box, Button, Collapsible, Menu, ResponsiveContext, Text, TextInput } from 'grommet';

import { useHistory } from 'react-router-dom';
import { cleanValue } from '../utils/displayUtils';

import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';

import AssetSelector from '../components/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { IYieldSeries, IYieldVault } from '../types';
import { borrowingPower } from '../utils/yieldMath';

import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { useActions } from '../hooks/actionHooks';

const Vault = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  /* state from context */
  const { userState: { vaultMap, activeVault }, userActions: { setActiveVault } } = useContext(UserContext);
  const { chainState: { assetMap, seriesMap } } = useContext(ChainContext);

  /* local state */
  const [availableVaults, setAvailableVaults] = useState<IYieldVault[]>();

  const [inputValue, setInputValue] = useState<any>(undefined);
  const [expanded, setExpanded] = useState<any>(undefined);

  const { repay } = useActions();

  /* init effects */
  useEffect(() => {
    setAvailableVaults(Array.from(vaultMap.values())); // add some filtering here
  }, [vaultMap, activeVault]);

  const handleRepay = () => {
    repay(inputValue?.toString(), activeVault);
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
                  { label: <Text size="small"> {x.id} </Text>, onClick: () => setActiveVault(vaultMap.get(x.id)) }
                )) || []
              }
              onSelect={(x:any) => console.log(x)}
            />
          </Box>

          <Box direction="row" justify="between" gap="small">
            <Text size="small"> Maturity date: </Text>
            <Text size="small"> { activeVault?.series?.displayName } </Text>
          </Box>
        </Box>

        <InfoBite label="Vault debt:" value={`${activeVault?.art_} ${activeVault?.base?.symbol}`} />
        <InfoBite label="Debt in USD" value="0.0" />

        <InfoBite label="Collateral posted:" value={`${activeVault?.ink_} ${activeVault?.ilk?.symbol}`} />

      </Box>

      <MainViewWrap>
        <SectionWrap>
          <Box direction="row" justify="between" fill="horizontal">
            <Text size={mobile ? 'small' : 'medium'}> Debt: {activeVault?.art_} {activeVault?.base?.symbol} </Text> <Text size={mobile ? 'small' : 'medium'}> ($0,00 USD) </Text>
          </Box>

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

          <Button
            label={mobile ? <Text size="xsmall"> Borrow more </Text> : <Text>Borrow more & add additional collateral</Text>}
            style={{ border: 0 }}
            onClick={() => routerHistory.push('/borrow', { from: 'vault' })}
            key="tertiary"
          />,
        ]}
        />

      </MainViewWrap>

    </MainViewWrap>
  );
};

export default Vault;

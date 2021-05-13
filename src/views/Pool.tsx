import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, RadioButtonGroup, ResponsiveContext, Text, TextInput } from 'grommet';

import { ethers } from 'ethers';

import { cleanValue } from '../utils/displayUtils';
import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { usePoolActions } from '../hooks/poolActions';
import MaxButton from '../components/MaxButton';

function Pool() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* local state */
  const [poolInput, setPoolInput] = useState<string>();
  const [removeInput, setRemoveInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();

  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxPool, setMaxPool] = useState<string|undefined>();
  const [maxRemove, setMaxRemove] = useState<string|undefined>();

  const [poolError, setPoolError] = useState<string|null>(null);
  const [removeError, setRemoveError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);
  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  const [strategy, setStrategy] = useState<'BUY'|'MINT'>('BUY');

  /* import hook fns */
  const { addLiquidity, removeLiquidity, rollLiquidity } = usePoolActions();

  /* Check max available to pool */
  useEffect(() => {
    activeAccount &&
          (async () => {
            /* Checks asset selection and sets the max available value */
            const max = await selectedBase?.getBalance(activeAccount);
            if (max) setMaxPool(ethers.utils.formatEther(max).toString());
          })();
  }, [activeAccount, poolInput, selectedBase, setMaxPool]);

  /* Check max available to remove/close */
  useEffect(() => {
    activeAccount &&
            (async () => {
              /* Checks asset selection and sets the max available value */
              const max = await selectedBase?.getBalance(activeAccount);
              if (max) setMaxPool(ethers.utils.formatEther(max).toString());
            })();
  }, [activeAccount, removeInput, selectedBase, setMaxRemove]);

  const handleAdd = () => {
    // !lendDisabled &&
    selectedSeries && addLiquidity(poolInput, selectedSeries, strategy);
  };

  const handleRemove = () => {
    // !lendDisabled &&
    selectedSeries && removeLiquidity(removeInput, selectedSeries);
  };

  const handleRoll = () => {
    // !lendDisabled &&
    selectedSeries && rollToSeries && rollLiquidity(rollInput, selectedSeries, rollToSeries);
  };

  return (
    <MainViewWrap>
      <SectionWrap title="1. Asset to Pool" subtitle="Choose an asset and series to pool">
        <Box direction="row" gap="small" fill="horizontal" align="start">
          <InputWrap action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder="Enter Amount"
              value={poolInput || ''}
              onChange={(event:any) => setPoolInput(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setPoolInput(maxPool)}
              disabled={maxPool === '0'}
            />
          </InputWrap>
          <Box basis={mobile ? '50%' : '35%'}>
            <AssetSelector />
          </Box>
        </Box>

      </SectionWrap>

      <SectionWrap title={`2. Select a series ${mobile ? '' : '(maturity date)'} `}>
        <SeriesSelector />
        <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
          {
            selectedSeries?.baseId === selectedBaseId &&
            <InfoBite label="Your pool tokens" value={selectedSeries?.poolTokens_!} />
          }
        </Box>
      </SectionWrap>

      <Box direction="row" justify="between">
        {!mobile && <Text size="small"> Pooling strategy: </Text>}
        <RadioButtonGroup
          name="strategy"
          options={[
            { label: <Text size="small"> Buy & Pool </Text>, value: 'BUY' },
            { label: <Text size="small"> Borrow & Pool </Text>, value: 'BORROW' },
          ]}
          value={strategy}
          onChange={(event:any) => setStrategy(event.target.value)}
          direction="row"
          justify="between"
        />
      </Box>

      <ActionButtonGroup buttonList={[
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Pool ${poolInput || ''} Dai`}</Text>}
          key="primary"
          onClick={() => handleAdd()}
        />,

      ]}
      />

      <SectionWrap
        title="Remove Liquidity:"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box direction="row" gap="small" fill="horizontal" align="start">
          <InputWrap action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder="Enter tokens to remove"
              value={removeInput || ''}
              onChange={(event:any) => setRemoveInput(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setRemoveInput(maxRemove)}
              disabled={maxRemove === '0'}
            />
          </InputWrap>
        </Box>

        <Box gap="small" fill="horizontal" direction="row" align="start">
          <ActionButtonGroup buttonList={[
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
              key="primary"
              onClick={() => handleRemove()}
            />,
          ]}
          />
        </Box>

      </SectionWrap>

      <SectionWrap
        title="Roll Liquidity to:"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box direction="row" gap="small" fill="horizontal">
          <InputWrap action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder="Tokens to remove"
              value={rollInput || ''}
              onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
            />
            <MaxButton
              action={() => setRollInput(maxRemove)}
              disabled={maxRemove === '0'}
            />
          </InputWrap>
        </Box>

        <Box gap="small" fill="horizontal" direction="row">
          <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

          <Box basis="35%">
            <ActionButtonGroup buttonList={[
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                key="primary"
                onClick={() => handleRoll()}
              />,
            ]}
            />
          </Box>
        </Box>
      </SectionWrap>

    </MainViewWrap>
  );
}

export default Pool;

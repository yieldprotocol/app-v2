import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import Loader from 'react-spinners/ScaleLoader';

import ActionButtonGroup from '../components/ActionButtonGroup';
import AssetSelector from '../components/selectors/AssetSelector';
import InfoBite from '../components/InfoBite';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import SeriesPanel from '../components/SeriesPanel';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import { ZERO_BN } from '../utils/constants';
import AprDisplay from '../components/AprDisplay';
import YieldApr from '../components/YieldApr';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  const [lendInput, setLendInput] = useState<string>();
  const [closeInput, setCloseInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();

  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxLend, setMaxLend] = useState<string|undefined>();
  const [maxClose, setMaxClose] = useState<string|undefined>();

  const [lendError, setLendError] = useState<string|null>(null);
  const [closeError, setCloseError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */

  const { lend, closePosition, rollPosition, redeem } = useLendActions();

  /* LOCAL FNS */

  const handleLend = () => {
    !lendDisabled &&
    lend(lendInput, selectedSeries!);
    setLendInput('');
  };
  const handleClosePosition = () => {
    !closeDisabled &&
    closePosition(closeInput, selectedSeries!);
    setCloseInput('');
  };
  const handleRollPosition = () => {
    !rollDisabled &&
    rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
    setRollInput('');
  };
  const handleRedeem = () => {
    redeem(selectedSeries!, undefined);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
    }
  }, [activeAccount, lendInput, selectedBase, setMaxLend]);

  useEffect(() => {
    /* Checks series selection and sets the max close available value */
    const max = selectedSeries?.fyTokenBalance;
    if (max) setMaxClose(ethers.utils.formatEther(max)?.toString());
  }, [closeInput, rollInput, selectedSeries]);

  /* WATCH FOR WARNINGS AND ERRORS */

  useEffect(() => {
    /* lendInput errors */
    if (activeAccount && (lendInput || lendInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxLend && parseFloat(lendInput) > parseFloat(maxLend)) setLendError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(lendInput) < 0) setLendError('Amount should be expressed as a positive value');
      /* 2. next Check */
      else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setLendError(null);
      }
    }
  }, [activeAccount, lendInput, maxLend, setLendError]);

  useEffect(() => {
    /* closeInput errors */
    if (activeAccount && (closeInput || closeInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(closeInput) > parseFloat(maxClose)) setCloseError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */
      else if (closeInput && !selectedSeries) setCloseError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(closeInput) < 0) setCloseError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setCloseError(null);
      }
    }
    /* rollInput errors */
    if (activeAccount && (rollInput || rollInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxClose && parseFloat(rollInput) > parseFloat(maxClose)) setRollError('Amount exceeds available fyToken balance');
      /* 2. Check if there is a selected series */
      else if (rollInput && !selectedSeries) setRollError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(rollInput) < 0) setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [activeAccount, closeInput, rollInput, maxClose, selectedSeries]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    (!activeAccount || !lendInput || !selectedSeries || lendError) ? setLendDisabled(true) : setLendDisabled(false);
  }, [lendInput, activeAccount, lendError, selectedSeries]);

  useEffect(() => {
    (
      !activeAccount ||
      !closeInput ||
      closeError
    ) ? setCloseDisabled(true) : setCloseDisabled(false);
  }, [closeInput, activeAccount, closeError]);

  useEffect(() => {
    (
      !activeAccount ||
      !rollInput ||
      !rollToSeries ||
      rollError
    ) ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError, rollToSeries]);

  return (
    <MainViewWrap>

      <PanelWrap>

        <Box>
          <Text size={stepPosition === 0 ? 'xxlarge' : 'xlarge'} color={stepPosition === 0 ? 'text' : 'text-xweak'}>Choose an asset to lend</Text>
          <Text size={stepPosition === 1 ? 'xxlarge' : 'xlarge'} color={stepPosition === 1 ? 'text' : 'text-xweak'}>Review and transact</Text>
        </Box>

        <Box gap="small">
          <Text weight="bold">Information</Text>
          <Text size="small"> Some information </Text>
        </Box>

      </PanelWrap>

      <CenterPanelWrap>

        <Box gap="large">

          {
          stepPosition === 0 &&
          <Box gap="large">
            <SectionWrap title="Select an asset and amount to lend">
              <Box direction="row" gap="small" fill="horizontal" align="start">
                <Box basis={mobile ? '50%' : '65%'}>
                  <InputWrap action={() => console.log('maxAction')} isError={lendError} disabled={selectedSeries?.seriesIsMature}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Enter amount"
                      value={lendInput || ''}
                      onChange={(event:any) => setLendInput(cleanValue(event.target.value))}
                      disabled={selectedSeries?.seriesIsMature}
                    />
                    <MaxButton
                      action={() => setLendInput(maxLend)}
                      disabled={maxLend === '0' || selectedSeries?.seriesIsMature}
                    />
                  </InputWrap>
                </Box>
                <Box basis={mobile ? '50%' : '35%'}>
                  <AssetSelector />
                </Box>
              </Box>
            </SectionWrap>

            <SectionWrap title="Choose a series to lend to">
              <SeriesSelector />
              <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
                {
                selectedSeries?.baseId === selectedBase?.id &&
                <InfoBite label="FYToken balance (Base value at maturity)" value={selectedSeries?.fyTokenBalance_!} />
              }
              </Box>
            </SectionWrap>
          </Box>
          }

          {
          stepPosition === 1 &&
          <Box gap="large">
            <Box onClick={() => setStepPosition(0)}>
              <Text>Back</Text>
            </Box>
            <SectionWrap title="Review your transaction">
              some transaction info
            </SectionWrap>
          </Box>
          }

        </Box>

        <Box>
          <ActionButtonGroup>
            {
            stepPosition !== 1 &&
            !selectedSeries?.seriesIsMature &&
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> continue to Review </Text>}
              key="ONE"
              onClick={() => setStepPosition(stepPosition + 1)}
            />
            }
            {
            stepPosition === 1 &&
            !selectedSeries?.seriesIsMature &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> {`Supply ${lendInput || ''} ${selectedBase?.symbol || ''}`} </Text>}
                key="primary"
                onClick={() => handleLend()}
                disabled={lendDisabled}
              />
            }
            {selectedSeries?.seriesIsMature &&
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> Redeem </Text>}
              key="primary"
              onClick={() => handleRedeem()}
            />}

          </ActionButtonGroup>
        </Box>

        {/* {
      !selectedSeries?.seriesIsMature &&
      <SectionWrap
        title=" [ Close position ]"
      >
        <Box direction="row" gap="small" fill="horizontal" align="start">

          <Box fill>
            <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!selectedSeries}>
              <TextInput
                plain
                type="number"
                placeholder="fyToken Amount" // {`${selectedBase?.symbol} to reclaim`}
                value={closeInput || ''}
                onChange={(event:any) => setCloseInput(cleanValue(event.target.value))}
                disabled={!selectedSeries}
              />
              <MaxButton
                action={() => setCloseInput(maxClose)}
                disabled={maxClose === '0.0' || !selectedSeries}
              />
            </InputWrap>
          </Box>

        </Box>

        <ActionButtonGroup buttonList={[
          <Button
            secondary
            label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
            key="secondary"
            onClick={() => handleClosePosition()}
            disabled={closeDisabled}
          />,
        ]}
        />
      </SectionWrap>
      } */}

        {/* <SectionWrap
          title="[ Roll Position ]"
        >

          <Box direction="row" gap="small" fill="horizontal" align="start">

            <Box fill>

              <InputWrap action={() => console.log('maxAction')} isError={rollError} disabled={!selectedSeries}>
                <TextInput
                  plain
                  type="number"
                  placeholder="fyToken Amount" // {`${selectedBase?.symbol} to roll`}
                  value={rollInput || ''}
                  onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
                  disabled={!selectedSeries}
                />
                <MaxButton
                  action={() => setRollInput(maxClose)}
                  disabled={maxClose === '0.0' || !selectedSeries}
                />
              </InputWrap>

            </Box>
          </Box>

          <Box gap="small" fill="horizontal" direction="row" align="center">

            <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

            <Box basis="35%">
              <ActionButtonGroup buttonList={[
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                  key="primary"
                  onClick={() => handleRollPosition()}
                  disabled={rollDisabled}
                />,
              ]}
              />
            </Box>
          </Box>
        </SectionWrap> */}
      </CenterPanelWrap>

      <PanelWrap>

        <YieldApr input={lendInput} type="LEND" />

        { selectedSeries?.fyTokenBalance?.gt(ZERO_BN) &&
        <Box gap="small" pad="large">
          <Box pad="xsmall" animation="fadeIn">
            <Text size="xsmall"> Your {selectedBase?.symbol}-based position for the {selectedSeries?.displayName} series: </Text>
            <InfoBite label="FYToken balance (Base value at maturity)" value={selectedSeries?.fyTokenBalance_!} />

            <Text> </Text>
          </Box>
          <Box
            direction="row"
            justify="start"
            // onClick={() => routerHistory.push(`/vault/${x.id}`)}
            animation={{ type: 'fadeIn', delay: 0, duration: 1500 }}
            border
            pad="xsmall"
            round="xsmall"
          >
            <Text size="xsmall"> Close Position </Text>
          </Box>

          <Box
            direction="row"
            justify="start"
            // onClick={() => routerHistory.push(`/vault/${x.id}`)}
            animation={{ type: 'fadeIn', delay: 100, duration: 1500 }}
            border
            pad="xsmall"
            round="xsmall"
          >
            <Text size="xsmall"> Roll Position </Text>
          </Box>
        </Box>}

        {/* { !selectedSeries &&
        <Box gap="small" pad="large">
          { false &&
          <Box pad="xsmall" animation="fadeIn">
            <Text size="xsmall"> You have any open positions yet.</Text>
          </Box>}
          <Box
            direction="row"
            justify="start"
            // onClick={() => routerHistory.push(`/vault/${x.id}`)}
            animation={{ type: 'fadeIn', delay: 100, duration: 1500 }}
            border
            pad="xsmall"
            round="xsmall"
          >
            <Text size="xsmall"> View all positions </Text>
          </Box>
        </Box>} */}

      </PanelWrap>

    </MainViewWrap>
  );
};

export default Lend;

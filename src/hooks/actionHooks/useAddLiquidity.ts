import { useSWRConfig } from 'swr';
import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { calcPoolRatios, calculateSlippage, fyTokenForMint, MAX_256, splitLiquidity } from '@yield-protocol/ui-math';

import { formatUnits } from 'ethers/lib/utils';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ActionCodes, LadleActions, RoutedActions, AddLiquidityType, IVault } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ONE_BN } from '../../utils/constants';

import { useChain } from '../useChain';

import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ETH_BASED_ASSETS } from '../../config/assets';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useAsset from '../useAsset';
import useStrategy from '../useStrategy';

export const useAddLiquidity = () => {
  const { mutate } = useSWRConfig();
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { seriesMap, selectedStrategy } = userState;
  const { updateVaults, updateSeries } = userActions;

  const { data: strategy, key: strategyKey } = useStrategy(selectedStrategy?.address!);

  const series = strategy?.currentSeries;
  if (!series) throw new Error('no series detected in add liq');

  const { address: account } = useAccount();
  if (!account) throw new Error('no account detected in add liq');
  const contracts = useContracts();

  const { data: base, key: baseKey } = useAsset(selectedStrategy?.baseId!);
  if (!base) throw new Error('no base detected in add liq');

  const { sign, transact } = useChain();
  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const { addEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const addLiquidity = async (
    input: string,
    method: AddLiquidityType = AddLiquidityType.BUY,
    matchingVault: IVault | undefined = undefined
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, strategy.id);

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    const matchingVaultId: string | undefined = matchingVault ? matchingVault.id : undefined;
    const cleanInput = cleanValue(input, base.decimals);

    const _input = ethers.utils.parseUnits(cleanInput, base.decimals);
    const inputToShares = series.getShares(_input);

    const [[cachedSharesReserves, cachedFyTokenReserves], totalSupply] = await Promise.all([
      series.poolContract.getCache(),
      series.poolContract.totalSupply(),
    ]);

    const hasZeroRealReserves = cachedFyTokenReserves.eq(totalSupply);
    const cachedRealReserves = cachedFyTokenReserves.sub(totalSupply.sub(ONE_BN));

    const [minRatio, maxRatio_] = calcPoolRatios(cachedSharesReserves, cachedRealReserves, slippageTolerance);
    const maxRatio = hasZeroRealReserves ? MAX_256 : maxRatio_;
    cachedFyTokenReserves.eq(totalSupply) && console.log('EDGE-CASE WARNING: CachedRealReserves are 0.');

    /* if approveMax, check if signature is still required */
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress!)).gte(_input);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(base.proxyId);

    /* Add liquidity by buying */
    const [fyTokenToBuy] = fyTokenForMint(
      cachedSharesReserves,
      cachedRealReserves,
      cachedFyTokenReserves,
      inputToShares,
      getTimeTillMaturity(series.maturity),
      series.ts,
      series.g1,
      series.decimals,
      slippageTolerance,
      series.c,
      series.mu
    );

    /* Add liquidity by borrowing */
    const [sharesToPool, fyTokenToBorrow] = splitLiquidity(
      cachedSharesReserves,
      cachedRealReserves,
      inputToShares,
      true
    ) as [BigNumber, BigNumber];

    const fyTokenToBorrowWithSlippage = hasZeroRealReserves
      ? ethers.constants.Zero
      : BigNumber.from(calculateSlippage(fyTokenToBorrow, slippageTolerance.toString(), true));

    /* convert shares to be pooled (when borrowing and pooling) to base, since we send in base */
    const baseToPool = series.getBase(sharesToPool);

    /* DIAGNOSITCS */
    method === AddLiquidityType.BUY &&
      console.log(
        '\n',
        'method: ',
        method,
        '\n',
        'input: ',
        formatUnits(_input, strategy.decimals),
        '\n',
        'shares reserves: ',
        formatUnits(cachedSharesReserves, strategy.decimals),
        '\n',
        'real: ',
        formatUnits(cachedRealReserves, strategy.decimals),
        '\n',
        'virtual: ',
        formatUnits(cachedFyTokenReserves, strategy.decimals),
        '\n',
        'fyToken to buy: ',
        formatUnits(fyTokenToBuy, strategy.decimals),
        '\n',
        'minRatio',
        formatUnits(minRatio, strategy.decimals),
        '\n',
        'maxRatio',
        formatUnits(maxRatio, strategy.decimals)
      );

    method === AddLiquidityType.BORROW &&
      console.log(
        '\n',
        'method: ',
        method,
        '\n',
        'input: ',
        formatUnits(_input, strategy.decimals),
        '\n',
        'shares reserves: ',
        formatUnits(cachedSharesReserves, strategy.decimals),
        '\n',
        'real: ',
        formatUnits(cachedRealReserves, strategy.decimals),
        '\n',
        'virtual: ',
        formatUnits(cachedFyTokenReserves, strategy.decimals),
        '\n',
        'minRatio',
        formatUnits(minRatio, strategy.decimals),
        '\n',
        'maxRatio',
        formatUnits(maxRatio, strategy.decimals),
        '\n',
        'base to pool',
        formatUnits(baseToPool, strategy.decimals),
        '\n',
        'fyToken to be borrowed',
        formatUnits(fyTokenToBorrowWithSlippage, strategy.decimals),
        '\n',
        'matching vault id',
        matchingVaultId
      );

    /**
     * GET SIGNATURE/APPROVAL DATA
     * */
    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    /* if  Eth base, build the correct add ethCalls */
    const addEthCallData = () => {
      /* BUY send WETH to  poolAddress */
      if (isEthBase && method === AddLiquidityType.BUY) return addEth(_input, series.poolAddress);
      /* BORROW send WETH to both basejoin and poolAddress */
      if (isEthBase && method === AddLiquidityType.BORROW)
        return [...addEth(fyTokenToBorrowWithSlippage, base.joinAddress), ...addEth(baseToPool, series.poolAddress)];
      return []; // sends back an empty array [] if not eth base
    };

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      ...permitCallData,

      /* addETh calldata */

      ...addEthCallData(),

      /**
       * Provide liquidity by BUYING :
       * */

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BUY || isEthBase, // ignore if not BUY and POOL or isETHbase
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account, // NOTE GOTCHA: receiver is _strategyAddress (if it exists) or else account
          account,
          fyTokenToBuy,
          minRatio,
          maxRatio,
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: series.poolContract,
        ignoreIf: method !== AddLiquidityType.BUY, // ignore if not BUY and POOL
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [series.id, base.proxyId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method !== AddLiquidityType.BORROW ? true : !!matchingVaultId, // ignore if not BORROW and POOL
      },

      /* First transfer: sends base asset corresponding to the fyToken portion (with slippage) of the split liquidity to the respective join to mint fyToken directly to the pool */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddress, fyTokenToBorrowWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },
      /* Second transfer: sends the shares portion (converted to base) of the split liquidity directly to the pool */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, baseToPool] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [
          matchingVaultId || BLANK_VAULT,
          series.poolAddress,
          fyTokenToBorrowWithSlippage,
          fyTokenToBorrowWithSlippage,
        ] as LadleActions.Args.POUR,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [strategy.id || account, account, minRatio, maxRatio] as RoutedActions.Args.MINT_POOL_TOKENS,
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },

      /**
       *
       * STRATEGY TOKEN MINTING
       * for all AddLiquidity recipes that use strategy >
       * if strategy address is provided, and is found in the strategyMap, use that address
       *
       * */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.MINT_STRATEGY_TOKENS,
        targetContract: strategy.strategyContract,
        ignoreIf: !strategy,
      },
    ];

    await transact(calls, txCode);

    mutate(strategyKey);
    mutate(baseKey);

    updateSeries([series]);
    updateStrategyHistory([strategy]);
    updateVaults();
  };

  return addLiquidity;
};

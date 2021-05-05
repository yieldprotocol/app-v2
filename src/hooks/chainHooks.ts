import { BigNumber, Contract, ContractInterface, ethers } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { MAX_256 } from '../utils/constants';
import { ICallData, ISignData, ISeriesRoot } from '../types';
import { ERC20__factory, Ladle, Pool, PoolRouter } from '../contracts';
import { POOLROUTER_OPS, VAULT_OPS } from '../utils/operations';

/*  💨 Calculate the accumulative gas limit (IF ALL calls have a gaslimit then set the total, else undefined ) */
const _getCallGas = (calls: ICallData[]) : BigNumber| undefined => {
  const allCallsHaveGas = calls.length && calls.every((_c:ICallData) => _c.overrides && _c.overrides.gasLimit);
  if (allCallsHaveGas) {
    const accumulatedGas = calls.reduce(
      (_t: BigNumber, _c: ICallData) => BigNumber.from(_c.overrides?.gasLimit).add(_t),
      ethers.constants.Zero,
    );
    return accumulatedGas.gt(ethers.constants.Zero) ? accumulatedGas : undefined;
  }
  return undefined;
};

/* Get ETH value from JOIN_ETHER OPCode, else zero -> N.B. other values sent in with other OPS are ignored for now */
const _getCallValue = (calls: ICallData[]) : BigNumber => {
  const joinEtherCall = calls.find((call:any) => (
    call.operation === VAULT_OPS.JOIN_ETHER || call.operation === POOLROUTER_OPS.JOIN_ETHER
  ));

  return joinEtherCall ? BigNumber.from(joinEtherCall?.overrides?.value) : ethers.constants.Zero;
};

/* Generic hook for chain transactions */
export const useChain = () => {
  const { chainState: { account, provider, signer, contractMap } } = useContext(ChainContext);
  const { txActions: { handleTx, handleSign } } = useContext(TxContext);

  /* Generic fn for READ ONLY chain calls (public view fns) */
  const read = async (contract:Contract, calls: ICallData[]) => {
    /* filter out ignored calls */
    const _calls = calls.filter((c:ICallData) => c.ignore);
    try {
      const _contract = contract as any;
      return await Promise.all(_calls.map((_call:ICallData) => {
        if (_call.fnName) {
          _contract[_call.fnName](_call.args);
        }
        throw new Error('Function name required required');
      }));
    } catch (e) {
      toast.error('Check Network Connection');
    }
    return null;
  };

  /**
   * TRANSACTING
   * @param { 'PoolRouter' | 'Ladle' } router
   * @param { string| undefined } vaultId
   * @param { ICallsData[] } calls list of callData as ICallData
   * @param { string } txCode internal transaction code
   */
  const transact = async (
    router: 'PoolRouter' | 'Ladle',
    calls: ICallData[],
    txCode: string,
  ) : Promise<void> => {
    /* Set the router contract instance, ladle by default */
    let _contract: Contract = contractMap.get('Ladle').connect(signer) as Ladle;
    if (router === 'PoolRouter') _contract = contractMap.get('PoolRouter').connect(signer) as PoolRouter;

    /* First, filter out any ignored calls */
    const _calls = calls.filter((call:ICallData) => !call.ignore);
    console.log('Batched calls: ', _calls);

    /* Encode each of the calls OR preEncoded route calls */
    const encodedCalls = _calls.map(
      (call:ICallData) => {
        const { poolContract, id, getBaseAddress, fyTokenAddress } = call.series! as ISeriesRoot;
        const { interface: _interface } = poolContract as Contract;

        /* encode routed calls if required */
        if (call.operation === VAULT_OPS.ROUTE || call.operation === POOLROUTER_OPS.ROUTE) {
          if (call.fnName) {
            const encodedFn = _interface.encodeFunctionData(call.fnName, call.args);
            const extraInfo = (call.operation === VAULT_OPS.ROUTE) ? [id] : [getBaseAddress(), fyTokenAddress];
            return ethers.utils.defaultAbiCoder.encode(call.operation[1], [...extraInfo, encodedFn]);
          }
          throw new Error('Function name required for routing');
        }

        return ethers.utils.defaultAbiCoder.encode(call.operation[1], call.args);
      },
    );

    /* Get the numeric OPCODES */
    const opsList = _calls.map((call:ICallData) => call.operation[0]);

    /* calculate the value sent */
    const batchValue = _getCallValue(_calls);
    console.log('Batch value sent:', batchValue.toString());

    /* calculate the gas required */
    const batchGas = _getCallGas(_calls);
    console.log('Batch gas sent: ', batchGas?.toString());

    /* Finally, send out the transaction */
    return handleTx(
      () => _contract.batch(opsList, encodedCalls, { value: batchValue, gasLimit: BigNumber.from('500000') }),
      txCode,
    );
  };

  /**
   * SIGNING
   * 1. Build the signatures of provided by ISignData[], returns ICallData for multicall.
   * 2. Sends off the approval tx, on completion of all txs, returns an empty array.
   * @param { ISignData[] } requestedSignatures
   * @param { string } txCode
   * @param { boolean } viaPoolRouter DEFAULT: false
   * @returns { Promise<ICallData[]> }
   */
  const sign = async (
    requestedSignatures:ISignData[],
    txCode:string,
    viaPoolRouter: boolean = false,
  ) : Promise<ICallData[]> => {
    /* First, filter out any ignored calls */
    const _requestedSigs = requestedSignatures.filter((_rs:ISignData) => !_rs.ignore);
    const signedList = await Promise.all(
      _requestedSigs.map(async (reqSig: ISignData) => {
        /* check if signing an fyToken, or another erc20 asset */
        const signingFYToken = reqSig.type === 'FYTOKEN_TYPE';

        /* Get the spender, defaults to ladle */
        const getSpender = (spender: 'POOLROUTER'|'LADLE'| string) => {
          const _ladleAddr = contractMap.get('Ladle').address;
          const _poolAddr = contractMap.get('PoolRouter').address;
          if (ethers.utils.isAddress(spender)) {
            return spender;
          }
          if (spender === 'POOLROUTER') return _poolAddr;
          return _ladleAddr;
        };

        /* get an ERC20 contract instance. This is only used in the case of fallback tx (when signing is not available) */
        const tokenContract = ERC20__factory.connect(reqSig.targetAddress, signer);

        /*
          Request the signature if using DaiType permit style
        */
        if (reqSig.type === 'DAI_TYPE') {
          // const ladleAddress = contractMap.get('Ladle').address;
          const { v, r, s, nonce, expiry, allowed } = await handleSign(
            /* We are pass over the generated signFn and sigData to the signatureHandler for tracking/tracing/fallback handling */
            () => signDaiPermit(
              provider,
              reqSig.targetAddress,
              account,
              getSpender(reqSig.spender),
            ),
            () => handleTx(
              () => tokenContract[reqSig.fallbackCall.fn](
                ...reqSig.fallbackCall.args,
                { ...reqSig.fallbackCall.overrides },
              ),
              txCode,
            ),
            reqSig,
            txCode,
          );

          const poolRouterArgs = [
            reqSig.series.getBaseAddress(),
            reqSig.series.fyTokenAddress,
            getSpender(reqSig.spender),
            nonce, expiry, allowed, v, r, s,
          ];
          const ladleArgs = [
            reqSig.targetId,
            true,
            getSpender(reqSig.spender),
            nonce, expiry, allowed, v, r, s,
          ];
          const args = viaPoolRouter ? poolRouterArgs : ladleArgs;
          const operation = viaPoolRouter ? POOLROUTER_OPS.FORWARD_DAI_PERMIT : VAULT_OPS.FORWARD_DAI_PERMIT;

          return {
            operation,
            args,
            ignore: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
            series: reqSig.series,
          };
        }

        /*
          Or else, request the signature using ERC2612 Permit style
          (handleSignature() wraps the sign function for in app tracking and tracing )
        */
        const { v, r, s, value, deadline } = await handleSign(
          () => signERC2612Permit(
            provider,
            reqSig.domain || reqSig.targetAddress, // uses custom domain if provided (eg. USDC needs version 2) else, provided tokenADdr, else use token address
            account,
            getSpender(reqSig.spender),
            MAX_256,
          ),
          () => handleTx(
            () => tokenContract[reqSig.fallbackCall.fn](
              ...reqSig.fallbackCall.args,
              { ...reqSig.fallbackCall.overrides },
            ),
            txCode,
          ),
          reqSig,
          txCode,
        );

        // router.forwardPermit(ilkId, true, ilkJoin.address, amount, deadline, v, r, s)
        const poolRouterArgs = [
          reqSig.series.getBaseAddress(),
          reqSig.series.fyTokenAddress,
          reqSig.targetAddress,
          getSpender(reqSig.spender),
          value,
          deadline, v, r, s,
        ];

        const ladleArgs = [
          reqSig.targetId, // the asset id OR the seriesId (if signing fyToken)
          !signingFYToken, // true or false=fyToken
          getSpender(reqSig.spender),
          value,
          deadline, v, r, s,
        ];

        const args = viaPoolRouter ? poolRouterArgs : ladleArgs;
        const operation = viaPoolRouter ? POOLROUTER_OPS.FORWARD_PERMIT : VAULT_OPS.FORWARD_PERMIT;

        return {
          operation,
          args,
          ignore: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
          series: reqSig.series,
        };
      }),
    );

    /* Returns the processed list of txs required as ICallData[] */
    return signedList;
  };

  return { sign, transact, read };
};

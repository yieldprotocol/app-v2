import { BigNumber, Contract, ContractInterface, ethers } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { MAX_128, MAX_256 } from '../utils/constants';
import { ICallData, ISignData, ISeriesRoot, ISeries } from '../types';
import { ERC20, ERC20__factory, Ladle, Pool, PoolRouter } from '../contracts';
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
  const { chainState: { account, provider, contractMap, chainId } } = useContext(ChainContext);
  const { txActions: { handleTx, handleSign } } = useContext(TxContext);

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
    const signer = account ? provider.getSigner(account) : provider.getSigner(0);
    /* Set the router contract instance, ladle by default */
    let _contract: Contract = contractMap.get('Ladle').connect(signer) as Ladle;
    if (router === 'PoolRouter') _contract = contractMap.get('PoolRouter').connect(signer) as PoolRouter;

    /* First, filter out any ignored calls */
    const _calls = calls.filter((call:ICallData) => !call.ignore);
    console.log('Batch calls: ', _calls);

    /* Encode each of the calls OR preEncoded route calls */
    const encodedCalls = _calls.map(
      (call:ICallData) => {
        const { poolContract, id: seriesId, getBaseAddress, fyTokenAddress } = call.series! as ISeries;
        const { interface: _interface } = poolContract as Contract;
        /* 'pre-encode' routed calls if required */
        if (call.operation === VAULT_OPS.ROUTE || call.operation === POOLROUTER_OPS.ROUTE) {
          if (call.fnName) {
            const encodedFn = _interface.encodeFunctionData(call.fnName, call.args);
            /* add in the extra parameters required for each specific rotuer */
            const extraParams = (call.operation === VAULT_OPS.ROUTE) ? [seriesId] : [getBaseAddress(), fyTokenAddress];
            return ethers.utils.defaultAbiCoder.encode(call.operation[1], [...extraParams, encodedFn]);
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
      () => _contract.batch(opsList, encodedCalls, { value: batchValue, gasLimit: BigNumber.from('750000') }),
      // () => _contract.batch(opsList, encodedCalls, { value: batchValue }),
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
    const signer = account ? provider.getSigner(account) : provider.getSigner(0);

    /* Get the spender if not provided, defaults to ladle */
    const getSpender = (spender: 'POOLROUTER'|'LADLE'| string) => {
      const _ladleAddr = contractMap.get('Ladle').address;
      const _poolAddr = contractMap.get('PoolRouter').address;
      if (ethers.utils.isAddress(spender)) {
        return spender;
      }
      if (spender === 'POOLROUTER') return _poolAddr;
      return _ladleAddr;
    };

    /* First, filter out any ignored calls */
    const _requestedSigs = requestedSignatures.filter((_rs:ISignData) => !_rs.ignore);
    const signedList = await Promise.all(
      _requestedSigs.map(async (reqSig: ISignData) => {
        const _spender = getSpender(reqSig.spender);

        /* get an ERC20 contract instance. This is only used in the case of fallback tx (when signing is not available) */
        const tokenContract = ERC20__factory.connect(reqSig.target.address, signer) as any;

        /*
          Request the signature if using DaiType permit style
        */
        if (reqSig.type === 'DAI_TYPE') {
          // const ladleAddress = contractMap.get('Ladle').address;
          const { v, r, s, nonce, expiry, allowed } = await handleSign(
            /* We are pass over the generated signFn and sigData to the signatureHandler for tracking/tracing/fallback handling */
            () => signDaiPermit(
              provider,
              /* build domain */
              {
                name: reqSig.target.name,
                version: reqSig.target.version,
                chainId,
                verifyingContract: reqSig.target.address,
              },
              account,
              _spender,
            ),
            /* this is the function for if using fallback approvals */
            () => handleTx(() => tokenContract.approve(_spender, MAX_256), txCode, true),
            reqSig,
            txCode,
          );

          const poolRouterArgs = [
            reqSig.series.getBaseAddress(),
            reqSig.series.fyTokenAddress,
            _spender,
            nonce, expiry, allowed, v, r, s,
          ];
          const ladleArgs = [
            reqSig.target.id,
            true,
            _spender,
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
            /* build domain */
            reqSig.domain || { // uses custom domain if provided, else use created Domain
              name: reqSig.target.name,
              version: reqSig.target.version,
              chainId,
              verifyingContract: reqSig.target.address,
            },
            account,
            _spender,
            MAX_256,
          ),
          /* this is the function for if using fallback approvals */
          () => handleTx(() => tokenContract.approve(_spender, MAX_256), txCode, true),
          reqSig,
          txCode,
        );

        // router.forwardPermit(ilkId, true, ilkJoin.address, amount, deadline, v, r, s)
        const poolRouterArgs = [
          reqSig.series.getBaseAddress(),
          reqSig.series.fyTokenAddress,
          reqSig.target.address,
          _spender,
          value,
          deadline, v, r, s,
        ];

        const ladleArgs = [
          reqSig.target.id, // the asset id OR the seriesId (if signing fyToken)
          reqSig.type !== 'FYTOKEN_TYPE', // true or false=fyToken
          _spender,
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
    return signedList.filter((x:ICallData) => !x.ignore);
  };

  return { sign, transact };
};

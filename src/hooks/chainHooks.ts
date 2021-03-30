import { BigNumber, Contract, ethers } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { MAX_256 } from '../utils/constants';

export enum SignType {
  ERC2612 = 'ERC2612_TYPE',
  DAI = 'DAI_TYPE',
  FYTOKEN = 'FYTOKEN_TYPE',
}

export interface ICallData {
  fn: string;
  args: string[];
  ignore: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISigData {
  assetOrSeriesId: string,
  fallbackCall: ICallData; // calldata to process if fallback
  ignore: boolean; // conditional for ignoring

  /* optional Extention/advanced use-case options */
  type?: SignType;
  tokenAddress?: string;
  spender?: string;
  domain?: IDomain;
}

export interface IDaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

export interface IERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
}

export interface IDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/* Generic hook for chain transactions */
export const useChain = () => {
  const { chainState } = useContext(ChainContext);
  const {
    txActions: { handleTx, handleTxRejection },
  } = useContext(TxContext);

  /* Generic fn for READ ONLY chain calls (public view fns) */
  const read = async (contract:Contract, calls: ICallData[]) => {
    /* filter out ignored calls */
    const _calls = calls.filter((c:ICallData) => c.ignore);
    try {
      const _contract = contract as any;
      return await Promise.all(_calls.map((call:ICallData) => _contract[call.fn](call.args)));
    } catch (e) {
      toast.error('Check Network Connection');
    }
    return null;
  };

  /* Generic fn for both simple and batched transactions (state changing fns) */
  const transact = async (
    contract:Contract,
    calls:ICallData[],
    pid:string|null = null,
  ) => {
    /* Filter out any ignored calls */
    const _calls = calls.filter((c:ICallData) => !c.ignore);
    console.log('Calls to be processed', _calls);

    let res;
    try {
      /* Create the contract instance on the fly */
      const _contract = contract.connect(chainState.signer) as any;

      /* Encode each of the calls in the calls list */
      const encodedCalls = _calls.map((call:ICallData) => contract.interface.encodeFunctionData(call.fn, call.args));

      /* Get ETH value from only FIRST in list N.B. other values are ignore for now */
      const _value = _calls[0].overrides?.value;

      /* Calculate the accumalatiive gas limit (IF all calls have a gaslimit set , else null ) */
      const _allCallsHaveGas = _calls.every((_c:ICallData) => _c.overrides && _c.overrides.gasLimit);
      const _gasTotal = _allCallsHaveGas
        ? _calls.reduce((_t: BigNumber, _c: ICallData) => BigNumber.from(_c.overrides?.gasLimit).add(_t),
          ethers.constants.Zero)
        : null;

      /*  if more than one call in list then use batching: */
      if (calls.length > 1) res = await _contract.batch(encodedCalls, true, { value: _value, gasLimit: _gasTotal });
      /* else, if _calls list === 1 simply use direct contract call */
      if (calls.length === 1) res = await _contract[_calls[0].fn](..._calls[0].args, { ..._calls[0].overrides });
      /* ** */
    } catch (e) {
      handleTxRejection(e);
    }
    res && console.log(res);
    res && handleTx(res);
    return res;
  };

  const sign = async (
    reqSigs:ISigData[],
    pid:string|null = null,
  ) : Promise<ICallData[]> => {
    /* filter out any ignored calls */
    const _reqSigs = reqSigs.filter((_rs:ISigData) => !_rs.ignore);

    const signedList = await Promise.all(
      _reqSigs.map(async (reqSig: ISigData) => {
        /* set the token address: used arg address if provided, else use either asset address or fyDai Address (fyDaiType) */
        const tokenAddress = reqSig.type === 'FYTOKEN_TYPE'
          ? reqSig.tokenAddress || chainState.seriesMap.get(reqSig.assetOrSeriesId).fyToken
          : reqSig.tokenAddress || chainState.assetMap.get(reqSig.assetOrSeriesId).address;

        /* Set the spender as the provided spender address or either 'Ladle' or the associated 'Join' */
        const spender = reqSig.type === 'FYTOKEN_TYPE'
          ? reqSig.spender || chainState.contractMap.get('Ladle').address // spender as ladle
          : reqSig.spender || chainState.assetMap.get(reqSig.assetOrSeriesId).joinAddress; // spender as join

        /* Request the signature if using DaiType permit style */
        if (reqSig.type === 'DAI_TYPE') {
          const _sig = await signDaiPermit(
            chainState.provider,
            tokenAddress,
            chainState.account,
            spender,
          );
          const { v, r, s, nonce, expiry, allowed } = _sig;
          // FN > ladle.forwardDaiPermit(daiId, true, ladle.address, nonce, deadline, true, v, r, s)
          return {
            fn: 'forwardDaiPermit',
            args: [reqSig.assetOrSeriesId, true, spender, nonce, expiry, allowed, v, r, s],
            ignore: false,
          };
        }

        /* Or else, request the signature using ERC2612 Permit style  - NB!! take note of the FYTOKEN TYPE CAHNGES */
        const _sig = await signERC2612Permit(
          chainState.provider,
          reqSig.domain || tokenAddress, // uses custom domain if provided (eg. USDC needs version 2) else, use token address
          chainState.account,
          spender,
          MAX_256,
        );
        const { v, r, s, value, deadline } = _sig;
        // FN > ladle.forwardPermit(ilkId, true, ilkJoin.address, amount, deadline, v, r, s)
        return {
          fn: 'forwardPermit',
          args: [
            reqSig.assetOrSeriesId,
            reqSig.type !== 'FYTOKEN_TYPE', // true or false
            spender,
            value, deadline, v, r, s],
          ignore: false,
        };
      }),
    );

    /* handle fallback case */

    /* Returns the processed list of txs required as ICallData[] */
    return signedList;
  };

  return { sign, transact, read };
};

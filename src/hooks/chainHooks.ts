import { BigNumber, Contract, ethers } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { MAX_256 } from '../utils/constants';
import { ICallData, ISigData } from '../types';
import { ERC20__factory } from '../contracts';

/* Generic hook for chain transactions */
export const useChain = () => {
  const { chainState } = useContext(ChainContext);
  const {
    txActions: { handleTx, handleSign },
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
    txCode:string,
  ) : Promise<void> => {
    /* Filter out any ignored calls */
    const _calls = calls.filter((c:ICallData) => !c.ignore);
    console.log('Calls to be processed:', _calls);

    /* Create the contract instance on the fly */
    const _contract = contract.connect(chainState.signer) as any;

    /* Encode each of the calls in the calls list */
    const encodedCalls = _calls.map((call:ICallData) => contract.interface.encodeFunctionData(call.fn, call.args));

    /* Get ETH value from only FIRST in list -> N.B. other values are ignored for now */
    const _value = _calls[0].overrides?.value;

    /* Calculate the accumulative gas limit (IF all calls have a gaslimit set , else null ) */
    const _allCallsHaveGas = _calls.every((_c:ICallData) => _c.overrides && _c.overrides.gasLimit);
    const _gasTotal = _allCallsHaveGas
      ? _calls.reduce((_t: BigNumber, _c: ICallData) => BigNumber.from(_c.overrides?.gasLimit).add(_t),
        ethers.constants.Zero)
      : null;

    /* if more than one call in list then use batching: */
    if (calls.length > 1) {
      handleTx(
        () => _contract.batch(encodedCalls, true, { value: _value, gasLimit: _gasTotal }),
        txCode,
      );
    }
    /* else, if _calls list === 1 simply use direct contract call */
    if (calls.length === 1) {
      handleTx(
        () => _contract[_calls[0].fn](..._calls[0].args, { ..._calls[0].overrides }),
        txCode,
      );
    }
  };

  const sign = async (
    requestedSignatures:ISigData[],
    txCode:string,
  ) : Promise<ICallData[]> => {
    /* filter out any ignored calls */
    const _reqSigs = requestedSignatures.filter((_rs:ISigData) => !_rs.ignore);

    const signedList = await Promise.all(

      _reqSigs.map(async (reqSig: ISigData) => {
        /* Set the token address: used passed address prameter if provided, else use either asset address or fyDai Address (fyDaiType) */
        const tokenAddress = reqSig.tokenAddress ||
          reqSig.type === 'FYTOKEN_TYPE'
          ? chainState.seriesMap.get(reqSig.assetOrSeriesId).fyToken
          : chainState.assetMap.get(reqSig.assetOrSeriesId).address;

        /* get the contract : is only used in the fallback case */
        const tokenContract = ERC20__factory.connect(tokenAddress, chainState.signer);

        /* Set the spender as the provided spender address OR either 'Ladle' or the associated 'Join' */
        const spender = reqSig.spender ||
          reqSig.type === 'FYTOKEN_TYPE'
          ? chainState.contractMap.get('Ladle').address // spender as ladle
          : chainState.assetMap.get(reqSig.assetOrSeriesId).joinAddress; // spender as join

        /* Request the signature if using DaiType permit style  ( handleSignature( fn, fn ) wraps the sign function for in app tracking and tracing ) */
        if (reqSig.type === 'DAI_TYPE') {
          const { v, r, s, nonce, expiry, allowed } = await handleSign(
            /* We are pass over the generated signFn and sigData to the signatureHandler for tracking/tracing/fallback handling */
            () => signDaiPermit(
              chainState.provider,
              reqSig.tokenAddress || tokenAddress,
              chainState.account,
              spender,
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

          // FN we want to call > ladle.forwardDaiPermit(daiId, true, ladle.address, nonce, deadline, true, v, r, s)
          return {
            fn: 'forwardDaiPermit',
            args: [reqSig.assetOrSeriesId, true, spender, nonce, expiry, allowed, v, r, s],
            ignore: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
          };
        }

        /* Or else, request the signature using ERC2612 Permit style - (handleSignature() wraps the sign function for in app tracking and tracing ) */
        const { v, r, s, value, deadline } = await handleSign(
          () => signERC2612Permit(
            chainState.provider,
            reqSig.domain || tokenAddress, // uses custom domain if provided (eg. USDC needs version 2) else, provided tokenADdr, else use token address
            chainState.account,
            spender,
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

        // FN we want to call  > ladle.forwardPermit(ilkId, true, ilkJoin.address, amount, deadline, v, r, s)
        return {
          fn: 'forwardPermit',
          args: [
            reqSig.assetOrSeriesId,
            reqSig.type !== 'FYTOKEN_TYPE', // true or false
            spender,
            value,
            deadline, v, r, s],
          ignore: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
        };
      }),
    );

    /* Returns the processed list of txs required as ICallData[] */
    return signedList;
  };

  return { sign, transact, read };
};

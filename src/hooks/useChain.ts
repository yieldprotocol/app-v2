import { BigNumber, Contract, ethers, PayableOverrides } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

import { ApprovalType, ICallData, ISettingsContext, ISignData, LadleActions } from '../types';
import { MAX_256 } from '../utils/constants'; 
import { DAI_PERMIT_ASSETS, NON_PERMIT_ASSETS } from '../config/assets';

import { ERC20Permit__factory, Ladle } from '../contracts';
import { useApprovalMethod } from './useApprovalMethod';
import { SettingsContext } from '../contexts/SettingsContext';

/* Get ETH value from JOIN_ETHER OPCode, else zero -> N.B. other values sent in with other OPS are ignored for now */
const _getCallValue = (calls: ICallData[]): BigNumber => {
  const joinEtherCall = calls.find((call: any) => call.operation === LadleActions.Fn.JOIN_ETHER);
  return joinEtherCall ? BigNumber.from(joinEtherCall?.overrides?.value) : ethers.constants.Zero;
};

/* Generic hook for chain transactions */
export const useChain = () => {
  const {
    settingsState: { approveMax, forceTransactions, diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: {
      connection: { account, provider, chainId },
      contractMap,
    },
  } = useContext(ChainContext);

  const {
    txActions: { handleTx, handleSign, handleTxWillFail },
  } = useContext(TxContext);

  const approvalMethod = useApprovalMethod();

  /**
   * TRANSACTING
   * @param { ICallsData[] } calls list of callData as ICallData
   * @param { string } txCode internal transaction code
   * 
   * * @returns { Promise<void> }
   */
  const transact = async (calls: ICallData[], txCode: string): Promise<void> => {
    const signer = account ? provider.getSigner(account) : provider.getSigner(0);

    /* Set the router contract instance, ladle by default */
    const _contract: Contract = contractMap.get('Ladle').connect(signer) as Ladle;

    /* First, filter out any ignored calls */
    const _calls = calls.filter((call: ICallData) => !call.ignoreIf);
    console.log('Batch multicalls: ', _calls);

    /* Encode each of the calls OR preEncoded route calls */
    const encodedCalls = _calls.map((call: ICallData) => {
      /* 'pre-encode' routed calls if required */
      if (call.operation === LadleActions.Fn.ROUTE) {
        if (call.fnName && call.targetContract) {
          const encodedFn = (call.targetContract as any).interface.encodeFunctionData(call.fnName, call.args);
          return _contract.interface.encodeFunctionData(LadleActions.Fn.ROUTE, [
            call.targetContract.address,
            encodedFn,
          ]);
        }
        throw new Error('Function name and contract target required for routing');
      }
      return _contract.interface.encodeFunctionData(call.operation as string, call.args);
    });

    /* calculate the value sent */
    const batchValue = _getCallValue(_calls);
    console.log('Batch value sent:', batchValue.toString());

    /* calculate the gas required */
    let gasEst: BigNumber;
    let gasEstFail: boolean = false;
    try {
      gasEst = await _contract.estimateGas.batch(encodedCalls, { value: batchValue } as PayableOverrides);
      console.log('Auto gas estimate:', gasEst.mul(120).div(100).toString());
    } catch (e) {

      gasEst= BigNumber.from(500000);
      console.log('Failed to get gas estimate', e);
      // toast.warning('It appears the transaction will likely fail. Proceed with caution...');
      gasEstFail = true;
    }

    /* handle if the tx if going to fail and transactions aren't forced */
    if (gasEstFail && !forceTransactions) {
      return handleTxWillFail(txCode);
    }

    /* Finally, send out the transaction */
    return handleTx(
      () =>
        _contract.batch(encodedCalls, { value: batchValue, gasLimit: gasEst.mul(120).div(100) } as PayableOverrides),
      txCode
    );
  };

  /**
   * SIGNING
   * 1. Build the signatures of provided by ISignData[], returns ICallData for multicall.
   * 2. Sends off the approval tx, on completion of all txs, returns an empty array.
   * @param { ISignData[] } requestedSignatures
   * @param { string } txCode
   *
   * @returns { Promise<ICallData[]> }
   */
  const sign = async (requestedSignatures: ISignData[], txCode: string): Promise<ICallData[]> => {
    const signer = account ? provider.getSigner(account) : provider.getSigner(0);

    /* Get the spender if not provided, defaults to ladle */
    const getSpender = (spender: 'LADLE' | string) => {
      const _ladleAddr = contractMap.get('Ladle').address;
      if (ethers.utils.isAddress(spender)) {
        return spender;
      }
      return _ladleAddr;
    };

    /* First, filter out any ignored calls */
    const _requestedSigs = requestedSignatures.filter((_rs: ISignData) => !_rs.ignoreIf);

    const signedList = await Promise.all(
      _requestedSigs.map(async (reqSig: ISignData) => {

        const _spender = getSpender(reqSig.spender);
        /* set as MAX if apporve max is selected */
        const _amount = approveMax ? MAX_256 : reqSig.amount?.toString();
        /* get an ERC20 contract instance. This is only used in the case of fallback tx (when signing is not available) */
        const tokenContract = ERC20Permit__factory.connect(reqSig.target.address, signer) as any;

        diagnostics && console.log('Sign: Target',  reqSig.target.symbol);
        diagnostics && console.log('Sign: Spender',  _spender);
        diagnostics && console.log('Sign: Amount',  _amount?.toString());

        /* Request the signature if using DaiType permit style */
        if (DAI_PERMIT_ASSETS.includes( reqSig.target.symbol) && chainId !== 42161) {
          const { v, r, s, nonce, expiry, allowed } = await handleSign(
            /* We are pass over the generated signFn and sigData to the signatureHandler for tracking/tracing/fallback handling */
            () =>
              signDaiPermit(
                provider,
                /* build domain */
                {
                  name: reqSig.target.name,
                  version: reqSig.target.version,
                  chainId,
                  verifyingContract: reqSig.target.address,
                },
                account,
                _spender
              ),
            /* This is the function  to call if using fallback approvals */
            () => handleTx(() => tokenContract.approve(_spender, _amount), txCode, true),
            txCode,
            approvalMethod
          );

          const args = [
            reqSig.target.address,
            _spender,
            nonce,
            expiry,
            allowed, // TODO check use amount if provided, else defaults to MAX.
            v,
            r,
            s,
          ] as LadleActions.Args.FORWARD_DAI_PERMIT;

          return {
            operation: LadleActions.Fn.FORWARD_DAI_PERMIT,
            args,
            ignoreIf: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
          };
        }

        /*
          Or else - if not DAI-BASED, request the signature using ERC2612 Permit style
          (handleSignature() wraps the sign function for in app tracking and tracing )
        */
        const { v, r, s, value, deadline } = await handleSign(
          () =>
            signERC2612Permit(
              provider,
              /* build domain */
              reqSig.domain || {
                // uses custom domain if provided, else use created Domain
                name: reqSig.target.name,
                version: reqSig.target.version,
                chainId,
                verifyingContract: reqSig.target.address,
              },
              account,
              _spender,
              _amount
            ),
          /* this is the function for if using fallback approvals */
          () => handleTx(() => tokenContract.approve(_spender, _amount), txCode, true),
          txCode,
          NON_PERMIT_ASSETS.includes(reqSig.target.symbol) ? ApprovalType.TX : approvalMethod
        );

        const args = [
          reqSig.target.address, // the asset id OR the seriesId (if signing fyToken)
          _spender,
          value,
          deadline,
          v,
          r,
          s,
        ] as LadleActions.Args.FORWARD_PERMIT;

        return {
          operation: LadleActions.Fn.FORWARD_PERMIT,
          args,
          ignoreIf: !(v && r && s), // set ignore flag if signature returned is null (ie. fallbackTx was used)
        };
      })
    );

    /* Returns the processed list of txs required as ICallData[] */
    return signedList.filter((x: ICallData) => !x.ignoreIf);
  };

  return { sign, transact };
};

import { BigNumber, Contract, ContractInterface, ethers } from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { MAX_256 } from '../utils/constants';
import { ICallData, ISignData, ISeriesRoot, IVaultRoot } from '../types';
import { ERC20__factory, Ladle, Pool, PoolRouter } from '../contracts';
import { POOLROUTER_OPS, VAULT_OPS } from '../utils/operations';

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
   *
   * TRANSACTING
   * @param vaultId sfsdfsdf
   * @param calls list of callData as ICallData
   * @param txCode internal transaction code
   *
   */
  const transact = async (
    router: 'PoolRouter' | 'Ladle',
    vaultId: string | undefined,
    calls:ICallData[],
    txCode:string,
  ) : Promise<void> => {
    /* Set the router contract instance, ladle by default */
    let _contract: Contract = contractMap.get('Ladle').connect(signer) as Ladle;
    if (router === 'PoolRouter') _contract = contractMap.get('PoolRouter').connect(signer) as PoolRouter;

    /* First, filter out any ignored calls */
    const _calls = calls.filter((call:ICallData) => !call.ignore);

    /* DEV ONLY: check that vaultID is passed when ladle is used as router */ // TODO remove for prod
    if (router === 'Ladle' && !vaultId) throw Error('Ladle Router requires a vaultId parameter');
    console.log('Calls to be processed', _calls);

    /* Encode each of the calls OR preEncoded route calls */
    const encodedCalls = _calls.map(
      (call:ICallData) => {
        if (
          call.operation === VAULT_OPS.ROUTE ||
          call.operation === POOLROUTER_OPS.ROUTE // TODO check conflict possibility
        ) {
          const { poolContract } = call.series! as ISeriesRoot;
          const { interface: _interface } = poolContract as Contract;
          if (call.fnName) {
            return _interface.encodeFunctionData(call.fnName, call.args);
          }
          throw new Error('Function name required for routing');
        }
        return ethers.utils.defaultAbiCoder.encode(call.operation[1], call.args);
      },
    );

    /* Get the numeric OPCODES */
    const opsList = _calls.map((call:ICallData) => call.operation[0]);
    /* Get the series baseAddresses */
    const baseAddrList : (string|undefined)[] = _calls.map(
      (call:ICallData, index: number) => call.series && call.series.getBaseAddress(),
    );
    /* Get the series fyDaiAddress */
    const fyTokenAddrList : (string|undefined)[] = _calls.map(
      (call:ICallData, index: number) => call.series && call.series.fyTokenAddress,
    );
    /* Get the series fyDaiAddress */ // TODO add logic to not duplicate
    const targetList : number[] = _calls.map(
      (call:ICallData, index: number) => index,
    );

    /* Get ETH value from JOIN_ETHER opCode (LAdle: 10 , PoolRouter: 4 ) , else zero -> N.B. other values are ignored for now */
    const joinEtherCall = _calls.find(
      (call:any) => call.operation === VAULT_OPS.JOIN_ETHER || call.operation === POOLROUTER_OPS.JOIN_ETHER,
    );
    const _value = joinEtherCall?.overrides?.value || ethers.constants.Zero;

    /* Calculate the accumulative gas limit (IF ALL calls have a gaslimit then set the total, else null ) */
    const allCallsHaveGas = _calls.length &&
      _calls.every((_c:ICallData) => _c.overrides && _c.overrides.gasLimit);
    const _gasLimit = allCallsHaveGas
      ? _calls.reduce((_t: BigNumber, _c: ICallData) => BigNumber.from(_c.overrides?.gasLimit).add(_t),
        ethers.constants.Zero)
      : undefined;

    // const joinEthCall = _contract.interface.encodeFunctionData('joinEther', ['0x455448000000']);
    // const pourCall = _contract.interface.encodeFunctionData('pour', [vaultId, account, BigNumber.from('2'), 0]);

    /* Finally, send out the transaction */
    return handleTx(
      // () => _contract.multicall([joinEthCall, pourCall], true, { value: BigNumber.from('2') }),
      (router === 'Ladle') ?
        () => _contract.batch(vaultId, opsList, encodedCalls, { value: _value, gasLimit: BigNumber.from('500000') }) :
        () => _contract.batch(baseAddrList, fyTokenAddrList, targetList, opsList, encodedCalls, { value: _value, gasLimit: BigNumber.from('500000') }),
      txCode,
    );
  };

  /**
   *
   * SIGNING
   *
   * Does two things:
   * 1. Build the signatures of provided by ISignData[], returns ICallData for multicall.
   * 2. Sends off the approval tx, on completion of all txs, returns an empty array.
   *
   *
   * */
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

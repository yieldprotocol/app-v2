import { BigNumber, Contract, ethers } from 'ethers';
import { ASSET_INFO, ETH_BASED_ASSETS, UNKNOWN } from '../../../config/assets';
import markMap from '../../../config/marks';
import { ERC1155__factory, ERC20Permit__factory, ERC20__factory } from '../../../contracts';
import { AssetAddedEvent, SeriesAddedEvent } from '../../../contracts/Cauldron';
import { JoinAddedEvent } from '../../../contracts/ConvexLadleModule';
import { IAssetInfo, IAsset, TokenType } from '../../../types';

export const getAssets = async (
  provider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider,
  contractMap: Map<string, Contract>,
  assets?: IAsset[],
  account?: string
) => {
  const { chainId } = await provider.getNetwork();
  const Cauldron = contractMap.get('Cauldron');
  const Ladle = contractMap.get('Ladle');

  const [assetAddedEvents, joinAddedEvents] = await Promise.all([
    Cauldron.queryFilter('AssetAdded' as ethers.EventFilter),
    Ladle.queryFilter('JoinAdded' as ethers.EventFilter),
  ]);

  /* Create a map from the joinAdded event data or hardcoded join data if available */
  const joinMap = new Map(joinAddedEvents.map((e: JoinAddedEvent) => e.args)); // event values);

  /* Create a array from the assetAdded event data or hardcoded asset data if available */
  const assetsAdded = assetAddedEvents.map((e: AssetAddedEvent) => e.args);

  return assetsAdded.reduce(async (assetMap, x) => {
    const { assetId: id, asset: address } = x;

    /* Get the basic hardcoded token info */
    const assetInfo: IAssetInfo = ASSET_INFO.has(id) ? ASSET_INFO.get(id) : ASSET_INFO.get(UNKNOWN);
    let { name, symbol, decimals, version } = assetInfo;

    /* On first load Checks/Corrects the ERC20 name/symbol/decimals  (if possible ) */
    if (
      assetInfo.tokenType === TokenType.ERC20_ ||
      assetInfo.tokenType === TokenType.ERC20_Permit ||
      assetInfo.tokenType === TokenType.ERC20_DaiPermit
    ) {
      const contract = ERC20__factory.connect(address, provider);
      try {
        [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()]);
      } catch (e) {
        console.log(
          address,
          ': ERC20 contract auto-validation unsuccessfull. Please manually ensure symbol and decimals are correct.'
        );
      }
    }

    /* Checks/Corrects the version for ERC20Permit tokens */
    if (assetInfo.tokenType === TokenType.ERC20_Permit || assetInfo.tokenType === TokenType.ERC20_DaiPermit) {
      const contract = ERC20Permit__factory.connect(address, provider);
      try {
        version = await contract.version();
      } catch (e) {
        console.log(
          address,
          ': contract version auto-validation unsuccessfull. Please manually ensure version is correct.'
        );
      }
    }

    /* check if an unwrapping handler is provided, if so, the token is considered to be a wrapped token */
    const isWrappedToken = !!(assetInfo.unwrapHandlerAddresses && chainId in assetInfo.unwrapHandlerAddresses);
    /* check if a wrapping handler is provided, if so, wrapping is required */
    const wrappingRequired = !!(assetInfo.wrapHandlerAddresses && chainId in assetInfo.wrapHandlerAddresses);

    const proxyId = assetInfo.proxyId || id; // set proxyId  (or as baseId if undefined)

    const seriesAddedEvents = await Cauldron.queryFilter('SeriesAdded' as ethers.EventFilter);

    const isYieldBase = !!seriesAddedEvents.find((e: SeriesAddedEvent) => e.args.baseId === proxyId);

    const newAsset = {
      ...assetInfo,
      id,
      address,
      name,
      symbol,
      decimals,
      version,

      /* Redirect the id/join if required due to using wrapped tokens */
      joinAddress: assetInfo.proxyId ? joinMap.get(assetInfo.proxyId) : joinMap.get(id),

      wrapHandlerAddresses: ASSET_INFO.get(id)?.wrapHandlerAddresses ? ASSET_INFO.get(id)?.wrapHandlerAddresses : null,
      unwrapHandlerAddresses: ASSET_INFO.get(id)?.unwrapHandlerAddresses
        ? ASSET_INFO.get(id)?.unwrapHandlerAddresses
        : null,
      isWrappedToken,
      wrappingRequired,
      proxyId,

      /* default setting of assetInfo fields if required */
      displaySymbol: assetInfo.displaySymbol || symbol,
      showToken: assetInfo.showToken || false,
      digitFormat: assetInfo.digitFormat || 6,

      isYieldBase,
    };

    return { ...(await assetMap), [id]: newAsset as IAsset };
  }, {});
};

/* add on extra/calculated ASSET info and contract instances (no async) */
export const chargeAsset = (provider: ethers.providers.JsonRpcProvider, asset: IAsset) => {
  /* attach either contract, (or contract of the wrappedToken ) */
  let assetContract: Contract;
  let getBalance: (acc: string, asset?: string) => Promise<BigNumber>;
  let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
  let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

  switch (asset.tokenType) {
    case TokenType.ERC20_:
      assetContract = ERC20__factory.connect(asset.address, provider);
      getBalance = async (acc) =>
        ETH_BASED_ASSETS.includes(asset.proxyId) ? provider?.getBalance(acc) : assetContract.balanceOf(acc);
      getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
      break;

    case TokenType.ERC1155_:
      assetContract = ERC1155__factory.connect(asset.address, provider);
      getBalance = async (acc) => assetContract.balanceOf(acc, asset.tokenIdentifier);
      getAllowance = async (acc: string, spender: string) => assetContract.isApprovedForAll(acc, spender);
      setAllowance = async (spender: string) => {
        console.log(spender);
        console.log(asset.address);
        assetContract.setApprovalForAll(spender, true);
      };
      break;

    default:
      // Default is ERC20Permit;
      assetContract = ERC20Permit__factory.connect(asset.address, provider);
      getBalance = async (acc) =>
        ETH_BASED_ASSETS.includes(asset.id) ? provider.getBalance(acc) : assetContract.balanceOf(acc);
      getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
      break;
  }

  return {
    ...asset,
    image: asset.tokenType !== TokenType.ERC1155_ ? markMap.get(asset.displaySymbol) : markMap.get('Notional'),

    assetContract,

    getBalance,
    getAllowance,
    setAllowance,
  };
};

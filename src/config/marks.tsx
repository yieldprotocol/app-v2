import DaiMark from '../components/logos/DaiMark';
import ENSMark from '../components/logos/ENSMark';
import EthMark from '../components/logos/EthMark';
import FRAXMark from '../components/logos/FRAXMark';
import LinkMark from '../components/logos/LinkMark';
import MakerMark from '../components/logos/MakerMark';
import NotionalMark from '../components/logos/NotionalMark';
import StEthMark from '../components/logos/StEthMark';
import TSTMark from '../components/logos/TSTMark';
import UNIMark from '../components/logos/UNIMark';
import USDCMark from '../components/logos/USDCMark';
import USDTMark from '../components/logos/USDTMark';
import WBTCMark from '../components/logos/WBTCMark';
import YFIMark from '../components/logos/YFIMark';
import { ASSET_INFO, yvUSDC } from './assets';

const markMap = new Map([
  ['DAI', <DaiMark key="dai" height={24} width={24} />],
  ['USDC', <USDCMark key="usdc" height={24} width={24} />],
  ['WBTC', <WBTCMark key="wbtc" height={24} width={24} />],
  ['TST', <TSTMark key="tst" height={24} width={24} />],
  ['ETH', <EthMark key="eth" height={24} width={24} />],
  ['USDT', <USDTMark key="usdt" height={24} width={24} />],
  ['LINK', <LinkMark key="link" height={24} width={24} />],
  ['wstETH', <StEthMark key="wsteth" height={24} width={24} />],
  ['stETH', <StEthMark key="steth" height={24} width={24} />],
  ['ENS', <ENSMark key="ens" height={24} width={24} />],
  ['UNI', <UNIMark key="uni" height={24} width={24} />],
  ['yvUSDC', <YFIMark key="yvusdc" color={ASSET_INFO?.get(yvUSDC)!.color} height={24} width={24} />],
  ['MKR', <MakerMark key="mkr" height={24} width={24} />],
  ['Notional', <NotionalMark color={ASSET_INFO?.get(yvUSDC)!.color} key="notional" height={24} width={24} />],
  // ['Cvx3Crv Mock', <TriCRVCVXMark key="cvx3crv" height={24} width={24} />],
  ['FRAX', <FRAXMark key="frax" height={24} width={24} />],
]);

export default markMap;

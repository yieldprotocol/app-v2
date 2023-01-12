import { Box, Text } from 'grommet';
import CRABMark from '../components/logos/CRABMark';
import CVX3CRVMark from '../components/logos/CVX3CRVMark';
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
import YVUSDCMark from '../components/logos/YVUSDCMark';

const markMap = new Map([
  ['DAI', <DaiMark key="dai" />],
  ['USDC', <USDCMark key="usdc" />],
  ['WBTC', <WBTCMark key="wbtc" />],
  ['TST', <TSTMark key="tst" />],
  ['ETH', <EthMark key="eth" />],
  ['USDT', <USDTMark key="usdt" />],
  ['LINK', <LinkMark key="link" />],
  ['wstETH', <StEthMark key="wsteth" />],
  ['stETH', <StEthMark key="steth" />],
  ['ENS', <ENSMark key="ens" />],
  ['UNI', <UNIMark key="uni" />],
  ['yvUSDC', <YVUSDCMark key="yvusdc" />],
  ['MKR', <MakerMark key="mkr" />],
  ['Notional', <NotionalMark />],
  ['Cvx3Crv Mock', <CVX3CRVMark key="cvx3crv mock" />],
  ['cvx3Crv', <CVX3CRVMark key="cvx3crv" />],
  ['FRAX', <FRAXMark key="frax" />],
  // ['Crabv2', <CRABMark key="crab" />],
  ['Crabv2', <Box key="crab"> <Text size='1em'>🦀</Text> </Box>],

]);

export default markMap;

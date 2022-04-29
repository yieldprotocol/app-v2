import { Box } from 'grommet';
import styled from 'styled-components';
import CRVMark from './CRVMark';
import CVXMark from './CVXMark';
import Logo from './Logo';

const Outer = styled(Box)`
  position: relative;
`;

const CRVWrap = styled(Box)`
  position: absolute;
  z-index: 10;
  top: -5px;
  left: -8px;
`;

const TriCRVCVXMark = () => (
  <Outer>
    <Logo image={<CVXMark />} />
    <CRVWrap>
      <Logo image={<CRVMark />} height="16px" width="16px" />
    </CRVWrap>
  </Outer>
);

export default TriCRVCVXMark;

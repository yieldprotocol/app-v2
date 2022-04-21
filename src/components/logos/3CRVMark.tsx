import { Box } from 'grommet';
import styled from 'styled-components';
import CRVMark from './CRVMark';
import CVXMark from './CVXMark';

const Outer = styled(Box)`
  position: relative;
`;

const CVXWrap = styled(Box)`
  position: absolute;
  z-index: 0;
`;

const CRVWrap = styled(Box)`
  position: absolute;
  z-index: 1;
  top: -5px;
  left: 10px;
`;

const TriCRVCVXMark = () => (
  <Outer>
    {/* <CVXWrap> */}
    <CVXMark />
    {/* </CVXWrap> */}
    {/* <CRVWrap>
      <CRVMark height=".75em" width=".75em" />
    </CRVWrap> */}
  </Outer>
);

export default TriCRVCVXMark;

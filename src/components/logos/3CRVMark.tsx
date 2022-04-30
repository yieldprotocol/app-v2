import { Box, Text } from 'grommet';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import CRVMark from './CRVMark';
import CVXMark from './CVXMark';
import Logo from './Logo';

const Outer = styled(Box)`
  position: relative;
  max-width: fit-content;
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: -5px;
  left: -8px;
`;

const TinyNum = styled(Box)`
  position: absolute;
  z-index: 11;
  top: 1px;
  left: 15px;
  font-size: 11px;
  color: black;
`;

const TriCRVCVXMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '16px' : '24px';
  const topStackSize = isDash ? '12px' : '14px';

  return (
    <Outer>
      <Logo image={<CVXMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Outer>
          <Logo image={<CRVMark />} height={topStackSize} width={topStackSize} />
          <Inner>
            <TinyNum>3</TinyNum>
          </Inner>
        </Outer>
      </Inner>
    </Outer>
  );
};

export default TriCRVCVXMark;

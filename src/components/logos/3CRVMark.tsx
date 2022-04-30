import { Box } from 'grommet';
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

const TriCRVCVXMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '16px' : '24px';
  const topStackSize = isDash ? '12px' : '16px';

  return (
    <Outer>
      <Logo image={<CVXMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Logo image={<CRVMark />} height={topStackSize} width={topStackSize} />
      </Inner>
    </Outer>
  );
};

export default TriCRVCVXMark;

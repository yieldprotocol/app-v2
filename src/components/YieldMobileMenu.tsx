import { useContext } from 'react';
import { Box, Header, Layer, ResponsiveContext , Text} from 'grommet';
import { FiX } from 'react-icons/fi';

import YieldMark from './logos/YieldMark';
import Navigation from './Navigation';

interface ILayerProps {
  toggleMenu: () => void;
  callback?: () => void;
}

const YieldMobileMenu = ({ toggleMenu, callback }: ILayerProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return mobile ? (
    <Layer position="right" full="vertical" responsive modal animation="none">
      <Box
        flex
        fill
        style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
        background="background"
      >
        <Box justify="between" fill>
          <Header pad="medium" justify="between">
            <YieldMark
              height="1.5rem"
              colors={['#f79533', '#f37055', '#ef4e7b', '#a166ab', '#5073b8', '#1098ad', '#07b39b', '#6fba82']}
            />
            <Box onClick={() => toggleMenu()} pad="small">
              <Box>
                <FiX size="1.5rem" />
              </Box>
            </Box>
          </Header>
          <Navigation callbackFn={() => toggleMenu()} />
        </Box>
      </Box>

      {/* <Box pad='medium'>
        <Text size="xsmall"> NOTICE:</Text>
        <Text size="xsmall"> We are aware of a few UI issues, in particular related to the December pools. If you are having any difficulties, please check back shortly. </Text>
      </Box> */}
    </Layer>
  ) : null;
};

YieldMobileMenu.defaultProps = { callback: () => null };

export default YieldMobileMenu;

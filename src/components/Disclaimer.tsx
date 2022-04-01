import { Anchor, Box, CheckBox, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const Disclaimer = ({ checked, onChange }: { checked: boolean; onChange: any }) => (
  <SectionWrap>
    <Box pad="small" justify="between" direction="row" gap="small">
      <CheckBox checked={checked} onChange={onChange} />
      <Text size="xsmall">
        By connecting my wallet, I agree to the{' '}
        <Anchor href="https://yieldprotocol.com/terms/" target="_blank">
          Terms of Service
        </Anchor>{' '}
        and the{' '}
        <Anchor href="https://yieldprotocol.com/privacy/" target="_blank">
          Privacy Policy
        </Anchor>
        .
      </Text>
    </Box>
  </SectionWrap>
);

export default Disclaimer;

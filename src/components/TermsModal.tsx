import useAccountPlus from '../hooks/useAccountPlus';
import ModalWrap from './wraps/ModalWrap';
import { Box, Text, Layer, Button, CheckBox, ResponsiveContext } from 'grommet';
import { useState, useEffect } from 'react';

import useUpgradeTokens from '../hooks/actionHooks/useUpgradeTokens';

interface ITermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal = ({ isOpen, onClose }: ITermsModalProps) => {
  const { address: account } = useAccountPlus();

  const { upgradeTokens } = useUpgradeTokens();

  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const closeTermsModal = () => {
    setTermsAccepted(false);
    onClose();
  };

  useEffect(() => {
    upgradeTokens(termsAccepted);
  }, [isOpen, termsAccepted]);

  return (
    <>
      {isOpen && (
        <Layer onEsc={() => closeTermsModal} onClickOutside={() => closeTermsModal}>
          <ResponsiveContext.Consumer>
            {(size) => (
              <Box pad={{ vertical: 'medium', horizontal: size === 'small' ? 'medium' : 'large' }}>
                <Box margin={{ bottom: 'medium' }}>
                  <Text size="xsmall">
                    By signing this Release and clicking "I Agree" on the web interface at https://yieldprotocol.com/
                    and accessing the smart contract to redeem my [existing LP Tokens] for [updated LP Tokens], I and
                    any protocol I represent hereby irrevocably and unconditionally release all claims I and any
                    protocol I represent (or other separate related or affiliated legal entities) ("Releasing Parties")
                    may have against Yield, Inc. and any of its agents, affiliates, officers, employees, or principals
                    ("Released Parties") related to this matter whether such claims are known or unknown at this time
                    and regardless of how such claims arise and the laws governing such claims (which shall include but
                    not be limited to any claims arising out of Yield Protocol's terms of use). This release constitutes
                    an express and voluntary binding waiver and relinquishment to the fullest extent permitted by law.
                    Releasing Parties further agree to indemnify the Released Parties from any and all third-party
                    claims arising or related to this matter, including damages, attorneys' fees, and any other costs
                    related to those claims. If I am acting for or on behalf of a company (or other such separate
                    related or affiliated legal entity), by signing this Release, clicking "I Agree" on the web
                    interface at https://yieldprotocol.com/ or executing the smart contract and accepting the
                    redemption, I confirm that I am duly authorized to enter into this contract on its behalf. I and any
                    Releasing Parties I represent further acknowledge and agree that the Released Parties are not the
                    issuer of the [updated LP Tokens] that I may redeem through the smart contracts accessible at
                    https://yieldprotocol.com/, the Released Parties are not issuing such [updated LP Token] to me, and
                    I have no expectations from or rights with respect to any Released Party with respect to the
                    [updated LP Token]. This agreement and all disputes relating to or arising under this agreement
                    (including the interpretation, validity or enforcement thereof) will be governed by and subject to
                    Yield, Inc.'s Terms of Service, including, but not limited to, the Limitation of Liability, Dispute
                    Resolution by Binding Arbitration, and General provisions within the Terms of Service. To the extent
                    that the terms of this release are inconsistent with any previous agreement and/or Yield, Inc.'s
                    Terms of Service, I accept that these terms take priority and, where necessary, replace the previous
                    terms.
                  </Text>
                </Box>
                <Box margin={{ bottom: 'medium' }}>
                  <CheckBox
                    label="I agree to the terms and conditions"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                </Box>
                <Box direction="row" justify="between">
                  <Button label="Cancel" onClick={closeTermsModal} />
                  <Button label="Accept" onClick={closeTermsModal} disabled={!termsAccepted} />
                </Box>
              </Box>
            )}
          </ResponsiveContext.Consumer>
        </Layer>
      )}
    </>
  );
};

export default TermsModal;

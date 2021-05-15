## Yield app v2 ## 

### Run development environment locally (recommended for now): ###

In a new console: 
1. **clone** the environments-v2 repo:  `git clone https://github.com/yieldprotocol/environments-v2.git`
2. **checkout tagged release** `git checkout RC4`
3. **install** the environment `yarn`
4. **Start a local hardhat chain instance**: `npx hardhat node`
5. optional: **Add your testing account** to the list of accounts to be auto-funded with test tokens:
   
   (edit `externalTestAccounts` array line 32 in file `./environments/development.ts` )

In a new console
1. **Run the dev environment deploy/setup** `npx hardhat run ./environments/development.ts --network localhost` 

Fire up the UI, (this repo): 
1. **install and run** `yarn && yarn start`
2. In the browser, connect metamask to the localhost network, and reset the metamask account (for just in case).

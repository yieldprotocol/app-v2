## Yield app v2 ## 
yarn && yarn start

setup a new metamask network with --
url: https://kcdou8hqih.execute-api.us-east-1.amazonaws.com
chainId: 31337

aws_hardat instance via API:   https://kcdou8hqih.execute-api.us-east-1.amazonaws.com
aws_hardat instance:  34.224.38.26:8545

// manage aws_hardhat
sign in: 
`ssh -i aws_hardhat.pem ubuntu@ec2-34-224-38-26.compute-1.amazonaws.com`
Start a hardhat node: 
`cd hardhat && npx hardhat node --hostname 0.0.0.0`  &
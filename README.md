# Angry Prints

## Installation
Install dependencies
- `npm install`

Create a .env file with the following variables:
- ALCHEMY_API_KEY
- DEV_WALLET_PRIVATE_KEY
- ETHERSCAN_API_KEY

Currently only deployment via Alchemy is supported, for other nodes modifications to `hardhat.config.js` will be required.

## Testing
Test using standard hardhat commands
- `npx hardhat test`

## Deploy
Deploy the token contract if required, the print contract will work with any ERC20 token
- `npx hardhat deploy_token`

Deploy the print contract, pass the address of the ERC20 token to use
- `npx hardhat deploy --token ${TOKEN_ADDRESS}`

Currently only Rinkeby deployment has been tested. Once either contract is deployed a command is printed which can be used to verify the contract on etherscan (currently this has Rinkey hardcoded).

## ERC721 metadata
The metadata files for the print contract have been uploaded to IPFS and hardcoded in the contract. The source for these files can be found in the metadata folder.

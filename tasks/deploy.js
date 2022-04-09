require('@nomiclabs/hardhat-waffle');

task('deploy', 'Deploy the print contract').addParam('token', 'The ERC20 token to use').setAction(async ({ token }) => {
  const PRICE = '100000000000000000000000000';
  const contract = await (await ethers.getContractFactory('Print')).deploy(token, PRICE);

  console.log('Print address:', contract.address);
  console.log(`npx hardhat verify --network rinkeby --contract contracts/Print.sol:Print ${contract.address} ${token} ${PRICE}`);
});

require('@nomiclabs/hardhat-waffle');

task('deploy', 'Deploy the print contract').addParam('token', 'The ERC20 token to use').setAction(async taskArgs => {
  const PRICE = '25000000000000000000000000';
  const contract = await (await ethers.getContractFactory('FeistyPrint')).deploy(taskArgs.token, PRICE);

  console.log('FeistyPrint address:', contract.address);
  console.log(`npx hardhat verify --network rinkeby --contract contracts/FeistyPrint.sol:FeistyPrint ${contract.address} ${taskArgs.token} ${PRICE}`);
});
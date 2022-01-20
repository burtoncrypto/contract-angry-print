require('@nomiclabs/hardhat-waffle');

task('deploy_token', 'Deploy the token contract', async () => {
  const TOTAL_SUPPLY = '100013673040334855403348419272';
  const token = await (await ethers.getContractFactory('Token')).deploy(TOTAL_SUPPLY);

  console.log('Token address:', token.address);
  console.log(`npx hardhat verify --network rinkeby --contract contracts/Token.sol:Token ${token.address} ${TOTAL_SUPPLY}`);
});
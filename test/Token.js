const { expect } = require('chai');

describe('Token contract', function () {
  let Token;
  let tokenContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    Token = await ethers.getContractFactory('Token');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    tokenContract = await Token.deploy(1000);
  });

  describe('Deployment', function () {
    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await tokenContract.balanceOf(owner.address);
      expect(await tokenContract.totalSupply()).to.equal(ownerBalance);
    });

    it ('Should contain the correct name and symbol', async function () {
      expect(await tokenContract.name()).to.equal('Test NFD');
      expect(await tokenContract.symbol()).to.equal('tNFD');
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      await tokenContract.transfer(addr1.address, 50);
      const addr1Balance = await tokenContract.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await tokenContract.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await tokenContract.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it('Should fail if sender doesn\'t have enough tokens', async function () {
      const initialOwnerBalance = await tokenContract.balanceOf(owner.address);

      await expect(
        tokenContract.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');

      expect(await tokenContract.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it('Should update balances after transfers', async function () {
      const initialOwnerBalance = await tokenContract.balanceOf(owner.address);

      await tokenContract.transfer(addr1.address, 100);
      await tokenContract.transfer(addr2.address, 50);

      const finalOwnerBalance = await tokenContract.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

      const addr1Balance = await tokenContract.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await tokenContract.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });
});
const { expect } = require('chai');

const TOKEN_COUNT = 1000;
const PRICE = 25;

describe('Feisty Print contract', function () {
  let Token;
  let FeistyPrint;
  let tokenContract;
  let feistyPrintContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    Token = await ethers.getContractFactory('Token');
    FeistyPrint = await ethers.getContractFactory('FeistyPrint');

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    tokenContract = await Token.deploy(TOKEN_COUNT);
    feistyPrintContract = await FeistyPrint.deploy(tokenContract.address, PRICE);

    await tokenContract.approve(feistyPrintContract.address, PRICE);
  });

  describe('Deployment', function () {
    it ('Should contain the correct name and symbol', async function () {
      expect(await feistyPrintContract.name()).to.equal('Feisty Doge Print');
      expect(await feistyPrintContract.symbol()).to.equal('FDP');
    });

    it ('Should have the correct contract address', async function () {
      expect(await feistyPrintContract.token()).to.equal(tokenContract.address);
    });

    it ('Should have the correct price', async function () {
      expect(await feistyPrintContract.price()).to.equal(PRICE);
    });
  });

  describe('Counter', function() {
    it('Should increment when print is called', async function() {
      expect(await feistyPrintContract.mints()).to.equal(0);
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.mints()).to.equal(1);
    });

    it('Should not decrement when redeem is called', async function() {
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.mints()).to.equal(1);
      await feistyPrintContract['redeem()']();
      expect(await feistyPrintContract.mints()).to.equal(1);
    });
  });

  describe('tokenUri', function () {
    it ('Should default the tokenURI', async function () {
      expect(await feistyPrintContract.tokenURI(0)).to.equal('ipfs://QmNUUqGtwKg4TzVp4cAXE6aeBprxPFcoKNvTFFi58dnZva');
    });

    it ('Should allow owner to update the tokenURI', async function () {
      await feistyPrintContract.setTokenURI('ipfs://test');
      expect(await feistyPrintContract.tokenURI(0)).to.equal('ipfs://test');
    });

    it ('Should prevent another address from updating the tokenURI', async function () {
      expect(
        feistyPrintContract.connect(addr1).setTokenURI('ipfs://test')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('contractUri', function () {
    it ('Should default the contractURI', async function () {
      expect(await feistyPrintContract.contractURI()).to.equal('ipfs://QmR3YWwi8aywM1eHZigH2eLbR3iNvpZpeEQP4VmQhQRsdK');
    });

    it ('Should allow owner to update the contractURI', async function () {
      await feistyPrintContract.setContractURI('ipfs://test');
      expect(await feistyPrintContract.contractURI()).to.equal('ipfs://test');
    });

    it ('Should prevent another address from updating the contractURI', async function () {
      expect(
        feistyPrintContract.connect(addr1).setContractURI('ipfs://test')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Print ()', function () {
    it('Should fail if sender doesn\'t have enough tokens', async function () {
      await expect(
        feistyPrintContract.connect(addr1)['print()']()
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Should fail if sender hasn\'t approved the transaction', async function () {
      await tokenContract.approve(addr1.address, PRICE);
      await tokenContract.transfer(addr1.address, PRICE);
      await expect(
        feistyPrintContract.connect(addr1)['print()']()
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });

    it('Should allow multiple prints', async function () {
      await feistyPrintContract['print()']();
      await tokenContract.approve(feistyPrintContract.address, PRICE);
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(2);
    });

    it('Should transfer ERC721 to the caller', async function () {
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.ownerOf(0)).to.equal(owner.address);
    });

    it('Should increment the minted count', async function () {
      expect(await feistyPrintContract.mints()).to.equal(0);
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.mints()).to.equal(1);
    });

    it('Should lock the ERC20 tokens in the contract', async function () {
      await feistyPrintContract['print()']();
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);
      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(PRICE);
    });
  });

  describe('PrintMultiple (uint256)', function () {
    beforeEach(async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 2);
    });

    it('Should fail if sender doesn\'t have enough tokens', async function () {
      await expect(
        feistyPrintContract.connect(addr1).printMultiple(2)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Should fail if sender hasn\'t approved the transaction', async function () {
      await tokenContract.approve(addr1.address, PRICE * 2);
      await tokenContract.transfer(addr1.address, PRICE * 2);
      await expect(
        feistyPrintContract.connect(addr1).printMultiple(2)
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });

    it('Should allow multiple prints', async function () {
      await feistyPrintContract.printMultiple(2);
      await tokenContract.approve(feistyPrintContract.address, PRICE * 2);
      await feistyPrintContract.printMultiple(2);
      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(4);
    });

    it('Should transfer ERC721 to the caller', async function () {
      await feistyPrintContract.printMultiple(2);
      expect(await feistyPrintContract.ownerOf(0)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(1)).to.equal(owner.address);
    });

    it('Should increment the minted count', async function () {
      expect(await feistyPrintContract.mints()).to.equal(0);
      await feistyPrintContract.printMultiple(2);
      expect(await feistyPrintContract.mints()).to.equal(2);
    });

    it('Should lock the ERC20 tokens in the contract', async function () {
      await feistyPrintContract.printMultiple(2);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (PRICE * 2));
      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(PRICE * 2);
    });

    it('Should limit maximum to 10', async function () {
      expect(feistyPrintContract.printMultiple(11)).to.revertedWith('FeistyPrint: max 10 prints');
    });
  });

  describe('Redeem ()', async function () {
    it('Should prevent redeem if the sender doesn\'t own a print', async function() {
      await expect(
        feistyPrintContract['redeem()']()
      ).to.be.revertedWith('FeistyPrint: sender doesn\'t have enough prints');
    });

    it('Should transfer ERC721 to the burn address', async function () {
      await feistyPrintContract['print()']();
      expect(await feistyPrintContract.ownerOf(0)).to.equal(owner.address);

      await feistyPrintContract['redeem()']();
      expect(
        feistyPrintContract.ownerOf(0)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should transfer ERC20 tokens to the sender', async function() {
      await tokenContract.transfer(addr1.address, PRICE);
      await tokenContract.connect(addr1).approve(feistyPrintContract.address, PRICE);

      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE);
      await feistyPrintContract.connect(addr1)['print()']();
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(0);
      await feistyPrintContract.connect(addr1)['redeem()']();
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE);
    });

    it('Should redeem the most recently minted by default', async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 2);
      await feistyPrintContract['print()']();
      const token1 = (await feistyPrintContract.mints()).toString() - 1;
      await feistyPrintContract['print()']();
      const token2 = (await feistyPrintContract.mints()).toString() - 1;

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(2);
      expect(await feistyPrintContract.ownerOf(token1)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(token2)).to.equal(owner.address);

      await feistyPrintContract['redeem()']();

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(1);
      expect(await feistyPrintContract.ownerOf(token1)).to.equal(owner.address);
      expect(feistyPrintContract.ownerOf(token2)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });
  });

  describe('Redeem (uint256)', async function () {
    it('Should prevent redeem if the sender doesn\'t own the specific token', async function() {
      await expect(
        feistyPrintContract['redeem(uint256)'](1)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should redeem the specified token', async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 2);
      await feistyPrintContract['print()']();
      const token1 = (await feistyPrintContract.mints()).toString() - 1;
      await feistyPrintContract['print()']();
      const token2 = (await feistyPrintContract.mints()).toString() - 1;

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(2);
      expect(await feistyPrintContract.ownerOf(token1)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(token2)).to.equal(owner.address);

      await feistyPrintContract['redeem(uint256)'](token1);

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(1);
      expect(feistyPrintContract.ownerOf(token1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(await feistyPrintContract.ownerOf(token2)).to.equal(owner.address);
    });
  });

  describe('RedeemMultiple ()', async function () {
    beforeEach(async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 2);
    });

    it('Should prevent redeem if the sender doesn\'t own a print', async function() {
      await expect(
        feistyPrintContract.redeemMultiple(2)
      ).to.be.revertedWith('FeistyPrint: sender doesn\'t have enough prints');
    });

    it('Should limit maximum to 10', async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 20);
      await feistyPrintContract.printMultiple(10);
      await feistyPrintContract.printMultiple(10);

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(20);
      expect(feistyPrintContract.redeemMultiple(11)).to.revertedWith('FeistyPrint: max 10 prints');
    });

    it('Should prevent redeem if the sender doesn\'t have enough prints', async function() {
      await feistyPrintContract.printMultiple(2);
      await expect(
        feistyPrintContract.redeemMultiple(3)
      ).to.be.revertedWith('FeistyPrint: sender doesn\'t have enough prints');
    });

    it('Should allow redeem of 10 prints', async function() {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 20);
      await feistyPrintContract.printMultiple(10);
      await feistyPrintContract.printMultiple(10);

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(20);
      feistyPrintContract.redeemMultiple(10);
      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(10);
    });

    it('Should transfer ERC721 to the burn address', async function () {
      await feistyPrintContract.printMultiple(2);
      expect(await feistyPrintContract.ownerOf(0)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(1)).to.equal(owner.address);

      await feistyPrintContract.redeemMultiple(2);
      expect(
        feistyPrintContract.ownerOf(0)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');

      expect(
        feistyPrintContract.ownerOf(1)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should transfer ERC20 tokens to the sender', async function() {
      await tokenContract.transfer(addr1.address, PRICE * 2);
      await tokenContract.connect(addr1).approve(feistyPrintContract.address, PRICE * 2);

      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE * 2);
      await feistyPrintContract.connect(addr1).printMultiple(2);
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(0);
      await feistyPrintContract.connect(addr1).redeemMultiple(2);
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE * 2);
    });

    it('Should redeem the most recently minted by default', async function () {
      await tokenContract.approve(feistyPrintContract.address, PRICE * 4);
      await feistyPrintContract.printMultiple(2);
      const token1 = (await feistyPrintContract.mints()).toString() - 2;
      const token2 = (await feistyPrintContract.mints()).toString() - 1;
      await feistyPrintContract.printMultiple(2);
      const token3 = (await feistyPrintContract.mints()).toString() - 2;
      const token4 = (await feistyPrintContract.mints()).toString() - 1;

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(4);
      expect(await feistyPrintContract.ownerOf(token1)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(token2)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(token3)).to.equal(owner.address);
      expect(await feistyPrintContract.ownerOf(token4)).to.equal(owner.address);

      await feistyPrintContract.redeemMultiple(3);

      expect(await feistyPrintContract.balanceOf(owner.address)).to.equal(1);
      expect(await feistyPrintContract.ownerOf(token1)).to.equal(owner.address);
      expect(feistyPrintContract.ownerOf(token2)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(feistyPrintContract.ownerOf(token3)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(feistyPrintContract.ownerOf(token4)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });
  });

  describe('Changing price', function() {
    it('Should allow the owner to change the price', async function() {
      expect(await feistyPrintContract.price()).to.equal(PRICE);
      await feistyPrintContract.setPrice(50);
      expect(await feistyPrintContract.price()).to.equal(50);
    });

    it('Should prevent another address changing the price', async function() {
      expect(await feistyPrintContract.price()).to.equal(PRICE);
      expect(feistyPrintContract.connect(addr1).setPrice(50)).to.be.revertedWith('Ownable: caller is not the owner');
      expect(await feistyPrintContract.price()).to.equal(PRICE);
    });

    it('Should redeem the original price after changing', async function() {
      await feistyPrintContract['print()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);

      await feistyPrintContract.setPrice(50);
      await feistyPrintContract['redeem()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem the new price of a mint at that price', async function() {
      const newPrice = 50;
      await tokenContract.approve(feistyPrintContract.address, newPrice);
      await feistyPrintContract.setPrice(newPrice);
      await feistyPrintContract['print()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(newPrice);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - newPrice);


      await feistyPrintContract['redeem()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem each at their prices for multiple of different prices', async function() {
      const newPrice = 50;
      await tokenContract.approve(feistyPrintContract.address, newPrice + PRICE);

      const token1 = await feistyPrintContract.mints();
      await feistyPrintContract['print()']();

      await feistyPrintContract.setPrice(newPrice);
      const token2 = await feistyPrintContract.mints();
      await feistyPrintContract['print()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await feistyPrintContract['redeem(uint256)'](token1);

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(newPrice);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - newPrice);

      await feistyPrintContract['redeem(uint256)'](token2);

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem each at their prices for multiple of different prices (opposite order)', async function() {
      const newPrice = 50;
      await tokenContract.approve(feistyPrintContract.address, newPrice + PRICE);

      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);

      const token1 = await feistyPrintContract.mints();
      await feistyPrintContract['print()']();

      await feistyPrintContract.setPrice(newPrice);
      const token2 = await feistyPrintContract.mints();
      await feistyPrintContract['print()']();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await feistyPrintContract['redeem(uint256)'](token2);

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);

      await feistyPrintContract['redeem(uint256)'](token1);

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem multiple with their correct prices', async function () {
      const newPrice = 50;
      await tokenContract.approve(feistyPrintContract.address, newPrice + PRICE);

      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);

      const token1 = await feistyPrintContract.mints();
      await feistyPrintContract.print();

      await feistyPrintContract.setPrice(newPrice);
      const token2 = await feistyPrintContract.mints();
      await feistyPrintContract.print();

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await feistyPrintContract.redeemMultiple(2);

      expect(await tokenContract.balanceOf(feistyPrintContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });
  });
});
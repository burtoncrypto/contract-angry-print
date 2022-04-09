const { expect } = require('chai');

const TOKEN_COUNT = 1000;
const PRICE = 25;

describe('Print contract', function () {
  let Token;
  let Print;
  let tokenContract;
  let printContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    Token = await ethers.getContractFactory('Token');
    Print = await ethers.getContractFactory('Print');

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    tokenContract = await Token.deploy(TOKEN_COUNT);
    printContract = await Print.deploy(tokenContract.address, PRICE);

    await tokenContract.approve(printContract.address, PRICE);
  });

  describe('Deployment', function () {
    it ('Should contain the correct name and symbol', async function () {
      expect(await printContract.name()).to.equal('Angry Doge Print');
      expect(await printContract.symbol()).to.equal('ADP');
    });

    it ('Should have the correct contract address', async function () {
      expect(await printContract.token()).to.equal(tokenContract.address);
    });

    it ('Should have the correct price', async function () {
      expect(await printContract.price()).to.equal(PRICE);
    });
  });

  describe('Counter', function() {
    it('Should increment when print is called', async function() {
      expect(await printContract.mints()).to.equal(0);
      await printContract['print()']();
      expect(await printContract.mints()).to.equal(1);
    });

    it('Should not decrement when redeem is called', async function() {
      await printContract['print()']();
      expect(await printContract.mints()).to.equal(1);
      await printContract['redeem()']();
      expect(await printContract.mints()).to.equal(1);
    });
  });

  describe('tokenUri', function () {
    it ('Should default the tokenURI', async function () {
      expect(await printContract.tokenURI(0)).to.equal('ipfs://QmdUmdwEKFAPyo3TUzne6XqMuULydc258YWjk2MWMh8V55');
    });

    it ('Should allow owner to update the tokenURI', async function () {
      await printContract.setTokenURI('ipfs://test');
      expect(await printContract.tokenURI(0)).to.equal('ipfs://test');
    });

    it ('Should prevent another address from updating the tokenURI', async function () {
      expect(
        printContract.connect(addr1).setTokenURI('ipfs://test')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('contractUri', function () {
    it ('Should default the contractURI', async function () {
      expect(await printContract.contractURI()).to.equal('ipfs://QmbB5tr7j54q6U7gBvpVJsQ1J3w9g4BLAvgN9ui44S7ycZ');
    });

    it ('Should allow owner to update the contractURI', async function () {
      await printContract.setContractURI('ipfs://test');
      expect(await printContract.contractURI()).to.equal('ipfs://test');
    });

    it ('Should prevent another address from updating the contractURI', async function () {
      expect(
        printContract.connect(addr1).setContractURI('ipfs://test')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Print ()', function () {
    it('Should fail if sender doesn\'t have enough tokens', async function () {
      await expect(
        printContract.connect(addr1)['print()']()
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Should fail if sender hasn\'t approved the transaction', async function () {
      await tokenContract.approve(addr1.address, PRICE);
      await tokenContract.transfer(addr1.address, PRICE);
      await expect(
        printContract.connect(addr1)['print()']()
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });

    it('Should allow multiple prints', async function () {
      await printContract['print()']();
      await tokenContract.approve(printContract.address, PRICE);
      await printContract['print()']();
      expect(await printContract.balanceOf(owner.address)).to.equal(2);
    });

    it('Should transfer ERC721 to the caller', async function () {
      await printContract['print()']();
      expect(await printContract.ownerOf(0)).to.equal(owner.address);
    });

    it('Should increment the minted count', async function () {
      expect(await printContract.mints()).to.equal(0);
      await printContract['print()']();
      expect(await printContract.mints()).to.equal(1);
    });

    it('Should lock the ERC20 tokens in the contract', async function () {
      await printContract['print()']();
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);
      expect(await tokenContract.balanceOf(printContract.address)).to.equal(PRICE);
    });

    it('Should emit a Printed event', async function () {
      expect(
        await printContract['print()']()
      ).to.emit(printContract, 'Printed').withArgs(owner.address, 0, PRICE);
    });
  });

  describe('PrintMultiple (uint256)', function () {
    beforeEach(async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
    });

    it('Should fail if sender doesn\'t have enough tokens', async function () {
      await expect(
        printContract.connect(addr1).printMultiple(2)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Should fail if sender hasn\'t approved the transaction', async function () {
      await tokenContract.approve(addr1.address, PRICE * 2);
      await tokenContract.transfer(addr1.address, PRICE * 2);
      await expect(
        printContract.connect(addr1).printMultiple(2)
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });

    it('Should allow multiple prints', async function () {
      await printContract.printMultiple(2);
      await tokenContract.approve(printContract.address, PRICE * 2);
      await printContract.printMultiple(2);
      expect(await printContract.balanceOf(owner.address)).to.equal(4);
    });

    it('Should transfer ERC721 to the caller', async function () {
      await printContract.printMultiple(2);
      expect(await printContract.ownerOf(0)).to.equal(owner.address);
      expect(await printContract.ownerOf(1)).to.equal(owner.address);
    });

    it('Should increment the minted count', async function () {
      expect(await printContract.mints()).to.equal(0);
      await printContract.printMultiple(2);
      expect(await printContract.mints()).to.equal(2);
    });

    it('Should lock the ERC20 tokens in the contract', async function () {
      await printContract.printMultiple(2);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (PRICE * 2));
      expect(await tokenContract.balanceOf(printContract.address)).to.equal(PRICE * 2);
    });

    it('Should limit maximum to 10', async function () {
      expect(printContract.printMultiple(11)).to.revertedWith('Print: max 10 prints');
    });

    it('Should emit a Printed event per print', async function () {
      const result = await printContract.printMultiple(2);

      expect(result).to.emit(printContract, 'Printed').withArgs(owner.address, 0, PRICE);
      expect(result).to.emit(printContract, 'Printed').withArgs(owner.address, 1, PRICE);
    });
  });

  describe('Redeem ()', async function () {
    it('Should prevent redeem if the sender doesn\'t own a print', async function() {
      await expect(
        printContract['redeem()']()
      ).to.be.revertedWith('Print: sender doesn\'t have enough prints');
    });

    it('Should transfer ERC721 to the burn address', async function () {
      await printContract['print()']();
      expect(await printContract.ownerOf(0)).to.equal(owner.address);

      await printContract['redeem()']();
      expect(
        printContract.ownerOf(0)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should transfer ERC20 tokens to the sender', async function() {
      await tokenContract.transfer(addr1.address, PRICE);
      await tokenContract.connect(addr1).approve(printContract.address, PRICE);

      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE);
      await printContract.connect(addr1)['print()']();
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(0);
      await printContract.connect(addr1)['redeem()']();
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE);
    });

    it('Should redeem the most recently minted by default', async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
      await printContract['print()']();
      const token1 = (await printContract.mints()).toString() - 1;
      await printContract['print()']();
      const token2 = (await printContract.mints()).toString() - 1;

      expect(await printContract.balanceOf(owner.address)).to.equal(2);
      expect(await printContract.ownerOf(token1)).to.equal(owner.address);
      expect(await printContract.ownerOf(token2)).to.equal(owner.address);

      await printContract['redeem()']();

      expect(await printContract.balanceOf(owner.address)).to.equal(1);
      expect(await printContract.ownerOf(token1)).to.equal(owner.address);
      expect(printContract.ownerOf(token2)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should emit a Redeemed event', async function () {
      await printContract['print()']();

      expect(
        await printContract['redeem()']()
      ).to.emit(printContract, 'Redeemed').withArgs(owner.address, 0, PRICE);
    });
  });

  describe('Redeem (uint256)', async function () {
    it('Should prevent redeem if the sender doesn\'t own the specific token', async function() {
      await expect(
        printContract['redeem(uint256)'](1)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should redeem the specified token', async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
      await printContract['print()']();
      const token1 = (await printContract.mints()).toString() - 1;
      await printContract['print()']();
      const token2 = (await printContract.mints()).toString() - 1;

      expect(await printContract.balanceOf(owner.address)).to.equal(2);
      expect(await printContract.ownerOf(token1)).to.equal(owner.address);
      expect(await printContract.ownerOf(token2)).to.equal(owner.address);

      await printContract['redeem(uint256)'](token1);

      expect(await printContract.balanceOf(owner.address)).to.equal(1);
      expect(printContract.ownerOf(token1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(await printContract.ownerOf(token2)).to.equal(owner.address);
    });

    it('Should emit a Redeemed event', async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
      await printContract.printMultiple(2);

      expect(
        await printContract['redeem(uint256)'](1)
      ).to.emit(printContract, 'Redeemed').withArgs(owner.address, 1, PRICE);
    });
  });

  describe('RedeemMultiple ()', async function () {
    beforeEach(async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
    });

    it('Should prevent redeem if the sender doesn\'t own a print', async function() {
      await expect(
        printContract.redeemMultiple(2)
      ).to.be.revertedWith('Print: sender doesn\'t have enough prints');
    });

    it('Should limit maximum to 10', async function () {
      await tokenContract.approve(printContract.address, PRICE * 20);
      await printContract.printMultiple(10);
      await printContract.printMultiple(10);

      expect(await printContract.balanceOf(owner.address)).to.equal(20);
      expect(printContract.redeemMultiple(11)).to.revertedWith('Print: max 10 prints');
    });

    it('Should prevent redeem if the sender doesn\'t have enough prints', async function() {
      await printContract.printMultiple(2);
      await expect(
        printContract.redeemMultiple(3)
      ).to.be.revertedWith('Print: sender doesn\'t have enough prints');
    });

    it('Should allow redeem of 10 prints', async function() {
      await tokenContract.approve(printContract.address, PRICE * 20);
      await printContract.printMultiple(10);
      await printContract.printMultiple(10);

      expect(await printContract.balanceOf(owner.address)).to.equal(20);
      printContract.redeemMultiple(10);
      expect(await printContract.balanceOf(owner.address)).to.equal(10);
    });

    it('Should transfer ERC721 to the burn address', async function () {
      await printContract.printMultiple(2);
      expect(await printContract.ownerOf(0)).to.equal(owner.address);
      expect(await printContract.ownerOf(1)).to.equal(owner.address);

      await printContract.redeemMultiple(2);
      expect(
        printContract.ownerOf(0)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');

      expect(
        printContract.ownerOf(1)
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should transfer ERC20 tokens to the sender', async function() {
      await tokenContract.transfer(addr1.address, PRICE * 2);
      await tokenContract.connect(addr1).approve(printContract.address, PRICE * 2);

      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE * 2);
      await printContract.connect(addr1).printMultiple(2);
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(0);
      await printContract.connect(addr1).redeemMultiple(2);
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(PRICE * 2);
    });

    it('Should redeem the most recently minted by default', async function () {
      await tokenContract.approve(printContract.address, PRICE * 4);
      await printContract.printMultiple(2);
      const token1 = (await printContract.mints()).toString() - 2;
      const token2 = (await printContract.mints()).toString() - 1;
      await printContract.printMultiple(2);
      const token3 = (await printContract.mints()).toString() - 2;
      const token4 = (await printContract.mints()).toString() - 1;

      expect(await printContract.balanceOf(owner.address)).to.equal(4);
      expect(await printContract.ownerOf(token1)).to.equal(owner.address);
      expect(await printContract.ownerOf(token2)).to.equal(owner.address);
      expect(await printContract.ownerOf(token3)).to.equal(owner.address);
      expect(await printContract.ownerOf(token4)).to.equal(owner.address);

      await printContract.redeemMultiple(3);

      expect(await printContract.balanceOf(owner.address)).to.equal(1);
      expect(await printContract.ownerOf(token1)).to.equal(owner.address);
      expect(printContract.ownerOf(token2)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(printContract.ownerOf(token3)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      expect(printContract.ownerOf(token4)).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('Should emit a Redeemed event per redeem', async function () {
      await tokenContract.approve(printContract.address, PRICE * 2);
      await printContract.printMultiple(2);

      const result = await printContract.redeemMultiple(2);

      expect(result).to.emit(printContract, 'Redeemed').withArgs(owner.address, 0, PRICE);
      expect(result).to.emit(printContract, 'Redeemed').withArgs(owner.address, 1, PRICE);
    });
  });

  describe('Changing price', function() {
    it('Should allow the owner to change the price', async function() {
      expect(await printContract.price()).to.equal(PRICE);
      await printContract.setPrice(50);
      expect(await printContract.price()).to.equal(50);
    });

    it('Should prevent another address changing the price', async function() {
      expect(await printContract.price()).to.equal(PRICE);
      expect(printContract.connect(addr1).setPrice(50)).to.be.revertedWith('Ownable: caller is not the owner');
      expect(await printContract.price()).to.equal(PRICE);
    });

    it('Should redeem the original price after changing', async function() {
      await printContract['print()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);

      await printContract.setPrice(50);
      await printContract['redeem()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem the new price of a mint at that price', async function() {
      const newPrice = 50;
      await tokenContract.approve(printContract.address, newPrice);
      await printContract.setPrice(newPrice);
      await printContract['print()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(newPrice);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - newPrice);

      await printContract['redeem()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem each at their prices for multiple of different prices', async function() {
      const newPrice = 50;
      await tokenContract.approve(printContract.address, newPrice + PRICE);

      const token1 = await printContract.mints();
      await printContract['print()']();

      await printContract.setPrice(newPrice);
      const token2 = await printContract.mints();
      await printContract['print()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await printContract['redeem(uint256)'](token1);

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(newPrice);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - newPrice);

      await printContract['redeem(uint256)'](token2);

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem each at their prices for multiple of different prices (opposite order)', async function() {
      const newPrice = 50;
      await tokenContract.approve(printContract.address, newPrice + PRICE);

      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);

      const token1 = await printContract.mints();
      await printContract['print()']();

      await printContract.setPrice(newPrice);
      const token2 = await printContract.mints();
      await printContract['print()']();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await printContract['redeem(uint256)'](token2);

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - PRICE);

      await printContract['redeem(uint256)'](token1);

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should redeem multiple with their correct prices', async function () {
      const newPrice = 50;
      await tokenContract.approve(printContract.address, newPrice + PRICE);

      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);

      const token1 = await printContract.mints();
      await printContract.print();

      await printContract.setPrice(newPrice);
      const token2 = await printContract.mints();
      await printContract.print();

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(newPrice + PRICE);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT - (newPrice + PRICE));

      await printContract.redeemMultiple(2);

      expect(await tokenContract.balanceOf(printContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(TOKEN_COUNT);
    });

    it('Should emit a PriceUpdated event', async function () {
      const newPrice = 50;

      expect(
        await printContract.setPrice(newPrice)
      ).to.emit(printContract, 'PriceUpdated').withArgs(PRICE, newPrice);
    });

    it('Should emit an event with the correect prices', async function() {
      const newPrice = 50;
      await tokenContract.approve(printContract.address, newPrice + PRICE);

      const token1 = await printContract.mints();
      await printContract.print();

      await printContract.setPrice(newPrice);
      const token2 = await printContract.mints();
      await printContract.print();

      const result = await printContract.redeemMultiple(2);

      expect(result).to.emit(printContract, 'Redeemed').withArgs(owner.address, token1, PRICE);
      expect(result).to.emit(printContract, 'Redeemed').withArgs(owner.address, token2, newPrice);
    });
  });
});

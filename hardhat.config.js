require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});



/* npx hardhat harvest --whale 0xa29332b560103d52f758b978e0661420a9d40cb5  --token 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 */ 
task("harvest", "Fund accounts by impersonating whales", async (taskArgs, hre) => {
  
  const topupList = [ '0x1Bd3Abb6ef058408734EA01cA81D325039cd7bcA' ];

  const whaleAddr = taskArgs.whale;
  const tokenAddr = taskArgs.token;

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [taskArgs.whale],
  });

  const signer = await ethers.getSigner(taskArgs.whale) // UNI whale 0xa29332b560103d52f758b978e0661420a9d40cb5
  const uniAddr = taskArgs.token; // '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'; 
  // The ERC-20 most simple Contract ABI
  const erc20Abi = ["function transfer(address to, uint amount)","function balanceOf(address) view returns (uint)",];
  const uni = new ethers.Contract(uniAddr, erc20Abi, signer);
  const amount = ethers.utils.parseUnits("1000.0", 18);
  await Promise.all( topupList.map(async (addr) => { 
    await uni.transfer( addr, amount);
    console.log( (await uni.balanceOf(addr)).toString() )
  }))
})
.addParam("whale", "The account's address")
.addParam("token", "The account's address");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: "https://mainnet.infura.io/v3/2af222f674024a0f84b5f0aad0da72a2",
      }
    }
  }
};

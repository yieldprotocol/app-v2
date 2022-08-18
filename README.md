## Yield Protocol App UI

`yarn && yarn type-contracts && yarn build && yarn global add serve && serve -s build`

### Using Tenderly Forks for Testing

1. Go to settings, and click the **_Use Tenderly Fork_** button to activate the tenderly fork testing environment; the app will reload
2. Go to settings, click the **_Fill ETH_** button to get 100 ETH for the test environment
3. Reload the page
4. If you don't see the expected new tenderly fork data (i.e.: you don't see new series, assets, or strategies), reload the page
5. If data still doesn't load: reset the app by going to settings and clicking **_Reset App_**, and try from step 1 above
6. Try any action (i.e.: borrow any asset with ETH as collateral)  
   a. **No user interaction is needed after clicking the submit button**; the UI will show an automatic approval transaction followed by your action (borrow, lend, pool, etc.)

### Dev: Updating Tenderly Fork Environment

1. Update the `TENDERLY_JSON_RPC_URL` environment variable within `.env.local` to point to the relevant fork; you can find the fork rpc url in the Tenderly UI
2. Restart the dev environment to have the new environment variable take effect

export type Operation = [number, string[]];

interface PoolRouter {
  ROUTE: Operation;
  TRANSFER_TO_POOL: Operation;
  FORWARD_PERMIT: Operation;
  FORWARD_DAI_PERMIT: Operation;
  JOIN_ETHER: Operation;
  EXIT_ETHER: Operation;
}

interface LadleRouter {
  BUILD:Operation;
  STIR_TO: Operation;
  STIR_FROM:Operation;
  POUR: Operation;
  SERVE: Operation;
  CLOSE: Operation;
  REPAY: Operation;
  REPAY_VAULT: Operation;
  FORWARD_PERMIT: Operation;
  FORWARD_DAI_PERMIT: Operation;
  JOIN_ETHER: Operation;
  EXIT_ETHER: Operation;
  TRANSFER_TO_POOL: Operation;
  RETRIEVE_FROM_POOL: Operation;
  ROUTE: Operation;
  TRANSFER_TO_FYTOKEN:Operation;
  REDEEM: Operation;
  TESTER: Operation;
}

export const POOLROUTER_OPS: PoolRouter = {
  ROUTE: [0, ['address', 'address', 'bytes6']],
  TRANSFER_TO_POOL: [1, ['address', 'uint128']],
  FORWARD_PERMIT: [2, ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT: [3, ['address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER: [4, ['bytes6']],
  EXIT_ETHER: [5, ['bytes6', 'address']],
};

export const VAULT_OPS: LadleRouter = {
  BUILD: [0, ['bytes6', 'bytes6']],
  STIR_TO: [1, ['still to find out']],
  STIR_FROM: [2, ['still to find out']],
  POUR: [3, ['bytes12', 'address', 'uint128', 'uint128']],
  SERVE: [4, ['address', 'uint128', 'uint128', 'uint128']],
  CLOSE: [5, ['still to find out']],
  REPAY: [6, ['address', 'int128', 'uint128']],
  REPAY_VAULT: [7, ['address', 'int128', 'uint128']],
  FORWARD_PERMIT: [8, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT: [9, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER: [10, ['bytes6']],
  EXIT_ETHER: [11, ['bytes6', 'address']],
  TRANSFER_TO_POOL: [12, ['bool', 'uint128']],
  RETRIEVE_FROM_POOL: [13, ['still to find out']],
  ROUTE: [14, ['bytes']],
  TRANSFER_TO_FYTOKEN: [15, ['still to find out']],
  REDEEM: [16, ['address', 'uint256']],
  TESTER: [17, ['address', 'uint128', 'uint128', 'uint128']],
};

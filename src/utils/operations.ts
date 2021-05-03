/* eslint-disable key-spacing */
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
  TWEAK:Operation;
  GIVE:Operation;
  DESTROY:Operation;
  STIR_TO: Operation;
  STIR_FROM:Operation;
  POUR: Operation;
  SERVE: Operation;
  ROLL:Operation;
  CLOSE: Operation;
  REPAY: Operation;
  REPAY_VAULT: Operation;
  FORWARD_PERMIT: Operation;
  FORWARD_DAI_PERMIT: Operation;
  JOIN_ETHER: Operation;
  EXIT_ETHER: Operation;
  TRANSFER_TO_POOL: Operation;
  ROUTE: Operation;
  TRANSFER_TO_FYTOKEN:Operation;
  REDEEM: Operation;
}

export const POOLROUTER_OPS: PoolRouter = {
  ROUTE:              [0, ['address', 'address', 'bytes']],
  TRANSFER_TO_POOL:   [1, ['address', 'address', 'address', 'uint128']],
  FORWARD_PERMIT:     [2, ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT: [3, ['address', 'address', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER:         [4, ['address', 'address']],
  EXIT_ETHER:         [5, ['address']],
};

export const VAULT_OPS: LadleRouter = {
  BUILD:                [0, ['bytes12', 'bytes6', 'bytes6']],
  TWEAK:                [1, ['bytes12', 'bytes6', 'bytes6']],
  GIVE:                 [2, ['bytes12', 'address']],
  DESTROY:              [3, ['bytes12']],
  STIR_TO:              [4, ['bytes12', 'bytes12', 'uint128', 'uint128']],
  STIR_FROM:            [5, ['bytes12', 'bytes12', 'uint128', 'uint128']],
  POUR:                 [6, ['bytes12', 'address', 'int128', 'int128']],
  SERVE:                [7, ['bytes12', 'address', 'uint128', 'uint128', 'uint128']],
  ROLL:                 [8, ['bytes12', 'bytes6', 'uint128']],
  CLOSE:                [9, ['bytes12', 'address', 'int128', 'int128']],
  REPAY:                [10, ['bytes12', 'address', 'int128', 'uint128']],
  REPAY_VAULT:          [11, ['bytes12', 'address', 'int128', 'uint128']],
  FORWARD_PERMIT:       [12, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT:   [13, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER:           [14, ['bytes6']],
  EXIT_ETHER:           [15, ['bytes6', 'address']],
  TRANSFER_TO_POOL:     [16, ['bytes6', 'bool', 'uint128']],
  ROUTE:                [17, ['bytes6', 'bytes']],
  TRANSFER_TO_FYTOKEN:  [18, ['bytes6', 'uint256']],
  REDEEM:               [19, ['bytes6', 'address', 'uint256']],
};

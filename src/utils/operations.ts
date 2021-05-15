/* eslint-disable key-spacing */
/* eslint-disable no-multi-spaces */
type ILadleRouter = {
  BUILD:                [0, ['bytes12', 'bytes6', 'bytes6']];
  TWEAK:                [1, ['bytes12', 'bytes6', 'bytes6']];
  GIVE:                 [2, ['bytes12', 'address']];
  DESTROY:              [3, ['bytes12']];
  STIR:                 [4, ['bytes12', 'bytes12', 'uint128', 'uint128']];
  POUR:                 [5, ['bytes12', 'address', 'int128', 'int128']];
  SERVE:                [6, ['bytes12', 'address', 'uint128', 'uint128', 'uint128']];
  ROLL:                 [7, ['bytes12', 'bytes6', 'uint128']];
  CLOSE:                [8, ['bytes12', 'address', 'int128', 'int128']];
  REPAY:                [9, ['bytes12', 'address', 'int128', 'uint128']];
  REPAY_VAULT:          [10, ['bytes12', 'address', 'int128', 'uint128']];
  FORWARD_PERMIT:       [11, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']];
  FORWARD_DAI_PERMIT:   [12, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']];
  JOIN_ETHER:           [13, ['bytes6']];
  EXIT_ETHER:           [14, ['bytes6', 'address']];
  TRANSFER_TO_POOL:     [15, ['bytes6', 'bool', 'uint128']];
  ROUTE:                [16, ['bytes6', 'bytes']];
  TRANSFER_TO_FYTOKEN:  [17, ['bytes6', 'uint256']];
  REDEEM:               [18, ['bytes6', 'address', 'uint256']];
};

type IPoolRouter  = {
  ROUTE:              [0, ['address', 'address', 'bytes']];
  TRANSFER_TO_POOL:   [1, ['address', 'address', 'address', 'uint128']];
  FORWARD_PERMIT:     [2, ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']];
  FORWARD_DAI_PERMIT: [3, ['address', 'address', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']];
  JOIN_ETHER:         [4, ['address', 'address']];
  EXIT_ETHER:         [5, ['address']];
};

export const POOLROUTER_OPS: IPoolRouter = {
  ROUTE:              [0, ['address', 'address', 'bytes']],
  TRANSFER_TO_POOL:   [1, ['address', 'address', 'address', 'uint128']],
  FORWARD_PERMIT:     [2, ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT: [3, ['address', 'address', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER:         [4, ['address', 'address']],
  EXIT_ETHER:         [5, ['address']],
};

export const VAULT_OPS: ILadleRouter = {
  BUILD:                [0, ['bytes12', 'bytes6', 'bytes6']],
  TWEAK:                [1, ['bytes12', 'bytes6', 'bytes6']],
  GIVE:                 [2, ['bytes12', 'address']],
  DESTROY:              [3, ['bytes12']],
  STIR:                 [4, ['bytes12', 'bytes12', 'uint128', 'uint128']],
  POUR:                 [5, ['bytes12', 'address', 'int128', 'int128']],
  SERVE:                [6, ['bytes12', 'address', 'uint128', 'uint128', 'uint128']],
  ROLL:                 [7, ['bytes12', 'bytes6', 'uint128']],
  CLOSE:                [8, ['bytes12', 'address', 'int128', 'int128']],
  REPAY:                [9, ['bytes12', 'address', 'int128', 'uint128']],
  REPAY_VAULT:          [10, ['bytes12', 'address', 'int128', 'uint128']],
  FORWARD_PERMIT:       [11, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32']],
  FORWARD_DAI_PERMIT:   [12, ['bytes6', 'bool', 'address', 'uint256', 'uint256', 'bool', 'uint8', 'bytes32', 'bytes32']],
  JOIN_ETHER:           [13, ['bytes6']],
  EXIT_ETHER:           [14, ['bytes6', 'address']],
  TRANSFER_TO_POOL:     [15, ['bytes6', 'bool', 'uint128']],
  ROUTE:                [16, ['bytes6', 'bytes']],
  TRANSFER_TO_FYTOKEN:  [17, ['bytes6', 'uint256']],
  REDEEM:               [18, ['bytes6', 'address', 'uint256']],
};

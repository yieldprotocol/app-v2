/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { Ladle } from "../Ladle";

export class Ladle__factory {
  static connect(address: string, signerOrProvider: Signer | Provider): Ladle {
    return new Contract(address, _abi, signerOrProvider) as Ladle;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "contract ICauldron",
        name: "cauldron_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes6",
        name: "assetId",
        type: "bytes6",
      },
      {
        indexed: true,
        internalType: "address",
        name: "join",
        type: "address",
      },
    ],
    name: "JoinAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "PoolAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        indexed: true,
        internalType: "bytes4",
        name: "newAdminRole",
        type: "bytes4",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "LOCK",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ROOT",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "assetId",
        type: "bytes6",
      },
      {
        internalType: "contract IJoin",
        name: "join",
        type: "address",
      },
    ],
    name: "addJoin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "contract IPool",
        name: "pool",
        type: "address",
      },
    ],
    name: "addPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "calls",
        type: "bytes[]",
      },
      {
        internalType: "bool",
        name: "revertOnFail",
        type: "bool",
      },
    ],
    name: "batch",
    outputs: [
      {
        internalType: "bool[]",
        name: "successes",
        type: "bool[]",
      },
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bytes6",
        name: "ilkId",
        type: "bytes6",
      },
    ],
    name: "build",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "base",
        type: "bool",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "tokenOut",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "max",
        type: "uint128",
      },
    ],
    name: "buyToken",
    outputs: [
      {
        internalType: "uint128",
        name: "tokenIn",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "cauldron",
    outputs: [
      {
        internalType: "contract ICauldron",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "int128",
        name: "ink",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "art",
        type: "int128",
      },
    ],
    name: "close",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "balances",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
    ],
    name: "destroy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "etherId",
        type: "bytes6",
      },
      {
        internalType: "address payable",
        name: "to",
        type: "address",
      },
    ],
    name: "exitEther",
    outputs: [
      {
        internalType: "uint256",
        name: "ethTransferred",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "id",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "asset",
        type: "bool",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "forwardDaiPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "id",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "asset",
        type: "bool",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "forwardPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "give",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4[]",
        name: "roles",
        type: "bytes4[]",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRoles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "etherId",
        type: "bytes6",
      },
    ],
    name: "joinEther",
    outputs: [
      {
        internalType: "uint256",
        name: "ethTransferred",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "",
        type: "bytes6",
      },
    ],
    name: "joins",
    outputs: [
      {
        internalType: "contract IJoin",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
    ],
    name: "lockRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "",
        type: "bytes6",
      },
    ],
    name: "pools",
    outputs: [
      {
        internalType: "contract IPool",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "int128",
        name: "ink",
        type: "int128",
      },
      {
        internalType: "int128",
        name: "art",
        type: "int128",
      },
    ],
    name: "pour",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "balances",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "int128",
        name: "ink",
        type: "int128",
      },
      {
        internalType: "uint128",
        name: "min",
        type: "uint128",
      },
    ],
    name: "repay",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "balances",
        type: "tuple",
      },
      {
        internalType: "uint128",
        name: "art",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "int128",
        name: "ink",
        type: "int128",
      },
      {
        internalType: "uint128",
        name: "max",
        type: "uint128",
      },
    ],
    name: "repayVault",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "balances",
        type: "tuple",
      },
      {
        internalType: "uint128",
        name: "base",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "base",
        type: "bool",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "retrieveToken",
    outputs: [
      {
        internalType: "uint128",
        name: "retrieved",
        type: "uint128",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "int128",
        name: "art",
        type: "int128",
      },
    ],
    name: "roll",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "base",
        type: "bool",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "min",
        type: "uint128",
      },
    ],
    name: "sellToken",
    outputs: [
      {
        internalType: "uint128",
        name: "tokenOut",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "ink",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "base",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "max",
        type: "uint128",
      },
    ],
    name: "serve",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "balances",
        type: "tuple",
      },
      {
        internalType: "uint128",
        name: "art",
        type: "uint128",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "role",
        type: "bytes4",
      },
      {
        internalType: "bytes4",
        name: "adminRole",
        type: "bytes4",
      },
    ],
    name: "setRoleAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint128",
        name: "ink",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "art",
        type: "uint128",
      },
    ],
    name: "settle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "from",
        type: "bytes12",
      },
      {
        internalType: "bytes12",
        name: "to",
        type: "bytes12",
      },
      {
        internalType: "uint128",
        name: "ink",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "art",
        type: "uint128",
      },
    ],
    name: "stir",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint128",
            name: "art",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "ink",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.Balances",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bool",
        name: "base",
        type: "bool",
      },
      {
        internalType: "uint128",
        name: "wad",
        type: "uint128",
      },
    ],
    name: "transferToPool",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes12",
        name: "vaultId",
        type: "bytes12",
      },
      {
        internalType: "bytes6",
        name: "seriesId",
        type: "bytes6",
      },
      {
        internalType: "bytes6",
        name: "ilkId",
        type: "bytes6",
      },
    ],
    name: "tweak",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

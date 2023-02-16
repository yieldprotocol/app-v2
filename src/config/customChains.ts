import { Chain } from '@rainbow-me/rainbowkit'
import { mainnet, arbitrum } from 'wagmi/chains'

export const defaultChains: Chain[] = [
    {
        ...mainnet,
        iconBackground: '#29b6af'
    },
    {
        ...arbitrum,
        iconBackground: '#1F2937'
    }
]


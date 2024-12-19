import { bech32 } from 'bech32';

export function encodeAddress(address: Buffer, network: string): string {
    const words = bech32.toWords(address);
    return bech32.encode(network, words);
}
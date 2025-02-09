import { toOutputScript } from 'bitcoinjs-lib/src/address';
import { Network } from 'bitcoinjs-lib';
import { WITNESS_SCALE_FACTOR } from './consensus.ts';
import * as ecc from 'tiny-secp256k1';

type CoinStatus = {
    isConfirmed: boolean;
    blockHeight?: number;
    blockHash?: string;
    blockTime?: number;
};

export class Coin {
    txid: string; // previous transaction id
    vout: number; // index of the output in the previous transaction
    value: number;
    address: string;
    status: CoinStatus;
    tweak?: string;

    constructor(partial: Partial<Coin>) {
        Object.assign(this, partial);
    }

    static fromJSON(json: string): Coin {
        return new Coin(JSON.parse(json));
    }

    toJSON(): string {
        return JSON.stringify({
            txid: this.txid,
            vout: this.vout,
            value: this.value,
            address: this.address,
            status: this.status,
            tweak: this.tweak,
        });
    }

    toInput(network: Network, spendPubBuffer: Buffer) {
        // ensure x-only, if it's a compressed pubkey
        if (
            spendPubBuffer.length === 33 &&
            (spendPubBuffer[0] === 0x02 || spendPubBuffer[0] === 0x03)
        ) {
            spendPubBuffer = spendPubBuffer.subarray(1, 33);
        }

        if (this.tweak) {
            const tweakBuf = Buffer.from(this.tweak, 'hex');
            const result = ecc.xOnlyPointAddTweak(spendPubBuffer, tweakBuf);
            const { xOnlyPubkey } = result;
            return {
                hash: this.txid,
                index: this.vout,
                witnessUtxo: {
                    // constructing a taproot script by concatenating
                    // OP_1 (0x51), a 32 byte push indicator (0x20) and the x-only pubkey
                    script: Buffer.concat([
                        Buffer.from([0x51, 0x20]),
                        xOnlyPubkey,
                    ]),
                    value: this.value,
                },
                tapInternalKey: spendPubBuffer,
            };
        } else {
            return {
                hash: this.txid,
                index: this.vout,
                witnessUtxo: {
                    script: toOutputScript(this.address, network),
                    value: this.value,
                },
            };
        }
    }

    estimateSpendingSize(): number {
        let total = 0;

        // Outpoint (hash and index) + sequence
        total += 32 + 4 + 4;

        // legacy script size (0x00)
        total += 1;

        // we know our coins is P2WPKH
        let size = 0;

        // varint-items-len
        size += 1;
        // varint-len [signature]
        size += 1 + 73;
        // varint-len [key]
        size += 1 + 33;
        // vsize
        size = ((size + WITNESS_SCALE_FACTOR - 1) / WITNESS_SCALE_FACTOR) | 0;

        total += size;

        return total;
    }

    estimateSpendingFee(feeRate: number): number {
        return this.estimateSpendingSize() * feeRate;
    }
}

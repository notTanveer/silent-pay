#!/usr/bin/env node

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import { Wallet } from '@silent-pay/wallet';
import { WalletDB } from '@silent-pay/level';
import { EsploraClient } from '@silent-pay/esplora';

// Default location for wallet data
const DEFAULT_WALLET_PATH = path.join(os.homedir(), '.silentpay');

const program = new Command();

let wallet: Wallet;
let walletDB: WalletDB;

// Initialize the program
program
  .name('silentpay')
  .description('CLI for managing Bitcoin silent payments')
  .version('0.0.1');

// Ensure wallet directory exists
const ensureWalletDir = (walletPath: string) => {
  if (!fs.existsSync(walletPath)) {
    fs.mkdirSync(walletPath, { recursive: true });
  }
  return walletPath;
};

// Initialize wallet
const initWallet = async (options: { path?: string; network?: string }) => {
  const walletPath = ensureWalletDir(options.path || DEFAULT_WALLET_PATH);

  walletDB = new WalletDB({
    location: walletPath,
  });

  const network = options.network || 'testnet';
  let esploraUrl: string;

  switch (network) {
    case 'main':
      esploraUrl = 'https://blockstream.info/api';
      break;
    case 'testnet':
      esploraUrl = 'https://blockstream.info/testnet/api';
      break;
    case 'regtest':
      esploraUrl = 'http://127.0.0.1:8094/regtest/api';
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  const networkClient = new EsploraClient({
    protocol: esploraUrl.startsWith('https') ? 'https' : 'http',
    host: new URL(esploraUrl).host,
    network,
  });

  wallet = new Wallet({
    db: walletDB,
    networkClient,
  });

  return wallet;
};

// Create wallet command
program
  .command('create')
  .description('Create a new wallet')
  .option('-p, --path <path>', 'Path to store the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        mnemonic: undefined, // This will generate a new random mnemonic
      });
      console.log(chalk.green('Wallet created successfully!'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to create wallet: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to create wallet: Unknown error.'));
      }
    }
  });

// Import wallet command
program
  .command('import')
  .description('Import a wallet using mnemonic')
  .option('-p, --path <path>', 'Path to store the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('-m, --mnemonic <mnemonic>', 'Mnemonic seed phrase')
  .action(async (options) => {
    try {
      if (!options.mnemonic) {
        console.error(chalk.red('Mnemonic is required'));
        return;
      }

      const wallet = await initWallet(options);
      await wallet.init({
        mnemonic: options.mnemonic,
      });
      console.log(chalk.green('Wallet imported successfully!'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to import wallet: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to import wallet: Unknown error.'));
      }
    }
  });

// Open wallet command
program
  .command('open')
  .description('Open an existing wallet')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });
      console.log(chalk.green('Wallet opened successfully!'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to open wallet: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to open wallet: Unknown error.'));
      }
    }
  });

// Get balance command
program
  .command('balance')
  .description('Get wallet balance')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });

      const balance = await wallet.getBalance();
      console.log(
        chalk.green(`Balance: ${balance / 100000000} BTC (${balance} satoshis)`)
      );

      await wallet.close();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to get balance: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to get balance: Unknown error.'));
      }
    }
  });

// Generate receive address command
program
  .command('address')
  .description('Generate a new receive address')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });

      const address = await wallet.deriveReceiveAddress();
      console.log(chalk.green(`Receive address: ${address}`));

      await wallet.close();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to generate address: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to generate address: Unknown error.'));
      }
    }
  });

// Generate silent payment address command
program
  .command('silent-address')
  .description('Generate a silent payment address')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });

      const address = await wallet.generateSilentPaymentAddress();
      console.log(chalk.green(`Silent payment address: ${address}`));

      await wallet.close();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to generate silent address: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to generate silent address: Unknown error.'));
      }
    }
  });

// Send command
program
  .command('send')
  .description('Send bitcoin')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .option('-a, --address <address>', 'Destination address')
  .option('-s, --amount <amount>', 'Amount in BTC')
  .action(async (options) => {
    try {
      if (!options.address || !options.amount) {
        console.error(chalk.red('Address and amount are required'));
        return;
      }

      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });

      // Convert BTC to satoshis
      const amount = Math.round(parseFloat(options.amount) * 100000000);

      // Check if it's a silent payment address
      const isSilentPayment =
        options.address.startsWith('sp1') || options.address.startsWith('tsp1');

      let txid: string;
      if (isSilentPayment) {
        txid = await wallet.sendToSilentAddress(options.address, amount);
      } else {
        txid = await wallet.send(options.address, amount);
      }

      console.log(chalk.green(`Transaction sent successfully! TXID: ${txid}`));

      await wallet.close();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to send: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to send: Unknown error.'));
      }
    }
  });

// Scan command
program
  .command('scan')
  .description('Scan for transactions')
  .option('-p, --path <path>', 'Path to the wallet data')
  .option('-n, --network <network>', 'Bitcoin network (mainnet, testnet, regtest)', 'testnet')
  .option('--password <password>', 'Wallet password')
  .action(async (options) => {
    try {
      const wallet = await initWallet(options);
      await wallet.init({
        password: options.password,
      });

      console.log(chalk.yellow('Scanning for transactions...'));
      await wallet.scan();
      console.log(chalk.green('Scan completed!'));

      await wallet.close();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to scan: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to scan: Unknown error.'));
      }
    }
  });

// Parse arguments
program.parse(process.argv);
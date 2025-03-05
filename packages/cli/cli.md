# Create a new wallet
silentpay create --network testnet

# Import a wallet using mnemonic
silentpay import --mnemonic "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

# Generate a receive address
silentpay address

# Generate a silent payment address
silentpay silent-address

# Check balance
silentpay balance

# Send a payment
silentpay send --address tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx --amount 0.001

# Send to silent payment address
silentpay send --address tsp1q... --amount 0.001

# Scan for transactions
silentpay scan
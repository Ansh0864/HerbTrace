import json
from web3 import Web3
import solcx  # Explicitly import solcx for version setting
from solcx import compile_standard, install_solc, get_installed_solc_versions
import os
import sys

# --- Step 0: Pre-flight Check ---
# Ensure the OpenZeppelin contracts are installed.
# We define paths relative to the script location.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BLOCKCHAIN_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "blockchain"))
NODE_MODULES_PATH = os.path.join(BLOCKCHAIN_DIR, "node_modules")
OPENZEPPELIN_PATH = os.path.join(NODE_MODULES_PATH, "@openzeppelin")

if not os.path.isdir(OPENZEPPELIN_PATH):
    print("Error: The OpenZeppelin contracts directory was not found.")
    print("Please navigate to the 'blockchain' directory and run: npm install @openzeppelin/contracts")
    sys.exit(1)

# --- Step 1: Connect to Ganache ---
ganache_url = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

if not web3.is_connected():
    print("Error: Could not connect to Ganache at http://127.0.0.1:7545")
    sys.exit(1)
print("Connected to Ganache!")

# --- Step 2: Install and Compile the Smart Contract ---
SOLC_VERSION = "0.8.20"

# Check and install solc
if SOLC_VERSION not in [str(v) for v in get_installed_solc_versions()]:
    print(f"Installing Solidity compiler version {SOLC_VERSION}...")
    install_solc(SOLC_VERSION)
else:
    print(f"Solidity compiler version {SOLC_VERSION} is already installed.")

# CRITICAL FIX: Explicitly set the solc version to resolve the path error
solcx.set_solc_version(SOLC_VERSION) 

def compile_contract(file_path):
    with open(file_path, "r") as file:
        contact_source = file.read()

    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "blockchain"))
    node_modules_path = os.path.join(base_path, "node_modules")

    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"AyurTrace.sol": {"content": contact_source}},
            "settings": {
                "optimizer": {"enabled": True, "runs": 200},
                "evmVersion": "paris",  # Ensures compatibility with Ganache
                "outputSelection": {"*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}},
                "remappings": [
                    f"@openzeppelin/={node_modules_path}/@openzeppelin/"
                ]
            },
        },
        allow_paths=[base_path, node_modules_path]
    )
    return compiled_sol

# --- Step 3: Deploy the contract ---
def deploy_contract(compiled_sol):
    # Safely navigate the JSON response from solcx
    contract_info = compiled_sol['contracts']['AyurTrace.sol']['AyurTrace']
    bytecode = contract_info['evm']['bytecode']['object']
    abi = contract_info['abi']
    
    account = web3.eth.accounts[0]
    AyurTraceContract = web3.eth.contract(abi=abi, bytecode=bytecode)
    
    print("Deploying contract...")
    tx_hash = AyurTraceContract.constructor().transact({
        'from': account,
        'gas': 3000000 # Increased gas limit for deployment
    })
    
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = tx_receipt.contractAddress
    
    print(f"Contract deployed at: {contract_address}")
    return contract_address, abi

# --- Step 4: Grant Roles ---
def setup_roles(contract_address, contract_abi):
    contract = web3.eth.contract(address=contract_address, abi=contract_abi)
    admin_account = web3.eth.accounts[0]
    processor_account = web3.eth.accounts[1]

    print(f"Admin Account: {admin_account}")
    print(f"Processor Account: {processor_account}")

    try:
        print("Granting PROCESSOR_ROLE...")
        # Ensure the function name 'addProcessor' matches your AyurTrace.sol exactly
        tx_hash = contract.functions.addProcessor(processor_account).transact({'from': admin_account})
        web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Successfully granted PROCESSOR_ROLE to {processor_account}")
    except Exception as e:
        print(f"An error occurred while granting roles: {e}")

# --- Main execution block ---
if __name__ == "__main__":
    # Ensure this path matches your folder structure exactly
    contract_file_path = os.path.join(BLOCKCHAIN_DIR, "contracts", "AyurTrace.sol")
    
    if not os.path.exists(contract_file_path):
        print(f"Error: Contract file not found at {contract_file_path}")
        sys.exit(1)

    compiled_contract = compile_contract(contract_file_path)
    contract_address, contract_abi = deploy_contract(compiled_contract)

    setup_roles(contract_address, contract_abi)

    # Save details for the backend to use
    with open("contract_details.json", "w") as f:
        json.dump({"address": contract_address, "abi": contract_abi}, f)
    print("Contract details saved to contract_details.json")
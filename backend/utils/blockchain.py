from web3 import Web3
from config import get_settings
import json, os

settings = get_settings()
w3 = Web3(Web3.HTTPProvider(settings.ganache_url))


def get_web3() -> Web3:
    if not w3.is_connected():
        raise ConnectionError("Cannot connect to Ganache. Is it running on port 8545?")
    return w3


def load_abi(contract_name: str) -> list:
    abi_path = os.path.join(
        os.path.dirname(__file__), "abis", f"{contract_name}.json"
    )
    with open(abi_path) as f:
        return json.load(f)["abi"]


def get_question_vault():
    return w3.eth.contract(
        address=settings.question_vault_address,
        abi=load_abi("QuestionVault")
    )


def get_result_certifier():
    return w3.eth.contract(
        address=settings.result_certifier_address,
        abi=load_abi("ResultCertifier")
    )
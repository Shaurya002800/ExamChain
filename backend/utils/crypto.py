import os
import json
import hashlib
import secrets
from typing import List, Tuple
from base64 import b64encode, b64decode
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes


# ── AES-256-GCM ────────────────────────────────────────────────

def generate_aes_key() -> bytes:
    return get_random_bytes(32)


def encrypt_question(plaintext: dict, key: bytes) -> dict:
    plaintext_bytes = json.dumps(plaintext).encode("utf-8")
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext_bytes)
    return {
        "ciphertext": b64encode(ciphertext).decode(),
        "nonce":      b64encode(cipher.nonce).decode(),
        "tag":        b64encode(tag).decode()
    }


def decrypt_question(encrypted: dict, key: bytes) -> dict:
    ciphertext = b64decode(encrypted["ciphertext"])
    nonce      = b64decode(encrypted["nonce"])
    tag        = b64decode(encrypted["tag"])
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    plaintext = cipher.decrypt_and_verify(ciphertext, tag)
    return json.loads(plaintext.decode("utf-8"))


# ── Shamir's Secret Sharing ────────────────────────────────────

PRIME = 2**127 - 1


def _eval_poly(poly: List[int], x: int) -> int:
    result = 0
    for coeff in reversed(poly):
        result = (result * x + coeff) % PRIME
    return result


def split_secret(secret: bytes, n: int = 5, k: int = 3) -> List[Tuple[int, int]]:
    secret_int = int.from_bytes(secret, "big")
    assert secret_int < PRIME
    poly = [secret_int] + [secrets.randbelow(PRIME) for _ in range(k - 1)]
    return [(i, _eval_poly(poly, i)) for i in range(1, n + 1)]


def reconstruct_secret(shares: List[Tuple[int, int]], secret_len: int = 32) -> bytes:
    x_vals = [s[0] for s in shares]
    y_vals = [s[1] for s in shares]
    secret_int = 0
    for i, (xi, yi) in enumerate(zip(x_vals, y_vals)):
        num = den = 1
        for j, xj in enumerate(x_vals):
            if i != j:
                num = (num * (-xj)) % PRIME
                den = (den * (xi - xj)) % PRIME
        secret_int = (secret_int + yi * num * pow(den, PRIME - 2, PRIME)) % PRIME
    return secret_int.to_bytes(secret_len, "big")


def shares_to_json(shares: List[Tuple[int, int]]) -> List[dict]:
    return [{"index": x, "value": str(y)} for x, y in shares]


def shares_from_json(data: List[dict]) -> List[Tuple[int, int]]:
    return [(d["index"], int(d["value"])) for d in data]


# ── Merkle Tree ────────────────────────────────────────────────

def sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def build_merkle_tree(leaves: List[bytes]) -> Tuple[str, List[List[str]]]:
    if not leaves:
        return "0x" + "0" * 64, []
    current = [sha256(leaf) for leaf in leaves]
    if len(current) % 2 == 1:
        current.append(current[-1])
    levels = [[h.hex() for h in current]]
    while len(current) > 1:
        next_level = []
        for i in range(0, len(current), 2):
            left  = current[i]
            right = current[i + 1] if i + 1 < len(current) else current[i]
            next_level.append(sha256(left + right))
        current = next_level
        levels.append([h.hex() for h in current])
    return "0x" + current[0].hex(), levels


def get_merkle_proof(leaves: List[bytes], index: int) -> List[str]:
    current = [sha256(leaf) for leaf in leaves]
    if len(current) % 2 == 1:
        current.append(current[-1])
    proof = []
    idx = index
    while len(current) > 1:
        sibling_idx = idx ^ 1
        if sibling_idx < len(current):
            proof.append("0x" + current[sibling_idx].hex())
        next_level = []
        for i in range(0, len(current), 2):
            left  = current[i]
            right = current[i + 1] if i + 1 < len(current) else current[i]
            next_level.append(sha256(left + right))
        current = next_level
        idx //= 2
    return proof


# ── DID ────────────────────────────────────────────────────────

def generate_did(student_id: str) -> str:
    seed = hashlib.sha256(student_id.encode()).hexdigest()[:32]
    return f"did:examchain:{seed}"


def hash_did(did: str) -> str:
    return "0x" + hashlib.sha256(did.encode()).hexdigest()
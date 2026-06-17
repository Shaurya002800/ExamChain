import base64
import hashlib
import json

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

from config import get_settings


def _master_key() -> bytes:
    settings = get_settings()
    return hashlib.sha256(settings.secret_key.encode()).digest()


def seal_exam_key(aes_key: bytes) -> str:
    cipher = AES.new(_master_key(), AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(aes_key)
    return json.dumps({
        "version": 1,
        "nonce": base64.b64encode(cipher.nonce).decode(),
        "tag": base64.b64encode(tag).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
    }, separators=(",", ":"))


def open_exam_key(sealed_key: str) -> bytes:
    payload = json.loads(sealed_key)
    cipher = AES.new(_master_key(), AES.MODE_GCM, nonce=base64.b64decode(payload["nonce"]))
    return cipher.decrypt_and_verify(
        base64.b64decode(payload["ciphertext"]),
        base64.b64decode(payload["tag"]),
    )


def generate_exam_key() -> bytes:
    return get_random_bytes(32)


def fingerprint_key(aes_key: bytes) -> str:
    return "0x" + hashlib.sha256(aes_key).hexdigest()

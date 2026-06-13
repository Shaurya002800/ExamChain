from fastapi import APIRouter, HTTPException
from utils.blockchain import get_web3, get_question_vault, get_result_certifier
from config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/status")
async def blockchain_status():
    """Check if Ganache is connected."""
    try:
        w3 = get_web3()
        return {
            "connected":    True,
            "network_id":   w3.eth.chain_id,
            "block_number": w3.eth.block_number,
            "accounts":     len(w3.eth.accounts),
            "deployer":     w3.eth.accounts[0],
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


@router.get("/vault/exam/{exam_id_hash}")
async def get_exam_on_chain(exam_id_hash: str):
    """Read exam data directly from QuestionVault contract."""
    try:
        vault    = get_question_vault()
        exam_bytes = bytes.fromhex(exam_id_hash.replace("0x", "").ljust(64, "0"))[:32]
        exam     = vault.functions.getExam(exam_bytes).call()
        q_count  = vault.functions.getQuestionCount(exam_bytes).call()
        released = vault.functions.isReleased(exam_bytes).call()
        return {
            "exam_id_hash":   exam_id_hash,
            "merkle_root":    "0x" + exam[0].hex(),
            "start_time":     exam[1],
            "end_time":       exam[2],
            "creator":        exam[3],
            "exists":         exam[4],
            "released":       released,
            "question_count": q_count,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/result/{exam_id}/{student_did}")
async def get_result_on_chain(exam_id: str, student_did: str):
    """Read result directly from ResultCertifier contract."""
    import hashlib
    try:
        certifier  = get_result_certifier()
        exam_bytes = bytes.fromhex(hashlib.sha256(exam_id.encode()).hexdigest())
        did_bytes  = bytes.fromhex(hashlib.sha256(student_did.encode()).hexdigest())
        result     = certifier.functions.getResult(exam_bytes, did_bytes).call()
        return {
            "exam_id":      exam_id,
            "student_did":  student_did,
            "score":        result[2],
            "total_marks":  result[3],
            "certified_at": result[4],
            "vc_hash":      "0x" + result[5].hex(),
            "flagged":      result[6],
            "exists":       result[7],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions/recent")
async def get_recent_transactions():
    """Get recent blocks and transactions from Ganache."""
    try:
        w3           = get_web3()
        latest_block = w3.eth.block_number
        transactions = []

        for block_num in range(max(0, latest_block - 10), latest_block + 1):
            block = w3.eth.get_block(block_num, full_transactions=True)
            for tx in block.transactions:
                transactions.append({
                    "tx_hash":    tx.hash.hex(),
                    "block":      block_num,
                    "from":       tx["from"],
                    "to":         tx.to,
                    "gas_used":   block.gasUsed,
                    "timestamp":  block.timestamp,
                })

        return {
            "latest_block": latest_block,
            "transactions": transactions[-20:]  # Last 20 txns
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify-credential")
async def verify_credential_on_chain(
    exam_id:     str,
    student_did: str,
    vc_hash:     str
):
    """Public verification — no auth needed."""
    import hashlib
    try:
        certifier  = get_result_certifier()
        exam_bytes = bytes.fromhex(hashlib.sha256(exam_id.encode()).hexdigest())
        did_bytes  = bytes.fromhex(hashlib.sha256(student_did.encode()).hexdigest())
        vc_bytes   = bytes.fromhex(vc_hash.replace("0x", ""))
        verified   = certifier.functions.verifyCredential(
            exam_bytes, did_bytes, vc_bytes
        ).call()
        return {
            "verified":    verified,
            "exam_id":     exam_id,
            "student_did": student_did,
            "vc_hash":     vc_hash,
            "message":     "Credential verified on-chain" if verified else "Credential not found or flagged"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
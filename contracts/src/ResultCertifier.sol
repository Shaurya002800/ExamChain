// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ResultCertifier {

    struct Result {
        bytes32 examId;
        bytes32 studentDID;
        uint256 score;
        uint256 totalMarks;
        uint256 certifiedAt;
        bytes32 vcHash;
        bool    flagged;
        bool    exists;
    }

    mapping(bytes32 => mapping(bytes32 => Result)) public results;
    mapping(bytes32 => bytes32[]) public examStudents;

    event ResultCertified(
        bytes32 indexed examId,
        bytes32 indexed studentDID,
        uint256 score,
        bytes32 vcHash,
        uint256 timestamp
    );
    event AuditLog(string action, bytes32 indexed examId, bytes32 indexed studentDID, uint256 timestamp);

    function certifyResult(
        bytes32 examId,
        bytes32 studentDID,
        uint256 score,
        uint256 totalMarks,
        bytes32 vcHash,
        bool    flagged
    ) external {
        require(!results[studentDID][examId].exists, "Result already certified");

        results[studentDID][examId] = Result({
            examId:      examId,
            studentDID:  studentDID,
            score:       score,
            totalMarks:  totalMarks,
            certifiedAt: block.timestamp,
            vcHash:      vcHash,
            flagged:     flagged,
            exists:      true
        });

        examStudents[examId].push(studentDID);

        emit ResultCertified(examId, studentDID, score, vcHash, block.timestamp);
        emit AuditLog("RESULT_CERTIFIED", examId, studentDID, block.timestamp);
    }

    function verifyCredential(
        bytes32 examId,
        bytes32 studentDID,
        bytes32 vcHash
    ) external view returns (bool) {
        Result memory r = results[studentDID][examId];
        return r.exists && r.vcHash == vcHash && !r.flagged;
    }

    function getResult(bytes32 examId, bytes32 studentDID)
        external view returns (Result memory)
    {
        return results[studentDID][examId];
    }

    function getExamStudentCount(bytes32 examId) external view returns (uint256) {
        return examStudents[examId].length;
    }
}
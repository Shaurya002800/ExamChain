// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QuestionVault {

    struct Exam {
        bytes32  merkleRoot;
        uint256  examStartTime;
        uint256  examEndTime;
        address  creator;
        bool     exists;
        bool     released;
    }

    mapping(bytes32 => Exam) public exams;
    mapping(bytes32 => string[]) public questionCIDs;

    event ExamCreated(bytes32 indexed examId, uint256 startTime, address creator);
    event PaperReleased(bytes32 indexed examId, uint256 releasedAt);
    event AuditLog(bytes32 indexed examId, string action, address actor, uint256 timestamp);

    function createExam(
        bytes32 examId,
        bytes32 merkleRoot,
        uint256 startTime,
        uint256 endTime,
        string[] calldata encryptedCIDs
    ) external {
        require(!exams[examId].exists, "Exam already exists");
        require(startTime > block.timestamp, "Start time must be in future");
        require(endTime > startTime, "End time must be after start");

        exams[examId] = Exam({
            merkleRoot:    merkleRoot,
            examStartTime: startTime,
            examEndTime:   endTime,
            creator:       msg.sender,
            exists:        true,
            released:      false
        });

        for (uint i = 0; i < encryptedCIDs.length; i++) {
            questionCIDs[examId].push(encryptedCIDs[i]);
        }

        emit ExamCreated(examId, startTime, msg.sender);
        emit AuditLog(examId, "EXAM_CREATED", msg.sender, block.timestamp);
    }

    function releasePaper(bytes32 examId) external returns (bool) {
        Exam storage exam = exams[examId];
        require(exam.exists, "Exam does not exist");
        require(block.timestamp >= exam.examStartTime, "Too early");
        require(!exam.released, "Already released");

        exam.released = true;
        emit PaperReleased(examId, block.timestamp);
        emit AuditLog(examId, "PAPER_RELEASED", msg.sender, block.timestamp);
        return true;
    }

    function verifyQuestion(
        bytes32 examId,
        bytes32 questionHash,
        bytes32[] calldata proof
    ) external view returns (bool) {
        require(exams[examId].exists, "Exam does not exist");
        return _verifyMerkle(proof, exams[examId].merkleRoot, questionHash);
    }

    function logAction(bytes32 examId, string calldata action) external {
        require(exams[examId].exists, "Exam does not exist");
        emit AuditLog(examId, action, msg.sender, block.timestamp);
    }

    function getExam(bytes32 examId) external view returns (Exam memory) {
        return exams[examId];
    }

    function isReleased(bytes32 examId) external view returns (bool) {
        return exams[examId].released;
    }

    function getQuestionCount(bytes32 examId) external view returns (uint256) {
        return questionCIDs[examId].length;
    }

    function _verifyMerkle(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint i = 0; i < proof.length; i++) {
            if (computed <= proof[i]) {
                computed = keccak256(abi.encodePacked(computed, proof[i]));
            } else {
                computed = keccak256(abi.encodePacked(proof[i], computed));
            }
        }
        return computed == root;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimeCapsule {
    struct Capsule {
        string message;
        uint256 unlockTime;
        address creator;
    }

    mapping(uint256 => Capsule) public capsules;
    uint256 public capsuleCount;

    // Transaction 1: สร้างแคปซูล
    function createCapsule(string memory _message, uint256 _unlockDelayInSeconds) public {
        capsuleCount++;
        uint256 unlockTime = block.timestamp + _unlockDelayInSeconds;
        capsules[capsuleCount] = Capsule(_message, unlockTime, msg.sender);
    }

    // Transaction 2: เปิดแคปซูล (อ่านข้อมูล)
    function openCapsule(uint256 _id) public view returns (string memory) {
        require(_id > 0 && _id <= capsuleCount, "Capsule does not exist");
        // จุดสำคัญ: เช็คเวลาปัจจุบันกับเวลาที่ตั้งไว้
        require(block.timestamp >= capsules[_id].unlockTime, "Capsule is still locked!");
        
        return capsules[_id].message;
    }
}

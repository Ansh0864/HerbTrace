// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AyurTrace is AccessControl {
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");

    struct Herb {
        string name;
        uint256 confidenceScore;
        int latitude;
        int longitude;
        uint256 timestamp;
        address farmer;
    }

    struct ProcessingStep {
        string action;
        string batchNumber;
        uint256 timestamp;
        address processor;
    }

    mapping(uint256 => Herb) public herbEntries;
    mapping(uint256 => ProcessingStep[]) public processingHistory;

    uint256 public herbCount;

    // Added 'id' to the event for backend indexing
    event HerbAdded(uint256 indexed id, string name, address indexed farmer);
    event ProcessingStepAdded(uint256 indexed herbId, string action, string batchNumber, address indexed processor);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addHerb(
        string memory _name,
        uint256 _confidenceScore,
        int _latitude,
        int _longitude
    ) public {
        herbEntries[herbCount] = Herb({
            name: _name,
            confidenceScore: _confidenceScore,
            latitude: _latitude,
            longitude: _longitude,
            timestamp: block.timestamp,
            farmer: msg.sender
        });
        
        // Emit event with current herbCount as ID
        emit HerbAdded(herbCount, _name, msg.sender);
        herbCount++;
    }

    function addProcessingStep(
        uint256 _herbId,
        string memory _action,
        string memory _batchNumber
    ) public onlyRole(PROCESSOR_ROLE) {
        require(_herbId < herbCount, "AyurTrace: Herb ID does not exist.");

        processingHistory[_herbId].push(ProcessingStep({
            action: _action,
            batchNumber: _batchNumber,
            timestamp: block.timestamp,
            processor: msg.sender
        }));

        emit ProcessingStepAdded(_herbId, _action, _batchNumber, msg.sender);
    }

    function addProcessor(address _processorAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PROCESSOR_ROLE, _processorAddress);
    }

    function getProcessingHistory(uint256 _herbId) public view returns (ProcessingStep[] memory) {
        return processingHistory[_herbId];
    }
}
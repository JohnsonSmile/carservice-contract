// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUser {
    /// @notice 用户结构体
    struct UserEntity {
        uint256 id; // 用户id
        uint256 phone; // 用户电话
        uint256 score; // 用户积分
    }
    function GetUser(uint256 _userId) external view returns (UserEntity memory user);
    function PayScore(uint256 _id, uint256 _score) external;
}
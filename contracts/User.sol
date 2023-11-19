// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

error Error_UserAlreadyExists();
error Error_UserInfoParamsInvalid();
error Error_UserNotExists();


contract User is AccessControl {

    /// @notice 用户结构体
    struct UserEntity {
        uint256 id; // 用户id
        uint256 phone; // 用户电话
        uint256 score; // 用户积分
    }

    /// manager role
    bytes32 public constant MANAGER = keccak256("MANAGER");

    /// @notice 用户信息相关的mapping
    /// 用户id => 用户信息
    mapping (uint256 => UserEntity) private userInfo;

    /// 用户创建的事件
    /// @param userId 用户的id
    /// @param user 用户信息
    event UserCreated(uint256 indexed userId, UserEntity user);

    /// 用户更新的事件
    /// @param userId 用户的id
    /// @param user 用户信息
    event UserUpdated(uint256 indexed userId, UserEntity user);

    constructor() {
        // 给deployer授权 MANAGER 角色权限
        _grantRole(MANAGER, msg.sender);
        // 给deployer授权 DEFAULT_ADMIN_ROLE 角色权限
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// 创建用户
    /// @param _id 用户的id
    /// @param _phone 用户的手机
    /// @param _score 用户的积分
    function CreateUser(uint256 _id, uint256 _phone, uint256 _score) onlyRole(MANAGER) external {
        // 需要输入的_user的信息是正确的, 用户id和phone必须不能为0
        if (_id == 0 || _phone == 0) {
            revert Error_UserInfoParamsInvalid();
        }

        // 需要当前用户没有创建,这里使用自定义error来节省gas费
        // 这里就不考虑phone的映射关系和唯一性了，也可以再添加一个映射
        if (userInfo[_id].id > 0) {
            revert Error_UserAlreadyExists();
        }

        UserEntity memory _user = UserEntity(_id, _phone, _score);
        // 添加用户信息
        userInfo[_id] = _user;
        
        // 发送消息到网络，即写入日志
        emit UserCreated(_id, _user);
    }

    /// 更新用户信息
    /// @param _id 用户的id
    /// @param _phone 用户的手机
    /// @param _score 用户的积分
    function UpdateUser(uint256 _id, uint256 _phone, uint256 _score) onlyRole(MANAGER) external {
        if (userInfo[_id].id == 0) {
            revert Error_UserNotExists();
        }
        userInfo[_id].phone = _phone;
        userInfo[_id].score = _score;
        emit UserUpdated(_id, UserEntity(_id, _phone, _score));
    }

    /// 充值score
    /// @param _id 用户的id
    /// @param _score 用户的积分
    function ChargeScore(uint256 _id, uint256 _score) onlyRole(MANAGER) external{
        UserEntity memory _userInfo = userInfo[_id];
        if (_userInfo.id == 0) {
            revert Error_UserNotExists();
        }
        uint256 score = _userInfo.score + _score;
        userInfo[_id].score = score;
        emit UserUpdated(_id, UserEntity(_id, _userInfo.phone, score));
    }


    /// 支付score
    /// @param _id 用户的id
    /// @param _score 用户的积分
    function PayScore(uint256 _id, uint256 _score) onlyRole(MANAGER) external{
        UserEntity memory _userInfo = userInfo[_id];
        if (_userInfo.id == 0) {
            revert Error_UserNotExists();
        }
        uint256 score = _userInfo.score - _score;
        userInfo[_id].score = score;
        emit UserUpdated(_id, UserEntity(_id, _userInfo.phone, score));
    }


    /// 根据用户id获取用户信息
    /// @param _userId 用户id
    function GetUser(uint256 _userId) external view returns (UserEntity memory user) {
        if (userInfo[_userId].id == 0) {
            revert Error_UserNotExists();
        }
        return userInfo[_userId];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interface/IUser.sol";

error Error_OrderAlreadyExists();
error Error_OrderNotExists();
error Error_OrderAlreadyPayed();
error Error_OrderUserNotEnoughScoreToPay();

contract Order is Ownable {

    // 使用library里面的自增
    using Counters for Counters.Counter;

    enum OrderType {
        Highway, // 0
        Charge, // 1
        Park // 2
    }

    struct OrderEntity {
        uint256 id;
        uint256 orderID;
        string orderSn;
        OrderType orderType;
        uint256 startAt;
        uint256 endAt;
        uint256 userID;
        uint256 fee;
        uint256 uniteCount;
        bool isPayed;
        uint256 blockHeight;
        uint256 blockTimestamp;
        string startPosition;
        string endPosition;
    }

    /// @dev 用户的所有order
    /// orderId => OrderEntity
    mapping (uint256 => OrderEntity) orders;

    // 当前自增id
    Counters.Counter public currentID;

    /// @dev user contract
    IUser user;


    /// order创建的事件
    /// @param orderID 用户的id
    /// @param order 用户信息
    event OrderCreated(uint256 indexed orderID, OrderEntity order);

    /// order更新的事件
    /// @param orderID 用户的id
    /// @param order 用户信息
    event OrderUpdated(uint256 indexed orderID, OrderEntity order);

    /// order支付的事件
    /// @param orderID 用户的id
    /// @param order 用户信息
    event OrderPayed(uint256 indexed orderID, OrderEntity order);

    constructor(address _user) {
        user = IUser(_user);
        // id从1 开始
        currentID.increment();
    }

    // create order
    function CreateOrder(
        uint256 _orderID,
        string calldata _orderSn,
        OrderType _orderType,
        uint256 _startAt,
        uint256 _endAt,
        uint256 _userID,
        uint256 _fee,
        uint256 _uniteCount,
        bool _isPayed,
        string calldata _startPosition,
        string calldata _endPosition) onlyOwner external  {

        if (orders[_orderID].id > 0) {
            revert Error_OrderAlreadyExists();
        }

        // 查看user是否存在
        user.GetUser(_userID);

        uint256 _currentID = currentID.current();
        OrderEntity memory _order = OrderEntity(
            _currentID, 
            _orderID,
            _orderSn,
            _orderType,
            _startAt,
            _endAt,
            _userID,
            _fee,
            _uniteCount,
            _isPayed,
            block.number,
            block.timestamp,
            _startPosition,
            _endPosition);
        orders[_orderID] = _order;
        // 记得增加1
        currentID.increment();

        // emit
        emit OrderCreated(_orderID, _order);
    }

    // update order
    function UpdateOrder(
        uint256 _orderID,
        string calldata _orderSn,
        OrderType _orderType,
        uint256 _startAt,
        uint256 _endAt,
        uint256 _userID,
        uint256 _fee,
        uint256 _uniteCount,
        bool _isPayed,
        string calldata _startPosition,
        string calldata _endPosition) onlyOwner external  {
        
        // 存在才能更新，不存在就报错
        if (orders[_orderID].id == 0) {
            revert Error_OrderNotExists();
        }
        
        OrderEntity memory _order = orders[_orderID];

        _order.orderSn = _orderSn;
        _order.orderType = _orderType;
        _order.startAt = _startAt;
        _order.endAt = _endAt;
        _order.userID = _userID;
        _order.fee = _fee;
        _order.uniteCount = _uniteCount;
        _order.startPosition = _startPosition;
        _order.endPosition = _endPosition;
        _order.isPayed = _isPayed;

        // 写回去
        orders[_orderID] = _order;

        // emit
        emit OrderUpdated(_orderID, _order);
    }

    // pay order
    function PayOrder(uint256 _orderID, uint256 _userID) onlyOwner external  {
        // order should exists
        // 存在才能更新，不存在就报错
        OrderEntity memory _order = orders[_orderID];
        if (_order.id == 0) {
            revert Error_OrderNotExists();
        }

        if (_order.isPayed) {
            revert Error_OrderAlreadyPayed();
        }

        // TODO: 是否需要userID和order里面的userID一致，看是否支持别人帮忙支付。这里不做判断

        // decimal 都是 100，如果是highway类型的只考虑fee即可
        uint256 price = _order.fee * _order.uniteCount / 100;
        if (_order.orderType == OrderType.Highway) {
            price = _order.fee;
        }

        // 通过userid获取userinfo
        IUser.UserEntity memory _userInfo = user.GetUser(_userID);
        // 其实这个不判断也行，直接减去price，如果小于0就会overflow
        if (_userInfo.score < price) {
            revert Error_OrderUserNotEnoughScoreToPay();
        }

        // 由于可能会存在Reentrancy攻击，这里先修改状态，然后再转账,不过这里不存在作恶的基础，因为重复支付对user没有任何好处，不考虑重入问题也可以。
        // 更新payed状态
        _order.isPayed = true;
        // 写回去
        orders[_orderID] = _order;

        // TODO: 是否使用score支付,会打折，这个看实际需求，实现方式很多，可以这里修改，也可以，充值积分的时候赠送积分，都等于变相打折。
        user.PayScore(_userInfo.id, price);

        emit OrderPayed(_orderID, _order);
    }


    function GetOrder(uint256 _orderID) external view returns (OrderEntity memory) {
        
        OrderEntity memory _order = orders[_orderID];
        if (_order.id == 0) {
            revert Error_OrderNotExists();
        }
        return _order;
    }
}
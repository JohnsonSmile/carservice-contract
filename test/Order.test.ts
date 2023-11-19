import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { Order, User } from "../typechain-types"

describe("Order", function () {
  // 这个里面的东西会保持不变
  async function deployUserFixture() {
    // 使用owner来部署合约
    const [owner, player] = await ethers.getSigners()

    // 1. 部署user
    const UserFactory = await ethers.getContractFactory("User")
    const user = (await UserFactory.deploy()) as User
    await user.waitForDeployment()
    const userAddress = await user.getAddress()
    console.log(`\tuser deployed at ${userAddress}`)
    // 2. 部署order
    const OrderFactory = await ethers.getContractFactory("Order")
    const order = (await OrderFactory.deploy()) as Order
    await order.waitForDeployment()
    // initialize
    const initTx = await order.Initialize(userAddress)
    await initTx.wait()
    const orderAddress = await order.getAddress()
    console.log(`\torder deployed at ${orderAddress}`)

    // 3. 授权order，manager权限
    const managerRole = await user.MANAGER()
    const grantTx = await user.grantRole(managerRole, orderAddress)
    await grantTx.wait()

    return { user, order, owner, managerRole, player }
  }

  describe("Deployment", function () {
    describe("It should have manager role granted properly", function () {
      it("order should have manager role granted", async function () {
        const { user, order, managerRole } = await loadFixture(
          deployUserFixture
        )
        const orderAddress = await order.getAddress()
        const isManager = await user.hasRole(managerRole, orderAddress)
        console.log(`\tisManager: ${isManager}`)
        const currentID = await order.currentID()
        console.log(`\tcurrentID: ${currentID}`)
        expect(isManager).to.be.true
        expect(currentID).to.be.eq(1, "should be start with 1")
      })
    })

    describe("It should create and pay order properly", function () {
      it("order should be created and payed properly", async function () {
        const { user, order, managerRole } = await loadFixture(
          deployUserFixture
        )
        /*
          enum OrderType {
              Highway, // 0
              Charge, // 1
              Park // 2
          }
         */
        // 1. 没有创建用户的时候会报错
        await expect(
          order.CreateOrder(
            1,
            "testxxxx",
            0,
            1700377074,
            1700378074,
            1,
            1000,
            100, // 其实就是1,decimal是2,这里可能会有问题，小数位丢弃的问题。
            false,
            "火星1号高速A",
            "兰桂坊高速B"
          )
        ).to.be.revertedWithCustomError(
          {
            interface: user.interface,
          },
          "Error_UserNotExists"
        )

        // 2. 创建用户，并创建订单
        const createTx = await user.CreateUser(1, 18888888888, 0)
        await createTx.wait()

        await expect(
          order.CreateOrder(
            1,
            "testxxxx",
            0,
            1700377074,
            1700378074,
            1,
            1000,
            100,
            false,
            "火星1号高速A",
            "兰桂坊高速B"
          )
        ).to.be.emit(order, "OrderCreated")

        const _order = await order.GetOrder(1)
        console.log(`\torder: ${_order}`)
        expect(_order.id).to.be.eq(1, "should be 1")
        expect(_order.orderID).to.be.eq(1, "should be 1")
        expect(_order.orderSn).to.be.eq("testxxxx", "ordersn should be eq")
        expect(_order.orderType).to.be.eq(0, "ordertype should be highway")
        expect(_order.startAt).to.be.eq(1700377074, "startat should be eq")
        expect(_order.endAt).to.be.eq(1700378074, "endat should be eq")
        expect(_order.userID).to.be.eq(1, "userid should be eq")
        expect(_order.fee).to.be.eq(1000, "fee should be eq")
        expect(_order.uniteCount).to.be.eq(100, "uniteCount should be eq")
        expect(_order.isPayed).to.be.eq(false, "should not be payed")
        expect(_order.startPosition).to.be.eq(
          "火星1号高速A",
          "startPosition should not be eq"
        )
        expect(_order.endPosition).to.be.eq(
          "兰桂坊高速B",
          "startPosition should not be eq"
        )

        // 3. 支付订单，会报错，没有足够的余额
        await expect(order.PayOrder(1, 1)).to.be.revertedWithCustomError(
          {
            interface: order.interface,
          },
          "Error_OrderUserNotEnoughScoreToPay"
        )

        // 4. 充值，更新用户score之后，支付订单会返回订单已经支付的信息
        const chargeTx = await user.ChargeScore(1, 900)
        await chargeTx.wait()
        const userInfoBefore = await user.GetUser(1)
        console.log(`\tuserInfoBefore: ${userInfoBefore}`)
        expect(userInfoBefore.score).to.be.eq(900, "should be 900")

        // 充值900不够价格1000，应该会revert
        await expect(order.PayOrder(1, 1)).to.be.revertedWithCustomError(
          {
            interface: order.interface,
          },
          "Error_OrderUserNotEnoughScoreToPay"
        )

        // 再充值100就足够了
        const chargeTx1 = await user.ChargeScore(1, 100)
        await chargeTx1.wait()
        const userInfoBefore1 = await user.GetUser(1)
        console.log(`\tuserInfoBefore1: ${userInfoBefore1}`)
        expect(userInfoBefore1.score).to.be.eq(1000, "should be 1000")

        // 支付订单
        const payTx = await order.PayOrder(1, 1)
        await payTx.wait()
        const userInfoAfter = await user.GetUser(1)
        console.log(`\tuserInfoAfter: ${userInfoAfter}`)
        expect(userInfoAfter.score).to.be.eq(
          0,
          "should be payed and updated to 0"
        )
      })
    })
  })
})

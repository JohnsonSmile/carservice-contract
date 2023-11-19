import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { User } from "../typechain-types"

describe("User", function () {
  // 这个里面的东西会保持不变
  async function deployUserFixture() {
    // 使用owner来部署合约
    const [owner, manager, player] = await ethers.getSigners()
    const UserFactory = await ethers.getContractFactory("User")
    const user = (await UserFactory.deploy()) as User
    await user.waitForDeployment()
    const managerRole = await user.MANAGER()
    const grantRole = await user.grantRole(managerRole, manager.address)
    await grantRole.wait()
    return { user, owner, manager, managerRole, player }
  }

  describe("Deployment", function () {
    describe("It should have manager role granted properly", function () {
      it("owner and manager should have manager role granted", async function () {
        const { user, owner, manager, managerRole, player } = await loadFixture(
          deployUserFixture
        )

        // owner 应该有 manager权限
        const isOwnerManager = await user.hasRole(managerRole, owner.address)
        console.log(`\tisOwnerManager: ${isOwnerManager}`)

        await expect(isOwnerManager).to.be.eq(
          true,
          "owner should have manager access"
        )

        // manager should have manager access
        const isManagerManager = await user.hasRole(
          managerRole,
          manager.address
        )
        console.log(`\tisManagerManager: ${isManagerManager}`)
        await expect(isManagerManager).to.be.eq(
          true,
          "manager should have manager access"
        )

        // player should not have manager access
        const isPlayerManager = await user.hasRole(managerRole, player.address)
        console.log(`\tisPlayerManager: ${isPlayerManager}`)

        await expect(isPlayerManager).to.be.eq(
          false,
          "player should not have manager access"
        )
      })
    })

    describe("It should have manager role granted properly", function () {
      it("owner and manager should have manager role granted", async function () {
        const { user, owner, manager, managerRole, player } = await loadFixture(
          deployUserFixture
        )

        // owner 应该有 manager权限
        const isOwnerManager = await user.hasRole(managerRole, owner.address)
        console.log(`\tisOwnerManager: ${isOwnerManager}`)

        await expect(isOwnerManager).to.be.eq(
          true,
          "owner should have manager access"
        )

        // manager should have manager access
        const isManagerManager = await user.hasRole(
          managerRole,
          manager.address
        )
        console.log(`\tisManagerManager: ${isManagerManager}`)
        await expect(isManagerManager).to.be.eq(
          true,
          "manager should have manager access"
        )

        // player should not have manager access
        const isPlayerManager = await user.hasRole(managerRole, player.address)
        console.log(`\tisPlayerManager: ${isPlayerManager}`)

        await expect(isPlayerManager).to.be.eq(
          false,
          "player should not have manager access"
        )
      })

      it("player should have manager role after granted", async function () {
        const { user, managerRole, player } = await loadFixture(
          deployUserFixture
        )
        const grantTx = await user.grantRole(managerRole, player.address)
        // 等待交易被矿工打包
        await grantTx.wait()
        // player should have manager access
        const isPlayerManager = await user.hasRole(managerRole, player.address)
        console.log(`\tisPlayerManager: ${isPlayerManager}`)
        await expect(isPlayerManager).to.be.eq(
          true,
          "player should have manager access after granted"
        )
      })

      it("only owner(admin) can grant roles", async function () {
        const { user, managerRole, player, manager } = await loadFixture(
          deployUserFixture
        )
        // manager should not have admin role, so it can't grant manager role for player
        // accout address 大小写问题。。。
        // await expect(
        //   user.connect(manager).grantRole(managerRole, player.address)
        // ).to.be.revertedWith(
        //   `AccessControl: account ${manager.address} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
        // )
        await expect(
          user.connect(manager).grantRole(managerRole, player.address)
        ).to.be.revertedWith(
          `AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
        )
      })
    })

    describe("It should create and get user properly", function () {
      it("owner and manager should create user successfully.", async function () {
        const { user, manager } = await loadFixture(deployUserFixture)

        // create user successfully with owner
        const createTx1 = await user.CreateUser({
          id: 1,
          phone: 18999999999,
          score: 0,
        })
        await createTx1.wait()

        const user1 = await user.GetUser(1)
        console.log(`\tuser1: ${user1}`)
        expect(user1.id).to.be.eq(1)
        expect(user1.phone).to.be.eq(18999999999)
        expect(user1.score).to.be.eq(0)

        // create user successfully with manager
        const createTx2 = await user.connect(manager).CreateUser({
          id: 2,
          phone: 18999999990,
          score: 0,
        })
        await createTx2.wait()
        const user2 = await user.GetUser(2)
        console.log(`\tuser2: ${user2}`)
        expect(user2.id).to.be.eq(2)
        expect(user2.phone).to.be.eq(18999999990)
        expect(user2.score).to.be.eq(0)
      })

      it("player should create user failed with reverted error.", async function () {
        const { user, player } = await loadFixture(deployUserFixture)

        // create user failed with player
        await expect(
          user.connect(player).CreateUser({
            id: 1,
            phone: 18999999999,
            score: 0,
          })
        ).to.be.revertedWith(
          "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c"
        )
      })

      it("should failed with reverted error when create an exists user.", async function () {
        const { user } = await loadFixture(deployUserFixture)

        // create user failed with owner
        const createTx = await user.CreateUser({
          id: 1,
          phone: 18999999999,
          score: 0,
        })

        await createTx.wait()

        // reverted with custom error
        await expect(
          user.CreateUser({
            id: 1,
            phone: 18999999999,
            score: 0,
          })
        ).to.be.revertedWithCustomError(
          {
            interface: user.interface,
          },
          "Error_UserAlreadyExists"
        )
      })

      it("should failed with reverted error when create an invalid user.", async function () {
        const { user } = await loadFixture(deployUserFixture)

        // reverted with custom error
        await expect(
          user.CreateUser({
            id: 0,
            phone: 18999999999,
            score: 0,
          })
        ).to.be.revertedWithCustomError(
          {
            interface: user.interface,
          },
          "Error_UserInfoParamsInvalid"
        )
      })

      it("should emit CreateUser event when create successfully.", async function () {
        const { user } = await loadFixture(deployUserFixture)

        // create user successfully with event emit
        await expect(
          user.CreateUser({
            id: 1,
            phone: 18999999999,
            score: 0,
          })
        ).to.be.emit(user, "UserCreated")
      })
    })

    describe("It should update user properly", function () {
      it("owner and manager should update user successfully.", async function () {
        const { user, manager } = await loadFixture(deployUserFixture)

        // create user successfully with owner
        const createTx1 = await user.CreateUser({
          id: 1,
          phone: 18999999999,
          score: 0,
        })
        await createTx1.wait()

        const user1 = await user.GetUser(1)
        console.log(`\tuser: ${user1}`)
        expect(user1.id).to.be.eq(1)
        expect(user1.phone).to.be.eq(18999999999)
        expect(user1.score).to.be.eq(0)

        const updateTx = await user.UpdateUser(1, 18000000000, 100)
        await updateTx.wait()
        const user2 = await user.GetUser(1)
        console.log(`\tuser: ${user2}`)
        expect(user2.id).to.be.eq(1)
        expect(user2.phone).to.be.eq(18000000000)
        expect(user2.score).to.be.eq(100)
      })

      it("player should update user failed with reverted error.", async function () {
        const { user, player } = await loadFixture(deployUserFixture)

        // create user with owner
        const userTx = await user.CreateUser({
          id: 1,
          phone: 18999999999,
          score: 0,
        })
        await userTx.wait()

        // update user failed with player
        await expect(
          user.connect(player).UpdateUser(1, 18999999900, 100)
        ).to.be.revertedWith(
          "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c"
        )
      })

      it("should failed with reverted error when update an not exists user.", async function () {
        const { user } = await loadFixture(deployUserFixture)

        // reverted with custom error
        await expect(
          user.UpdateUser(1, 18999999999, 0)
        ).to.be.revertedWithCustomError(
          {
            interface: user.interface,
          },
          "Error_UserNotExists"
        )
      })

      it("should emit UserUpdated event when update successfully.", async function () {
        const { user } = await loadFixture(deployUserFixture)

        // create user successfully
        const createTx = await user.CreateUser({
          id: 1,
          phone: 18999999999,
          score: 0,
        })
        await createTx.wait()

        // update user successfully with event emit
        await expect(user.UpdateUser(1, 18999990000, 10)).to.be.emit(
          user,
          "UserUpdated"
        )
        const user1 = await user.GetUser(1)
        console.log(`\tuser: ${user1}`)
        expect(user1.id).to.be.eq(1)
        expect(user1.phone).to.be.eq(18999990000)
        expect(user1.score).to.be.eq(10)
      })
    })
  })
})

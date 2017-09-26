/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it web3 */

const makeHash = require('solidity-sha3').default
const expectedExceptionPromise = require("../utils/expectedException")

const Regulator = artifacts.require("./Regulator.sol")
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

contract('TollBoothOperator', (accounts) => {

	let test,
		booth0, booth1, boothNoFee, boothOwner,
		owner1, owner2, vehicle0, vehicle1, vehicle2,
		regulator0, regulatorOwner0,
		hash0, hash1, hash2

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 10)
		vehicle2 = accounts[0]
		owner1 = accounts[1]
		owner2 = accounts[4]
		vehicle0 = accounts[2]
		vehicle1 = accounts[3]
		regulatorOwner0 = accounts[5]
		booth0 = accounts[6]
		booth1 = accounts[7]
		boothNoFee = accounts[9]
		boothOwner = accounts[8]
	})

	beforeEach("make new test case", async() => {
		regulator0 = await Regulator.new({ from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle0, 1, { from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle1, 2, { from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle2, 3, { from: regulatorOwner0 })

		const tx = await regulator0.createNewOperator(boothOwner, 10, { from: regulatorOwner0 })
		test = await TollBoothOperator.at(tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator)
		await test.setPaused(false, { from: boothOwner })
		await test.setMultiplier(1, 1, { from: boothOwner })
		await test.setMultiplier(2, 3, { from: boothOwner })
		await test.addTollBooth(booth0, { from: boothOwner })
		await test.addTollBooth(booth1, { from: boothOwner })
		await test.addTollBooth(boothNoFee, { from: boothOwner })
		await test.setRoutePrice(booth0, booth1, 2, { from: boothOwner })

		hash0 = await test.hashSecret(web3.fromAscii("helo"))
		hash1 = await test.hashSecret(web3.fromAscii("YOULOSTTHEGAME"))
		hash2 = await test.hashSecret(web3.fromAscii("ILIEKMUDKIPS"))
	})

	describe("enterRoad", () => {

		it("should allow entry to the road", async() => {
			await test.enterRoad(booth0, hash0, { from: vehicle0, value: web3.toWei(1, 'ether') })
			const [vehicle, entryBooth, depositedWeis, ...others] = await test.getVehicleEntry(hash0)
			assert.strictEqual(others.length, 0, "Vehicle entry data returned incorrectly")
			assert.notEqual(vehicle, '0x0000000000000000000000000000000000000000', "Road entry vehicle not recorded")
			assert.notEqual(entryBooth, '0x0000000000000000000000000000000000000000', "Road entry booth not recorded")
			assert.notEqual(depositedWeis.toNumber(), 0, "Road entry deposit not recorded")
		})

		it("should prevent entry to the road when paused", async() => {
			await test.setPaused(true, { from: boothOwner })
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, hash0, { from: vehicle0, value: web3.toWei(4, 'wei'), gas: 3000000 }),
				3000000
			)
		})

		it("should prevent entry to the road when entry booth is invalid", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(owner1, hash0, { from: vehicle0, value: web3.toWei(1, 'ether'), gas: 3000000 }),
				3000000
			)
		})

		it("should prevent entry to the road when vehicle is not registered", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, hash0, { from: owner2, value: web3.toWei(1, 'ether'), gas: 3000000 }),
				3000000
			)
		})

		it("should reject if insufficient funds were paid", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, hash0, { from: vehicle0, value: web3.toWei(1, 'wei'), gas: 3000000 }),
				3000000
			)
		})

	})

	describe("reportExitRoad", () => {

		it("should handle vehicles exiting the road", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })
		})

		it("should handle vehicles exiting the road via a route with known price", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			const status = await test.reportExitRoad.call(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })
			assert.strictEqual(status.toNumber(), 1)
		})

		it("should handle vehicles exiting the road via a route with unknown price", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			const status = await test.reportExitRoad.call(web3.fromAscii("YOULOSTTHEGAME"), { from: boothNoFee })
			assert.strictEqual(status.toNumber(), 2)
		})

		it("should clear vehicle visit data when exiting the road", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })

			const [vehicle, entryBooth, depositedWeis, ...others] = await test.getVehicleEntry(hash1)
			assert.strictEqual(others.length, 0, "Vehicle entry data returned incorrectly")
			assert.strictEqual(vehicle, '0x0000000000000000000000000000000000000000', "Road entry vehicle not cleared")
			assert.strictEqual(entryBooth, '0x0000000000000000000000000000000000000000', "Road entry booth not cleared")
			assert.strictEqual(depositedWeis.toNumber(), 0, "Road entry deposit not cleared")
			assert.strictEqual((await test.getPendingPaymentCount(booth0, booth1)).toNumber(), 0)
		})

		it("should refund vehicle deposit difference when exiting the road", async() => {
			const depositAmount = web3.toWei(1, 'ether')
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: depositAmount })
			const tx = await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })

			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis
			assert.strictEqual(web3.toBigNumber(depositAmount).minus(2).toString(10), refund.toString(10))
		})

		it("should prevent vehicles exiting the road when paused", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.setPaused(true, { from: boothOwner })
			return expectedExceptionPromise(
				() => test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1, gas: 3000000 }),
				3000000
			)
		})

		it("should prevent vehicles exiting the road if sender is not a toll booth", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			return expectedExceptionPromise(
				() => test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: owner2, gas: 3000000 }),
				3000000
			)
		})

		it("should roll back if entry and exit TollBooths are the same", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			return expectedExceptionPromise(
				() => test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth0, gas: 3000000 }),
				3000000
			)
		})

		it("should roll back if vehicle exit nonce does not match", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			return expectedExceptionPromise(
				() => test.reportExitRoad(web3.fromAscii("ILIEKMUDKIPS"), { from: booth1, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("clearSomePendingPayments", () => {

		beforeEach(async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: boothNoFee })
			await test.enterRoad(booth0, hash2, { from: vehicle1, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("ILIEKMUDKIPS"), { from: boothNoFee })
			await test.enterRoad(booth0, hash0, { from: vehicle2, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("helo"), { from: boothNoFee })

			await test.setRoutePrice(booth0, boothNoFee, 3, { from: boothOwner })
		})

		it("should clear a pending payment", async() => {
			await test.clearSomePendingPayments(booth0, boothNoFee, 1, { from: boothOwner })
			assert.strictEqual((await test.getPendingPaymentCount(booth0, boothNoFee)).toNumber(), 1)
		})

		it("should clear multiple pending payments", async() => {
			await test.clearSomePendingPayments(booth0, boothNoFee, 2, { from: boothOwner })
			assert.strictEqual((await test.getPendingPaymentCount(booth0, boothNoFee)).toNumber(), 0)
		})

		it("should not allow clearing payments when paused", async() => {
			test.setPaused(true, { from: boothOwner })
			return expectedExceptionPromise(
				() => test.clearSomePendingPayments(booth0, boothNoFee, 1, { from: boothOwner, gas: 3000000 }),
				3000000
			)
		})

		it("should abort clearing payments if fewer to clear than specified", async() => {
			return expectedExceptionPromise(
				() => test.clearSomePendingPayments(booth0, boothNoFee, 10, { from: boothOwner, gas: 3000000 }),
				3000000
			)
		})

		it("should abort clearing payments if number to clear is 0", async() => {
			return expectedExceptionPromise(
				() => test.clearSomePendingPayments(booth0, boothNoFee, 0, { from: boothOwner, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("withdrawCollectedFees", () => {

		it("should allow withdrawal of fees to owner", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })
			assert.strictEqual((await test.getCollectedFeesAmount()).toNumber(), 2, "Incorrect amount retained")
			await test.withdrawCollectedFees({ from: boothOwner })
			assert.strictEqual((await test.getCollectedFeesAmount()).toNumber(), 0, "Incorrect amount paid out")
		})

		it("should deny withdrawls to anyone other than the contract owner", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth1 })
			return expectedExceptionPromise(
				() => test.withdrawCollectedFees({ from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should abort payment withdrawal if no fees have been collected", async() => {
			return expectedExceptionPromise(
				() => test.withdrawCollectedFees({ from: boothOwner, gas: 3000000 }),
				3000000
			)
		})

		// it("should abort payment withdrawal if owner does not receive funds", async() => {
			// :TODO: how to test this? Fake stack depth to make `send` fail?
		// })

	})

	describe("setRoutePrice", () => {

		it("should allow setting route price even if paused", async() => {
			await test.setPaused(true, { from: boothOwner })
			await test.setRoutePrice(booth0, booth1, 6, { from: boothOwner })
			assert.strictEqual((await test.getRoutePrice(booth0, booth1)).toNumber(), 6, "Route price not updated")
		})

		it("should trigger pending payments to be processed if any are present", async() => {
			await test.enterRoad(booth0, hash1, { from: vehicle0, value: web3.toWei(1, 'ether') })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: boothNoFee })

			const tx = await test.setRoutePrice(booth0, boothNoFee, web3.toWei(1, 'ether') - 100, { from: boothOwner })

			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis
			assert.strictEqual(refund.toNumber(), 100, "Refunded amount does not match expected")
		})

	})

})

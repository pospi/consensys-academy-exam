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
		booth0, booth1, boothOwner,
		owner0, owner1, owner2, vehicle0, vehicle1,
		regulator0, regulatorOwner0

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 9)
		owner0 = accounts[0]
		owner1 = accounts[1]
		owner2 = accounts[4]
		vehicle0 = accounts[2]
		vehicle1 = accounts[3]
		regulatorOwner0 = accounts[5]
		booth0 = accounts[6]
		booth1 = accounts[7]
		boothOwner = accounts[8]
	})

	beforeEach("make new test case", async() => {
		regulator0 = await Regulator.new({ from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle0, 1, { from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle1, 2, { from: regulatorOwner0 })

		const tx = await regulator0.createNewOperator(boothOwner, 10, { from: regulatorOwner0 })
		test = await TollBoothOperator.at(tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator)
		await test.setPaused(false, { from: boothOwner })
		await test.setMultiplier(1, 1, { from: boothOwner })
		await test.setMultiplier(2, 3, { from: boothOwner })
		await test.addTollBooth(booth0, { from: boothOwner })
		await test.addTollBooth(booth1, { from: boothOwner })
		await test.setRoutePrice(booth0, booth1, 2, { from: boothOwner })
	})

	describe("enterRoad", () => {

		it("should allow entry to the road", async() => {
			await test.enterRoad(booth0, makeHash("helo"), { from: vehicle0, value: web3.toWei(1, 'ether') })
			const [ vehicle, entryBooth, depositedWeis, ...others ] = await test.getVehicleEntry(makeHash("helo"))
			assert.strictEqual(others.length, 0, "Vehicle entry data returned incorrectly")
			assert.notEqual(vehicle, 0x0, "Road entry vehicle not recorded")
			assert.notEqual(entryBooth, 0x0, "Road entry booth not recorded")
			assert.notEqual(depositedWeis, 0, "Road entry deposit not recorded")
		})

		it("should prevent entry to the road when paused", async() => {
			await test.setPaused(true, { from: boothOwner })
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, makeHash("helo"), { from: vehicle0, value: web3.toWei(4, 'wei'), gas: 3000000 }),
				3000000
			)
		})

		it("should prevent entry to the road when entry booth is invalid", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(owner1, makeHash("helo"), { from: vehicle0, value: web3.toWei(1, 'ether'), gas: 3000000 }),
				3000000
			)
		})

		it("should prevent entry to the road when vehicle is not registered", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, makeHash("helo"), { from: owner2, value: web3.toWei(1, 'ether'), gas: 3000000 }),
				3000000
			)
		})

		it("should reject if insufficient funds were paid", async() => {
			return expectedExceptionPromise(
				() => test.enterRoad(booth0, makeHash("helo"), { from: vehicle0, value: web3.toWei(1, 'wei'), gas: 3000000 }),
				3000000
			)
		})

	})

	describe("setRoutePrice", () => {

		it("should allow setting route price even if paused", async() => {
			await test.setPaused(true, { from: boothOwner })
			await test.setRoutePrice(booth0, booth1, 6, { from: boothOwner })
			assert.strictEqual((await test.getRoutePrice(booth0, booth1)).toNumber(), 6, "Route price not updated")
		})

	})

})

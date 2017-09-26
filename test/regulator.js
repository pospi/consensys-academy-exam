/**
 * Keeping this in spite of regulator_tollBoothOperator since some access control
 * tests (eg. owner-only modifiers on operator management)
 *
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const Regulator = artifacts.require("./Regulator.sol")

contract('Regulator', (accounts) => {

	let owner0, owner1, owner2, vehicle0, vehicle1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 2)
		owner0 = accounts[0]
		owner1 = accounts[1]
		owner2 = accounts[4]
		vehicle0 = accounts[2]
		vehicle1 = accounts[3]
	})

	describe("setVehicleType", () => {

		it("should allow registering vehicles if the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			return test.setVehicleType(vehicle0, 1, { from: owner0 })
		})

		it("should not allow registering vehicles if not the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.setVehicleType(vehicle1, 1, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should reject registering vehicles if no changes are made", async() => {
			const test = await Regulator.new({ from: owner0 })
			await test.setVehicleType(vehicle0, 1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setVehicleType(vehicle0, 1, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should reject registering vehicles to a 0 address", async() => {
			const test = await Regulator.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.setVehicleType(0, 1, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("createNewOperator", () => {

		it("should allow creating operators if the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			return test.createNewOperator(owner1, 100, { from: owner0 })
		})

		it("should not allow creating operators if not the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.createNewOperator(owner1, 100, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should create new operators which start initially paused", async() => {
			const test = await Regulator.new({ from: owner0 })
			const tx = await test.createNewOperator(owner1, 100, { from: owner0 })
			const operator = tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator
			assert.isTrue(await operator.isPaused())
		})

		it("should reject creating operators with the same owner as the regulator", async() => {
			const test = await Regulator.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.createNewOperator(owner0, 1, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("removeOperator", () => {

		it("should allow removing operators if the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			const tx = await test.createNewOperator(owner1, 100, { from: owner0 })
			const operator = tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator
			await test.removeOperator(operator, { from: owner0 })
			assert.isFalse(await test.isOperator(operator))
		})

		it("should not allow removing operators if not the owner", async() => {
			const test = await Regulator.new({ from: owner0 })
			await test.createNewOperator(owner1, 100, { from: owner0 })
			return expectedExceptionPromise(
				() => test.removeOperator(owner1, { from: owner2, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow removing operators if the operation is not registered", async() => {
			const test = await Regulator.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.removeOperator(owner1, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

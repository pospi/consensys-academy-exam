/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-24
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const DepositHolder = artifacts.require("./DepositHolder.sol")

contract('DepositHolder', (accounts) => {

	let owner0, owner1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 2)
		owner0 = accounts[0]
		owner1 = accounts[1]
	})

	describe("permissions", () => {

		it("should allow changing deposit if the owner", async() => {
			const test = await DepositHolder.new(2, { from: owner0 })
			return test.setDeposit(1, { from: owner0 })
		})

		it("should not allow changing deposit if not the owner", async() => {
			const test = await DepositHolder.new(2, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setDeposit(1, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("errors", () => {

		it("should not allow changing deposit if setting to the same value", async() => {
			const test = await DepositHolder.new(1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setDeposit(1, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow changing deposit if setting to 0", async() => {
			const test = await DepositHolder.new(1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setDeposit(0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("setDeposit", async() => {

		it("should update the required deposit amount when called", async() => {
			const test = await DepositHolder.new(2, { from: owner0 })
			await test.setDeposit(1, { from: owner0 })
			assert.strictEqual((await test.getDeposit()).toNumber(), 1)
		})

	})

})

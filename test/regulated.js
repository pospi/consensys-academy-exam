/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const Regulated = artifacts.require("./Regulated.sol")

contract('Regulated', (accounts) => {

	let test, owner0, owner1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 2)
		owner0 = accounts[0]
		owner1 = accounts[1]
	})

	beforeEach("make new test case", async() => {
		test = await Regulated.new(owner0, { from: owner0 })
	})

	describe("initialisation", () => {

		it("should store the provided regulator address when creating", async() => {
			const test1 = await Regulated.new(owner0, { from: owner0 })
			const test2 = await Regulated.new(owner1, { from: owner0 })
			assert.strictEqual(owner0, await test1.getRegulator())
			assert.strictEqual(owner1, await test2.getRegulator())
		})

	})

	describe("setRegulator", () => {

		it("should allow setting regulator if the current regulator", async() => {
			assert.isTrue(await test.setRegulator(owner1, { from: owner0 }))
		})

		it("should not allow setting regulator if not the current regulator", async() => {
			return expectedExceptionPromise(
				() => test.setRegulator(owner1, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should reject setting regulator if no changes are made", async() => {
			return expectedExceptionPromise(
				() => test.setRegulator(owner0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should reject setting regulator to a 0 address", async() => {
			return expectedExceptionPromise(
				() => test.setRegulator(0x0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

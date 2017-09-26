/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const Regulated = artifacts.require("./Regulated.sol")
const Regulator = artifacts.require("./Regulator.sol")

contract('Regulated', (accounts) => {

	let test, regulator, regulatorNew, owner0, owner1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 2)
		owner0 = accounts[0]
		owner1 = accounts[1]
	})

	beforeEach("make new test case", async() => {
		regulator = await Regulator.new({ from: owner0 })
		regulatorNew = await Regulator.new({ from: owner0 })
		test = await Regulated.new(regulator.address, { from: owner0 })
	})

	describe("initialisation", () => {

		it("should store the provided regulator address when creating", async() => {
			const test1 = await Regulated.new(regulator.address, { from: owner0 })
			assert.strictEqual(regulator.address, await test1.getRegulator())
		})

	})

	describe("setRegulator", () => {

		it("should allow setting regulator if the current regulator", async() => {
			await regulator.delegateRegulatorRole(test.address, regulatorNew.address, { from: owner0 })
			assert.strictEqual(await test.getRegulator(), regulatorNew.address, "Regulator was not set")
		})

		it("should not allow setting regulator if not the current regulator", async() => {
			return expectedExceptionPromise(
				() => test.setRegulator(regulatorNew.address, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should reject setting regulator if no changes are made", async() => {
			return expectedExceptionPromise(
				() => regulator.delegateRegulatorRole(test.address, regulator.address, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should reject setting regulator to a 0 address", async() => {
			return expectedExceptionPromise(
				() => regulator.delegateRegulatorRole(test.address, 0x0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

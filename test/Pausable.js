/**
 * @package:	Consensys Academy exam pt2
 * @author:		pospi <sam.pospi@consensys.net>
 * @since:		2017-09-24
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const Pausable = artifacts.require("./mock/PausableMock.sol")

contract('Pausable', (accounts) => {

	let owner0, owner1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 2)
		owner0 = accounts[0]
		owner1 = accounts[1]
	})

	describe("permissions", () => {

		it("should allow changing paused status if the owner", async() => {
			const paused = await Pausable.new(false, { from: owner0 })
			await paused.setPaused(true, { from: owner0 })
			assert.isTrue(await paused.isPaused())
		})

		it("should not allow changing paused status if not the owner", async() => {
			const paused = await Pausable.new(false, { from: owner0 })
			return expectedExceptionPromise(
				() => paused.setPaused(true, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("whenPaused", () => {

		it("allows actions when paused", async() => {
			const paused = await Pausable.new(true, { from: owner0 })
			await paused.countUpWhenPaused()
			const callCount = await paused.counters(true)
			assert.strictEqual(callCount.toNumber(), 1)
		})

		it("prevents actions when not paused", async() => {
			const paused = await Pausable.new(false, { from: owner0 })
			return expectedExceptionPromise(
				() => paused.countUpWhenPaused({ from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("whenNotPaused", () => {

		it("allows actions when not paused", async() => {
			const paused = await Pausable.new(false, { from: owner0 })
			await paused.countUpWhenNotPaused()
			const callCount = await paused.counters(false)
			assert.strictEqual(callCount.toNumber(), 1)
		})

		it("prevents actions when paused", async() => {
			const paused = await Pausable.new(true, { from: owner0 })
			return expectedExceptionPromise(
				() => paused.countUpWhenNotPaused({ from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

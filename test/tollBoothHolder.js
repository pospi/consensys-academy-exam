/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const TollBoothHolder = artifacts.require("./TollBoothHolder.sol")

contract('TollBoothHolder', (accounts) => {

	let owner0, owner1, booth0, booth1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 4)
		owner0 = accounts[0]
		owner1 = accounts[1]
		booth0 = accounts[2]
		booth1 = accounts[3]
	})

	describe("addTollBooth", () => {

		it("should allow adding toll booths if the owner", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			await test.addTollBooth(booth0, { from: owner0 })
			assert.isTrue(await test.isTollBooth(booth0))
		})

		it("should not allow adding toll booths if not the owner", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.addTollBooth(booth0, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow adding a 0 toll booth", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.addTollBooth(0x0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow adding a toll booth that already exists", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			await test.addTollBooth(booth0, { from: owner0 })
			return expectedExceptionPromise(
				() => test.addTollBooth(booth0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

	describe("removeTollBooth", () => {

		it("should allow removing toll booths if the owner", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			await test.addTollBooth(booth0, { from: owner0 })
			assert.isTrue(await test.isTollBooth(booth0))
			await test.removeTollBooth(booth0, { from: owner0 })
			assert.isFalse(await test.isTollBooth(booth0))
		})

		it("should not allow removing toll booths if not the owner", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			await test.addTollBooth(booth0, { from: owner0 })
			return expectedExceptionPromise(
				() => test.removeTollBooth(booth0, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow removing a 0 toll booth", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.removeTollBooth(0x0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow removing a toll booth that does not exist", async() => {
			const test = await TollBoothHolder.new({ from: owner0 })
			return expectedExceptionPromise(
				() => test.removeTollBooth(booth0, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

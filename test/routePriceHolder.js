/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it */

const expectedExceptionPromise = require("../utils/expectedException")

const RoutePriceHolder = artifacts.require("./RoutePriceHolder.sol")

contract('RoutePriceHolder', (accounts) => {

	let test, owner0, owner1, booth0, booth1

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 4)
		owner0 = accounts[0]
		owner1 = accounts[1]
		booth0 = accounts[2]
		booth1 = accounts[3]
	})

	beforeEach("make new test case", async() => {
		test = await RoutePriceHolder.new({ from: owner0 })
	})

	describe("setRoutePrice", () => {

		it("should allow setting route price if the owner", async() => {
			await Promise.all([test.addTollBooth(booth0, { from: owner0 }), test.addTollBooth(booth1, { from: owner0 })])
			assert.isTrue(await test.setRoutePrice(booth0, booth1, 43, { from: owner0 }))
			assert.strictEqual(await test.getRoutePrice(booth0, booth1), 43)
		})

		it("should not allow setting route price if not the owner", async() => {
			await Promise.all([test.addTollBooth(booth0, { from: owner0 }), test.addTollBooth(booth1, { from: owner0 })])
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, booth1, 43, { from: owner1, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if entry booth is not a registered TollBooth", async() => {
			await test.addTollBooth(booth1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if exit booth is not a registered TollBooth", async() => {
			await test.addTollBooth(booth0, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if toll booths are not registered", async() => {
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if entry booth and exit booth are the same", async() => {
			await test.addTollBooth(booth1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth1, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if entry booth is null", async() => {
			await test.addTollBooth(booth1, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setRoutePrice(0x0, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price if exit booth is null", async() => {
			await test.addTollBooth(booth0)
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, 0x0, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

		it("should not allow setting route price to its current value", async() => {
			await Promise.all([test.addTollBooth(booth0, { from: owner0 }), test.addTollBooth(booth1, { from: owner0 })])
			await test.setRoutePrice(booth0, booth1, 43, { from: owner0 })
			return expectedExceptionPromise(
				() => test.setRoutePrice(booth0, booth1, 43, { from: owner0, gas: 3000000 }),
				3000000
			)
		})

	})

})

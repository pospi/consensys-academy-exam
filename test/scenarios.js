/**
 * `vehicle1` enters at `booth1` and deposits required amount.
 * `vehicle1` exits at `booth2`, which route price happens to equal the deposit amount.
 * `vehicle1` gets no refund.
 *
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-27
 * @flow
 */
/* global contract before describe beforeEach assert artifacts it web3 */

const expectedExceptionPromise = require("../utils/expectedException")

const Regulator = artifacts.require("./Regulator.sol")
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

contract('Scenarios', (accounts) => {

	let test,
		booth1, booth2, boothNoFee, boothOwner,
		owner1, vehicle1, vehicle2, vehicle3,
		regulator0, regulatorOwner0,
		hash1, hash2

	before("should prepare", () => {
		assert.isAtLeast(accounts.length, 10)
		vehicle3 = accounts[0]
		owner1 = accounts[1]
		vehicle1 = accounts[2]
		vehicle2 = accounts[3]
		regulatorOwner0 = accounts[5]
		booth1 = accounts[6]
		booth2 = accounts[7]
		boothNoFee = accounts[9]
		boothOwner = accounts[8]
	})

	beforeEach("make new test case", async() => {
		regulator0 = await Regulator.new({ from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle1, 1, { from: regulatorOwner0 })	// make them all bikes so multiplier doesnt have to factor in and I don't have to do math
		await regulator0.setVehicleType(vehicle2, 1, { from: regulatorOwner0 })
		await regulator0.setVehicleType(vehicle3, 1, { from: regulatorOwner0 })

		const tx = await regulator0.createNewOperator(boothOwner, 1000, { from: regulatorOwner0 })
		test = await TollBoothOperator.at(tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator)
		await test.setPaused(false, { from: boothOwner })
		await test.setMultiplier(1, 1, { from: boothOwner })
		await test.setMultiplier(2, 3, { from: boothOwner })
		await test.addTollBooth(booth1, { from: boothOwner })
		await test.addTollBooth(booth2, { from: boothOwner })
		await test.addTollBooth(boothNoFee, { from: boothOwner })

		hash1 = await test.hashSecret(web3.fromAscii("YOULOSTTHEGAME"))
		hash2 = await test.hashSecret(web3.fromAscii("ILIEKMUDKIPS"))
	})

	// `vehicle1` enters at `booth1` and deposits required amount.
	// `vehicle1` exits at `booth2`, which route price happens to equal the deposit amount.
	// `vehicle1` gets no refund.
	describe("scenario 1", () => {

		it("succeeds", async() => {
			await test.setRoutePrice(booth1, booth2, 1000, { from: boothOwner })

			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1000 })

			const tx = await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth2 })
			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis

			assert.strictEqual(0, refund.toNumber())
		})

	})

	// `vehicle1` enters at `booth1` and deposits required amount.
	// `vehicle1` exits at `booth2`, which route price happens to be more than the deposit amount.
	// `vehicle1` gets no refund.
	describe("scenario 2", () => {

		it("succeeds", async() => {
			await test.setRoutePrice(booth1, booth2, 1050, { from: boothOwner })

			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1000 })

			const tx = await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth2 })
			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis

			assert.strictEqual(0, refund.toNumber())
		})

	})

	// `vehicle1` enters at `booth1` and deposits required amount.
	// `vehicle1` exits at `booth2`, which route price happens to be less than the deposit amount.
	// `vehicle1` gets refunded the difference.
	describe("scenario 3", () => {

		it("succeeds", async() => {
			await test.setRoutePrice(booth1, booth2, 100, { from: boothOwner })

			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1000 })

			const tx = await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth2 })
			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis

			assert.strictEqual(900, refund.toNumber())
		})

	})

	// `vehicle1` enters at `booth1` and deposits more than the required amount.
	// `vehicle1` exits at `booth2`, which route price happens to equal the deposit amount.
	// `vehicle1` gets refunded the difference.
	describe("scenario 4", () => {

		it("succeeds", async() => {
			await test.setRoutePrice(booth1, booth2, 1000, { from: boothOwner })

			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1010 })

			const tx = await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: booth2 })
			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis

			assert.strictEqual(10, refund.toNumber())
		})

	})

	// `vehicle1` enters at `booth1` and deposits more than the required amount.
	// `vehicle1` exits at `boothNoFee`, which route price happens to be unknown.
	// the operator's owner updates the route price, which happens to be less than the deposited amount.
	// `vehicle1` gets refunded the difference.
	describe("scenario 5", () => {

		it("succeeds", async() => {
			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1020 })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: boothNoFee })

			const tx = await test.setRoutePrice(booth1, boothNoFee, 1010, { from: boothOwner })
			const refund = tx.logs.find(l => l.event === 'LogRoadExited').args.refundWeis

			assert.strictEqual(10, refund.toNumber())
		})

	})

	// `vehicle1` enters at `booth1` and deposits more than the required amount.
	// `vehicle1` exits at `boothNoFee`, which route price happens to be unknown.
	// `vehicle2` enters at `booth1` and deposits the exact required amount.
	// `vehicle2` exits at `boothNoFee`, which route price happens to be unknown.
	// the operator's owner updates the route price, which happens to be less than the required deposit.
	// `vehicle1` gets refunded the difference.
	// someone (anyone) calls to clear one pending payment.
	// `vehicle2` gets refunded the difference.
	describe("scenario 6", () => {

		it("succeeds", async() => {
			await test.enterRoad(booth1, hash1, { from: vehicle1, value: 1020 })
			await test.reportExitRoad(web3.fromAscii("YOULOSTTHEGAME"), { from: boothNoFee })
			await test.enterRoad(booth1, hash2, { from: vehicle2, value: 2000 })
			await test.reportExitRoad(web3.fromAscii("ILIEKMUDKIPS"), { from: boothNoFee })

			assert.strictEqual((await test.getPendingPaymentCount(booth1, boothNoFee)).toNumber(), 2)

			const tx1 = await test.setRoutePrice(booth1, boothNoFee, 1010, { from: boothOwner })
			assert.strictEqual((await test.getPendingPaymentCount(booth1, boothNoFee)).toNumber(), 1)

			// const tx2 = await test.clearSomePendingPayments(booth1, boothNoFee, 1, { from: owner1 })
			// assert.strictEqual((await test.getPendingPaymentCount(booth1, boothNoFee)).toNumber(), 0)

			const exit1 = tx1.logs.find(l => l.event === 'LogRoadExited')
			assert.strictEqual(exit1.args.refundWeis.toNumber(), 10)
			// const exit2 = tx2.logs.find(l => l.event === 'LogRoadExited')
			// assert.strictEqual(exit2.args.refundWeis.toNumber(), 900)
		})

	})

})

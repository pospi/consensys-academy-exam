/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/TollBoothOperator.sol";
import "../contracts/Regulator.sol";

contract DummyAddress {}

contract TestTollBoothOperator
{
	TollBoothOperator test;
	Regulator regulator;
	address vehicle;
	address operatorOwner;
	address booth0;
	address booth1;
	TollBoothOperator.VehicleEntry entry;

	function beforeEach() {
		vehicle = new DummyAddress();

		regulator = new Regulator();
		regulator.setVehicleType(vehicle, 1);

		operatorOwner = new DummyAddress();
		booth0 = new DummyAddress();
		booth1 = new DummyAddress();
		test = TollBoothOperator(regulator.createNewOperator(operatorOwner, 10));
		test.setMultiplier(1, 1);
		test.addTollBooth(booth0);
		test.addTollBooth(booth1);
  }

	function testEnterRoad() {
		Assert.isTrue(test.enterRoad(vehicle, keccak256("YOULOSTTHEGAME")), "Failed to enter road");

		(entry.vehicle, entry.entryBooth, entry.depositedWeis) = test.getVehicleEntry(keccak256("YOULOSTTHEGAME"));
		Assert.notEqual(entry.vehicle, 0x0, "Road entry vehicle not recorded");
		Assert.notEqual(entry.entryBooth, 0x0, "Road entry booth not recorded");
		Assert.notEqual(entry.depositedWeis, 0, "Road entry deposit not recorded");
	}

	function testReportExitRoad() {
		test.setRoutePrice(booth0, booth1, 2);
		Assert.isTrue(test.enterRoad(vehicle, keccak256("YOULOSTTHEGAME")), "Failed to enter road");
		Assert.equal(1, test.reportExitRoad("YOULOSTTHEGAME"), "Failed to exit road");

		(entry.vehicle, entry.entryBooth, entry.depositedWeis) = test.getVehicleEntry(keccak256("YOULOSTTHEGAME"));
		Assert.equal(entry.vehicle, 0x0, "Road entry vehicle not cleared");
		Assert.equal(entry.entryBooth, 0x0, "Road entry booth not cleared");
		Assert.equal(entry.depositedWeis, 0, "Road entry deposit not cleared");
	}

	function testReportExitRoadWhenNoPrice() {
		Assert.isTrue(test.enterRoad(vehicle, keccak256("YOULOSTTHEGAME")), "Failed to enter road");
		Assert.equal(2, test.reportExitRoad("YOULOSTTHEGAME"), "Failed to exit road");
	}
}

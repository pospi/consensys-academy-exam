/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/Regulator.sol";

contract DummyVehicle {}

contract TestRegulator {
    function testCreation() {
      Regulator test = new Regulator();
    }

    function testSetVehicleType() {
      Regulator test = new Regulator();
      DummyVehicle vehicle = new DummyVehicle();
      test.setVehicleType(vehicle, 1);
      Assert.equal(test.getVehicleType(vehicle), 1, "Vehicle type not changed");
    }

    function testClearVehicleType() {
      Regulator test = new Regulator();
      DummyVehicle vehicle = new DummyVehicle();
      test.setVehicleType(vehicle, 2);
      test.setVehicleType(vehicle, 0);
      Assert.equal(test.getVehicleType(vehicle), 0, "Vehicle type not cleared");
    }
}

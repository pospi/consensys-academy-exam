/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/Regulated.sol";

contract DummyAddress {}

contract TestRegulated
{
	function testSetRegulator() {
		RegulatedI test = new Regulated(this);
		address newRegulator = new DummyAddress();
		Assert.isTrue(test.setRegulator(newRegulator), "Failed to set regulator");
		Assert.equal(test.getRegulator(), newRegulator, "Regulator was not set");
	}
}

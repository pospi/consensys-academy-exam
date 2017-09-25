/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/TollBoothHolder.sol";

contract DummyAddress {}

contract TestTollBoothHolder
{
	function testAddTollBooth() {
		address booth = new DummyAddress();

		TollBoothHolder test = new TollBoothHolder();
		Assert.isTrue(test.addTollBooth(booth), "Toll booth could not be added");
		Assert.isTrue(test.isTollBooth(booth), "Toll booth was not registered");
	}
}

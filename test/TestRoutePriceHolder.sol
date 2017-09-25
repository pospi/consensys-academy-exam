/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-25
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/RoutePriceHolder.sol";

contract DummyAddress {}

contract TestRoutePriceHolder
{
	function testSetRoutePrice() {
		address entryBooth = new DummyAddress();
		address exitBooth = new DummyAddress();

		RoutePriceHolder test = new RoutePriceHolder();
		Assert.isTrue(test.setRoutePrice(entryBooth, exitBooth, 100), "Route price not set");
		Assert.equal(test.getRoutePrice(entryBooth, exitBooth), 100, "Route price was not changed");
	}
}

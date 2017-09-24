/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-24
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/MultiplierHolder.sol";

contract TestMultiplierHolder {
    function testSetMultiplier() {
        MultiplierHolderI test = new MultiplierHolder();
        Assert.isTrue(test.setMultiplier(1, 1), "Failed to set multiplier");
        Assert.equal(test.getMultiplier(1), 1, "Multiplier was not set");
    }
}

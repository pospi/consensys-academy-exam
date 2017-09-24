pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/Pausable.sol";

contract TestPausable {
    function testDefaultPausable() {
        PausableI test = new Pausable(true);
        Assert.isTrue(test.isPaused(), "Failed to initialise paused");
        PausableI test2 = new Pausable(false);
        Assert.isFalse(test2.isPaused(), "Failed to initialise unpaused");
    }

    function testSetPausable() {
        PausableI test = new Pausable(false);
        Assert.isTrue(test.setPaused(true), "Failed to update paused status");
        Assert.equal(test.isPaused(), true, "Paused status should have been changed");
    }
}

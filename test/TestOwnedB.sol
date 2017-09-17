pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/mock/RoutePriceHolderMock.sol";
import "../contracts/TollBoothOperator.sol";

contract TestOwnedB {

    uint instanceCount = 2;

    function createInstance(uint index) private returns(OwnedI) {
        if (index == 0) {
            return new RoutePriceHolderMock();
        } else if (index == 1) {
            return new TollBoothOperator(true, 1, this);
        } else {
            revert();
        }
    }

    function testInitialOwner() {
        OwnedI owned;
        for(uint index = 0; index < instanceCount; index++) {
            owned = createInstance(index);
            Assert.equal(owned.getOwner(), this, "Owner should have been set");
        }
    }

    function testCanChangeOwner() {
        OwnedI owned;
        for(uint index = 0; index < instanceCount; index++) {
            owned = createInstance(index);
            address newOwner = 0x0123456789abcDEF0123456789abCDef01234567;
            Assert.isTrue(owned.setOwner(newOwner), "Failed to change owner");
            Assert.equal(owned.getOwner(), newOwner, "Owner should have been changed");
        }
    }
}

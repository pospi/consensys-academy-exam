/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-24
 */
pragma solidity 0.4.15;

import "truffle/Assert.sol";
import "../contracts/DepositHolder.sol";

contract TestDepositHolder {
    function testCreationWithValue() {
      DepositHolder test = new DepositHolder(10 wei);
      // require(test.send(100 wei));
      Assert.equal(test.getDeposit(), 10 wei, "Initial deposit amount was not saved");
    }

    function testChangeDeposit() {
      DepositHolder test = new DepositHolder(1 wei);
      test.setDeposit(2 wei);
      Assert.equal(test.getDeposit(), 2 wei, "Deposit amount not changed");
    }
}

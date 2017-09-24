pragma solidity 0.4.15;

import "../Pausable.sol";


contract PausableMock is Pausable {

    mapping(bool => uint) public counters;

    function PausableMock(bool paused) Pausable(paused) {
    }

    function countUpWhenPaused()
        whenPaused()
    {
        counters[isPaused()]++;
    }

    function countUpWhenNotPaused()
        whenNotPaused()
    {
        counters[isPaused()]++;
    }
}

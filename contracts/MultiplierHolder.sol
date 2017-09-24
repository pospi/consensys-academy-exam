/**
 * Storage for fare multipliers per different vehicle types
 *
 * Configurable by regulator operator
 *
 * @package: Consensys Academy exam pt2
 * @author:	pospi <sam.pospi@consensys.net>
 * @since:	 2017-09-24
 */
pragma solidity 0.4.15;

import "./interfaces/MultiplierHolderI.sol";
import "./Owned.sol";


contract MultiplierHolder is MultiplierHolderI, Owned
{
	uint constant TYPE_NONE = 0;
	uint constant TYPE_MOTORBIKE = 1;
	uint constant TYPE_CAR = 2;
	uint constant TYPE_TRUCK = 3;

	mapping(uint8 => uint) vehicleTypeMultipliers;

	/**
	 * Event emitted when a new multiplier has been set.
	 * @param sender The account that ran the action.
	 * @param vehicleType The type of vehicle for which the multiplier was set.
	 * @param multiplier The actual multiplier set.
	 */
	event LogMultiplierSet(
		address indexed sender,
		uint indexed vehicleType,
		uint multiplier);

	/**
	 * Called by the owner of the TollBoothOperator.
	 * Can be used to update a value.
	 * It should roll back if the vehicle type is 0.
	 * Setting the multiplier to 0 is equivalent to removing it and is acceptable.
	 * It should roll back if the same multiplier is already set to the vehicle type.
	 * @param vehicleType The type of the vehicle being set.
	 * @param multiplier The multiplier to use.
	 * @return Whether the action was successful.
	 * Emits LogMultiplierSet.
	 */
	function setMultiplier(
		uint vehicleType,
		uint multiplier
	)
		fromOwner()
		public
		returns(bool success)
	{
		require(vehicleType != 0);
		require(vehicleTypeMultipliers[uint8(vehicleType)] != multiplier);

		LogMultiplierSet(msg.sender, vehicleType, multiplier);
		vehicleTypeMultipliers[uint8(vehicleType)] = multiplier;
		return true;
	}

	/**
	 * @param vehicleType The type of vehicle whose multiplier we want
	 *	 It should accept a vehicle type equal to 0.
	 * @return The multiplier for this vehicle type.
	 *	 A 0 value indicates a non-existent multiplier.
	 */
	function getMultiplier(uint vehicleType)
		constant
		public
		returns(uint multiplier)
	{
		return vehicleTypeMultipliers[uint8(vehicleType)];
	}
}

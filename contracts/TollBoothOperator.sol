/**
 * Toll booth operator
 *
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-24
 */
pragma solidity 0.4.15;

import "./interfaces/TollBoothOperatorI.sol";
import "./TollBoothHolder.sol";
import "./DepositHolder.sol";
import "./MultiplierHolder.sol";
import "./RoutePriceHolder.sol";
import "./Regulated.sol";
import "./Pausable.sol";


contract TollBoothOperator is TollBoothOperatorI, TollBoothHolder, DepositHolder, MultiplierHolder, RoutePriceHolder, Regulated, Pausable
{
	struct VehicleEntry {
		address vehicle;
		address entryBooth;
		uint256 depositedWeis;
	}

	mapping(bytes32 => VehicleEntry) activeVehicles;
	mapping(address => mapping(address => bytes32[])) pendingPayments;

	function TollBoothOperator(bool paused, uint depositWei, address regulator)
		TollBoothHolder()
		DepositHolder(depositWei)
		MultiplierHolder()
		RoutePriceHolder()
		Regulated(regulator)
		Pausable(paused)
		Owned()
	{}

	/**
	 * This provides a single source of truth for the encoding algorithm.
	 * @param secret The secret to be hashed.
	 * @return the hashed secret.
	 */
	function hashSecret(bytes32 secret)
		constant
		public
		returns(bytes32 hashed)
	{
		return keccak256(secret);
	}

	/**
	 * Event emitted when a vehicle made the appropriate deposit to enter the road system.
	 * @param vehicle The address of the vehicle that entered the road system.
	 * @param entryBooth The declared entry booth by which the vehicle will enter the system.
	 * @param exitSecretHashed A hashed secret that when solved allows the operator to pay itself.
	 * @param depositedWeis The amount that was deposited as part of the entry.
	 */
	event LogRoadEntered(
		address indexed vehicle,
		address indexed entryBooth,
		bytes32 indexed exitSecretHashed,
		uint depositedWeis);

	/**
	 * Called by the vehicle entering a road system.
	 * Off-chain, the entry toll booth will open its gate up successful deposit and confirmation
	 * of the vehicle identity.
	 *	 It should roll back when the contract is in the `true` paused state.
	 *	 It should roll back if `entryBooth` is not a tollBooth.
	 *	 It should roll back if less than deposit * multiplier was sent alongside.
	 *	 It should be possible for a vehicle to enter "again" before it has exited from the
	 *	   previous entry.
	 * @param entryBooth The declared entry booth by which the vehicle will enter the system.
	 * @param exitSecretHashed A hashed secret that when solved allows the operator to pay itself.
	 *   A previously used exitSecretHashed cannot be used ever again.
	 * @return Whether the action was successful.
	 * Emits LogRoadEntered.
	 */
	function enterRoad(
		address entryBooth,
		bytes32 exitSecretHashed
	)
		whenNotPaused()
		public
		payable
		returns (bool success)
	{
		require(isTollBooth(entryBooth));
		require(getRegulator().getVehicleType(msg.sender) != 0);
		require(msg.value >= getRequiredVehicleDeposit(msg.sender));

		activeVehicles[exitSecretHashed] = VehicleEntry({
			vehicle: msg.sender,
			entryBooth: entryBooth,
			depositedWeis: msg.value
		});

		LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);

		return true;
	}

	/**
	 * @param exitSecretHashed The hashed secret used by the vehicle when entering the road.
	 * @return The information pertaining to the entry of the vehicle.
	 *	 vehicle: the address of the vehicle that entered the system.
	 *	 entryBooth: the address of the booth the vehicle entered at.
	 *	 depositedWeis: how much the vehicle deposited when entering.
	 * After the vehicle has exited, `depositedWeis` should be returned as `0`.
	 * If no vehicles had ever entered with this hash, all values should be returned as `0`.
	 */
	function getVehicleEntry(bytes32 exitSecretHashed)
		constant
		public
		returns(
			address vehicle,
			address entryBooth,
			uint depositedWeis
		)
	{
		return (
			activeVehicles[exitSecretHashed].vehicle,
			activeVehicles[exitSecretHashed].entryBooth,
			activeVehicles[exitSecretHashed].depositedWeis
		);
	}

	/**
	 * Event emitted when a vehicle exits a road system.
	 * @param exitBooth The toll booth that saw the vehicle exit.
	 * @param exitSecretHashed The hash of the secret given by the vehicle as it
	 *	 passed by the exit booth.
	 * @param finalFee The toll fee taken from the deposit.
	 * @param refundWeis The amount refunded to the vehicle, i.e. deposit - fee.
	 */
	event LogRoadExited(
		address indexed exitBooth,
		bytes32 indexed exitSecretHashed,
		uint finalFee,
		uint refundWeis);

	/**
	 * Event emitted when a vehicle used a route that has no known fee.
	 * It is a signal for the oracle to provide a price for the pair.
	 * @param exitSecretHashed The hashed secret that was defined at the time of entry.
	 * @param entryBooth The address of the booth the vehicle entered at.
	 * @param exitBooth The address of the booth the vehicle exited at.
	 */
	event LogPendingPayment(
		bytes32 indexed exitSecretHashed,
		address indexed entryBooth,
		address indexed exitBooth);

	/**
	 * Called by the exit booth.
	 *	 It should roll back when the contract is in the `true` paused state.
	 *	 It should roll back when the sender is not a toll booth.
	 *	 It should roll back if the exit is same as the entry.
	 *	 It should roll back if the secret does not match a hashed one.
	 * @param exitSecretClear The secret given by the vehicle as it passed by the exit booth.
	 * @return status:
	 *   1: success, -> emits LogRoadExited
	 *   2: pending oracle -> emits LogPendingPayment
	 */
	function reportExitRoad(bytes32 exitSecretClear)
		whenNotPaused()
		public
		returns (uint status)
	{
		bytes32 hashed = keccak256(exitSecretClear);
		address vehicle = activeVehicles[hashed].vehicle;
		address entryBooth = activeVehicles[hashed].entryBooth;

		require(isTollBooth(msg.sender));
		require(vehicle != 0x0);
		require(msg.sender != entryBooth);

		return handleVehicleExit(hashed, true);
	}

	/**
	 * @param entryBooth the entry booth that has pending payments.
	 * @param exitBooth the exit booth that has pending payments.
	 * @return the number of payments that are pending because the price for the
	 * entry-exit pair was unknown.
	 */
	function getPendingPaymentCount(address entryBooth, address exitBooth)
		constant
		public
		returns (uint count)
	{
		return pendingPayments[entryBooth][exitBooth].length;
	}

	/**
	 * Can be called by anyone. In case more than 1 payment was pending when the oracle gave a price.
	 *	 It should roll back when the contract is in `true` paused state.
	 *	 It should roll back if booths are not really booths.
	 *	 It should roll back if there are fewer than `count` pending payment that are solvable.
	 *	 It should roll back if `count` is `0`.
	 * @param entryBooth the entry booth that has pending payments.
	 * @param exitBooth the exit booth that has pending payments.
	 * @param count the number of pending payments to clear for the exit booth.
	 * @return Whether the action was successful.
	 * Emits LogRoadExited as many times as count.
	 */
	function clearSomePendingPayments(
		address entryBooth,
		address exitBooth,
		uint count
	)
		whenNotPaused()
		public
		returns (bool success)
	{
		uint currentNumPayments = getPendingPaymentCount(entryBooth, exitBooth);

		require(count > 0);
		require(isTollBooth(entryBooth) && isTollBooth(exitBooth));
		require(currentNumPayments < count);

		for (uint i = 0; i < count; ++i) {
			handleVehicleExit(pendingPayments[entryBooth][exitBooth][i], false);
		}

		return true;
	}

	/**
	 * @return The amount that has been collected so far through successful payments.
	 */
	function getCollectedFeesAmount()
		constant
		public
		returns(uint amount)
	{

	}

	/**
	 * Event emitted when the owner collects the fees.
	 * @param owner The account that sent the request.
	 * @param amount The amount collected.
	 */
	event LogFeesCollected(
		address indexed owner,
		uint amount);

	/**
	 * Called by the owner of the contract to withdraw all collected fees (not deposits) to date.
	 *	 It should roll back if any other address is calling this function.
	 *	 It should roll back if there is no fee to collect.
	 *	 It should roll back if the transfer failed.
	 * @return success Whether the operation was successful.
	 * Emits LogFeesCollected.
	 */
	function withdrawCollectedFees()
		public
		returns(bool success)
	{

	}

	function handleVehicleExit(bytes32 exitSecretHashed, bool skipPendingHandling)
		private
		returns(uint status)
	{
		address vehicle = activeVehicles[exitSecretHashed].vehicle;
		address entryBooth = activeVehicles[exitSecretHashed].entryBooth;

		uint basePrice = getRoutePrice(entryBooth, msg.sender);

		// if no route price, we can't do anything yet. Payment remains and gets logged "pending".
		if (!skipPendingHandling && basePrice == 0) {
			pendingPayments[entryBooth][msg.sender].push(exitSecretHashed);
			LogPendingPayment(exitSecretHashed, entryBooth, msg.sender);
			return 2;
		}

		uint fee = basePrice * getVehicleMultiplier(vehicle);
		uint deposit = activeVehicles[exitSecretHashed].depositedWeis;
		uint refund = fee > deposit ? deposit : deposit - fee;

		// exit the road
		delete activeVehicles[exitSecretHashed];

		// log an event
		LogRoadExited(msg.sender, exitSecretHashed, fee, refund);

		// refund any extra deposit back to the vehicle
		// don't bother caring if it fails, their fault for trying to exploit us
		vehicle.send(refund);

		return 1;
	}

	function getRequiredVehicleDeposit(address vehicle)
		constant
		internal
		returns(uint fee)
	{
		return getDeposit() * getVehicleMultiplier(vehicle);
	}

	function getVehicleMultiplier(address vehicle)
		constant
		internal
		returns(uint mult)
	{
		return getMultiplier(getRegulator().getVehicleType(vehicle));
	}

}

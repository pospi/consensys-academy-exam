/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-27
 * @flow
 */
/* global artifacts */

const Regulator = artifacts.require("./Regulator.sol")
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

module.exports = async (deployer, network, accounts) => {
	const [regulatorOwner, operatorOwner] = accounts

	await deployer.deploy(Regulator, { from: regulatorOwner })

	const tx = await Regulator.createNewOperator(operatorOwner, 100, { from: regulatorOwner })
	const op = await TollBoothOperator.at(tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator)

	await op.setPaused(true, { from: operatorOwner })
}

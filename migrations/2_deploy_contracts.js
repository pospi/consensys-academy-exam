/**
 * @package: Consensys Academy exam pt2
 * @author:  pospi <sam.pospi@consensys.net>
 * @since:   2017-09-27
 * @flow
 */
/* global artifacts */

const Regulator = artifacts.require("./Regulator.sol")
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

module.exports = (deployer, network, accounts) => deployer.then(async() => {
	const [regulatorOwner, operatorOwner] = accounts

	await deployer.deploy(Regulator, { from: regulatorOwner })

	const regulator = await Regulator.at(Regulator.address)
	const tx = await regulator.createNewOperator(operatorOwner, 100, { from: regulatorOwner })
	const op = await TollBoothOperator.at(tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator)

	await op.setPaused(false, { from: operatorOwner })
})

#!/usr/bin/env bash
#
# Runs geth locally, unlocked, with a clean chain for running tests against
#
# IMPORTANT: Must be run from the toplevel working directory!
#
# @author:  pospi <sam.pospi@consensys.net>
# @since:   2017-09-27
#
##

CHAINDATA_DIR="$HOME/.ethereum/localTestNet"
CHAIN_GENESIS_CONFIG="`pwd`/internals/genesis.json"
ACCOUNT_PASSPHRASE_FILE="`pwd`/internals/noPassword.txt"

mkdir -p "$CHAINDATA_DIR"
rm -Rf "$CHAINDATA_DIR/geth"
geth --password "$ACCOUNT_PASSPHRASE_FILE" --unlock "1,2,3,4,5,6,7,8,9,10" --datadir "$CHAINDATA_DIR" init "$CHAIN_GENESIS_CONFIG"
geth --password "$ACCOUNT_PASSPHRASE_FILE" --unlock "1,2,3,4,5,6,7,8,9,10" --networkid=33 --datadir="$CHAINDATA_DIR" console > /dev/null 2>&1

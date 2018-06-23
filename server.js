'use strict'

const config = require('config')
const MetronomeContracts = require('metronome-contracts')
const Web3 = require('web3')

const logger = require('./logger')

const web3 = new Web3(config.eth.wsUrl)
const contracts = new MetronomeContracts(web3)

const subscription = web3.eth.subscribe('newBlockHeaders')

function getTokensSold ({ minting }) {
  return 8000000 - Number.parseInt(minting.padStart(25, '0').substr(0, 7))
}

function getMillonsSold (heartbeat) {
  return Math.floor(getTokensSold(heartbeat) / 1000000)
}

function getPercentageSold (heartbeat) {
  return Math.floor(getTokensSold(heartbeat) / 8000000 * 100)
}

let pHeartbeat = {
  minting: '8000000000000000000000000'
}

subscription.on('data', function () {
  logger.debug('new block header')
  contracts.auctions.methods.isInitialAuctionEnded()
    .call()
    .then(function (ended) {
      if (ended) {
        logger.info('ISA Ended!')
        process.exit(0)
      }
      return contracts.auctions.methods.heartbeat()
        .call()
        .then(function (heartbeat) {
          // notify every 1MM tokens sold
          if (getMillonsSold(heartbeat) - getMillonsSold(pHeartbeat) === 1) {
            logger.info(`${getMillonsSold(heartbeat)} millon MET sold!`)
          }
          // notify every 1%
          if (getPercentageSold(heartbeat) !== getPercentageSold(pHeartbeat)) {
            logger.info(`${getPercentageSold(heartbeat)}% of ISA tokens sold!`)
          }
          // remember last state
          logger.debug('Updating last heartbeat')
          pHeartbeat = heartbeat
        })
    })
    .catch(function (err) {
      logger.error('Processing error:', err.message)
    })
})

subscription.on('error', function (err) {
  logger.error('Subscription error:', err.message)
})

logger.info('Monitor started')

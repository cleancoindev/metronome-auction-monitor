/* eslint-env mocha */
/* eslint-disable no-console, no-shadow */

'use strict'

const proxyquire = require('proxyquire')
const EventEmtter = require('events')

const emitter = new EventEmtter()

const mockWeb3 = function () {
  this.eth = {
    subscribe () {
      return {
        on (ev, fn) {
          emitter.on(`subscription-${ev}`, fn)
        }
      }
    }
  }
}

const mockData = {
  heartbeat: null
}

const mockMetronomeContracts = function () {
  this.auctions = {
    methods: {
      heartbeat () {
        return {
          call () {
            return Promise.resolve(mockData.heartbeat)
          }
        }
      },
      isInitialAuctionEnded () {
        return {
          call () {
            return Promise.resolve(false)
          }
        }
      }
    }
  }
}

const mockLogger = {
  debug (msg) {
    emitter.emit('logger-debug', msg)
  },
  info (msg) {
    console.log(msg)
    emitter.emit('logger-info', msg)
  }
}

proxyquire('./server', {
  './logger': mockLogger,
  'metronome-contracts': mockMetronomeContracts,
  'web3': mockWeb3
})

it('should not log', function (done) {
  mockData.heartbeat = { minting: '7999999999999999999999999999999' }
  emitter.on('logger-info', function () {
    emitter.removeAllListeners('logger-info')
    emitter.removeAllListeners('logger-debug')
    done(new Error('logger.info() should not have been called'))
  })
  emitter.on('logger-debug', function (msg) {
    if (msg === 'Updating last heartbeat') {
      emitter.removeAllListeners('logger-info')
      emitter.removeAllListeners('logger-debug')
      done()
    }
  })
  emitter.emit('subscription-data')
})

it('should log at 1 millon sold', function (done) {
  let logs = 2
  mockData.heartbeat = { minting: '6999999999999999999999999999999' }
  emitter.on('logger-info', function () {
    logs -= 1
    if (!logs) {
      emitter.on('logger-debug', function (msg) {
        if (msg === 'Updating last heartbeat') {
          emitter.removeAllListeners('logger-info')
          emitter.removeAllListeners('logger-debug')
          done()
        }
      })
    }
  })
  emitter.emit('subscription-data')
})

it('should log only %', function (done) {
  let logs = 1
  mockData.heartbeat = { minting: '6499999999999999999999999999999' }
  emitter.on('logger-info', function () {
    logs -= 1
    if (!logs) {
      emitter.on('logger-debug', function (msg) {
        if (msg === 'Updating last heartbeat') {
          emitter.removeAllListeners('logger-info')
          emitter.removeAllListeners('logger-debug')
          done()
        }
      })
    }
  })
  emitter.emit('subscription-data')
})

it('should log at 2 millon sold', function (done) {
  let logs = 2
  mockData.heartbeat = { minting: '5999999999999999999999999999999' }
  emitter.on('logger-info', function () {
    logs -= 1
    if (!logs) {
      emitter.on('logger-debug', function (msg) {
        if (msg === 'Updating last heartbeat') {
          emitter.removeAllListeners('logger-info')
          emitter.removeAllListeners('logger-debug')
          done()
        }
      })
    }
  })
  emitter.emit('subscription-data')
})

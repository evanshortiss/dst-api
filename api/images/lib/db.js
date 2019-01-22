require('make-promises-safe')

const moment = require('moment')
const env = require('env-var')
const log = require('pino')({
  name: __filename,
  level: 'info'
})
const mongodb = require('mongodb')

const MONGO_URL = env
  .get('MONGODB_CONNECTION_STRING')
  .required()
  .asUrlString()

/**
 * Provides access to the underlying MongoDB instance
 * @returns {Promise<mongodb.Db>}
 */
const _db = exports.getDb = mongodb.MongoClient.connect(MONGO_URL).then(client => {
  log.info('mongodb connection established')
  return Promise.resolve(client.db('docker-stats-tracker'))
})
  .catch(e => {
    console.log(e.stack)
    process.exit(1)
  })

/**
 * Returns a reference to colllection
 * @param {String} name
 */
const getCollection = exports.getCollection = async name => {
  log.debug(`fetching collection reference for "${name}"`)
  const db = await _db

  return db.collection(name)
}

/**
 * Simple getter that returns a reference to the "stats" collection
 */
exports.getStatsCollection = () => getCollection('stats')

/**
 * Simple getter that returns a reference to the "refresh-runs" collection
 */
exports.getRunsCollection = () => getCollection('refresh-runs')

/**
 * Fetches the latest image names using the latest complete run.
 * @return {Promise<Array<String>>}
 */
exports.getLatestAvailableImageNames = async () => {
  log.info('fetching latest available image names')

  const latestRun = await getLatestRunItem()
  const statsCol = await getCollection('stats')
  const runId = new mongodb.ObjectID(latestRun._id)

  log.info(`fetching latest available image names using runId "${runId}"`)

  return statsCol.distinct('name', { runId })
}

/**
 * Returns all image names we've ever come across
 * @returns {Promise<string[]>}
 */
exports.getAllDistinctImageNames = async () => {
  const statsCol = await getCollection('stats')

  return statsCol.distinct('name')
}

/**
 * Get the latest officially supported image names
 */
exports.getLatestDistinctImageNames = async () => {
  const latestRunItem = await getLatestRunItem()
  const statsCol = await exports.getStatsCollection()

  return statsCol.distinct('name', { runId: new mongodb.ObjectID(latestRunItem._id) })
}

/**
 * Returns all "stats" entries for a given runId
 */
exports.getStatsForRunId = async runId => {
  const statsCol = await getCollection('stats')

  return statsCol.find({ runId: new mongodb.ObjectID(runId) }).toArray()
}

const getLatestRunItem = exports.getLatestRunItem = async function () {
  const refreshCol = await getCollection('refresh-runs')

  const lastRunItem = await refreshCol.find({
    endTs: {
      $exists: true
    }
  })
    .limit(1)
    .sort({ $natural: -1 })
    .toArray()

  if (!lastRunItem || !lastRunItem[0]) {
    throw new Error('unable to get latest run item')
  }

  return lastRunItem[0]
}

exports.getFirstRunItemOfCurrentMonth = async () => {
  const refreshCol = await getCollection('refresh-runs')

  const firstRunItem = await refreshCol.find({
    endTs: {
      $gte: moment.utc().startOf('month').toDate(),
      $exists: true
    }
  })
    .limit(1)
    .sort({ $natural: 1 })
    .toArray()

  if (!firstRunItem || !firstRunItem[0]) {
    throw new Error('unable to get first run item of the month')
  }

  return firstRunItem[0]
}

exports.getFirstRunItem = async function () {
  const refreshCol = await getCollection('refresh-runs')

  const lastRunItem = await refreshCol.find({
    endTs: {
      $exists: true
    }
  })
    .limit(1)
    .sort({ $natural: 1 })
    .toArray()

  if (!lastRunItem || !lastRunItem[0]) {
    throw new Error('unable to get first run item')
  }

  return lastRunItem[0]
}

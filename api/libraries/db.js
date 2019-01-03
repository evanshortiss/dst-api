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

const _db = exports.getDb = mongodb.MongoClient.connect(MONGO_URL).then(client => {
  log.info('mongodb connection established')
  return Promise.resolve(client.db('docker-stats-tracker'))
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

exports.getLatestAvailableImageNames = async () => {
  log.info('fetching latest available image names')

  const latestRun = await getLatestRunItem()
  const statsCol = await getCollection('stats')
  const runId = new mongodb.ObjectID(latestRun._id)

  log.info(`fetching latest available image names using runId "${runId}"`)

  return statsCol.distinct('name', { runId })
}

exports.getStatsCollection = () => getCollection('stats')
exports.getRunsCollection = () => getCollection('refresh-runs')

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

require('make-promises-safe')

const mongodb = require('mongodb')
const JSONStream = require('JSONStream')
const env = require('env-var')
const boom = require('boom')
const log = require('pino')({
  name: __filename,
  level: 'info'
})

const MONGO_URL = env
  .get('MONGODB_CONNECTION_STRING')
  .required()
  .asUrlString()

const _db = mongodb.MongoClient.connect(MONGO_URL).then(client => {
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

/**
 *
 */
module.exports = async (req, res) => {
  const refreshCol = await getCollection('refresh-runs')
  const statsCol = await getCollection('stats')

  // Get the last item inserted, we need the timestamp
  const lastRunItem = await refreshCol.find({
    endTs: {
      $exists: true
    }
  })
    .limit(1)
    .sort({ $natural: -1 })
    .toArray()

  if (lastRunItem && lastRunItem.length > 0) {
    log.info('fetching and streaming summary for runId:', lastRunItem[0])
    const query = { runId: new mongodb.ObjectID(lastRunItem[0]._id) }
    const projection = {
      _id: 0,
      runId: 0,
      name: 1,
      pullCount: 1,
      starCount: 1,
      pullDelta: 1,
      lastUpdated: 1
    }

    statsCol.find(query, projection)
      .stream()
      .pipe(JSONStream.stringify())
      .pipe(res)
  } else {
    log.error('no run item was found to fetch a summary')

    const err = boom.internal('whoops, something went wrong')

    res.writeHead(err.output.statusCode)
    res.end(JSON.stringify(err.output.payload))
  }
}

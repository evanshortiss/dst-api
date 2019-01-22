require('make-promises-safe')

const mongodb = require('mongodb')
const boom = require('boom')
const db = require('./lib/db')
const log = require('pino')({
  name: __filename,
  level: 'info'
})

/**
 * This returns summary information for all CURRENTLY AVAILABLE official images.
 * Currently available images are those that are listed in the Docker Hub search
 * API results (see get-official-images.js)
 */
module.exports = async (req, res) => {
  const statsCol = await db.getStatsCollection()
  const lastRunItem = await db.getLatestRunItem()

  if (lastRunItem) {
    log.info('fetching and streaming summary for runId:', lastRunItem)

    const query = { runId: new mongodb.ObjectID(lastRunItem._id) }
    const projection = {
      _id: 0,
      runId: 0
    }

    log.info('fetching with query %j and projection %j', query, projection)

    const stats = await statsCol.find(query).project(projection).toArray()

    res.end(JSON.stringify({
      stats,
      run: lastRunItem
    }))
  } else {
    log.error('no run item was found to fetch a summary')

    const err = boom.internal('whoops, something went wrong')

    res.writeHead(err.output.statusCode)
    res.end(JSON.stringify(err.output.payload))
  }
}

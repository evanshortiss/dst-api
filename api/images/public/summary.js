require('make-promises-safe')

const mongodb = require('mongodb')
const JSONStream = require('JSONStream')
const boom = require('boom')
const log = require('pino')({
  name: __filename,
  level: 'info'
})
const db = require('../db')

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

    log.info('fetching with query %j', query)

    statsCol.find(query)
      .project(projection)
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

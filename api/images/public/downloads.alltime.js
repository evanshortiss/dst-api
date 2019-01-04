require('make-promises-safe')

const db = require('../db')
const log = require('pino')({
  name: __filename,
  level: 'debug'
})

async function getLatestImageDownloadCounts () {
  const statsCol = await db.getStatsCollection()
  const imageNames = await db.getAllDistinctImageNames()

  const queries = imageNames.map(name => {
    return statsCol
      .find({ name })
      .project({
        pullCount: 1,
        name: 1
      })
      .sort({ $natural: -1 })
      .limit(1)
      .toArray()
  })

  const results = await Promise.all(queries)

  return results.map(r => r[0])
}

async function getFirstRunDate () {
  const runItem = await db.getFirstRunItem()

  return runItem.startTs
}

module.exports = async (req, res) => {
  log.info('fetching all time download counts')

  const results = await Promise.all([
    getFirstRunDate(),
    getLatestImageDownloadCounts()
  ])

  res.end(JSON.stringify({
    firstRun: results[0],
    downloadCounts: results[1]
  }))
}

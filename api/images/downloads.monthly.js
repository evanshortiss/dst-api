// require('make-promises-safe')

const db = require('./lib/db')
const ObjectID = require('mongodb').ObjectID
const log = require('pino')({
  name: __filename,
  level: 'debug'
})

/**
 * Returns the monthy downloads for all currently supported images.
 * Procedure:
 * 1. Get current official images
 * 2. Find the latest entry for each in "stats" collection
 * 3. Find the oldest entry for each in "stats" collection where:
 *  date >= startOfCurrentMonthUTC
 * 4. Loop over latest, find corresponding oldest and subtract pullCounts
 */
module.exports = async (req, res) => {
  log.info('fetching monthly downloads')

  const collection = await db.getStatsCollection()
  const projection = {
    _id: 0,
    name: 1,
    pullCount: 1
  }

  const runs = await Promise.all([
    db.getFirstRunItemOfCurrentMonth(),
    db.getLatestRunItem()
  ])

  const runsData = await Promise.all([
    collection.find({ runId: new ObjectID(runs[0]._id) }).project(projection).toArray(),
    collection.find({ runId: new ObjectID(runs[1]._id) }).project(projection).toArray()
  ])

  const earliestOfMonthImageStats = runsData[0]
  const latestImageStats = runsData[1]

  log.debug(`earliest items (${earliestOfMonthImageStats.length}) %j`, earliestOfMonthImageStats)
  log.debug(`latest stats (${latestImageStats.length}) %j`, latestImageStats)

  const results = latestImageStats.map((lItem, idx) => {
    const matchingStartItem = earliestOfMonthImageStats.find(eItem => eItem.name === lItem.name)

    if (!matchingStartItem) {
      return {
        name: lItem.name,
        new: true
      }
    } else {
      return {
        name: lItem.name,
        downloads: lItem.pullCount - matchingStartItem.pullCount
      }
    }
  })

  log.info('monthly downloads computed as %j', results)

  res.end(JSON.stringify(results))
}

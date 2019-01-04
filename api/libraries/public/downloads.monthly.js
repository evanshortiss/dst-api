require('make-promises-safe')

const moment = require('moment')
const db = require('../db')
const log = require('pino')({
  name: __filename,
  level: 'debug'
})

async function getEarliestRunIdForCurrentMonth () {
  const runsCol = await db.getRunsCollection()
  const earliestOfMonth = await runsCol
    .find({
      startTs: {
        $gte: moment.utc().startOf('month').toDate()
      }
    })
    .sort({ $natural: 1 })
    .limit(1)
    .toArray()

  if (!earliestOfMonth && !earliestOfMonth[0]) {
    throw new Error('failed to get run for start of the month')
  }

  return earliestOfMonth[0]
}

module.exports = async (req, res) => {
  log.info('fetching monthly downloads')

  const mostRecentRunOfMonth = await db.getLatestRunItem()
  const earliestRunOfMonth = await getEarliestRunIdForCurrentMonth()

  log.info(`recent run is ${mostRecentRunOfMonth.startTs} and earliest for month is ${earliestRunOfMonth.startTs}`)

  const startingItems = await db.getStatsForRunId(earliestRunOfMonth._id)
  const endingItems = await db.getStatsForRunId(mostRecentRunOfMonth._id)

  log.debug(`starting items (${startingItems.length}) %j`, startingItems)
  log.debug(`ending items (${endingItems.length}) %j`, endingItems)

  const results = endingItems.map((eItem, idx) => {
    const matchingStartItem = startingItems.find(sItem => sItem.name === eItem.name)

    if (!matchingStartItem) {
      return {
        name: eItem.name,
        new: true
      }
    } else {
      return {
        name: eItem.name,
        new: false,
        downloads: eItem.pullCount - matchingStartItem.pullCount
      }
    }
  })

  res.end(JSON.stringify(results))
}

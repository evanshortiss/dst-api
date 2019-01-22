require('make-promises-safe')

// const moment = require('moment')
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
  log.info('fetching weekly download numbers')

  // const startOfPastDays = [
  //   moment.utc().startOf('day').subtract(1, 'day'),
  //   moment.utc().startOf('day').subtract(2, 'day'),
  //   moment.utc().startOf('day').subtract(3, 'day'),
  //   moment.utc().startOf('day').subtract(4, 'day'),
  //   moment.utc().startOf('day').subtract(5, 'day'),
  //   moment.utc().startOf('day').subtract(6, 'day'),
  //   moment.utc().startOf('day').subtract(7, 'day')
  // ]

  // const endOfPastDays = [
  //   moment.utc().endOf('day').subtract(1, 'day'),
  //   moment.utc().endOf('day').subtract(2, 'day'),
  //   moment.utc().endOf('day').subtract(3, 'day'),
  //   moment.utc().endOf('day').subtract(4, 'day'),
  //   moment.utc().endOf('day').subtract(5, 'day'),
  //   moment.utc().endOf('day').subtract(6, 'day'),
  //   moment.utc().endOf('day').subtract(7, 'day')
  // ]
}

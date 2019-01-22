const getImages = require('./lib/get-official-images')

/**
 * Returns high-level information for all currently available official images
 */
module.exports = async (req, res) => {
  const images = await getImages()

  res.end(JSON.stringify(images))
}

const getImages = require('../get-official-images')

module.exports = async (req, res) => {
  const images = await getImages()

  res.end(JSON.stringify(images))
}

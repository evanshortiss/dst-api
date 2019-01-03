const axios = require('axios')
const path = require('path')

module.exports = async () => {
  const httpReq = await axios.get('https://github.com/docker-library/official-images/tree/master/library')

  const libraries = httpReq.data
    // Get each line in the HTML
    .split('\n')
    // Extract hrefs matching this pattern, e.g 'library/ubuntu"'
    .map(l => l.match(/\/master\/library\/.*"/gi))
    // Filter out non-matching lines
    .filter(l => l !== null && l[0])
    // Strip ending quote from HTML
    .map(l => l[0].replace('"', ''))
    // Get end segemnt, e.g "ubuntu" from "library/ubuntu"
    .map(l => path.basename(l))

  return libraries
}

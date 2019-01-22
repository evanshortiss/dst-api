const axios = require('axios')
const log = require('pino')({
  name: __filename,
  level: 'debug'
})

module.exports = async () => {
  log.info('fetching official images list')

  const httpReq = await axios.get(
    'https://hub.docker.com/api/content/v1/products/search',
    {
      params: {
        image_filter: 'official',
        page_size: 250,
        type: 'image'
      },
      headers: {
        'Search-Version': 'v3'
      }
    }
  )

  return httpReq.data.summaries.map(s => {
    return {
      name: s.name,
      createdAt: s.created_at,
      description: s.short_description,
      logo: s.logo_url.large || s.logo_url.small || null,
      categories: s.categories
    }
  })
}

import client from '@sanity/client'

export const sanityClient = client({
  projectId: 'z9slyadj',
  dataset: 'production',
  useCdn: true, // `false` if you want to ensure fresh data
})

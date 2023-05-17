import articles from './structure/articles'
import tips from './structure/tips'
import tutorials from './structure/tutorials'
import workshops from './structure/workshops'
import pricing from './structure/pricing'
import products from './structure/products'
import interviews from './structure/interviews'
import explainers from './structure/explainers'
import exercises from './structure/exercises'
import sections from './structure/sections'
import links from './structure/links'

import videoResources from './structure/videoResources'

const hiddenDocTypes = (listItem: any) =>
  ![
    'module',
    'tip',
    'pricing',
    'product',
    'article',
    'page',
    'lesson',
    'exercise',
    'explainer',
    'videoResource',
    'section',
    'linkResource',
    'interview',
  ].includes(listItem.getId())

export default (S: any) =>
  S.list()
    .title('Studio')
    .items([
      products(S),
      pricing(S),
      S.divider(),
      workshops(S),
      tutorials(S),
      articles(S),
      tips(S),
      S.divider(),
      videoResources(S),
      exercises(S),
      sections(S),
      explainers(S),
      interviews(S),
      links(S),
      S.divider(),
      ...S.documentTypeListItems().filter(hiddenDocTypes),
    ])
import Layout from '@/components/app/layout'
import {ArticleJsonLd} from '@skillrecordings/next-seo'
import {Article} from '@/lib/articles'
import Image from 'next/legacy/image'
import Share from '@/components/share'
import {useConvertkit} from '@skillrecordings/skill-lesson/hooks/use-convertkit'
import {ArticleNewsletterCta} from '@/components/primary-newsletter-cta'
import {format} from 'date-fns'
import {ArticleTeaser} from '@/pages/articles'
import {type MDXRemoteSerializeResult} from 'next-mdx-remote'
import MDX from '@skillrecordings/skill-lesson/markdown/mdx'
import removeMarkdown from 'remove-markdown'
import '@/styles/shiki-twoslash.css'
import {ShareImageMDX} from '@/components/mdx'

type ArticleTemplateProps = {
  article: Article
  articles: Article[]
  articleBody: MDXRemoteSerializeResult
}

const ArticleTemplate: React.FC<ArticleTemplateProps> = ({
  article,
  articleBody,
  articles,
}) => {
  const {body, title, slug, _createdAt, _updatedAt, image, description} =
    article
  const {subscriber, loadingSubscriber} = useConvertkit()
  const articleDescription = description
    ? description
    : body
    ? removeMarkdown(body.slice(0, 160))
    : ''

  return (
    <Layout
      meta={{
        title,
        description: articleDescription,
        ogImage: {
          url: `${process.env.NEXT_PUBLIC_URL}/api/og?title=${encodeURI(
            title,
          )}`,
          alt: title,
        },
      }}
      className="bg-black/40"
    >
      <ArticleJsonLd
        title={title}
        url={process.env.NEXT_PUBLIC_URL + `/${slug}`}
        authorName={`${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`}
        datePublished={_createdAt}
        dateModified={_updatedAt}
        type="Article"
        images={[image || '']}
        description={articleDescription}
      />
      <header className="relative z-10 flex w-full flex-col items-center justify-center px-5 pb-8 pt-24 sm:pb-10 sm:pt-36">
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col">
          <time dateTime={_createdAt} className="pb-4 text-gray-300">
            {format(new Date(_createdAt), 'MMM dd, y')}
          </time>
          <h1 className="block text-left font-text text-4xl font-extrabold sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <div className="flex items-center gap-3 pt-8">
            <div className="flex items-center justify-center overflow-hidden rounded-full">
              <Image
                src={require('../../public/matt-pocock.jpeg')}
                alt="Matt Pocock"
                width={40}
                height={40}
                priority
              />
            </div>
            <span className="font-medium">Matt Pocock</span>
          </div>
        </div>
        {image && (
          <div className="relative aspect-video h-full w-full max-w-screen-lg rounded-lg">
            <Image
              className="scale-[2] sm:scale-100"
              src={image}
              alt=""
              aria-hidden="true"
              quality={100}
              layout="fill"
            />
          </div>
        )}
      </header>
      <main className="relative z-10 pt-5">
        <div className="prose relative z-10 mx-auto w-full max-w-3xl px-5 sm:prose-lg md:prose-xl prose-p:text-gray-300 prose-a:text-cyan-300 prose-a:transition hover:prose-a:text-cyan-200 sm:prose-pre:-mx-5">
          {articleBody && (
            <MDX
              contents={articleBody}
              components={{ShareImage: ShareImageMDX}}
            />
          )}
          <div className="flex w-36 -rotate-6 gap-2 pt-10 text-gray-400">
            —
            <Image
              src={require('../../public/assets/signature.svg')}
              alt="Matt's signature"
            />
          </div>
        </div>
        <section className="relative z-10 overflow-hidden px-5 pb-24">
          <Share title={title} />
          {!subscriber && !loadingSubscriber && (
            <ArticleNewsletterCta article={article} />
          )}
        </section>
        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 px-5 pb-32 sm:grid-cols-2">
          {articles.map((article) => {
            return <ArticleTeaser article={article} key={article.slug} />
          })}
        </section>
      </main>
    </Layout>
  )
}

export default ArticleTemplate

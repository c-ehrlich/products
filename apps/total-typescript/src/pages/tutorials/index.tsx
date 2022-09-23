import React from 'react'
import Layout from 'components/app/layout'
import {SanityDocument} from '@sanity/client'
import {getAllTutorials} from 'lib/tutorials'
import Link from 'next/link'
import Image from 'next/image'

export async function getStaticProps() {
  const tutorials = await getAllTutorials()

  return {
    props: {tutorials},
    revalidate: 10,
  }
}

const TutorialsPage: React.FC<{tutorials: SanityDocument[]}> = ({
  tutorials,
}) => {
  return (
    <Layout
      meta={{
        title: `Free TypeScript Tutorials from Matt Pocock`,
        description: `Free TypeScript tutorials by Matt Pocock that will help you learn how to use TypeScript as a professional web developer through exercise driven examples.`,
        ogImage: {
          url: 'https://res.cloudinary.com/total-typescript/image/upload/v1663164063/tutorials-card_2x_gsi059.png',
        },
      }}
    >
      <main className="flex sm:py-40 py-32 items-center justify-center flex-col relative z-10">
        <h1 className="font-heading sm:text-5xl text-5xl font-bold text-center">
          Free TypeScript Tutorials
        </h1>
        <p className="max-w-sm pt-8 text-center text-lg text-rose-100/90">
          A collection of free, exercise-driven, in-depth TypeScript tutorials
          for you to use on your journey to TypeScript wizardry.
        </p>
        {tutorials && (
          <ul className="pt-20 max-w-screen-md flex flex-col gap-8 px-3">
            {tutorials.map(({title, slug, image, description, exercises}) => {
              return (
                <li
                  key={slug.current}
                  className="flex md:flex-row flex-col gap-10 items-center p-10 rounded-lg bg-black/30"
                >
                  <div className="flex items-center justify-center flex-shrink-0">
                    <Image
                      src={image}
                      alt={title}
                      width={300}
                      quality={100}
                      height={300}
                    />
                  </div>
                  <div>
                    <Link
                      href={{
                        pathname: '/tutorials/[module]',
                        query: {
                          module: slug.current,
                        },
                      }}
                    >
                      <a className="sm:text-5xl text-4xl font-semibold hover:underline">
                        {title}
                      </a>
                    </Link>
                    <div className="py-4 text-sm font-mono uppercase">
                      {exercises.length} exercises
                    </div>
                    {description && (
                      <p className="text-gray-300">{description}</p>
                    )}
                    <Link
                      href={{
                        pathname: '/tutorials/[module]',
                        query: {
                          module: slug.current,
                        },
                      }}
                    >
                      <a className="gap-2 px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 transition inline-block mt-5 font-medium">
                        View <span aria-hidden="true">→</span>
                      </a>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Image
        layout="fill"
        aria-hidden="true"
        alt=""
        src={require('../../../public/assets/landing/bg-divider-3.png')}
        objectPosition={'top'}
        className="object-contain -z-10"
      />
    </Layout>
  )
}

export default TutorialsPage
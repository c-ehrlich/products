import React from 'react'
import Layout from '@/components/app/layout'
import Image from 'next/image'
import Link from 'next/link'
import cx from 'classnames'
import {CourseJsonLd} from '@skillrecordings/next-seo'
import {Icon} from '@skillrecordings/skill-lesson/icons'
import ResetProgress from '@skillrecordings/skill-lesson/video/reset-progress'
import {isBrowser} from '@/utils/is-browser'
import {track} from '@skillrecordings/skill-lesson/utils/analytics'
import first from 'lodash/first'
import isEmpty from 'lodash/isEmpty'
import * as Accordion from '@radix-ui/react-accordion'
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  LockClosedIcon,
} from '@heroicons/react/solid'
import {Lesson} from '@skillrecordings/skill-lesson/schemas/lesson'
import {Module} from '@skillrecordings/skill-lesson/schemas/module'
import {Section} from '@skillrecordings/skill-lesson/schemas/section'
import * as process from 'process'
import {trpc} from '../trpc/trpc.client'
import Balancer from 'react-wrap-balancer'
import {useModuleProgress} from '@skillrecordings/skill-lesson/video/module-progress'
import WorkshopCertificate from '@/certificate/workshop-certificate'
import {capitalize} from 'lodash'
import {createAppAbility} from '@skillrecordings/skill-lesson/utils/ability'
import Testimonials from '@/testimonials'
import pluralize from 'pluralize'
import {MDXRemoteSerializeResult} from 'next-mdx-remote'
import MDX from '@skillrecordings/skill-lesson/markdown/mdx'
import {SanityProduct} from '@skillrecordings/commerce-server/dist/@types'
import {PriceCheckProvider} from '@skillrecordings/skill-lesson/path-to-purchase/pricing-check-context'
import {Pricing} from '@skillrecordings/skill-lesson/path-to-purchase/pricing'
import {useRouter} from 'next/router'
import {Skeleton} from '@skillrecordings/ui'

const WorkshopTemplate: React.FC<{
  workshop: Module
  workshopBodySerialized: MDXRemoteSerializeResult
  product?: SanityProduct
}> = ({workshop, workshopBodySerialized}) => {
  const product = workshop.product
  const {title, ogImage, testimonials, description, slug} = workshop
  const pageTitle = `${title} Workshop`
  const {data: commerceProps, status: commercePropsStatus} =
    trpc.pricing.propsForCommerce.useQuery({productId: product?.productId})
  const router = useRouter()

  const useAbilities = () => {
    const {data: abilityRules, status: abilityRulesStatus} =
      trpc.modules.rules.useQuery({
        moduleSlug: workshop.slug.current,
        moduleType: workshop.moduleType,
      })
    return {ability: createAppAbility(abilityRules || []), abilityRulesStatus}
  }
  const {ability, abilityRulesStatus} = useAbilities()

  const canViewRegionRestriction = ability.can('view', 'RegionRestriction')
  const canView = ability.can('view', 'Content')

  return (
    <Layout
      className="mx-auto w-full pt-20 lg:max-w-4xl lg:pb-24"
      meta={{
        title: pageTitle,
        description,
        ogImage: {
          url: ogImage,
          alt: pageTitle,
        },
      }}
    >
      <CourseMeta title={pageTitle} description={description} />
      <Header
        module={workshop}
        hasPurchased={canView}
        product={product as SanityProduct}
      />
      <main
        data-workshop-template={slug.current}
        className="relative z-10 flex flex-col gap-5 lg:flex-row"
      >
        <div className="px-5">
          {product && (
            <RegionRestrictedBanner
              workshop={workshop}
              productId={product?.productId}
            />
          )}
          <article className="prose prose-lg w-full max-w-none text-white prose-a:text-cyan-300 hover:prose-a:text-cyan-200 lg:max-w-xl">
            <MDX contents={workshopBodySerialized} />
          </article>
          {testimonials && testimonials?.length > 0 && (
            <Testimonials testimonials={testimonials} />
          )}
        </div>
        <div className="flex w-full flex-col lg:max-w-xs">
          {product && commercePropsStatus === 'loading' ? (
            <div className="mb-8 flex flex-col space-y-2" role="status">
              <div className="sr-only">Loading commerce details</div>
              {new Array(8).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full bg-gray-800" />
              ))}
            </div>
          ) : (
            <>
              {!canView && product && (
                <PriceCheckProvider
                  purchasedProductIds={commerceProps?.purchases?.map(
                    (p) => p.id,
                  )}
                >
                  <Pricing
                    canViewRegionRestriction={canViewRegionRestriction}
                    product={product as SanityProduct}
                    allowPurchase={commerceProps?.allowPurchase}
                    cancelUrl={process.env.NEXT_PUBLIC_URL + router.asPath}
                    purchases={commerceProps?.purchases}
                    userId={commerceProps?.userId}
                    options={{
                      withGuaranteeBadge: true,
                      withImage: true,
                    }}
                  />
                </PriceCheckProvider>
              )}
              {canView && product && (
                <div className="mb-8 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 p-5 text-lg text-cyan-300">
                  <Icon name="Checkmark" />
                  Purchased
                </div>
              )}
              {workshop && <ModuleNavigator module={workshop} />}
            </>
          )}
          <ResetProgress module={workshop} />
          <WorkshopCertificate workshop={workshop} />
        </div>
      </main>
    </Layout>
  )
}

export default WorkshopTemplate

const RegionRestrictedBanner: React.FC<{
  workshop: Module
  productId: string
}> = ({workshop, productId}) => {
  const useAbilities = () => {
    const {data: abilityRules, status: abilityRulesStatus} =
      trpc.modules.rules.useQuery({
        moduleSlug: workshop.slug.current,
        moduleType: workshop.moduleType,
      })
    return {ability: createAppAbility(abilityRules || []), abilityRulesStatus}
  }
  const {data: purchaseData} = trpc.purchases.getPurchaseByProductId.useQuery({
    productId: productId,
  })
  const {ability} = useAbilities()
  const canViewRegionRestriction = ability.can('view', 'RegionRestriction')
  const countryCode = purchaseData?.purchase?.country
  const regionNames = new Intl.DisplayNames(['en'], {type: 'region'})
  const country = countryCode && regionNames.of(countryCode)

  return canViewRegionRestriction ? (
    <div
      className="mb-5 flex items-start space-x-4 rounded-md bg-white/5 p-5 text-lg"
      role="alert"
    >
      <div className="flex items-center justify-center rounded-full bg-yellow-200/10 p-3">
        <LockClosedIcon className="h-5 w-5 text-yellow-200" />
      </div>
      <div className="flex flex-col space-y-3 pt-2">
        <p className="font-medium">
          Your license is restricted to{' '}
          {country ? (
            <>
              <img
                className="inline-block"
                src={`https://hardcore-golick-433858.netlify.app/image?code=${countryCode}`}
                alt={`${country} flag`}
              />{' '}
              {country}
            </>
          ) : (
            'a specific region'
          )}
          .
        </p>
        <p className="text-gray-200">
          You can upgrade to an unrestricted license to view this workshop
          anywhere.
        </p>
      </div>
    </div>
  ) : null
}

const Header: React.FC<{
  module: Module
  product?: SanityProduct
  hasPurchased: boolean
}> = ({module, product, hasPurchased = false}) => {
  const {title, slug, sections, image, github} = module
  const {data: moduleProgress, status: moduleProgressStatus} =
    trpc.moduleProgress.bySlug.useQuery({
      slug: module.slug.current,
    })

  const isModuleInProgress = (moduleProgress?.completedLessonCount || 0) > 0
  const nextSection = moduleProgress?.nextSection
  const nextLesson = moduleProgress?.nextLesson

  const firstSection = first<Section>(sections)
  const firstLesson = first<Lesson>(firstSection?.lessons)

  return (
    <>
      <header className="relative z-10 flex flex-col-reverse items-center justify-between px-5 pb-16 pt-0 sm:pb-8 sm:pt-8 md:flex-row">
        <div className="w-full text-center md:text-left">
          <Link
            href="/workshops"
            className="pb-1 font-mono text-sm font-semibold uppercase tracking-wide text-cyan-300"
          >
            Pro Workshop
          </Link>
          <h1 className="font-text text-4xl font-bold sm:text-5xl lg:text-6xl">
            <Balancer>{title}</Balancer>
          </h1>
          <div className="w-full pt-8 text-lg">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center overflow-hidden rounded-full">
                  <Image
                    src={require('../../public/matt-pocock.jpeg')}
                    alt="Matt Pocock"
                    width={48}
                    height={48}
                    placeholder="blur"
                  />
                </div>
                <span>Matt Pocock</span>
              </div>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-3 pt-8 md:flex-row md:justify-start">
              <Link
                href={
                  firstSection && sections
                    ? {
                        pathname: `/${pluralize(
                          module.moduleType,
                        )}/[module]/[section]/[lesson]`,
                        query: {
                          module: slug.current,
                          section: isModuleInProgress
                            ? nextSection?.slug
                            : firstSection.slug,
                          lesson: isModuleInProgress
                            ? nextLesson?.slug
                            : firstLesson?.slug,
                        },
                      }
                    : {
                        pathname: `/${pluralize(
                          module.moduleType,
                        )}/[module]/[lesson]`,
                        query: {
                          module: slug.current,
                          lesson: isModuleInProgress
                            ? nextLesson?.slug
                            : firstLesson?.slug,
                        },
                      }
                }
                className={cx(
                  'flex w-full min-w-[208px] items-center justify-center rounded  px-5 py-4 font-semibold leading-tight transition  md:w-auto',
                  {
                    'animate-pulse': moduleProgressStatus === 'loading',
                    'bg-cyan-400 text-black hover:bg-cyan-300':
                      hasPurchased || !product,
                    'bg-cyan-300/20 text-cyan-300 hover:bg-cyan-300/30':
                      !hasPurchased && product,
                  },
                )}
                onClick={() => {
                  track('clicked start learning', {module: slug.current})
                }}
              >
                {hasPurchased || !product ? (
                  <>{isModuleInProgress ? 'Continue' : 'Start'} Learning</>
                ) : (
                  <>Preview</>
                )}
                <span className="pl-2" aria-hidden="true">
                  →
                </span>
              </Link>
              {github?.repo && (
                <a
                  className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-gray-800 px-5 py-4 font-medium leading-tight transition hover:bg-gray-800 md:w-auto"
                  href={`https://github.com/total-typescript/${github.repo}`}
                  onClick={() => {
                    track('clicked github code link', {module: slug.current})
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="Github" size="24" /> Code
                </a>
              )}
            </div>
          </div>
        </div>
        {image && (
          <div className="flex flex-shrink-0 items-center justify-center lg:-mr-16">
            <Image
              src={image}
              alt={title}
              width={400}
              height={400}
              quality={100}
            />
          </div>
        )}
      </header>
      <Image
        fill
        aria-hidden="true"
        alt=""
        src={require('../../public/assets/landing/bg-divider-3.png')}
        className="-z-10 object-contain object-top"
      />
    </>
  )
}

export const ModuleNavigator: React.FC<{
  module: Module
}> = ({module}) => {
  const {sections, moduleType, lessons} = module
  const {data: moduleProgress, status: moduleProgressStatus} =
    trpc.moduleProgress.bySlug.useQuery({
      slug: module.slug.current,
    })
  const nextSection = moduleProgress?.nextSection
  const initialOpenedSections = !isEmpty(first(sections))
    ? [first(sections)?.slug]
    : []
  const [openedSections, setOpenedSections] = React.useState<string[]>(
    initialOpenedSections as string[],
  )

  const firstSection = sections && sections[0]
  const lessonType =
    sections && sections.length > 1
      ? 'section'
      : firstSection
      ? firstSection?.lessons && firstSection.lessons[0]._type
      : lessons && lessons[0]._type

  React.useEffect(() => {
    nextSection?.slug && setOpenedSections([nextSection?.slug])
  }, [nextSection?.slug])

  return moduleProgressStatus === 'success' ? (
    <nav
      aria-label={`${moduleType} navigator`}
      className="w-full bg-black/20 px-5 py-8 lg:max-w-xs lg:bg-transparent lg:px-0 lg:py-0"
    >
      {sections && sections.length > 1 && (
        <Accordion.Root
          type="multiple"
          onValueChange={(e) => setOpenedSections(e)}
          value={openedSections}
        >
          <div className="flex w-full items-center justify-between pb-3">
            <h2 className="text-2xl font-semibold">Contents</h2>
            <h3
              className="cursor-pointer font-mono text-sm font-semibold uppercase text-gray-300"
              onClick={() => {
                setOpenedSections(
                  !isEmpty(openedSections)
                    ? []
                    : sections.map(({slug}: {slug: string}) => slug),
                )
              }}
            >
              {sections?.length || 0} {capitalize(lessonType || 'lesson')}s
            </h3>
          </div>
          <ul className="flex flex-col gap-2">
            {sections.map((section: Section, i: number) => {
              return section.lessons?.length ? (
                <ModuleSection
                  key={section.slug}
                  section={section}
                  module={module}
                />
              ) : (
                <ModuleSection
                  key={section.slug}
                  section={{title: `${section.title} (coming soon)`} as Section}
                  module={module}
                />
              )
            })}
          </ul>
        </Accordion.Root>
      )}
      {sections && sections.length === 1 && (
        <>
          <div className="flex w-full items-center justify-between pb-3">
            <h2 className="text-2xl font-semibold">Contents</h2>
            <h3 className="font-mono text-sm font-semibold uppercase text-gray-300">
              {firstSection?.lessons?.length || 0}{' '}
              {capitalize(lessonType || 'lesson')}s
            </h3>
          </div>
          <ul>
            {firstSection &&
              firstSection?.lessons?.map((lesson, idx) => {
                return (
                  <ModuleLesson
                    isInSection={false}
                    index={idx}
                    lessonResource={lesson}
                    section={sections[0]}
                    module={module}
                    key={lesson.slug}
                  />
                )
              })}
          </ul>
        </>
      )}
      {!sections && lessons && (
        <>
          <div className="flex w-full items-center justify-between pb-3">
            <h2 className="text-2xl font-semibold">Contents</h2>
            <h3 className="font-mono text-sm font-semibold uppercase text-gray-300">
              {lessons?.length || 0} {capitalize(lessonType || 'lesson')}s
            </h3>
          </div>
          <ul>
            {lessons?.map((lesson, idx) => {
              return (
                <ModuleLesson
                  isInSection={false}
                  index={idx}
                  lessonResource={lesson}
                  module={module}
                  key={lesson.slug}
                />
              )
            })}
          </ul>
        </>
      )}
    </nav>
  ) : (
    <ModuleNavigatorSkeleton
      sections={sections}
      lessons={lessons}
      lessonType={lessonType}
    />
  )
}

const ModuleNavigatorSkeleton: React.FC<{
  sections: Section[] | null | undefined
  lessons: Lesson[] | null | undefined
  lessonType: string | null | undefined
}> = ({sections, lessons, lessonType}) => {
  const items = sections || lessons
  return (
    <div
      role="status"
      className="flex w-full animate-pulse flex-col gap-3 lg:max-w-xs"
    >
      <div className="flex w-full items-center justify-between pb-3">
        <h2 className="text-2xl font-semibold">Contents</h2>
        <h3 className="cursor-pointer font-mono text-sm font-semibold uppercase text-gray-300">
          {items?.length || 0} {capitalize(lessonType || 'lesson')}s
        </h3>
      </div>
      {sections?.map((section) => {
        return (
          <div key={section._id} className="flex flex-col gap-3 pb-5">
            <div className="h-4 w-5/6 rounded-full bg-gray-700" />
            {section?.lessons?.map(() => {
              return <div className="h-3 rounded-full bg-gray-800" />
            })}
          </div>
        )
      })}
      {lessons?.map((lesson) => {
        return (
          <div key={lesson._id} className="flex flex-col">
            <div className="h-5 rounded-full bg-gray-700" />
          </div>
        )
      })}
    </div>
  )
}

const ModuleSection: React.FC<{
  section: Section
  module: Module
}> = ({section, module}) => {
  const moduleProgress = useModuleProgress()
  const sectionProgress = moduleProgress?.sections?.find(
    (s) => s.id === section._id,
  )
  const isSectionCompleted = sectionProgress?.sectionCompleted
  const sectionPercentComplete = sectionProgress?.percentComplete

  return (
    <li key={section.slug}>
      <Accordion.Item value={section.slug}>
        <Accordion.Header className="relative z-10 overflow-hidden rounded-lg bg-gray-900">
          <Accordion.Trigger className="group relative z-10 flex w-full items-center justify-between rounded-lg border border-white/5 bg-gray-800/20 px-3 py-2.5 text-left text-lg font-medium leading-tight shadow-lg transition hover:bg-gray-800/40">
            <Balancer>{section.title}</Balancer>
            <div className="flex items-center">
              {isSectionCompleted && (
                <CheckIcon
                  className="mr-2 h-4 w-4 text-teal-400"
                  aria-hidden="true"
                />
              )}
              {section.lessons?.length && (
                <ChevronDownIcon
                  className="relative h-3 w-3 opacity-70 transition group-hover:opacity-100 group-radix-state-open:rotate-180"
                  aria-hidden="true"
                />
              )}
            </div>
          </Accordion.Trigger>
          <div
            aria-hidden="true"
            className={`absolute left-0 top-0 h-full bg-white/5`}
            style={{width: `${sectionPercentComplete}%`}}
          />
        </Accordion.Header>
        <Accordion.Content>
          <ModuleSectionContent module={module} section={section} />
        </Accordion.Content>
      </Accordion.Item>
    </li>
  )
}

const ModuleLesson = ({
  lessonResource,
  section,
  module,
  index,
  isInSection = true,
}: {
  lessonResource: Lesson
  section?: Section
  module: Module
  index: number
  isInSection?: boolean
}) => {
  const moduleProgress = useModuleProgress()

  const completedLessons = moduleProgress?.lessons.filter(
    (l) => l.lessonCompleted,
  )
  const nextLesson = moduleProgress?.nextLesson
  const completedLessonCount = moduleProgress?.completedLessonCount || 0

  const isExerciseCompleted = completedLessons?.find(
    ({id}) => id === lessonResource._id,
  )

  const isNextLesson = nextLesson?.slug === lessonResource.slug
  const useAbilities = () => {
    const {data: abilityRules, status: abilityRulesStatus} =
      trpc.modules.rules.useQuery({
        moduleSlug: module.slug.current,
        moduleType: module.moduleType,
        sectionSlug: section?.slug,
        lessonSlug: lessonResource.slug,
      })
    return {ability: createAppAbility(abilityRules || []), abilityRulesStatus}
  }
  const {ability, abilityRulesStatus} = useAbilities()

  // relying on ability would mark tutorials as locked because it's correctly checking for user
  // we don't want that here hence the moduleType check
  const canShowVideo =
    module.moduleType === 'tutorial' ||
    ability.can('view', 'Content') ||
    abilityRulesStatus === 'loading'

  return (
    <li key={lessonResource._id}>
      <Link
        href={
          section
            ? {
                pathname: `/${pluralize(
                  module.moduleType,
                )}/[module]/[section]/[lesson]`,
                query: {
                  section: section.slug,
                  lesson: lessonResource.slug,
                  module: module.slug.current,
                },
              }
            : {
                pathname: `/${pluralize(module.moduleType)}/[module]/[lesson]`,
                query: {
                  lesson: lessonResource.slug,
                  module: module.slug.current,
                },
              }
        }
        passHref
        className={cx(
          'group inline-flex w-full flex-col justify-center py-2.5 pl-3.5 pr-3 text-base font-medium',
          {
            'bg-gradient-to-r from-cyan-300/5 to-transparent':
              isNextLesson && completedLessons && completedLessons.length > 0,
            'rounded-md': !isInSection,
          },
        )}
        onClick={() => {
          track('clicked workshop exercise', {
            module: module.slug.current,
            lesson: lessonResource.slug,
            ...(section && {section: section.slug}),
            moduleType: section ? section._type : module.moduleType,
            lessonType: lessonResource._type,
          })
        }}
      >
        {isNextLesson && completedLessonCount > 0 && (
          <div className="flex items-center gap-1 pb-1">
            <ArrowRightIcon
              aria-hidden="true"
              className="-ml-1 mr-1.5 h-4 w-4 text-cyan-300"
            />
            <div className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-300">
              CONTINUE
            </div>
          </div>
        )}
        <div className="inline-flex items-center">
          {canShowVideo ? (
            <>
              {isExerciseCompleted ? (
                <CheckIcon
                  className="-ml-1 mr-[11.5px] h-4 w-4 text-teal-400"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="w-6 font-mono text-xs text-gray-400"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
              )}
            </>
          ) : (
            <LockClosedIcon
              aria-hidden="true"
              className="-ml-1 mr-[11.5px] h-4 w-4 text-gray-400"
            />
          )}
          <span className="w-full cursor-pointer leading-tight group-hover:underline">
            {lessonResource.title}
          </span>
        </div>
      </Link>
    </li>
  )
}

const ModuleSectionContent: React.FC<{
  section: Section
  module: Module
}> = ({section, module}) => {
  const {lessons} = section

  return lessons ? (
    <ul className="-mt-5 rounded-b-lg border border-white/5 bg-black/20 pb-3 pt-7">
      {lessons.map((exercise: Lesson, i: number) => {
        return (
          <ModuleLesson
            key={exercise.slug}
            lessonResource={exercise}
            section={section}
            module={module}
            index={i}
          />
        )
      })}
    </ul>
  ) : null
}

const CourseMeta = ({
  title,
  description,
}: {
  title: string
  description?: string | null
}) => (
  <CourseJsonLd
    courseName={title}
    description={description || process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION}
    provider={{
      name: `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`,
      type: 'Person',
      url: isBrowser() ? document.location.href : process.env.NEXT_PUBLIC_URL,
    }}
  />
)

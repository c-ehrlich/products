import React from 'react'
import {type Module} from '@skillrecordings/skill-lesson/schemas/module'
import {type Section as SectionType} from '@skillrecordings/skill-lesson/schemas/section'
import {type Lesson as LessonType} from '@skillrecordings/skill-lesson/schemas/lesson'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../primitives'
import {type Scope, createContextScope} from '@radix-ui/react-context'
import {Primitive} from '@radix-ui/react-primitive'
import type * as Radix from '@radix-ui/react-primitive'
import {capitalize, first, isEmpty} from 'lodash'
import {trpcSkillLessons} from '@skillrecordings/skill-lesson/utils/trpc-skill-lessons'
import Link from 'next/link'
import pluralize from 'pluralize'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../primitives'
import {
  type SectionProgress,
  useModuleProgress,
} from '@skillrecordings/skill-lesson/video/module-progress'
import {CheckIcon, Lock} from 'lucide-react'
import {createAppAbility} from '@skillrecordings/skill-lesson/utils/ability'
import {cn} from '../../utils/cn'

/* -------------------------------------------------------------------------------------------------
 * Collection
 * -----------------------------------------------------------------------------------------------*/

const COLLECTION_NAME = 'Module Contents'

type ScopedProps<P> = P & {__scopeCollection?: Scope}
const [createCollectionContext, createCollectionScope] =
  createContextScope(COLLECTION_NAME)

type CollectionContextValue = {
  module: Module
  openedSections: string[]
  setOpenedSections: React.Dispatch<React.SetStateAction<string[]>>
  checkIconRenderer: () => React.ReactNode
  lockIconRenderer: () => React.ReactNode
  sectionProgressRenderer: (
    sectionProgress?: SectionProgress,
  ) => React.ReactNode
}
const [CollectionProvider, useCollectionContext] =
  createCollectionContext<CollectionContextValue>(COLLECTION_NAME)

type CollectionElement = React.ElementRef<typeof Primitive.div>
type PrimitiveDivProps = Radix.ComponentPropsWithoutRef<typeof Primitive.div>
interface CollectionProps extends PrimitiveDivProps {
  module: Module
  checkIconRenderer?: () => React.ReactNode
  lockIconRenderer?: () => React.ReactNode
  sectionProgressRenderer?: (
    sectionProgress?: SectionProgress,
  ) => React.ReactNode
}

const Collection = React.forwardRef<CollectionElement, CollectionProps>(
  (props: ScopedProps<CollectionProps>, forwardedRef) => {
    const {
      __scopeCollection,
      module,
      children,
      checkIconRenderer = () => (
        <CheckIcon
          width={16}
          opacity={0.7}
          data-check-icon=""
          aria-hidden="true"
        />
      ),
      lockIconRenderer = () => <Lock aria-hidden="true" width={13} />,
      sectionProgressRenderer = (sectionProgress) => {
        const isSectionInProgress = Boolean(
          sectionProgress?.completedLessonCount,
        )
        const isSectionCompleted = sectionProgress?.sectionCompleted
        const sectionPercentComplete = sectionProgress?.percentComplete

        return (
          <>
            {isSectionCompleted && checkIconRenderer()}
            {isSectionInProgress && (
              <div
                data-progress={sectionPercentComplete?.toString()}
                aria-hidden="true"
                className={`absolute pointer-events-none left-0 bottom-0 h-0.5 bg-foreground/20`}
                style={{width: `${sectionPercentComplete}%`}}
              />
            )}
          </>
        )
      },
      ...collectionProps
    } = props
    const {sections, lessons} = module

    const moduleProgress = useModuleProgress()

    const nextSection = moduleProgress?.nextSection
    const initialOpenedSections = !isEmpty(first(sections))
      ? [first(sections)?.slug]
      : []
    const [openedSections, setOpenedSections] = React.useState<string[]>(
      initialOpenedSections as string[],
    )

    const hasSections = sections && sections.length > 0

    React.useEffect(() => {
      nextSection?.slug && setOpenedSections([nextSection?.slug])
    }, [nextSection?.slug])

    return (
      <CollectionProvider
        module={module}
        openedSections={openedSections}
        sectionProgressRenderer={sectionProgressRenderer}
        setOpenedSections={setOpenedSections}
        checkIconRenderer={checkIconRenderer}
        lockIconRenderer={lockIconRenderer}
        scope={__scopeCollection}
      >
        <TooltipProvider>
          {children ? (
            children
          ) : (
            <>
              <Metadata />
              {hasSections && <Sections />}
              {!hasSections && lessons && <Lessons />}
            </>
          )}
        </TooltipProvider>
      </CollectionProvider>
    )
  },
)

Collection.displayName = COLLECTION_NAME

/* -------------------------------------------------------------------------------------------------
 * Metadata
 * -----------------------------------------------------------------------------------------------*/

const METADATA_NAME = 'Module Metadata'

type MetadataElement = React.ElementRef<typeof Primitive.div>

interface MetadataProps extends PrimitiveDivProps {
  className?: string
}

const Metadata = React.forwardRef<MetadataElement, MetadataProps>(
  (props: ScopedProps<MetadataProps>, forwardedRef) => {
    const {__scopeCollection, children, className, ...sectionsProps} = props
    const {module, setOpenedSections, openedSections} = useCollectionContext(
      COLLECTION_NAME,
      __scopeCollection,
    )
    const {sections, lessons} = module

    const handleToggleAllSections = (sections?: SectionType[] | null) => {
      if (sections) {
        setOpenedSections(
          isEmpty(openedSections)
            ? sections.map(({slug}: {slug: string}) => slug)
            : [],
        )
      }
    }

    return (
      <Primitive.div {...sectionsProps} ref={forwardedRef}>
        {children}
        {sections && sections.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={className}
                aria-label={`Toggle all sections`}
                onClick={() => handleToggleAllSections(sections)}
              >
                {sections?.length || 0}{' '}
                {capitalize(pluralize('section', sections.length))}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle sections</p>
            </TooltipContent>
          </Tooltip>
        ) : lessons ? (
          <p className={className}>
            {lessons.length || 0}{' '}
            {capitalize(pluralize('lesson', lessons.length))}
          </p>
        ) : null}
      </Primitive.div>
    )
  },
)

Metadata.displayName = METADATA_NAME

/* -------------------------------------------------------------------------------------------------
 * Sections
 * -----------------------------------------------------------------------------------------------*/

const SECTIONS_NAME = 'Sections'

type SectionsElement = React.ElementRef<typeof Primitive.ul>
type PrimitiveUlProps = Radix.ComponentPropsWithoutRef<typeof Primitive.ul>
interface SectionsProps extends PrimitiveUlProps {}

const Sections = React.forwardRef<SectionsElement, SectionsProps>(
  (props: ScopedProps<SectionsProps>, forwardedRef) => {
    const {__scopeCollection, children, ...sectionsProps} = props
    const {module, openedSections, setOpenedSections} = useCollectionContext(
      COLLECTION_NAME,
      __scopeCollection,
    )

    if (!module.sections) return null

    return (
      <Accordion
        type="multiple"
        onValueChange={(e) => setOpenedSections(e)}
        value={openedSections}
      >
        <Primitive.ul
          className="space-y-2"
          {...sectionsProps}
          ref={forwardedRef}
        >
          {module.sections?.map?.((section) => {
            const childrenWithProps = React.Children.map(children, (child) => {
              if (React.isValidElement<SectionProps>(child)) {
                return React.cloneElement(child, {
                  key: section._id,
                  section: section,
                })
              }
              return null
            })

            return (
              childrenWithProps || (
                <Section key={section._id} section={section} />
              )
            )
          })}
        </Primitive.ul>
      </Accordion>
    )
  },
)

Sections.displayName = SECTIONS_NAME

/* -------------------------------------------------------------------------------------------------
 * Section
 * -----------------------------------------------------------------------------------------------*/

const SECTION_NAME = 'Section'

type SectionElement = React.ElementRef<typeof Primitive.li>
type PrimitiveLiProps = Radix.ComponentPropsWithoutRef<typeof Primitive.li>
interface SectionProps extends PrimitiveLiProps {
  section?: SectionType
}

const Section = React.forwardRef<SectionElement, SectionProps>(
  (props: ScopedProps<SectionProps>, forwardedRef) => {
    const {__scopeCollection, section, children, ...sectionProps} = props
    const {sectionProgressRenderer} = useCollectionContext(
      COLLECTION_NAME,
      __scopeCollection,
    )

    const moduleProgress = useModuleProgress()

    if (!section) return null

    const sectionProgress = moduleProgress?.sections?.find(
      (s) => s.id === section._id,
    )
    const isSectionInProgress = Boolean(sectionProgress?.completedLessonCount)

    const sectionPercentComplete = sectionProgress?.percentComplete
    const hasLessons = Boolean(section.lessons)
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement<LessonsProps>(child)) {
        return React.cloneElement(child, {
          key: section._id,
          section: section,
        })
      }
      return null
    })

    return (
      <Primitive.li
        className="[&>div>h3>button]:font-semibold [&>div>h3>button]:overflow-hidden [&>div>h3>button[data-state='closed']]:rounded [&>div>h3>button[data-state='open']]:rounded-t [&>div>h3>button]:bg-card [&>div>h3>button>[data-check-icon]]:w-4 [&>div>h3>button>[data-check-icon]]:ml-auto [&>div>h3>button>[data-check-icon]]:mr-1 [&>div>h3>button>span]:text-sm [&>div>h3>button>span]:mr-5 [&>div>h3>button>span]:font-normal bg-card rounded [&>div]:border-b-0 [&>div>h3>button]:px-5 [&>div>h3>button]:py-4 [&>div>div>ul]:pb-4 [&>div>div>ul]:mt-0.5"
        {...sectionProps}
        ref={forwardedRef}
      >
        <AccordionItem value={section.slug}>
          <AccordionTrigger disabled={!hasLessons} className="relative">
            {section.title} {!hasLessons && '(coming soon)'}
            {isSectionInProgress && sectionProgressRenderer(sectionProgress)}
          </AccordionTrigger>
          {hasLessons && (
            <AccordionContent>
              {children ? childrenWithProps : <Lessons section={section} />}
            </AccordionContent>
          )}
        </AccordionItem>
      </Primitive.li>
    )
  },
)

Section.displayName = SECTION_NAME

/* -------------------------------------------------------------------------------------------------
 * Lessons
 * -----------------------------------------------------------------------------------------------*/

const LESSONS_NAME = 'Lessons'

type LessonsElement = React.ElementRef<typeof Primitive.ul>
interface LessonsProps extends PrimitiveUlProps {
  section?: SectionType
}

const Lessons = React.forwardRef<LessonsElement, LessonsProps>(
  (props: ScopedProps<LessonsProps>, forwardedRef) => {
    const {__scopeCollection, section, children, ...lessonsProps} = props
    const {module} = useCollectionContext(COLLECTION_NAME, __scopeCollection)
    const lessons = section?.lessons || module.lessons
    if (!lessons) return null

    return (
      <Primitive.ul
        ref={forwardedRef}
        className={cn(lessonsProps.className)}
        {...lessonsProps}
      >
        {lessons?.map((lesson, index) => {
          const childrenWithProps = React.Children.map(children, (child) => {
            if (React.isValidElement<LessonProps>(child)) {
              return React.cloneElement(child, {
                lesson: lesson,
                section: section,
                index: index,
              })
            }
            return null
          })
          return (
            <li key={lesson._id}>
              {childrenWithProps || (
                <Lesson section={section} lesson={lesson} index={index} />
              )}
            </li>
          )
        })}
      </Primitive.ul>
    )
  },
)

Lessons.displayName = LESSONS_NAME

/* -------------------------------------------------------------------------------------------------
 * Lesson
 * -----------------------------------------------------------------------------------------------*/

const LESSON_NAME = 'Lesson'

type LessonElement = React.ElementRef<typeof Primitive.li>
interface LessonProps extends PrimitiveLiProps {
  lesson?: LessonType
  section?: SectionType
  index?: number
}

const Lesson = React.forwardRef<LessonElement, LessonProps>(
  (props: ScopedProps<LessonProps>, forwardedRef) => {
    const {
      __scopeCollection,
      lesson,
      section,
      index = 0,
      ...lessonProps
    } = props
    const {module, checkIconRenderer, lockIconRenderer} = useCollectionContext(
      COLLECTION_NAME,
      __scopeCollection,
    )
    const moduleProgress = useModuleProgress()

    const useAbilities = () => {
      const {data: abilityRules, status: abilityRulesStatus} =
        trpcSkillLessons.modules.rules.useQuery({
          moduleSlug: module.slug.current,
          moduleType: module.moduleType,
          sectionSlug: section?.slug,
          lessonSlug: lesson?.slug,
        })
      return {ability: createAppAbility(abilityRules || []), abilityRulesStatus}
    }
    const {ability, abilityRulesStatus} = useAbilities()

    if (!lesson) return null

    const completedLessons = moduleProgress?.lessons.filter(
      (l) => l.lessonCompleted,
    )
    const nextLesson = moduleProgress?.nextLesson
    const completedLessonCount = moduleProgress?.completedLessonCount || 0

    const isExerciseCompleted = completedLessons?.find(
      ({id}) => id === lesson._id,
    )

    const isNextLesson = nextLesson?.slug === lesson.slug

    // relying on ability would mark tutorials as locked because it's correctly checking for user
    // we don't want that for tutorials hence the moduleType check
    const canShowVideo =
      module.moduleType === 'tutorial' ||
      ability.can('view', 'Content') ||
      abilityRulesStatus === 'loading'

    const isHighlighted =
      (isNextLesson && completedLessons && completedLessons.length > 0) || false

    const showContinue = isNextLesson && completedLessonCount > 0
    return (
      <Primitive.li asChild {...lessonProps} ref={forwardedRef}>
        <Link
          className={cn(
            `[&>div]:flex [&>div]:py-2 [&>div]:items-center [&>div]:gap-2 text-base [&>div>span]:text-xs [&>div>span]:opacity-60 font-medium flex flex-col`,
            {
              'before:content-["continue"] before:mt-2 before:-mb-1 before:text-xs before:font-semibold before:pl-11 before:text-primary before:uppercase before:block':
                showContinue,
              '[&>div]:px-5 [&>div]:opacity-80 hover:[&>div]:opacity-100':
                section,
              'bg-card [&>div]:px-2.5': !section,
            },
            lessonProps.className,
          )}
          href={getLessonHref(lesson, module, section)}
          passHref
        >
          {/* {showContinue && (
            <div className="flex items-center gap-1">
              <ArrowRightIcon width={16} aria-hidden="true" />
              <div data-label="">CONTINUE</div>
            </div>
          )} */}
          <div>
            {canShowVideo ? (
              <>
                {isExerciseCompleted ? (
                  checkIconRenderer()
                ) : (
                  <span
                    className="w-4 h-4 flex items-center justify-center"
                    data-index={`${index + 1}`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                )}
              </>
            ) : (
              lockIconRenderer()
            )}
            {lesson.title}
          </div>
        </Link>
      </Primitive.li>
    )
  },
)

Lesson.displayName = LESSON_NAME

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

const getLessonHref = (
  lesson: LessonType,
  module: Module,
  section?: SectionType,
) => {
  const pathname = `/${pluralize(module.moduleType)}/[module]/${
    section ? '[section]/' : ''
  }[lesson]`
  const query = {
    lesson: lesson.slug,
    module: module.slug.current,
    ...(section && {section: section.slug}),
  }
  return {pathname, query}
}

/* -------------------------------------------------------------------------------------------------*/

const Root = Collection

export {Collection, Root, Metadata, Section, Sections, Lessons, Lesson}

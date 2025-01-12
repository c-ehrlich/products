import {SanityDocument} from '@sanity/client'
import reverse from 'lodash/reverse'
import isEmpty from 'lodash/isEmpty'
import indexOf from 'lodash/indexOf'
import sortBy from 'lodash/sortBy'
import first from 'lodash/first'
import find from 'lodash/find'
import get from 'lodash/get'
import axios from 'axios'
import {LessonProgress} from '@skillrecordings/database'

type ProgressProps = {
  slug: string
}

export const toggleLessonProgressForUser = async ({slug}: ProgressProps) =>
  await axios
    .post(`/api/progress/lessons/${slug}`)
    .catch(() => {
      throw new Error('failed to set progress')
    })
    .then((data) => {
      console.debug('progress set')
      return data
    })

export const getLessonProgressForUser = async () =>
  await axios
    .get(`/api/progress`)
    .catch(() => {
      throw new Error('failed to load progress')
    })
    .then(({data}) => {
      console.debug('progress loaded', data)
      return data
    })

export const getSectionProgressForUser = (
  progress: LessonProgress[],
  section: SanityDocument,
) => {
  if (!progress || !section) {
    return {}
  }

  const sectionLessonsSlugs = section.lessons
    ? section.lessons.map(({slug}: {slug: string}) => slug)
    : [section.slug]

  const completedLessonsInSection = progress.filter(
    ({lessonSlug, completedAt}) =>
      sectionLessonsSlugs.includes(lessonSlug) && completedAt,
  )

  const numberOfLessons = sectionLessonsSlugs?.length
  const numberOfCompletedLessons = completedLessonsInSection.length
  const isCompleted =
    numberOfCompletedLessons > 0 && numberOfCompletedLessons === numberOfLessons
  const percentCompleted = Math.round(
    (100 * numberOfCompletedLessons) / numberOfLessons,
  )

  return {
    completedLessons: completedLessonsInSection,
    percentCompleted,
    isCompleted,
  }
}

export const getModuleProgressForUser = (
  progress: LessonProgress[],
  moduleSections: SanityDocument[],
) => {
  if (!progress || !moduleSections) {
    return {}
  }

  let completedSectionsInModule: string[] = []

  moduleSections.forEach((section) => {
    const {isCompleted: isSectionCompleted} = getSectionProgressForUser(
      progress,
      section,
    )

    if (isSectionCompleted) {
      return completedSectionsInModule.push(section.slug)
    }
  })

  const numberOfSections = moduleSections.length
  const numberOfCompletedSections = completedSectionsInModule.length
  const isCompleted = numberOfCompletedSections === numberOfSections
  const percentCompleted = Math.round(
    (100 * numberOfCompletedSections) / numberOfSections,
  )

  return {
    completedSections: completedSectionsInModule,
    percentCompleted,
    isCompleted,
  }
}

export const getNextUpLesson = (
  progress: LessonProgress[],
  modules: SanityDocument[],
): {slug: string; title: string} | null => {
  if (!progress || !modules) {
    return null
  }

  const progressSortedByLastCompleted = reverse(
    sortBy(progress, (l: LessonProgress) => {
      if (!l.completedAt) return
      return new Date(l.completedAt)
    }),
  )
    .filter((l: LessonProgress) => l.completedAt)
    .map((l) => l.lessonSlug)

  if (isEmpty(progressSortedByLastCompleted)) return null

  const allLessons = modules
    .flatMap((m) => m?.sections)
    .flatMap((s) => s?.lessons)

  const unfinishedLessons = allLessons.filter(
    (l) => !progressSortedByLastCompleted.includes(l),
  )

  const lastCompletedLesson = find(allLessons, {
    slug: first(progressSortedByLastCompleted),
  })

  const indexOfLastCompletedLesson = indexOf(allLessons, lastCompletedLesson)

  const nextUpLessonSlug = get(
    allLessons[indexOfLastCompletedLesson + 1],
    'slug',
  )

  const nextUpLesson = find(unfinishedLessons, {
    slug: nextUpLessonSlug,
  })

  return nextUpLesson
}

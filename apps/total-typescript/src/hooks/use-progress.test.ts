import {LessonProgress} from '@skillrecordings/database'
import {getAllLessons} from './use-progress'

test('the all lessons to be returned', () => {
  const lessons = getAllLessons(sections)

  expect(lessons).toEqual([lessonOne, lessonTwo])
})

const lessonOneProgress: LessonProgress = {
  lessonSlug: 'lesson-1',
  completedAt: new Date(),
  id: '',
  userId: '',
  lessonId: null,
  sectionId: null,
  moduleId: null,
  lessonVersion: null,
  updatedAt: null,
  createdAt: new Date(),
}

const lessonOneSolution = {
  _id: 'lesson-1-solution',
  slug: 'lesson-1-solution',
  _type: 'solution',
  title: 'Lesson 1 Solution',
}

const lessonOne = {
  _id: 'lesson-1',
  slug: 'lesson-1',
  type: 'exercise',
  title: 'Lesson 1',
  _type: 'exercise',
  solution: lessonOneSolution,
}

const lessonTwoSolution = {
  _id: 'lesson-2-solution',
  slug: 'lesson-2-solution',
  _type: 'solution',
  title: 'Lesson 2 Solution',
}

const lessonTwo = {
  _id: 'lesson-2',
  slug: 'lesson-2',
  type: 'exercise',
  title: 'Lesson 2',
  _type: 'exercise',
  solution: lessonTwoSolution,
}

const sections = [
  {
    _id: 'section-1',
    slug: 'section-1',
    _type: 'section',
    title: 'Section 1',
    lessons: [lessonOne, lessonTwo],
  },
]

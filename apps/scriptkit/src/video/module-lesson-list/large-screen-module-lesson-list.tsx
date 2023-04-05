import * as React from 'react'
import {LessonList} from './lesson-list'
import ModuleLessonListHeader from './module-lesson-list-header'
import {Module} from '@skillrecordings/skill-lesson/schemas/module'
import {Section} from '@skillrecordings/skill-lesson/schemas/section'
import {Lesson} from '@skillrecordings/skill-lesson/schemas/lesson'

export const LargeScreenModuleLessonList: React.FC<{
  lessonResourceRenderer: (
    path: string,
    module: Module,
    lesson: Lesson,
    section?: Section,
  ) => void
  module: Module
  path: string
}> = ({module, path, lessonResourceRenderer}) => {
  return (
    <ModuleLessonListHeader module={module} path={path}>
      <LessonList lessonResourceRenderer={lessonResourceRenderer} path={path} />
    </ModuleLessonListHeader>
  )
}
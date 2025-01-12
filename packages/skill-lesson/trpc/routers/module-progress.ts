import {publicProcedure, router} from '../trpc.server'
import {z} from 'zod'
import {Section} from '../../schemas/section'
import {Lesson} from '../../schemas/lesson'
import {prisma} from '@skillrecordings/database'
import {getToken} from 'next-auth/jwt'
import {ModuleProgressSchema} from '../../video/module-progress'
import {getModule} from '../../lib/modules'

export const moduleProgressRouter = router({
  bySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().nullish(),
      }),
    )
    .query(async ({ctx, input}) => {
      const token = await getToken({req: ctx.req})
      if (!token || !input.slug) {
        return null
      }

      const module = await getModule(input.slug)

      const allModuleLessons =
        module.sections.length > 0
          ? module.sections
              .filter((section: Section) => section?.lessons?.length)
              .flatMap((section: Section) => section.lessons)
          : module.lessons

      const lessonIds = allModuleLessons.map((lesson: Lesson) => lesson._id)

      const moduleLessonProgress = await prisma.lessonProgress.findMany({
        where: {
          lessonId: {in: lessonIds},
          userId: token.id as string,
        },
      })

      const moduleProgressLessons = allModuleLessons.map((lesson: Lesson) => {
        return {
          id: lesson._id,
          slug: lesson.slug,
          lessonCompleted: Boolean(
            moduleLessonProgress.find(
              (progress) =>
                progress.lessonId === lesson._id && progress.completedAt,
            ),
          ),
        }
      })

      const moduleProgressSections = module.sections
        .filter((section: Section) => section.lessons)
        .map((section: Section) => {
          const sectionProgressLessons =
            section.lessons?.map((lesson: Lesson) => {
              return {
                id: lesson._id,
                slug: lesson.slug,
                lessonCompleted: Boolean(
                  moduleLessonProgress.find(
                    (progress) =>
                      progress.lessonId === lesson._id && progress.completedAt,
                  ),
                ),
              }
            }) || []

          return {
            id: section._id,
            slug: section.slug,
            sectionCompleted: sectionProgressLessons.every(
              (lesson) => lesson.lessonCompleted,
            ),
            percentComplete: Math.round(
              (sectionProgressLessons.filter((lesson) => lesson.lessonCompleted)
                .length /
                sectionProgressLessons.length) *
                100,
            ),
            completedLessonCount: sectionProgressLessons.filter(
              (lesson) => lesson.lessonCompleted,
            ).length,
            lessonCount: sectionProgressLessons.length,
            lessons: sectionProgressLessons,
          }
        })

      return ModuleProgressSchema.parse({
        moduleId: module._id,
        nextLesson:
          moduleProgressLessons.find(
            (lesson: {lessonCompleted: boolean}) => !lesson.lessonCompleted,
          ) || null,
        nextSection:
          moduleProgressSections.find(
            (section: {sectionCompleted: boolean}) => !section.sectionCompleted,
          ) || null,
        moduleCompleted: moduleProgressLessons.every(
          (lesson: {lessonCompleted: boolean}) => lesson.lessonCompleted,
        ),
        percentComplete: Math.round(
          (moduleLessonProgress.length / allModuleLessons.length) * 100,
        ),
        completedLessonCount: moduleLessonProgress.filter(
          (lesson) => lesson.completedAt,
        ).length,
        lessonCount: allModuleLessons.length,
        lessons: moduleProgressLessons,
        sections: moduleProgressSections,
      })
    }),
})

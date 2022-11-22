import * as React from 'react'
import Layout from 'components/layout'
import {useRouter} from 'next/router'

const Unsubscribed = () => {
  const router = useRouter()
  const sequence = String(router.query?.sequence)
  const message = (sequence: string) => {
    switch (sequence) {
      case 'course01': // unsubscribed: email course
        return 'Escuela Frontend email course'
      case 'workshops': // unsubscribed: live workshop info
        return 'Escuela Frontend live workshops list'
      default:
        return 'Escuela Frontend email list'
    }
  }

  return (
    <Layout>
      <main className="mt-32 flex flex-grow flex-col items-center justify-center px-5">
        <div className="max-w-lg text-center font-light">
          <h1 className="py-8 font-heading text-4xl font-bold lg:text-5xl">
            Unsubscribed
          </h1>
          <p className="mx-auto pb-8 leading-relaxed text-gray-200 sm:text-xl">
            You've been removed from the {message(sequence)} and won't receive
            any more emails about it.
          </p>
        </div>
      </main>
    </Layout>
  )
}

export default Unsubscribed
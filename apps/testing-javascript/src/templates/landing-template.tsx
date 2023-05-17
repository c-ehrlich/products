import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {SanityDocument} from '@sanity/client'
import type {TestimonialProps, FaqProps, InterviewProps} from '@types'
import Balancer from 'react-wrap-balancer'
import MuxPlayer from '@mux/mux-player-react'

import LandingCopy from 'components/landing/landing-copy.mdx'
import Testimonials from 'components/landing/testimonials'
import Faqs from 'components/landing/faqs'
import Greeting from 'components/landing/greeting'
import Printables from 'components/landing/printables'
import Interviews from 'components/landing/interviews'

type LandingTemplateProps = {
  isPro: boolean
  playlists: SanityDocument[]
  testimonials: TestimonialProps[]
  faqs: FaqProps[]
  interviews: InterviewProps[]
  proTestingPurchased: boolean
}

const LandingTemplate: React.FC<LandingTemplateProps> = ({
  isPro,
  playlists,
  testimonials,
  faqs,
  interviews,
  proTestingPurchased,
}) => {
  return (
    <div className="pt-10">
      <div className="container max-w-6xl">
        <h1 className="text-center font-heading text-4xl md:text-6xl sm:text-5xl">
          <Balancer>
            Learn the smart, efficient way to test any JavaScript application.
          </Balancer>
        </h1>
        <h3 className="flex justify-center items-center text-center mt-5 before:block before:bg-brand-orange before:w-4 before:h-[2px] before:mr-2 after:block after:bg-brand-orange after:w-4 after:h-[2px] after:ml-2 text-sm md:text-xl">
          YOUR ESSENTIAL GUIDE TO FLAWLESS TESTING
        </h3>
        <div className="flex justify-center items-center space-x-3 text-sm md:text-base mt-6">
          <span className="uppercase">by</span>
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image
              src="/images/portraits/kent-c-dodds.png"
              width={32}
              height={32}
              alt="Kent C. Dodds"
            />
          </div>
          <span className="text-base md:text-xl">Kent C. Dodds</span>
        </div>
        <div className="m-auto w-full max-w-[680px] mt-16">
          <Image
            src="/images/illos/trophy-with-labels.png"
            width={742}
            height={760}
            alt="Trophy"
            priority
          />
          <div className="prose md:prose-md mt-32">
            <LandingCopy />
          </div>
        </div>
      </div>
      <div className="container max-w-6xl mt-20">
        <MuxPlayer
          streamType="on-demand"
          playbackId="lZ7JLEsycJZ1hi9D02NlGo701t2IILWuXssviaT9fy8u8"
        />
        <div className="mt-36 flex flex-col items-center">
          <Image
            src="/images/illos/code-bits-1.png"
            alt="Code Bits"
            width={300}
            height={83}
          />
          <h2 className="text-center font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-14">
            What's in Testing JavaScript?
          </h2>
          <div className="bg-gray-600 text-white mt-20 w-full">modules</div>
        </div>
        <div className="mt-14">
          <h2 className="text-center font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-xl mx-auto">
            <Balancer>Gain insight from industry experts.</Balancer>
          </h2>
          <h3 className="font-tt-regular text-center text-xl md:text-2xl lg:text-3xl opacity-80 mt-6 md:mt-10">
            Exclusive Pro Testing Bonus Content
          </h3>
        </div>
        <Interviews
          proTestingPurchased={proTestingPurchased}
          interviews={interviews}
          className="mt-20"
        />
        <Printables
          proTestingPurchased={proTestingPurchased}
          className="mt-20"
        />
      </div>
      <Greeting className="mt-20" />

      <div className="container max-w-6xl">
        <div className="bg-gray-600 text-white my-32">
          Start testing like a pro
        </div>
        <Testimonials
          testimonials={testimonials}
          title="What other developers are saying"
          className="mt-20 md:mt-24 lg:mt-32"
        />
        <Faqs faqs={faqs} className="mt-20 md:mt-24 lg:mt-32" />
      </div>
    </div>
  )
}

export default LandingTemplate
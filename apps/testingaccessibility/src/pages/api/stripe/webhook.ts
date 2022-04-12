import {buffer} from 'micro'
import type {NextApiRequest, NextApiResponse} from 'next'
import {stripe} from '../../../utils/stripe'
import {sendServerEmail} from '../../../utils/send-server-email'
import {nextAuthOptions} from '../auth/[...nextauth]'
import {recordNewPurchase} from '../../../utils/record-new-purchase'
import {withSentry} from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import {setupHttpTracing} from '@vercel/tracing-js'
import {tracer} from '../../../utils/honeycomb-tracer'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripeWebhookHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  setupHttpTracing({name: stripeWebhookHandler.name, tracer, req, res})
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']

    let event: any

    try {
      event = stripe.webhooks.constructEvent(buf, sig as string, webhookSecret)

      if (event.type === 'checkout.session.completed') {
        const {user, purchase} = await recordNewPurchase(event.data.object.id)

        if (!user) throw new Error('no-user-created')

        await sendServerEmail({
          email: user.email as string,
          callbackUrl: `${process.env.NEXTAUTH_URL}/learn/welcome?purchaseId=${purchase.id}`,
          nextAuthOptions,
        })

        res.status(200).send(`This works!`)
      } else {
        res.status(200).send(`not-handled`)
      }
    } catch (err: any) {
      Sentry.captureException(err)
      console.error(err)
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default withSentry(stripeWebhookHandler)

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/preview(.*)',
  '/opengraph-image(.*)',
  '/twitter-image(.*)',
  '/sitemap.xml',
])

const SOCIAL_CRAWLER_UA =
  /Twitterbot|LinkedInBot|facebookexternalhit|Facebot|Slackbot|Discordbot|WhatsApp|TelegramBot/i

function isSocialPreviewCrawler(req: Request): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  const ua = req.headers.get('user-agent') || ''
  return SOCIAL_CRAWLER_UA.test(ua)
}

export default clerkMiddleware(async (auth, req) => {
  const isAgentBuilderPreviewBot =
    req.nextUrl.pathname.startsWith('/agent-builder') && isSocialPreviewCrawler(req)

  if (!isPublicRoute(req) && !isAgentBuilderPreviewBot) {
    await auth.protect()
  }
}, {
  // Allow up to 60s clock skew to prevent future iat errors
  clockSkewInMs: 60000,
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

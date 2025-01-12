import React from 'react'
import Link from 'next/link'
import NextLink, {type LinkProps} from 'next/link'
import {NextRouter, useRouter} from 'next/router'
import cx from 'classnames'
import {Icon} from '@skillrecordings/skill-lesson/icons'
import {track} from 'utils/analytics'
import {signOut, useSession} from 'next-auth/react'
import toast from 'react-hot-toast'
import {isSellingLive} from '@skillrecordings/skill-lesson/utils/is-selling-live'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import {createAppAbility} from '@skillrecordings/skill-lesson/utils/ability'
import {trpc} from '../trpc/trpc.client'
import {ChevronDownIcon, MenuIcon} from '@heroicons/react/solid'
import {useFeedback} from '@skillrecordings/feedback-widget'

type NavigationProps = {
  className?: string
}

const useAbilities = () => {
  const {data: abilityRules} = trpc.abilities.getAbilities.useQuery()

  return createAppAbility(abilityRules || [])
}

const Navigation: React.FC<NavigationProps> = ({className}) => {
  return (
    <nav
      aria-label="top"
      className="relative top-0 z-50 w-full bg-white py-3 shadow-xl shadow-gray-200/20 print:hidden sm:py-4 md:text-sm lg:text-base"
    >
      <div
        className={cx(className, {
          'mx-auto flex max-w-screen-lg items-center justify-between gap-2 px-5 sm:gap-0':
            !className,
        })}
      >
        <NavLogo />
        <DesktopNav />
        <MobileNav />
      </div>
    </nav>
  )
}

export default Navigation

const DesktopNav = () => {
  const {status} = useSession()
  const {setIsFeedbackDialogOpen} = useFeedback()
  return (
    <ul
      className={cx('hidden items-center space-x-5 md:flex', {
        'w-full justify-between': isSellingLive || status === 'authenticated',
      })}
    >
      <NavSlots>
        {isSellingLive && (
          <NavLink
            path="/workshops"
            icon={<Icon name="Trophy" className="text-[#F8A729]" />}
            label={
              <>
                <span className="hidden lg:inline-block">Pro</span> Workshops
              </>
            }
          />
        )}
        <NavLink
          path="/tutorials"
          icon={<Icon name="Video" className="text-brand-red" />}
          label="Tutorials"
        />
        <NavLink path="/tips" icon={<Icon name="Anchor" />} label="Tips" />
        <NavLink
          path="/articles"
          icon={<Icon name="Palm" />}
          label="Articles"
        />
      </NavSlots>
      {status !== 'loading' && (
        <>
          {(isSellingLive || status === 'authenticated') && (
            <ul className="flex items-center gap-2">
              {status === 'authenticated' && (
                <NavLink
                  label={
                    <>
                      <span className="hidden lg:inline-block">Send</span>{' '}
                      Feedback
                    </>
                  }
                  onClick={() => {
                    setIsFeedbackDialogOpen(true, 'navigation')
                    track('opened feedback dialog')
                  }}
                />
              )}
              {status === 'authenticated' ? (
                <AccountDropdown />
              ) : (
                <NavLink path="/login" label="Log in" />
              )}
            </ul>
          )}
        </>
      )}
    </ul>
  )
}

const NavSlots: React.FC<React.PropsWithChildren> = ({children}) => {
  const {status} = useSession()

  return (
    <div
      className={cx('flex items-center', {
        'pl-5': isSellingLive || status === 'authenticated',
      })}
    >
      {children}
    </div>
  )
}

const NavLink: React.FC<
  React.PropsWithChildren<{
    label: string | React.ReactElement
    icon?: React.ReactElement
    path?: string
    className?: string
    onClick?: () => void
  }>
> = ({onClick, label, icon, path, className}) => {
  const router = useRouter()
  const isActive = router.pathname === path
  if (onClick) {
    return (
      <li>
        <button
          onClick={onClick}
          aria-current={isActive ? 'page' : undefined}
          className={cx(
            'jusfify-center flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-gray-100 lg:px-4',
            className,
            {
              'bg-gray-50': isActive,
            },
          )}
        >
          {label}
        </button>
      </li>
    )
  }
  return path ? (
    <li>
      <NextLink
        href={path}
        passHref
        className={cx(
          'jusfify-center flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-gray-100 lg:px-4',
          className,
          {
            'bg-gray-50': isActive,
          },
        )}
        onClick={() => {
          track(`clicked ${label} link in nav`)
        }}
      >
        {icon ? icon : null}
        {label}
      </NextLink>
    </li>
  ) : null
}

const NavLogo = () => {
  const router = useRouter()
  return (
    <Link
      href="/"
      aria-label="Pro Tailwind Home"
      passHref
      tabIndex={router.pathname === '/' ? -1 : 0}
      className="font-heading text-xl font-black sm:text-2xl"
    >
      <span className="text-brand-red">Pro</span>Tailwind
    </Link>
  )
}

const AccountDropdown = () => {
  const ability = useAbilities()
  const canViewInvoice = ability.can('view', 'Invoice')

  const preventHover = (event: any) => {
    const e = event as Event
    return e.preventDefault()
  }

  return (
    <NavigationMenu.Root
      aria-label="Account"
      delayDuration={0}
      className="relative flex h-full"
    >
      <NavigationMenu.List className="flex h-full items-center justify-center">
        <NavigationMenu.Item className="">
          <NavigationMenu.Trigger
            onPointerMove={preventHover}
            onPointerLeave={preventHover}
            className={cx(
              'jusfify-center flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-gray-100 lg:px-4',
            )}
          >
            Account <ChevronDownIcon className="h-4 w-4" aria-hidden />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content
            onPointerMove={preventHover}
            onPointerLeave={preventHover}
            className="absolute left-0 top-full w-full rounded-b"
          >
            <ul className="flex w-full flex-col items-start rounded-b-lg bg-white p-1 text-sm shadow-2xl shadow-gray-900/20 lg:text-base">
              {canViewInvoice && (
                <li className="w-full">
                  <DropdownLink href="/purchases">Purchases</DropdownLink>
                </li>
              )}
              {/* <li className="w-full">
                <DropdownLink href="/faq">FAQ</DropdownLink>
              </li> */}
              <li className="w-full">
                <LogOutButton />
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

const DropdownLink: React.FC<
  React.PropsWithChildren<LinkProps & {className?: string}>
> = ({href, ...props}) => {
  const router = useRouter()
  const isActive = router.asPath === href

  return (
    <NextLink href={href} passHref legacyBehavior>
      <NavigationMenu.Link
        active={isActive}
        {...props}
        className={cx(
          'flex w-full rounded-full px-3 py-2 transition hover:bg-gray-100',
          props.className,
        )}
      />
    </NextLink>
  )
}

const MobileNav = () => {
  const ability = useAbilities()
  const canViewTeam = ability.can('view', 'Team')
  const canViewInvoice = ability.can('view', 'Invoice')
  const {status} = useSession()
  const {setIsFeedbackDialogOpen} = useFeedback()

  return (
    <div className="block md:hidden">
      <ul className="flex h-full items-center justify-center">
        {isSellingLive && status === 'unauthenticated' ? (
          <NavLink path="/login" label="Log in" />
        ) : null}
        <li className="h-full">
          <NavigationMenu.Root delayDuration={0} className="flex h-full">
            <NavigationMenu.List className="flex h-full items-center justify-center">
              <NavigationMenu.Item className="h-full">
                <NavigationMenu.Trigger className="flex h-full items-center justify-center rounded-full px-2 py-2 hover:bg-gray-100">
                  <MenuIcon className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Menu</span>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-full w-full border-t border-gray-100 bg-white shadow-2xl shadow-gray-500/20">
                  <ul>
                    {isSellingLive && (
                      <MobileNavLink
                        path="/workshops"
                        label="Pro Workshops"
                        icon={<Icon name="Trophy" className="text-[#F8A729]" />}
                      />
                    )}
                    <MobileNavLink
                      path="/tutorials"
                      label="Free Tutorials"
                      icon={<Icon name="Video" className="text-brand-red" />}
                    />
                    <MobileNavLink
                      path="/tips"
                      label="Tips"
                      icon={<Icon name="Anchor" />}
                    />
                    <MobileNavLink
                      path="/articles"
                      label="Articles"
                      icon={<Icon name="Palm" />}
                    />
                    {/* <MobileNavLink path="/faq" label="FAQ" /> */}
                    {status === 'authenticated' && (
                      <>
                        <div className="border-t border-gray-100 px-5 pb-3 pt-5 font-mono text-xs font-semibold uppercase tracking-wide text-gray-700">
                          Account
                        </div>
                        <ul>
                          {canViewInvoice && (
                            <MobileNavLink
                              path="/purchases"
                              label="Purchases"
                            />
                          )}
                          <MobileNavLink
                            label="Send Feedback"
                            onClick={() => {
                              setIsFeedbackDialogOpen(true, 'navigation')
                              track('opened feedback dialog')
                            }}
                          />
                          <li>
                            <LogOutButton className="flex h-full w-full items-center gap-0.5 px-5 py-3 text-base font-medium transition duration-100 hover:bg-gray-100 active:bg-transparent" />
                          </li>
                        </ul>
                      </>
                    )}
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Viewport className="w-full" />
          </NavigationMenu.Root>
        </li>
      </ul>
    </div>
  )
}

const MobileNavLink: React.FC<
  React.PropsWithChildren<{
    label: string
    icon?: React.ReactElement
    path?: string
    className?: string
    onClick?: () => void
  }>
> = ({onClick, label, icon, path, className}) => {
  if (onClick) {
    return (
      <li>
        <button
          onClick={onClick}
          className={cx(
            'flex h-full w-full items-center gap-1.5 px-5 py-3 text-base font-medium transition duration-100 hover:bg-gray-100 active:bg-transparent',
            className,
          )}
        >
          {icon ? icon : null}
          {label}
        </button>
      </li>
    )
  }
  return path ? (
    <li>
      <NextLink
        href={path}
        passHref
        className={cx(
          'flex h-full items-center gap-1.5 px-5 py-3 text-base font-medium transition duration-100 hover:bg-gray-100 active:bg-transparent',
          className,
        )}
        onClick={() => {
          track(`clicked ${label} link in nav`)
        }}
      >
        {icon ? icon : null}
        {label}
      </NextLink>
    </li>
  ) : null
}

const LogOutButton: React.FC<{className?: string}> = ({className}) => {
  const router = useRouter()
  return (
    <NavigationMenu.Link asChild>
      <button
        onClick={async () => {
          await handleLogOut(router)
          toast.success('Logged out successfully')
        }}
        className={
          className
            ? className
            : 'flex w-full rounded-full px-3 py-2 transition hover:bg-gray-100'
        }
      >
        Log out
      </button>
    </NavigationMenu.Link>
  )
}

export const handleLogOut = async (router: NextRouter) => {
  const data = await signOut({
    redirect: false,
    callbackUrl: '/',
  }).then((data) => data)
  window.location.href = data.url
}

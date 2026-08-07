import { useEffect } from 'react'
import { useLocation } from 'wouter'

const HOME_DESCRIPTION = 'Create professional invoices, quotes, estimates, receipts, and purchase orders with Invoice Focus, a free online invoice generator for freelancers and small businesses.'

const publicMetadata: Record<string, string> = {
  '/': HOME_DESCRIPTION,
  '/about': 'Learn how Invoice Focus helps freelancers and growing teams create clear, professional invoices without complicated software.',
  '/blog': 'Practical ideas from Invoice Focus for invoicing, freelancing, small business finance, and focused work.',
  '/contact': 'Contact Invoice Focus for product questions, partnerships, and support with your invoicing workflow.',
  '/guides': 'Practical Invoice Focus guides for creating polished invoices, organizing clients, and building a calmer billing workflow.',
  '/help': 'Find answers to common questions about creating invoices, managing your account, and using Invoice Focus.',
  '/privacy': 'Read the Invoice Focus privacy policy and learn how we handle information used by the invoicing service.',
  '/status': 'Check the current operational status of the Invoice Focus application and supporting services.',
  '/terms': 'Read the Invoice Focus terms of service for using the free online invoicing application.',
}

const PRIVATE_DESCRIPTION = 'Invoice Focus is a free online invoicing workspace for creating and managing professional business documents.'

function getMetadata(pathname: string) {
  const description = publicMetadata[pathname]
  return {
    description: description ?? PRIVATE_DESCRIPTION,
    indexable: Boolean(description),
  }
}

function upsertMeta(name: string, content: string) {
  const tags = Array.from(document.head.querySelectorAll(`meta[name="${name}"]`))
  const tag = tags[0] ?? document.createElement('meta')
  tag.setAttribute('name', name)
  tag.setAttribute('content', content)
  if (!tag.parentNode) document.head.appendChild(tag)
  tags.slice(1).forEach((duplicate) => duplicate.remove())
}

export function RouteSeo() {
  const [location] = useLocation()

  useEffect(() => {
    const pathname = location.split('?')[0] || '/'
    const { description, indexable } = getMetadata(pathname)

    document.title = 'Free Invoice Generator'
    upsertMeta('description', description)
    upsertMeta('robots', indexable ? 'index, follow' : 'noindex, nofollow')

    const canonical = document.head.querySelector('link[rel="canonical"]') ?? document.createElement('link')
    if (indexable) {
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', `https://invoicefocus.com${pathname}`)
      if (!canonical.parentNode) document.head.appendChild(canonical)
    } else if (canonical.parentNode) {
      canonical.remove()
    }
  }, [location])

  return null
}
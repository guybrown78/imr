import areas from '../data/areas.json';
import { site, phone } from './site';
import { pricing } from './pricing';

const id = `${site.url}/#business`;

export function localBusiness() {
  const r = site.reviews;
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': id,
    name: site.name,
    url: site.url + '/',
    telephone: phone.e164,
    email: site.email,
    image: `${site.url}/og.png`,
    logo: `${site.url}/favicon.svg`,
    priceRange: `£${pricing.minimumCharge}+`,
    foundingDate: String(site.foundedYear),
    address: { '@type': 'PostalAddress', addressLocality: site.addressLocality, addressRegion: site.addressRegion, addressCountry: 'GB' },
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Teesside' }, ...areas.map((a) => ({ '@type': 'City', name: a.name }))],
    openingHoursSpecification: site.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.schema, opens: h.opens, closes: h.closes })),
    makesOffer: {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'PAT testing (portable appliance testing)' },
      priceSpecification: [
        { '@type': 'PriceSpecification', price: pricing.minimumCharge, priceCurrency: pricing.currency, description: `Minimum charge, covers first ${pricing.itemsIncluded} appliances` },
        { '@type': 'UnitPriceSpecification', price: pricing.perExtraItem, priceCurrency: pricing.currency, unitText: 'appliance', description: `Each appliance after the first ${pricing.itemsIncluded}` },
      ],
    },
    ...(r.googleRating && r.googleCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: r.googleRating, reviewCount: r.googleCount } } : {}),
  };
}

export function service(name: string, areaName = 'Teesside', url?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: 'PAT testing',
    provider: { '@id': id },
    areaServed: { '@type': 'Place', name: areaName },
    ...(url ? { url } : {}),
    offers: { '@type': 'Offer', price: pricing.minimumCharge, priceCurrency: pricing.currency, description: `From £${pricing.minimumCharge} for up to ${pricing.itemsIncluded} appliances, then £${pricing.perExtraItem} each` },
  };
}

export const faqSchema = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const breadcrumbSchema = (items: { name: string; href: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', href: '/' }, ...items].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: site.url + c.href })),
});

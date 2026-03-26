// lib/scrapers.js
// Server-side scrapers for Internshala, Wellfound, Contra, Freelancer
// Targets 10+ results per fetch across sources

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

function timeout(ms) {
  return AbortSignal.timeout(ms)
}

// ── Internshala ───────────────────────────────────────────────────────────────
export async function scrapeInternshala(keyword = 'ux design') {
  const slug = keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const endpoints = [
    { url: `https://internshala.com/internships/${slug}-internship`, type: 'Internship' },
    { url: `https://internshala.com/jobs/${slug}-jobs`, type: 'Job' },
    { url: `https://internshala.com/freelancing-projects/${slug}-freelancing-project`, type: 'Freelance Project' },
    { url: `https://internshala.com/internships/ux-design-internship`, type: 'Internship' },
    { url: `https://internshala.com/jobs/ux-designer-jobs`, type: 'Job' },
  ]

  const results = []

  for (const ep of endpoints) {
    if (results.length >= 8) break
    try {
      const res = await fetch(ep.url, { headers: HEADERS, signal: timeout(9000) })
      if (!res.ok) continue
      const html = await res.text()

      // Extract from individual_internship containers
      const containers = html.match(/class="individual_internship"[\s\S]*?(?=class="individual_internship"|<\/div>\s*<\/div>\s*<\/div>\s*<div class="internship_list)/g) || []

      for (const block of containers.slice(0, 5)) {
        const profileMatch  = block.match(/class="[^"]*profile[^"]*"[^>]*>\s*<a[^>]*>([^<]{4,80})<\/a>/) ||
                              block.match(/data-internship-name="([^"]{4,80})"/)
        const companyMatch  = block.match(/class="[^"]*company-name[^"]*"[^>]*>\s*(?:<[^>]+>)*([^<]{3,60})/) ||
                              block.match(/class="[^"]*company_name[^"]*"[^>]*>([^<]{3,60})/)
        const stipendMatch  = block.match(/class="[^"]*stipend[^"]*"[^>]*>([^<]{3,40})/)
        const locationMatch = block.match(/class="[^"]*location[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]{3,50})/) ||
                              block.match(/class="[^"]*location_link[^"]*"[^>]*>([^<]{3,50})/)
        const linkMatch     = block.match(/href="(\/internship\/detail\/[^"]+)"/) ||
                              block.match(/href="(\/job\/detail\/[^"]+)"/)

        const title   = profileMatch?.[1]?.trim()
        const company = companyMatch?.[1]?.trim()
        if (!title || !company || title.length < 4) continue

        results.push({
          id: `internshala-${Date.now()}-${results.length}`,
          source: 'Internshala',
          title,
          company,
          budget: stipendMatch?.[1]?.trim() || 'Negotiable',
          location: locationMatch?.[1]?.trim() || 'Remote / India',
          url: linkMatch?.[1] ? `https://internshala.com${linkMatch[1]}` : ep.url,
          postedOn: 'Recent',
          type: ep.type,
          description: '',
        })
      }

      // Fallback: JSON-LD extraction
      if (results.length === 0) {
        const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        for (const match of jsonLdMatches) {
          try {
            const data = JSON.parse(match[1])
            const items = Array.isArray(data) ? data : data['@graph'] || [data]
            for (const item of items) {
              if (item['@type'] === 'JobPosting' && item.title) {
                results.push({
                  id: `internshala-ld-${results.length}`,
                  source: 'Internshala',
                  title: item.title,
                  company: item.hiringOrganization?.name || 'Company',
                  budget: item.baseSalary?.value?.value || 'Negotiable',
                  location: item.jobLocation?.address?.addressLocality || 'India',
                  url: item.url || ep.url,
                  postedOn: item.datePosted ? new Date(item.datePosted).toLocaleDateString('en-IN') : 'Recent',
                  type: ep.type,
                  description: item.description?.slice(0, 200) || '',
                })
              }
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.error('Internshala error:', ep.url, e.message)
    }
  }

  return results.slice(0, 8)
}

// ── Wellfound ─────────────────────────────────────────────────────────────────
export async function scrapeWellfound(keyword = 'ux designer') {
  const q = encodeURIComponent(keyword)
  const urls = [
    `https://wellfound.com/jobs?q=${q}`,
    `https://wellfound.com/jobs?q=${q}&remote=true`,
    `https://wellfound.com/role/r/ux-designer`,
  ]

  const results = []

  for (const url of urls) {
    if (results.length >= 6) break
    try {
      const res = await fetch(url, { headers: HEADERS, signal: timeout(9000) })
      if (!res.ok) continue
      const html = await res.text()

      // Try Next.js __NEXT_DATA__ first (most reliable)
      const ndMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (ndMatch) {
        try {
          const nd = JSON.parse(ndMatch[1])
          // Traverse pageProps for job arrays
          const search = (obj, depth = 0) => {
            if (depth > 8 || !obj || typeof obj !== 'object') return []
            if (Array.isArray(obj)) {
              // Check if it looks like a jobs array
              if (obj.length > 0 && (obj[0]?.title || obj[0]?.jobTitle || obj[0]?.role)) {
                return obj
              }
              return obj.flatMap(i => search(i, depth + 1))
            }
            return Object.values(obj).flatMap(v => search(v, depth + 1))
          }

          const jobs = search(nd?.props?.pageProps)
          for (const job of jobs.slice(0, 6)) {
            const title = job.title || job.jobTitle || job.role || job.name
            const company = job.startup?.name || job.company?.name || job.organizationName || 'Startup'
            if (!title) continue
            results.push({
              id: `wellfound-${job.id || results.length}`,
              source: 'Wellfound',
              title,
              company,
              budget: job.compensation || job.salaryRange || job.equity ? `${job.equity} equity` : 'Equity + Salary',
              location: job.remote ? 'Remote' : (job.locationNames?.[0] || job.location || 'Global'),
              url: job.slug ? `https://wellfound.com/jobs/${job.slug}` : url,
              postedOn: job.liveStartAt ? new Date(job.liveStartAt).toLocaleDateString('en-IN') : 'Recent',
              type: job.jobType || 'Full-time / Contract',
              description: (job.description || job.summary || '').slice(0, 200),
            })
          }
          if (results.length >= 3) break
        } catch (_) {}
      }

      // Regex fallback on JSON fragments
      const titleMatches   = [...html.matchAll(/"(?:title|jobTitle)":\s*"([^"]{5,80})"/g)]
      const companyMatches = [...html.matchAll(/"(?:companyName|name)":\s*"([^"]{3,60})"/g)]
      const remoteMatches  = [...html.matchAll(/"remote":\s*(true|false)/g)]

      for (let i = 0; i < Math.min(titleMatches.length, 4); i++) {
        const title = titleMatches[i]?.[1]?.trim()
        if (!title || results.some(r => r.title === title)) continue
        results.push({
          id: `wellfound-re-${i}`,
          source: 'Wellfound',
          title,
          company: companyMatches[i]?.[1]?.trim() || 'Startup',
          budget: 'Equity + Salary',
          location: remoteMatches[i]?.[1] === 'true' ? 'Remote' : 'On-site',
          url,
          postedOn: 'Recent',
          type: 'Full-time / Contract',
          description: '',
        })
      }
    } catch (e) {
      console.error('Wellfound error:', url, e.message)
    }
  }

  return results.slice(0, 6)
}

// ── Contra ────────────────────────────────────────────────────────────────────
export async function scrapeContra(keyword = 'ux design') {
  const q = encodeURIComponent(keyword)
  const url = `https://contra.com/search?query=${q}&type=opportunity`

  try {
    const res = await fetch(url, { headers: HEADERS, signal: timeout(9000) })
    if (!res.ok) return []
    const html = await res.text()
    const results = []

    const ndMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (ndMatch) {
      try {
        const nd = JSON.parse(ndMatch[1])
        const search = (obj, depth = 0) => {
          if (depth > 8 || !obj || typeof obj !== 'object') return []
          if (Array.isArray(obj) && obj.length > 0 && (obj[0]?.title || obj[0]?.slug)) return obj
          return Object.values(obj).flatMap(v => search(v, depth + 1))
        }
        const opps = search(nd?.props?.pageProps)
        for (const opp of opps.slice(0, 5)) {
          const title = opp.title || opp.name
          if (!title) continue
          results.push({
            id: `contra-${opp.id || results.length}`,
            source: 'Contra',
            title,
            company: opp.client?.displayName || opp.hiringUser?.name || 'Client',
            budget: opp.hourlyRate ? `$${opp.hourlyRate}/hr` : opp.fixedRate ? `$${opp.fixedRate}` : 'Negotiable',
            location: opp.remote !== false ? 'Remote' : opp.location || 'Remote',
            url: `https://contra.com/opportunity/${opp.slug || opp.id || ''}`,
            postedOn: opp.createdAt ? new Date(opp.createdAt).toLocaleDateString('en-IN') : 'Recent',
            type: 'Freelance Project',
            description: (opp.description || '').slice(0, 200),
          })
        }
      } catch (_) {}
    }

    return results
  } catch (e) {
    console.error('Contra error:', e.message)
    return []
  }
}

// ── Freelancer.com (public RSS) ───────────────────────────────────────────────
export async function scrapeFreelancer(keyword = 'ux designer') {
  // Freelancer has a public RSS feed — no auth needed
  const q = encodeURIComponent(keyword)
  const url = `https://www.freelancer.com/jobs/rss/?keyword=${q}`

  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, Accept: 'application/rss+xml, text/xml' },
      signal: timeout(9000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const results = []

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    for (const item of items.slice(0, 5)) {
      const title   = item.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/)?.[1] ||
                      item.match(/<title>([^<]+)<\/title>/)?.[1]
      const link    = item.match(/<link>([^<]+)<\/link>/)?.[1]
      const desc    = item.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>/)?.[1] ||
                      item.match(/<description>([^<]+)<\/description>/)?.[1]
      const budget  = item.match(/Budget:\s*([^<\n,]+)/i)?.[1]?.trim()
      const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]

      if (!title) continue
      results.push({
        id: `freelancer-${results.length}`,
        source: 'Freelancer.com',
        title: title.trim(),
        company: 'Client on Freelancer',
        budget: budget || 'See listing',
        location: 'Remote / Global',
        url: link?.trim() || 'https://www.freelancer.com/jobs',
        postedOn: pubDate ? new Date(pubDate).toLocaleDateString('en-IN') : 'Recent',
        type: 'Freelance Project',
        description: desc?.replace(/<[^>]+>/g, '').slice(0, 200) || '',
      })
    }
    return results
  } catch (e) {
    console.error('Freelancer RSS error:', e.message)
    return []
  }
}

// ── Deduplicate ───────────────────────────────────────────────────────────────
export function deduplicate(listings) {
  const seen = new Set()
  return listings.filter(l => {
    const key = `${l.title?.toLowerCase().slice(0, 30)}-${l.company?.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

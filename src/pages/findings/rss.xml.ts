import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const findings = import.meta.glob('../../content/findings/*.md', { eager: true }) as Record<string, any>;

  const items = Object.values(findings)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .map((f) => ({
      title: f.frontmatter.title,
      pubDate: new Date(f.frontmatter.date),
      description: f.frontmatter.summary || f.frontmatter.title,
      link: `/findings/${f.frontmatter.slug}/`,
    }));

  return rss({
    title: 'bigcompute.science — Findings',
    description: 'Novel observations from heavy computation — the citable results. Number theory, spectral theory, fractal geometry, and more.',
    site: context.site!.toString(),
    items,
    customData: '<language>en-us</language>',
  });
}

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const experiments = import.meta.glob('../../content/experiments/*.md', { eager: true }) as Record<string, any>;

  const items = Object.values(experiments)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .map((exp) => ({
      title: exp.frontmatter.title,
      pubDate: new Date(exp.frontmatter.date),
      description: exp.frontmatter.results?.status || exp.frontmatter.title,
      link: `/experiments/${exp.frontmatter.slug}/`,
    }));

  return rss({
    title: 'bigcompute.science — Experiments',
    description: 'Open experimental results from heavy computation. Custom CUDA kernels, GPU clusters, big math, serious hardware.',
    site: context.site!.toString(),
    items,
    customData: '<language>en-us</language>',
  });
}

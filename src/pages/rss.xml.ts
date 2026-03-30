import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const experiments = import.meta.glob('../content/experiments/*.md', { eager: true }) as Record<string, any>;
  const findings = import.meta.glob('../content/findings/*.md', { eager: true }) as Record<string, any>;

  const expItems = Object.values(experiments).map((exp) => ({
    title: `[Experiment] ${exp.frontmatter.title}`,
    pubDate: new Date(exp.frontmatter.date),
    description: exp.frontmatter.results?.status || exp.frontmatter.title,
    link: `/experiments/${exp.frontmatter.slug}/`,
  }));

  const findItems = Object.values(findings).map((f) => ({
    title: `[Finding] ${f.frontmatter.title}`,
    pubDate: new Date(f.frontmatter.date),
    description: f.frontmatter.summary || f.frontmatter.title,
    link: `/findings/${f.frontmatter.slug}/`,
  }));

  const items = [...expItems, ...findItems]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'bigcompute.science',
    description: 'Open experimental results from heavy computation. Custom CUDA kernels, GPU clusters, big math, serious hardware.',
    site: context.site!.toString(),
    items,
    customData: '<language>en-us</language>',
  });
}

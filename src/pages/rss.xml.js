import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog'); // if you use content collections
  return rss({
    title: 'Debug & Play',
    description: 'Latest posts',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      link: `/posts/${p.slug}/`,
      pubDate: p.data.published,
    })),
  });
}

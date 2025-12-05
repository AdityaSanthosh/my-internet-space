import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { siteConfig } from '@/site-config'

export async function GET(context: any) {
	const posts = (await getCollection('blog'))
		.filter((post) => !post.data.draft)
		.sort((a, b) => {
			const aDate = a.data.updatedDate || a.data.pubDate
			const bDate = b.data.updatedDate || b.data.pubDate
			return bDate.valueOf() - aDate.valueOf()
		})
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			pubDate: post.data.updatedDate || post.data.pubDate,
			link: `post/${post.slug}/`
		}))
	})
}

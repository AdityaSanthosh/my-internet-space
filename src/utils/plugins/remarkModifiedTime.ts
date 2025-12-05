import { execSync } from 'child_process'
import { statSync } from 'fs'

export function remarkModifiedTime() {
	return function (tree: any, file: any) {
		const filepath = file.history[0]

		try {
			// Try to get the last modified date from git
			const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`, {
				encoding: 'utf-8'
			})

			if (result) {
				file.data.astro.frontmatter.updatedDate = new Date(result.trim())
			}
		} catch (error) {
			// If git fails (not a git repo or file not tracked), fall back to filesystem mtime
			try {
				const stats = statSync(filepath)
				file.data.astro.frontmatter.updatedDate = stats.mtime
			} catch (fsError) {
				// If both fail, don't set updatedDate
				console.warn(`Could not get modified time for ${filepath}`)
			}
		}
	}
}

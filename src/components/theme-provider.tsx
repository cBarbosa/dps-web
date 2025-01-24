'use client'

import { ApiRoles } from '@/hooks/getServerSessionAuthorization'
import React from 'react'

export enum Theme {
	Default = 'default',
	Bradesco = 'bradesco',
}

export const ThemeContext = React.createContext<{
	theme: Theme
	setTheme: (theme: Theme) => void
}>({ theme: Theme.Default, setTheme: () => {} })

function ThemeProvider({
	initialTheme,
	children,
	role,
}: {
	initialTheme?: Theme
	children: React.ReactNode
	role?: ApiRoles
}) {
	if (!initialTheme && role) {
		const roleBasedTheme: Record<string, Theme> = {
			admin: Theme.Default,
			oferta: Theme.Bradesco,
		}

		initialTheme = roleBasedTheme[role.toLowerCase()]
	}

	const [theme, setTheme] = React.useState<Theme>(initialTheme ?? Theme.Default)

	const ThemeContextValue = React.useMemo(
		() => ({
			theme,
			setTheme,
		}),
		[theme]
	)

	return (
		<ThemeContext.Provider value={ThemeContextValue}>
			<div className={`theme-${theme}`}>{children}</div>
		</ThemeContext.Provider>
	)
}

export default ThemeProvider

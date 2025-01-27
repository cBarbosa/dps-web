'use client'

import { ApiRoles } from '@/hooks/getServerSessionAuthorization'
import useSessionAuthorization from '@/hooks/useSessionAuthorization'
import React, { useEffect } from 'react'

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
	role: roleProp,
}: {
	initialTheme?: Theme
	children: React.ReactNode
	role?: ApiRoles
}) {
	const { session } = useSessionAuthorization()
	const role = session?.data?.role?.toLowerCase() as Lowercase<ApiRoles>

	if (!initialTheme && roleProp) {
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

	useEffect(() => {
		if (role === 'oferta') {
			setTheme(Theme.Bradesco)
		} else {
			setTheme(Theme.Default)
		}
	}, [role])

	return (
		<ThemeContext.Provider value={ThemeContextValue}>
			<div className={`theme-${theme}`}>{children}</div>
		</ThemeContext.Provider>
	)
}

export default ThemeProvider

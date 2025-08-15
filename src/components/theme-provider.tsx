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

	const mapRoleToTheme = (role?: string): Theme => {
		if (!role) return Theme.Default
		switch (role.toLowerCase()) {
			case 'oferta':
				return Theme.Bradesco
			default:
				return Theme.Default
		}
	}

	const roleFromSession = session?.data?.role
	const effectiveRole = (roleProp ?? roleFromSession) as ApiRoles | undefined

	const resolvedInitialTheme = initialTheme ?? mapRoleToTheme(effectiveRole)

	const [theme, setTheme] = React.useState<Theme>(resolvedInitialTheme)

	const ThemeContextValue = React.useMemo(
		() => ({
			theme,
			setTheme,
		}),
		[theme]
	)

	useEffect(() => {
		setTheme(mapRoleToTheme(effectiveRole))
	}, [effectiveRole])

	return (
		<ThemeContext.Provider value={ThemeContextValue}>
			<div className={`theme-${theme}`}>{children}</div>
		</ThemeContext.Provider>
	)
}

export default ThemeProvider

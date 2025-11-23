'use client'

import { NextPage } from 'next'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import React from 'react'
import { ProductsProvider } from '@/contexts/products-context'

const AppSessionProvider: NextPage<{
	children: React.ReactNode
	session: Session | null
}> = ({ children, session }) => {
	return (
		<SessionProvider session={session}>
			<ProductsProvider>
				{children}
			</ProductsProvider>
		</SessionProvider>
	)
}

export default AppSessionProvider

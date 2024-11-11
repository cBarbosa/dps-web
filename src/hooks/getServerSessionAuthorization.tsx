import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession, Session } from 'next-auth'

type ApiRolesAux = 'ADMIN' | 'VENDEDOR' | 'SUBSCRITOR' | 'SUBSCRITOR-MED'

export type ApiRoles = Lowercase<ApiRolesAux> | Uppercase<ApiRolesAux>

export default async function getServerSessionAuthorization(
	roles?: ApiRoles[]
): Promise<{
	granted: boolean
	session: (Session & { accessToken: string; role: ApiRoles }) | null
}> {
	const session = (await getServerSession(authOptions)) as
		| (Session & {
				accessToken: string
				role: ApiRoles
		  })
		| null

	if (!roles || roles.length === 0) {
		return {
			granted: true,
			session,
		}
	}

	roles = roles.map(role => role.toLowerCase()) as ApiRoles[]

	if (session) {
		const { accessToken, role: roleRaw } = session as
			| Session & { accessToken: string; role: string }

		const role = roleRaw?.toLowerCase() as Lowercase<ApiRoles>

		// ALWAYS ALLOW ADMIN
		if (role === 'admin') {
			return {
				granted: true,
				session,
			}
		}

		if (!accessToken || !roles.includes(role)) {
			return {
				granted: false,
				session,
			}
		}

		return {
			granted: true,
			session,
		}
	}

	return {
		granted: false,
		session,
	}
}

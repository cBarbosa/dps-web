import { Session } from 'next-auth'
import { SessionContextValue, useSession } from 'next-auth/react'
import { ApiRoles } from './getServerSessionAuthorization'

export default function useSessionAuthorization(roles?: ApiRoles[]): {
	granted: boolean
	session: SessionContextValue & {
		data: (Session & { accessToken: string; role: ApiRoles }) | null
	}
} {
	const session = useSession() as SessionContextValue & {
		data: (Session & { accessToken: string; role: ApiRoles }) | null
	}

	if (!roles || roles.length === 0) {
		return {
			granted: true,
			session,
		}
	}

	roles = roles.map(role => role.toLowerCase()) as ApiRoles[]

	if (session) {
		const { accessToken, role: roleRaw } = session.data as
			| Session & { accessToken: string; role: string }

		const role = roleRaw?.toLowerCase() as ApiRoles

		//ALWAYS ALLOW ADMIN
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

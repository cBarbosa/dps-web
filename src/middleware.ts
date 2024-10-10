import { withAuth } from 'next-auth/middleware'
import { revalidatePath } from 'next/cache'

export default withAuth({
	// Matches the pages config in `[...nextauth]`
	pages: {
		signIn: '/login',
	},
})

export const config = {
	matcher: '/((?!login|forgot-password|static|favicon.ico).*)',
}

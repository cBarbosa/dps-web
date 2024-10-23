import { withAuth } from 'next-auth/middleware'
import { revalidatePath } from 'next/cache'

export default withAuth({
	// Matches the pages config in `[...nextauth]`
	pages: {
		signIn: '/login',
	},

	callbacks: {
		// Called when the user is authenticated
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		authorized: ({ token, req }) => {
			console.log(token)
			console.log('^^^^^^^^Authorized')
			console.log(req)
			return true
		},
	},
})

export const config = {
	matcher: '/((?!login|forgot-password|static|favicon.ico).*)',
}

import axios from 'redaxios'

function resolveBaseURL(): string | undefined {
	const raw = process.env.NEXT_PUBLIC_API_BASE_URL
	if (!raw || raw === 'null' || raw === 'undefined') return undefined
	if (!/^https?:\/\//i.test(raw)) return undefined
	return raw
}

const instance = axios.create({
	baseURL: resolveBaseURL(),
})

export default instance

import axios from 'redaxios'

const instance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

export default instance

import { LoaderIcon } from 'lucide-react'

export default function LoadingPage() {
	return (
		<div className="flex w-screen h-screen justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	)
}

import { LoaderIcon } from 'lucide-react'
import React from 'react'

const LoadingScreen = () => {
	return (
		<div className="flex w-full h-full min-h-20 justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	)
}

export default LoadingScreen

import { LoaderIcon } from 'lucide-react'
import React from 'react'

const LoadingScreen = () => {
	return (
		<div className="flex w-full h-full justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	)
}

export default LoadingScreen

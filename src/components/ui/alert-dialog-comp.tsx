import React from 'react'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './alert-dialog'

const DialogAlertComp = ({
	open = false,
	defaultOpen = false,
	onOpenChange,
	title,
	children,
}: {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	title: string
	children: React.ReactNode
}) => {
	return (
		<AlertDialog
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={onOpenChange}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{children}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Fechar</AlertDialogCancel>
					{/* <AlertDialogAction>Continue</AlertDialogAction> */}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default DialogAlertComp

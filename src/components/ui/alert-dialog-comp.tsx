import React from 'react'
import {
	AlertDialog,
	AlertDialogAction,
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
	onConfirm,
	confirmText = 'Continuar',
}: {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	title: string
	children: React.ReactNode
	onConfirm?: () => void
	confirmText?: string
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
					{onConfirm ? (
						<AlertDialogAction onClick={onConfirm}>
							{confirmText}
						</AlertDialogAction>
					) : null}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default DialogAlertComp

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

type AlertContent = {
	title: string
	description?: string
	closeLabel?: string
	actionList?: {
		label: string
		action: () => void
	}[]
}

type AlertDialogConfig = {
	defaultOpen?: boolean
	open?: boolean
	onOpenChange?: (open: boolean) => void
	initialContent: AlertContent
}
export default function useAlertDialog({
	defaultOpen,
	open: openArg,
	onOpenChange,
	initialContent,
}: AlertDialogConfig) {
	const [open, setOpen] = useState(openArg ?? defaultOpen ?? false)
	const [content, setContent] = useState<AlertContent>(initialContent)

	function toggle(newOpen?: boolean) {
		if (openArg !== undefined) return onOpenChange?.(newOpen ?? !openArg)

		if (newOpen !== undefined) setOpen(newOpen)
		else setOpen(prev => !prev)
	}

	const dialogComp = content.title ? (
		<AlertDialog open={openArg ?? open} onOpenChange={open => toggle(open)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{content.title}</AlertDialogTitle>
					{content.description && (
						<AlertDialogDescription>
							{content.description}
						</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{content.closeLabel ?? 'Fechar'}
					</AlertDialogCancel>
					{content.actionList?.map(({ label, action }) => (
						<AlertDialogAction key={label} onClick={action}>
							{label}
						</AlertDialogAction>
					))}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	) : null

	return {
		toggle,
		dialogComp,
		setContent: (content: AlertContent, open?: boolean) => {
			setContent(content)
			if (open !== undefined) toggle(open)
		},
	}
}

'use client'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { AvatarFallback } from '@radix-ui/react-avatar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { UserData } from './top-bar'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

export default function AccountSection({ userData }: { userData: UserData }) {
	return (
		<div className="flex ml-10 gap-3 items-center">
			<div className="text-right">
				<div className="text-sm font-bold text-primary-dark">
					{userData.name}
				</div>
				<div className="text-xs text-muted-foreground capitalize">
					{userData.role.toLowerCase()}
				</div>
			</div>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						className="p-0 hover:cursor-pointer hover:ring-2 hover:ring-ring"
						asChild
					>
						<Avatar className="h-12 w-12 rounded-xl">
							<AvatarImage src="/static/images/avatar-pic.jpg" />
							<AvatarFallback>FS</AvatarFallback>
						</Avatar>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="py-1 px-1.5 rounded-lg"
					sideOffset={10}
					collisionPadding={10}
				>
					<Button
						className={userData.role === 'OFERTA' ? 'bg-bradesco' : ''}
						onClick={() => signOut()}
					>
						Sair
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	)
}

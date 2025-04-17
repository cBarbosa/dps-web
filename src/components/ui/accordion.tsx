'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
	<AccordionPrimitive.Item
		ref={ref}
		className={cn('border-b', className)}
		{...props}
	/>
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Trigger> & {
		hideArrow?: boolean
	},
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
		hideArrow?: boolean
	}
>(({ className, children, hideArrow = false, ...props }, ref) => (
	<AccordionPrimitive.Header className="flex">
		<AccordionPrimitive.Trigger
			ref={ref}
			className={cn(
				'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline group',
				className
			)}
			{...props}
		>
			{children}
			{hideArrow ? null : (
				<div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-teal-700 transition-all duration-300 ease-in-out">
					<ChevronUpIcon className="h-5 w-5 transition-transform duration-300 ease-in-out rotate-180 group-data-[state=open]:rotate-0" />
				</div>
			)}
		</AccordionPrimitive.Trigger>
	</AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimitive.Content
		ref={ref}
		className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		{...props}
	>
		<div className={cn('pb-4 pt-0', className)}>{children}</div>
	</AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

if (typeof document !== 'undefined') {
	const style = document.createElement('style')
	style.textContent = `
		[data-state="open"] [data-state-icon="plus-minus"] .plus-icon {
			display: none;
		}
		[data-state="open"] [data-state-icon="plus-minus"] .minus-icon {
			display: inline;
		}
	`
	document.head.appendChild(style)
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

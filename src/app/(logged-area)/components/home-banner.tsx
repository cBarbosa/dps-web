'use client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function HomeBanner() {
	const startUrl = {
		agile: '/agile',
		assertive: '/assertive',
	}

	const [selectedStart, setSelectedStart] =
		useState<keyof typeof startUrl>('agile')

	function selectStart(value: string) {
		if (startUrl[value as keyof typeof startUrl] === undefined) return

		setSelectedStart(value as keyof typeof startUrl)
	}

	return (
		<div className="w-full min-h-[320px] px-14 py-6 rounded-4xl bg-bradesco text-bradesco-foreground bg-[url(/static/images/bradesco-banner-bg.webp)] bg-no-repeat bg-[right_40px_top_10px] bg-[auto_108%]">
			<h2 className="text-4xl font-semibold pr-72">
				Uma nova forma de prospectar e oferecer serviços e seguros!
			</h2>
			<Tabs
				onValueChange={selectStart}
				defaultValue={selectedStart}
				className="w-[400px] ml-5 mt-5"
			>
				<TabsList className="bg-white h-20">
					<TabsTrigger
						value="agile"
						className="h-full px-4 text-md font-semibold text-black bg-transparent data-[state=active]:bg-bradesco-accent data-[state=active]:text-bradesco-foreground"
					>
						+<br />
						Agilidade
					</TabsTrigger>
					<TabsTrigger
						value="assertive"
						className="h-full px-4 text-md font-semibold text-black bg-transparent data-[state=active]:bg-bradesco-accent data-[state=active]:text-bradesco-foreground"
					>
						+<br />
						Assertividade
					</TabsTrigger>
				</TabsList>
			</Tabs>
			<div className="flex ml-5 mt-5 gap-6 items-end">
				<Button
					asChild
					className="px-6 py-5 bg-white hover:bg-white text-black/80 hover:text-black font-semibold"
				>
					<Link href={startUrl[selectedStart]}>Começar</Link>
				</Button>
				<Image
					src="/static/images/bradesco-banner-arrowloop.png"
					width={55}
					height={42}
					alt="Logo"
					className="pb-3"
				/>
			</div>
		</div>
	)
}

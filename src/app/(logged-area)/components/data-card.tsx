'use client'

import React from 'react'
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import {
	Label,
	Pie,
	PieChart,
	PolarGrid,
	PolarRadiusAxis,
	RadialBar,
	RadialBarChart,
} from 'recharts'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DataCard({
	className,
	children,
}: {
	className?: string
	children: React.ReactNode
}) {
	return (
		<div className={cn('p-4 rounded-3xl bg-gray-100', className)}>
			{children}
		</div>
	)
}

export function PieChartCard({
	title,
	chartData,
}: {
	title: string
	chartData: {
		data: {
			label: string
			value: number
			fill: string
		}[]
		config: ChartConfig
	}
}) {
	const chart = chartData ? (
		<ChartContainer
			config={chartData.config}
			className="mx-auto aspect-square max-h-[175px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
		>
			<PieChart>
				<PolarGrid
					gridType="circle"
					radialLines={false}
					stroke="none"
					className="first:fill-white last:fill-muted"
					polarRadius={[60, 20]}
				/>
				<ChartTooltip content={<ChartTooltipContent hideLabel />} />
				<Pie
					data={chartData.data}
					dataKey="value"
					label={renderLabel}
					nameKey="label"
					innerRadius={30}
					outerRadius={50}
					paddingAngle={10}
				/>
			</PieChart>
		</ChartContainer>
	) : null

	return (
		<DataCard>
			<h5 className="font-semibold text-xl">{title}</h5>
			<div className="flex justify-between items-center gap-10">
				<div className="grow-0 shrink-0 w-[175px]">{chart}</div>
				<div className="grow pr-4">
					<ul>
						{chartData.data.map((item, index) => (
							<li key={index}>
								<span
									className="inline-block w-4 h-1.5 mr-3 rounded-full"
									style={{ backgroundColor: item.fill }}
								/>
								<span>
									{item.label}{' '}
									<span className="text-gray-400 text-xs">({item.value}%)</span>
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</DataCard>
	)
}
function renderLabel({ value }: { value: number }) {
	if (value === 0) {
		return null
	}
	return `${value}%`
}

export function DonutProgressCard({
	label,
	value,
	change,
	chartData,
}: {
	label: string
	value: number
	change?: number
	chartData?: {
		value: number
		fill: string
	}
}) {
	const data = {
		data: {
			label: 'percent',
			value: chartData?.value || 0,
			fill: chartData?.fill || 'var(--color-chrome)',
		},

		config: {
			percent: {
				label: 'Percent',
				color: 'hsl(var(--chart-2))',
			},
		},
	}

	const chart = chartData ? (
		<ChartContainer
			config={data.config}
			className="mx-auto aspect-square max-h-[85px]"
		>
			<RadialBarChart
				data={[data.data]}
				startAngle={90}
				endAngle={90 - (data.data.value / 100) * 360}
				innerRadius={35}
				outerRadius={65}
			>
				<PolarGrid
					gridType="circle"
					radialLines={false}
					stroke="none"
					className="first:fill-background last:fill-muted"
					polarRadius={[40, 30]}
				/>
				<RadialBar dataKey="value" background cornerRadius={10} />
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={viewBox.cx}
											y={viewBox.cy}
											className="fill-foreground text-base font-normal"
										>
											{data.data.value.toLocaleString()}%
										</tspan>
									</text>
								)
							}
						}}
					/>
				</PolarRadiusAxis>
			</RadialBarChart>
		</ChartContainer>
	) : null

	return (
		<DataCard>
			<div className="h-full flex flex-col gap-2">
				<div className="grow flex justify-between items-center gap-5">
					<div className="grow">
						<h5 className="text-lg font-bold">{value}</h5>
						<h6 className="mt-2 text-sm">{label}</h6>
					</div>
					<div className="grow-0 shrink-0 w-[85px]">{chart}</div>
				</div>
				{change && (
					<div className="text-sm text-gray-400">
						{change > 0 ? (
							<p>
								<span className="text-green-600 font-semibold">
									<TrendingUpIcon size={18} className="inline" />{' '}
									{change.toLocaleString()}%
								</span>{' '}
								a mais que o mês passado
							</p>
						) : (
							<p>
								<span className="text-red-600 font-semibold">
									<TrendingDownIcon size={18} className="inline" />{' '}
									{change.toLocaleString()}%
								</span>{' '}
								a menos que o mês passado
							</p>
						)}
					</div>
				)}
			</div>
		</DataCard>
	)
}

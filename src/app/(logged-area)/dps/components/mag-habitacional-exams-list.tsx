'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getRequiredExamsMagHabitacional, getExamsByTypeMagHabitacional } from '@/utils/exam-rules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MagHabitacionalExamsListProps {
	age: number
	gender: 'M' | 'F'
}

export default function MagHabitacionalExamsList({ age, gender }: MagHabitacionalExamsListProps) {
	const examsByType = getExamsByTypeMagHabitacional(age, gender)
	const allExams = getRequiredExamsMagHabitacional(age, gender)

	if (allExams.length === 0) {
		return null
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Exames Médicos Necessários</CardTitle>
				<CardDescription>
					Lista de exames necessários baseado na idade ({age} anos) e gênero ({gender === 'M' ? 'Masculino' : 'Feminino'})
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{examsByType.minimum.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm mb-2 text-gray-700">Exames Mínimos</h4>
						<div className="flex flex-wrap gap-2">
							{examsByType.minimum.map((exam, index) => (
								<Badge key={index} variant="default">
									{exam.replace(/_/g, ' ')}
								</Badge>
							))}
						</div>
					</div>
				)}

				{examsByType.additional.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm mb-2 text-gray-700">
							Exames Adicionais ({age > 51 && age <= 60 ? '51-60 anos' : '&gt; 61 anos'})
						</h4>
						<div className="flex flex-wrap gap-2">
							{examsByType.additional.map((exam, index) => (
								<Badge key={index} variant="secondary">
									{exam.replace(/_/g, ' ')} {gender === 'M' && exam === 'PSA' ? '(Masculino)' : gender === 'F' && exam === 'Ultrassonografia_mamas' ? '(Feminino)' : ''}
								</Badge>
							))}
						</div>
					</div>
				)}

				{examsByType.complete.length > 0 && (
					<div>
						<h4 className="font-semibold text-sm mb-2 text-gray-700">Exames Completos (&gt; 61 anos)</h4>
						<div className="flex flex-wrap gap-2">
							{examsByType.complete.map((exam, index) => (
								<Badge key={index} variant="outline">
									{exam.replace(/_/g, ' ')}
								</Badge>
							))}
						</div>
					</div>
				)}

				<div className="mt-4 pt-4 border-t">
					<p className="text-xs text-gray-500">
						Total de exames necessários: <strong>{allExams.length}</strong>
					</p>
				</div>
			</CardContent>
		</Card>
	)
}


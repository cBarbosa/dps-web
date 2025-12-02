'use client'

import React from 'react'

interface ScoreGaugeProps {
	scoreLabel: string
	className?: string
}

export function ScoreGauge({ scoreLabel, className }: ScoreGaugeProps) {
	// Converte a faixa de score da API em valor numérico para o gráfico
	const getScoreValue = (label: string): { value: number; color: string; description: string } => {
		const upperLabel = label?.toUpperCase().trim() || ''
		
		// Mapeamento em 4 zonas: Verde, Amarelo, Laranja, Vermelho
		if (upperLabel === 'BAIXISSIMO RISCO' || upperLabel === 'BAIXÍSSIMO RISCO' || upperLabel === 'BAIXISSIMO') {
			return { value: 15, color: '#10B981', description: 'Baixíssimo Risco' } // Verde
		}
		if (upperLabel === 'BAIXO') {
			return { value: 20, color: '#10B981', description: 'Baixo' } // Verde
		}
		if (upperLabel === 'MEDIO' || upperLabel === 'MÉDIO') {
			return { value: 45, color: '#EEC232', description: 'Médio' } // Amarelo
		}
		if (upperLabel === 'ALTO') {
			return { value: 70, color: '#F59E0B', description: 'Alto' } // Laranja
		}
		if (upperLabel === 'ALTISSIMO' || upperLabel === 'ALTÍSSIMO') {
			return { value: 90, color: '#DC2626', description: 'Altíssimo' } // Vermelho
		}
		
		return { value: 50, color: '#9CA3AF', description: label || 'N/A' }
	}

	const scoreData = getScoreValue(scoreLabel)
	
	// Configurações do gauge - ajustado para rotação vertical
	const width = 280
	const height = 280
	const centerX = width / 2
	const centerY = height / 2
	const radius = 120
	const needleLength = 95
	
	// Converte o valor (0-100) para ângulo (0 a 180 graus)
	const valueToAngle = (value: number) => {
		return (value / 100) * 180
	}
	
	const needleAngle = valueToAngle(scoreData.value)
	// Ajusta para que 0 fique à esquerda e 180 à direita
	const needleAngleRad = ((needleAngle - 90) * Math.PI) / 180
	
	// Ponto final da agulha
	const needleX = centerX + needleLength * Math.cos(needleAngleRad)
	const needleY = centerY + needleLength * Math.sin(needleAngleRad)
	
	// Criar os arcos coloridos - versão simplificada e robusta
	const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
		const start = (startAngle - 90) * (Math.PI / 180)
		const end = (endAngle - 90) * (Math.PI / 180)
		
		const x1 = centerX + Math.cos(start) * outerRadius
		const y1 = centerY + Math.sin(start) * outerRadius
		const x2 = centerX + Math.cos(end) * outerRadius
		const y2 = centerY + Math.sin(end) * outerRadius
		
		const x3 = centerX + Math.cos(end) * innerRadius
		const y3 = centerY + Math.sin(end) * innerRadius
		const x4 = centerX + Math.cos(start) * innerRadius
		const y4 = centerY + Math.sin(start) * innerRadius
		
		const largeArc = endAngle - startAngle > 180 ? 1 : 0
		
		return `M ${x1},${y1} A ${outerRadius},${outerRadius} 0 ${largeArc} 1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`
	}

	return (
		<div className={className}>
			<div className="p-4 rounded-2xl border border-muted bg-gradient-to-br from-white to-gray-50 shadow-sm h-full flex items-center justify-center">
				<div className="flex items-center justify-center w-full">
					<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm -rotate-90 mx-auto">
						{/* Fundo do gauge - base cinza clara */}
						<path
							d={createArc(0, 180, 85, 115)}
							fill="#E5E7EB"
							opacity="0.3"
						/>
						
						{/* Zona Verde (0-25%) */}
						<path
							d={createArc(0, 45, 85, 115)}
							fill="#10B981"
							opacity="0.7"
						/>
						
						{/* Zona Amarela (25-50%) */}
						<path
							d={createArc(45, 90, 85, 115)}
							fill="#EEC232"
							opacity="0.7"
						/>
						
						{/* Zona Laranja (50-75%) */}
						<path
							d={createArc(90, 135, 85, 115)}
							fill="#F59E0B"
							opacity="0.7"
						/>
						
						{/* Zona Vermelha (75-100%) */}
						<path
							d={createArc(135, 180, 85, 115)}
							fill="#DC2626"
							opacity="0.7"
						/>
						
						{/* Linhas divisórias entre as zonas */}
						{[45, 90, 135].map((angle) => {
							const rad = ((angle - 90) * Math.PI) / 180
							const x1 = centerX + 85 * Math.cos(rad)
							const y1 = centerY + 85 * Math.sin(rad)
							const x2 = centerX + 115 * Math.cos(rad)
							const y2 = centerY + 115 * Math.sin(rad)
							return (
								<line
									key={angle}
									x1={x1}
									y1={y1}
									x2={x2}
									y2={y2}
									stroke="white"
									strokeWidth="2"
									opacity="0.6"
								/>
							)
						})}
						
						{/* Agulha/Ponteiro estilo triangular com sombra */}
						<defs>
							<filter id="needleShadow">
								<feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3"/>
							</filter>
						</defs>
						
						{/* Agulha triangular */}
						<polygon
							points={`${centerX},${centerY - 6} ${needleX},${needleY} ${centerX},${centerY + 6}`}
							fill={scoreData.color}
							filter="url(#needleShadow)"
						/>
						
						{/* Círculo central maior com borda */}
						<circle
							cx={centerX}
							cy={centerY}
							r="12"
							fill={scoreData.color}
							stroke="white"
							strokeWidth="3"
						/>
						
						{/* Círculo interno decorativo */}
						<circle
							cx={centerX}
							cy={centerY}
							r="5"
							fill="white"
							opacity="0.3"
						/>
						
						{/* Descrição com fundo - compensando rotação de 90° */}
						<g transform={`rotate(90, ${centerX}, ${centerY})`}>
							<rect
								x={centerX - 65}
								y={centerY + 35}
								width="130"
								height="30"
								rx="15"
								fill={scoreData.color}
								opacity="0.15"
							/>
							<text
								x={centerX}
								y={centerY + 55}
								fontSize="15"
								fontWeight="700"
								fill={scoreData.color}
								textAnchor="middle"
							>
								{scoreData.description}
							</text>
						</g>
					</svg>
				</div>
			</div>
		</div>
	)
}


'use client'

import { Input } from '@/components/ui/input'
import { ListFilterIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { 
	Popover,
	PopoverContent,
	PopoverTrigger 
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface SearchFilterProps {
	filterAction: (formData: FormData) => Promise<void>
}

export function SearchFilter({ filterAction }: SearchFilterProps) {
	const [searchType, setSearchType] = useState<'cpf' | 'operation'>('cpf')
	
	return (
		<form action={filterAction} className="mb-3 flex gap-5 items-center">
			<>
				<Input
					name="searchValue"
					placeholder={searchType === 'cpf' ? "Pesquisar CPF" : "Pesquisar Nº Operação"}
					className="w-72 p-5 rounded-full bg-gray-150 border-none"
					icon={<SearchIcon size={20} className="text-gray-500" />}
					iconOffset={2}
					mask={searchType === 'cpf' ? "999.999.999-99" : undefined}
					maxLength={searchType === 'operation' ? 20 : undefined}
					type={searchType === 'operation' ? 'number' : 'text'}
				/>
				<input type="hidden" name="searchType" value={searchType} />
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="round"
							className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
						>
							<ListFilterIcon size={20} />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Tipo de Pesquisa</h4>
							<RadioGroup 
								defaultValue="cpf" 
								className="gap-2"
								value={searchType}
								onValueChange={(value) => setSearchType(value as 'cpf' | 'operation')}
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="cpf" id="cpf" />
									<Label htmlFor="cpf">CPF</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="operation" id="operation" />
									<Label htmlFor="operation">Número de Operação</Label>
								</div>
							</RadioGroup>
						</div>
					</PopoverContent>
				</Popover>
				<Button
					type="submit"
					variant="round"
					className="w-10 h-10 p-0 text-muted-foreground bg-gray-150 hover:bg-gray-200"
				>
					<SearchIcon size={20} />
				</Button>
			</>
		</form>
	)
} 
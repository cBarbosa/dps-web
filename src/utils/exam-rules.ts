/**
 * Regras de exames médicos para produtos DPS
 */

// Regras de exames para MAG Habitacional
export const MAG_HABITACIONAL_EXAM_RULES = {
  MINIMUM: [
    'Hb1Ac',
    'Glicemia',
    'Colesterol_total_HDL',
    'Triglicerídeos',
    'Creatinina',
    'TGO',
    'TGP',
    'Gama-GT',
    'NT-proBNP',
    'Eletrocardiograma_esforço',
    'HIV',
    'Hemograma',
    'PH',
    'Proteinas',
    'Glicose',
    'Corpos_cetonicos',
    'Urobilinogenio',
    'Bilirubinas',
    'Celulas_epiteliais',
    'Leucocitos',
    'Hemacias',
    'Cristais',
    'Filamentos_muco',
    'Cilindros',
    'Bacteria'
  ],
  PSA_OR_ULTRASOUND: (gender: 'M' | 'F'): string[] => 
    gender === 'M' ? ['PSA'] : ['Ultrassonografia_mamas'],
  COMPLETE: ['ECG', 'Teste_Esforco', 'Ecocardiograma']
} as const;

/**
 * Obtém a lista de exames necessários para MAG Habitacional baseado em idade e gênero
 * @param age Idade do proponente
 * @param gender Gênero ('M' para masculino, 'F' para feminino)
 * @returns Array com os nomes dos exames necessários
 */
export function getRequiredExamsMagHabitacional(age: number, gender: 'M' | 'F'): string[] {
  const exams: string[] = [...MAG_HABITACIONAL_EXAM_RULES.MINIMUM];
  
  // Idade > 51 e ≤ 60 anos: Adiciona PSA ou Ultrassonografia das mamas
  if (age > 51 && age <= 60) {
    exams.push(...MAG_HABITACIONAL_EXAM_RULES.PSA_OR_ULTRASOUND(gender));
  }
  
  // Idade > 61 anos: Adiciona todos os anteriores + exames completos
  if (age > 61) {
    exams.push(...MAG_HABITACIONAL_EXAM_RULES.PSA_OR_ULTRASOUND(gender));
    exams.push(...MAG_HABITACIONAL_EXAM_RULES.COMPLETE);
  }
  
  // Remove duplicatas e retorna
  return Array.from(new Set(exams));
}

/**
 * Obtém exames agrupados por tipo para MAG Habitacional
 * @param age Idade do proponente
 * @param gender Gênero ('M' para masculino, 'F' para feminino)
 * @returns Objeto com exames agrupados por tipo
 */
export function getExamsByTypeMagHabitacional(age: number, gender: 'M' | 'F'): {
  minimum: string[];
  additional: string[];
  complete: string[];
} {
  const minimum = [...MAG_HABITACIONAL_EXAM_RULES.MINIMUM];
  const additional: string[] = [];
  const complete: string[] = [];
  
  // Idade > 51 e ≤ 60 anos: Adiciona PSA ou Ultrassonografia das mamas
  if (age > 51 && age <= 60) {
    additional.push(...MAG_HABITACIONAL_EXAM_RULES.PSA_OR_ULTRASOUND(gender));
  }
  
  // Idade > 61 anos: Adiciona todos os anteriores + exames completos
  if (age > 61) {
    additional.push(...MAG_HABITACIONAL_EXAM_RULES.PSA_OR_ULTRASOUND(gender));
    complete.push(...MAG_HABITACIONAL_EXAM_RULES.COMPLETE);
  }
  
  return {
    minimum,
    additional,
    complete
  };
}


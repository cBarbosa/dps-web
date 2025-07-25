'use server';

import axios from '../../../lib/axios'
import { redirect } from 'next/navigation'

export async function getProposals(
	token: string,
	cpf = '',
	operation?: string,
	dfiStatus?: number,
	produto?: string,
	status?: number,
	orderBy?: string,
	page = 1,
	size = 10
) {
	try {
		const response = await axios.get('v1/Proposal/all', {
			params: {
				page: page,
				size: size,
				document: cpf ?? ``,
				contractNumber: operation ?? ``,
				dfiStatus: dfiStatus ?? ``,
				status: status ?? ``,
				productUid: produto ?? ``,
				orderBy: orderBy ?? ``
			},
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data as {
				totalItems: number
				page: number
				size: number
				items: {
					uid: string
					code: string
					riskStatus?: string
					customer: {
						uid: string
						document: string
						name: string
						email: string
						birthdate: string
					}
					product: {
						uid: string
						name: string
					}
					type: {
						id: number
						description: string
					}
					status: {
						id: number
						description: string
					}
					dfiStatus: {
						id: number
						description: string
					}
					// lmi: {
					// 	code: number
					// 	description: string
					// }
					createdAt: string
				}[]
			}
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function postProposal(
	token: string,
	data: {
		document: string
		name: string
		socialName?: string
		gender: string
		cellphone?: string
		email: string
		contractNumber?: string
		birthDate: string
		productId: string
		profession: string
		typeId: number
		deadlineId?: number
		deadlineMonths?: number
		propertyTypeId: number
		capitalMip: number
		capitalDfi: number
		address?: any
		participantsNumber?: string
		totalValue?: number
		totalParticipants?: number
		operationValue?: number
		percentageParticipation?: number
		financingParticipation?: number
		participantType?: string
	}
) {
	try {
		const response = await axios.post('v1/Proposal', data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getLmiOptions(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/ValoresLMI', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getTipoImovelOptions(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/TipoImovel', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getPrazosOptions(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/Prazos', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getProposalSituations(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/SituacaoProposta', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getProposalTypes(token: string): Promise<{
	success: boolean
	message: string
	data: { id: number; description: string }[]
} | null> {
	try {
		const response = await axios.get('v1/Domain/group/TipoProposta', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getProductList(token: string): Promise<{
	success: boolean
	message: string
	data: {
		uid: string
		name: string
		status: string
	}[]
} | null> {
	try {
		const response = await axios.get('v1/Product/all', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export type ProposalByUid = {
	uid: string;
	code: string;
	contractNumber?: string; // Opcional, pois é opcional em ProposalByUidA
	capitalMIP: number;
	capitalDFI: number;
	uploadMIP?: boolean; // Opcional, pois é opcional em ProposalByUidA
	uploadDFI?: boolean; // Opcional, pois é opcional em ProposalByUidA
	uploadReturnMIP?: boolean; // Opcional, pois existe apenas em ProposalByUidE
	customer: {
	  uid: string;
	  document: string;
	  name: string;
	  socialName?: string; // Opcional, pois é opcional em ProposalByUidA
	  email: string;
	  cellphone: string;
	  profession?: string; // Opcional, pois existe apenas em ProposalByUidE
	  gender: string;
	  birthdate: string;
	};
	product: {
	  uid: string;
	  name: string;
	  description?: string; // Opcional, pois existe apenas em ProposalByUidE
	};
	type: {
	  id: number;
	  description: string;
	};
	statusId?: number; // Opcional, pois existe apenas em ProposalByUidE
	status: {
	  id: number;
	  description: string;
	};
	dfiStatus?: { // Opcional, pois existe apenas em ProposalByUidA
	  id: number;
	  description: string;
	};
	propertyTypeId?: number; // Opcional, pois é opcional em ProposalByUidA
	deadLineId?: number; // Opcional, pois é opcional em ProposalByUidA
	deadlineMonths?: number; // Opcional, pois é opcional em ProposalByUidA
	deadLine?: {
	  id: number;
	  description: string;
	}; // Opcional, pois é opcional em ProposalByUidA
	created: string;
	addressZipcode?: string; // Opcional, pois é opcional em ProposalByUidA
	addressStreet?: string; // Opcional, pois é opcional em ProposalByUidA
	addressNumber?: string; // Opcional, pois é opcional em ProposalByUidA
	addressComplement?: string; // Opcional, pois é opcional em ProposalByUidA
	addressNeighborhood?: string; // Opcional, pois existe apenas em ProposalByUidA
	addressCity?: string; // Opcional, pois é opcional em ProposalByUidA
	addressState?: string; // Opcional, pois é opcional em ProposalByUidA
	history: {
	  description: string;
	  statusId: number;
	  created: string;
	}[];
	riskStatus?: string; // Opcional, pois existe apenas em ProposalByUidA
	closed?: string; // Opcional, pois existe apenas em ProposalByUidA
	refused?: string; // Opcional, pois existe apenas em ProposalByUidA
  };

export async function getProposalByUid(
	token: string,
	uid: string
): Promise<{
	success: boolean
	message: string
	data: ProposalByUid
} | null> {
	try {
		const response = await axios.get(`v1/Proposal/${uid}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getHealthDataByUid(
	token: string,
	uid: string
): Promise<{
	message: string
	success: boolean
	data: {
		code: string
		question: string
		exists: boolean
		created: string
		updated: string
		description?: string
	}[]
} | null> {
	try {
		const response = await axios.get('v1/Proposal/' + uid + '/questions', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function postHealthDataByUid(
	token: string,
	uid: string,
	data: {
		code: string
		question: string
		exists: boolean
		created: string
	}[]
) {
	try {
		const response = await axios.post(`v1/Proposal/${uid}/questions`, data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function postAttachmentFile(
	token: string,
	uid: string,
	data: {
		documentName: string
		description: string
		stringBase64: string
	}
) {
	try {
		if (data.stringBase64.startsWith('data:'))
			data.stringBase64 = data.stringBase64.split(',')[1]

		const response = await axios.post(`v1/Proposal/${uid}/document`, data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function signProposal(token: string, uid: string) {
	try {
		const response = await axios.post(`v1/Proposal/${uid}/sign`, null, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function postStatus(
	token: string,
	uid: string,
	statusId: number,
	description: string,
	type: 'MIP' | 'DFI'
) {
	const requestData = {
		statusId,
		Description: description,
		type,
	}
	try {
		const response = await axios.post(
			`v1/Proposal/${uid}/status`,
			requestData,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getProposalDocumentsByUid(
	token: string,
	uid: string,
	type?: 'MIP' | 'DFI'
): Promise<
	Promise<{
		message: string
		success: boolean
		data: {
			uid: string
			documentName: string
			documentUrl: string
			description: string
			created: Date | string
			updated?: Date | string
		}[]
	} | null>
> {
	try {
		const response = await axios.get(
			`v1/Proposal/${uid}/document${type ? `?type=${type}` : ''}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function postProposalDocumentsByUid(
	token: string,
	uid: string,
	data: {
		documentName: string
		description: string
		stringBase64: string
		type: 'MIP' | 'DFI'
	}
) {
	try {
		if (data.stringBase64.startsWith('data:'))
			data.stringBase64 = data.stringBase64.split(',')[1]

		const response = await axios.post(
			`v1/Proposal/${uid}/document${data.type ? `?type=${data.type}` : ''}`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export const getProposalArchiveByUid = async (
	token: string,
	uid: string,
	documentUid: string
): Promise<
	Promise<{
		message: string
		success: boolean
		data: string
	} | null>
> => {
	try {
		const response = await axios.get(
			`v1/Proposal/${uid}/document/${documentUid}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		if (response?.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export const getProposalSignByUid = async (
	token: string,
	uid: string
): Promise<
	Promise<{
		message: string
		success: boolean
		data: string
	} | null>
> => {
	try {
		const response = await axios.get(`v1/Proposal/${uid}/pdf-sign`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		if (response?.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null
}

export async function getProponentDataByCpf(cpf: string): Promise<{
	detalhes: {
		antecedenteCriminal: string
		nascimento?: string
		riscoAposentadoPorDoenca: string
		aposentado: string
		situacaoCadastral: string
		obitoOnline: string
		profissao: string
		nome: string
		profissaoRisco: string
		renda: string
		idade: string
		riscoAposentadoPorAcidente: string
		cpf: string
		sexo: string
		mandadoPrisao: string
		nomeMae: string
		aposentadoMotivo: string
	}
	mortePorQualquerCausa: {
		score: string
		indicadorDecisao: string
	}
	morteNatural: {
		score: string
		indicadorDecisao: string
	}
	mortePorAcidente: {
		score: string
		indicadorDecisao: string
	}
	acidente: {
		score: string
		indicadorDecisao: string
	}
	doencasCronicas: {
		score: string
		indicadorDecisao: string
	}
} | null> {
	// | {
	// 		codigo: string
	// 		mensagem: string
	// 		parametros: unknown[]
	// 		validacoes: [
	// 			{
	// 				propriedade: string
	// 				mensagem: string
	// 				argumentos: unknown[]
	// 			}
	// 		]
	// 		stacktrace: string
	// 		referencia: string
	//   }
	cpf = cpf.replace(/[^\d]/g, '')
	if (cpf.length !== 11) return null

	try {
		const response = await axios.get(
			'https://apitechtrail.com.br/api/score/pf/' + cpf,
			{
				headers: {
					Authorization:
						'Basic MjJlYWU3ZDQtZjI3Mi00NDJlLTkyZDAtYWZlMjMyMDg4YmFkOjYwYWU0NmE2OGI2ZWY4NTAxYjQ4NWVkMzQ3ZGMzZjI4OGFhYTIyOGYxMWUxZGQyNzMxZDAzY2IyOTI5ZTM3NmY=',
				},
			}
		)

		if (!response.data.codigo) {
			return response.data
		} else {
			throw new Error(
				'Unsuccessful request. Message: "' +
					response.data.mensagem +
					'".\n\n Parametros: ' +
					response.data?.parametros?.join(', ')
			)
		}
	} catch (err) {
		console.error(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}

		return null
	}
}

export async function getAddressByZipcode(
	zipcode: string,
): Promise<{
		logradouro: string
		complemento: string
		unidade: string
		bairro: string
		localidade: string
		uf: string
		estado: string
		regiao: string
		ibge: string
		gia: string
		ddd: string
		siafi: string
	} | null
> {
	try {
		const response = await axios.get(
			`https://viacep.com.br/ws/${zipcode}/json`
		)

		if (response.data) {
			return response.data
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null;
};

export async function deleteArchive(
	token: string,
	archiveUid: string
) {

	try {
		const response = await axios.delete(
			`v1/Proposal/${archiveUid}/document`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				}
			}
		);

		if (response.data) {
			return response.data;
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
	}

	return null;
};

export async function getReopenedProposals(
	token: string,
	status?: number,
	page = 1,
	size = 10
) {

	try {
		const response = await axios.get('v1/Proposal/reopen', {
			params: {
				page: page,
				size: size,
				status: status ?? ''
			},
			headers: {
				Authorization: `Bearer ${token}`,
			}
		})

		if (response.data) {
			return response.data as {
				totalItems: number
				page: number
				size: number
				items: {
					uid: string
					code: string
					riskStatus?: string
					customer: {
						uid: string
						document: string
						name: string
						email: string
						birthdate: string
					}
					product: {
						uid: string
						name: string
					}
					type: {
						id: number
						description: string
					}
					status: {
						id: number
						description: string
					}
					dfiStatus: {
						id: number
						description: string
					}
					createdAt: string
				}[];
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};

export async function putProposalAnalysis(
	token: string,
	uid: string,
	data: {
		Action: string
		IsApproved: boolean
	}
) {
	try {

		const response = await axios.put(
			`v1/Proposal/${uid}/analysis`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				}
			}
		);

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};

export async function getReviewProposals(
	token: string,
	status?: number,
	page = 1,
	size = 10
) {

	try {
		const response = await axios.get('v1/Proposal/review', {
			params: {
				page: page,
				size: size,
				status: status ?? ''
			},
			headers: {
				Authorization: `Bearer ${token}`,
			}
		})

		if (response.data) {
			return response.data as {
				totalItems: number
				page: number
				size: number
				items: {
					uid: string
					code: string
					riskStatus?: string
					customer: {
						uid: string
						document: string
						name: string
						email: string
						birthdate: string
					}
					product: {
						uid: string
						name: string
					}
					type: {
						id: number
						description: string
					}
					status: {
						id: number
						description: string
					}
					dfiStatus: {
						id: number
						description: string
					}
					createdAt: string
				}[];
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};

export async function putProposalReview(
	token: string,
	uid: string,
	data: {
		Action: string
		IsApproved: boolean
	}
) {
	try {

		const response = await axios.put(
			`v1/Proposal/${uid}/review`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				}
			}
		);

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};

export async function getParticipantsByOperation(
	token: string,
	operationNumber: string
) {
	try {
		const response = await axios.get(`v1/Proposal/participants/${operationNumber}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.data) {
			return response.data as {
				message: string;
				success: boolean;
				data: Array<{
					uid: string;
					contractNumber: string;
					operationValue: number;
					totalParticipants: number;
					percentageParticipation: number;
					financingParticipation: number;
					participantType: "P" | "C";
					productId: number;
					deadlineId?: number;
					deadlineMonths?: number;
					propertyTypeId: number;
					capitalMIP: number;
					capitalDFI: number;
					customer: {
						name: string;
						document: string;
					};
					product: {
						uid: string;
						name: string;
						description: string;
					};
				}>
			}
		} else {
			throw new Error('Unsuccessful request')
		}
	} catch (err) {
		console.log(err)

		if ((err as any)?.status === 401) {
			redirect('/logout')
		}
		return {
			message: "Erro ao buscar participantes",
			success: false,
			data: []
		}
	}
}

export async function putProposalCancel(
	token: string,
	uid: string,
	data: {
		Action: string
		IsApproved: boolean
	}
) {
	try {
		const response = await axios.put(
			`v1/Proposal/${uid}/cancel`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				}
			}
		);

		if (response.data) {
			return response.data as {
				message: string
				success: boolean
				data: number
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};

export async function getCanceledProposals(
	token: string,
	status?: number,
	page = 1,
	size = 10
) {

	try {
		const response = await axios.get('v1/Proposal/cancel', {
			params: {
				page: page,
				size: size,
				status: status ?? ''
			},
			headers: {
				Authorization: `Bearer ${token}`,
			}
		})

		if (response.data) {
			return response.data as {
				totalItems: number
				page: number
				size: number
				items: {
					uid: string
					code: string
					riskStatus?: string
					customer: {
						uid: string
						document: string
						name: string
						email: string
						birthdate: string
					}
					product: {
						uid: string
						name: string
					}
					type: {
						id: number
						description: string
					}
					status: {
						id: number
						description: string
					}
					dfiStatus: {
						id: number
						description: string
					}
					createdAt: string
				}[];
			}
		} else {
			throw new Error('Unsuccessful request');
		}
	} catch (err) {
		console.log(err);

		if ((err as any)?.status === 401) {
			redirect('/logout');
		}
	}

	return null;
};
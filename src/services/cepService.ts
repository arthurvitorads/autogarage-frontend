export interface EnderecoViaCep {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

interface ViaCepResponse extends EnderecoViaCep {
  erro?: boolean
}

export async function buscarCep(
  cep: string,
): Promise<EnderecoViaCep> {
  const cepLimpo = cep.replace(/\D/g, '')

  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido.')
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${cepLimpo}/json/`,
  )

  if (!response.ok) {
    throw new Error(
      'Não foi possível consultar o CEP.',
    )
  }

  const data =
    (await response.json()) as ViaCepResponse

  if (data.erro) {
    throw new Error(
      'CEP não encontrado ou incorreto.',
    )
  }

  return data
}
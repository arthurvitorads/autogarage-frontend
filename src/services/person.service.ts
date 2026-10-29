import { apiRequest } from '@/services/api.service'
import type { ICadPessoa, IPessoaResponse, IManutPessoa } from '@/interface/interface-pages/PessoaPage'
import type { Pessoa } from '@/models/pessoa'

export function getPerson(ePage = 1, eLimit = 20, search = ''): Promise<IPessoaResponse> {
  const params = new URLSearchParams({
    page: String(ePage),
    limit: String(eLimit),
    search
  })
  return apiRequest(`/pessoa?${params}`)
}

export function createPerson(values: IManutPessoa) {
  return apiRequest<ICadPessoa>('/pessoa', values)
}

export function updatePerson(id: string | number, values: IManutPessoa) {
  return apiRequest<ICadPessoa>(`/pessoa/${encodeURIComponent(id)}`, values)
}

export function personToForm(pessoa: ICadPessoa): Pessoa {
  const endereco = pessoa.endereco
  const dados = {
    id: pessoa.cn_pessoa,
    bo_categ_cliente: pessoa.bo_categ_cliente,
    bo_categ_func: pessoa.bo_categ_func,
    bo_sts_reg: pessoa.bo_sts_reg,
    email: pessoa.an_email ?? '',
    telefone: pessoa.an_telefone ?? '',
    cargo: pessoa.an_cargo ?? '',
    comissaoPercentual: pessoa.nm_comissao_percentual ?? 0,
    endereco: {
      cep: endereco?.ca_cep ?? '',
      logradouro: endereco?.an_logradouro ?? '',
      numero: endereco?.an_numero ?? '',
      complemento: endereco?.an_complemento ?? '',
      bairro: endereco?.an_bairro ?? '',
      cidade: endereco?.an_cidade ?? '',
      uf: endereco?.ca_uf ?? ''
    },
  }
  return pessoa.ca_tipo === 'PF' ? {
    ...dados,
    tipo: 'PF',
    nome: pessoa.an_nome ?? '',
    cpf: pessoa.ca_cpf ?? ''
  }
    : {
      ...dados,
      tipo: 'PJ',
      razaoSocial: pessoa.an_razao_social ?? '',
      nomeFantasia: pessoa.an_nome_fantasia ?? '',
      cnpj: pessoa.ca_cnpj ?? ''
    }
}

export function personToRequest(pessoa: Pessoa): IManutPessoa {
  return {
    ca_tipo: pessoa.tipo,
    an_nome: pessoa.tipo === 'PF' ? pessoa.nome : null,
    ca_cpf: pessoa.tipo === 'PF' ? pessoa.cpf : null,
    ca_cnpj: pessoa.tipo === 'PJ' ? pessoa.cnpj : null,
    an_razao_social: pessoa.tipo === 'PJ' ? pessoa.razaoSocial : null,
    an_nome_fantasia: pessoa.tipo === 'PJ' ? pessoa.nomeFantasia : null,
    an_email: pessoa.email,
    an_telefone: pessoa.telefone,
    bo_categ_cliente: pessoa.bo_categ_cliente,
    bo_categ_func: pessoa.bo_categ_func,
    bo_sts_reg: pessoa.bo_sts_reg,
    an_cargo: pessoa.cargo ?? '',
    nm_comissao_percentual: pessoa.comissaoPercentual ?? 0,
    endereco: {
      ca_cep: pessoa.endereco.cep,
      an_logradouro: pessoa.endereco.logradouro,
      an_numero: pessoa.endereco.numero,
      an_complemento: pessoa.endereco.complemento,
      an_bairro: pessoa.endereco.bairro,
      an_cidade: pessoa.endereco.cidade,
      ca_uf: pessoa.endereco.uf
    },
  }
}

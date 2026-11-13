import { apiPage, apiRequest } from '@/services/api.service'

import type { Pessoa } from '@/models/pessoa.model'

import type {
  ICadPessoa,
  IManutPerson,
  IPessoaGridRow,
} from '@/interface/interface-pages/PessoaPage'

export function getPeople(page = 1, limit = 20, search = '') {
  return apiPage<IPessoaGridRow>('/pessoa/listar', page, limit, search)
}

export function getPersonById(id: string | number) {
  return apiRequest<ICadPessoa>('/pessoa/detalhar', { cn_pessoa: id })
}

export function createPerson(values: IManutPerson) {
  return apiRequest<ICadPessoa>('/pessoa', values)
}

export function updatePerson(id: string | number, values: IManutPerson) {
  return apiRequest<ICadPessoa>('/pessoa/atualizar', { ...values, cn_pessoa: id })
}

export function personToRequest(pessoa: Pessoa): IManutPerson {
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
    nm_comissao_func: pessoa.nm_comissao_func ?? 0,
    endereco: {
      ca_cep: pessoa.endereco.cep,
      an_logradouro: pessoa.endereco.logradouro,
      an_numero: pessoa.endereco.numero,
      an_complemento: pessoa.endereco.complemento,
      an_bairro: pessoa.endereco.bairro,
      an_cidade: pessoa.endereco.cidade,
      cn_estado: pessoa.endereco.cn_estado,
    },
  }
}

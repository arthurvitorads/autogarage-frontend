import type { IFormPessoa } from '@/interface/pages/PessoaPage'

export class PersonModel {
  static createForm(): IFormPessoa {
    return {
      ca_tipo: 'PF',
      bo_categ_cliente: true,
      bo_categ_func: false,
      bo_sts_reg: true,
      an_nome: '',
      ca_cpf: '',
      ca_cnpj: '',
      an_razao_social: '',
      an_nome_fantasia: '',
      an_email: '',
      an_telefone: '',
      an_cargo: '',
      nm_comissao_func: 0,
      ca_cep: '',
      an_logradouro: '',
      an_numero: '',
      an_complemento: '',
      an_bairro: '',
      an_cidade: '',
      cn_estado: '',
    }
  }
}

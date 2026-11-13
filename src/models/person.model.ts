import type { IFormPerson } from '@/interface/interface-pages/PessoaPage'

export class PersonModel {
  static createForm(): IFormPerson {
    return {
      tipo: 'PF',
      bo_categ_cliente: true,
      bo_categ_func: false,
      bo_sts_reg: true,
      nome: '',
      cpf: '',
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      email: '',
      telefone: '',
      cargo: '',
      nm_comissao_func: 0,
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cn_estado: '',
    }
  }
}

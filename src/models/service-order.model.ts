import type { IFormOrdemServico } from '@/interface/pages/OrdemServicoPage'
import { dataHoraLocal } from '@/services/ordem-servico.service'

export class ServiceOrderModel {
  static createForm(defaultClassification: string | number | null = null): IFormOrdemServico {
    return {
      cn_pessoa: null,
      cn_classificacao_os: defaultClassification,
      dt_entrada: dataHoraLocal(),
      dt_previsao: '',
      cn_responsavel: null,
      an_placa: '',
      an_marca: '',
      an_modelo: '',
      nu_ano: null,
      an_cor: '',
      qt_quilometragem: null,
      an_solicitacao: '',
      an_obs: '',
    }
  }
}

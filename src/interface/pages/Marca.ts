export interface IFormMarca {
  an_descr: string
}

export interface IManutMarca extends IFormMarca {
  cn_marca?: number
}

export interface ICadMarca extends IFormMarca {
  cn_marca: number
  dt_inc: string
  dt_alt: string
}

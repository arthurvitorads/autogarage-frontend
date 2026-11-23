import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  ICadCategoriaProduto,
  IManutCategoriaProduto,
} from '@/interface/pages/CategoriaProduto'
import {
  getProductCategoryList,
  saveProductCategory as requestSaveProductCategory,
} from '@/services/product-category.service'
import type {
  ICadCategoriaServico,
  IManutCategoriaServico,
} from '@/interface/pages/CategoriaServico'
import {
  getServiceCategoryList,
  saveServiceCategory as requestSaveServiceCategory,
} from '@/services/service-category.service'
import type { ICadMarca, IManutMarca } from '@/interface/pages/Marca'
import { getBrandList, saveBrand as requestSaveBrand } from '@/services/brand.service'
import type { ICadUnidade, IManutUnidade } from '@/interface/pages/Unidade'
import { getUnitList, saveUnit as requestSaveUnit } from '@/services/unit.service'
import { useUtilStore } from '@/stores/util.store'

export const useCatalogoStore = defineStore('catalogo', () => {
  const productCategoryList = ref<ICadCategoriaProduto[]>([])
  const serviceCategoryList = ref<ICadCategoriaServico[]>([])
  const brands = ref<ICadMarca[]>([])
  const units = ref<ICadUnidade[]>([])
  const utilStore = useUtilStore()
  let sessionVersion = 0

  const categoriasProduto = computed(() => productCategoryList.value.map((item) => item.an_descr))
  const categoriasServico = computed(() => serviceCategoryList.value.map((item) => item.an_descr))
  const marcasProduto = computed(() => brands.value.map((item) => item.an_descr))
  const unidadesProduto = computed(() =>
    units.value.map((item) => ({
      label: item.an_descr + ' (' + item.ca_sigla + ')',
      value: item.ca_sigla,
    })),
  )

  async function loadProductCategoryList() {
    const version = sessionVersion
    const { dados } = await getProductCategoryList()
    if (version === sessionVersion) productCategoryList.value = dados
  }

  async function saveProductCategory(values: IManutCategoriaProduto) {
    const version = sessionVersion
    const { dados } = await requestSaveProductCategory(values)
    if (version === sessionVersion) {
      const index = productCategoryList.value.findIndex(
        (record) => record.cn_categoria_produto === dados.cn_categoria_produto,
      )
      if (index === -1) productCategoryList.value.push(dados)
      else productCategoryList.value[index] = dados
    }
    return dados
  }

  async function loadServiceCategoryList() {
    const version = sessionVersion
    const { dados } = await getServiceCategoryList()
    if (version === sessionVersion) serviceCategoryList.value = dados
  }

  async function saveServiceCategory(values: IManutCategoriaServico) {
    const version = sessionVersion
    const { dados } = await requestSaveServiceCategory(values)
    if (version === sessionVersion) {
      const index = serviceCategoryList.value.findIndex(
        (record) => record.cn_categoria_servico === dados.cn_categoria_servico,
      )
      if (index === -1) serviceCategoryList.value.push(dados)
      else serviceCategoryList.value[index] = dados
    }
    return dados
  }

  async function loadBrandList() {
    const version = sessionVersion
    const { dados } = await getBrandList()
    if (version === sessionVersion) brands.value = dados
  }

  async function saveBrand(values: IManutMarca) {
    const version = sessionVersion
    const { dados } = await requestSaveBrand(values)
    if (version === sessionVersion) {
      const index = brands.value.findIndex((record) => record.cn_marca === dados.cn_marca)
      if (index === -1) brands.value.push(dados)
      else brands.value[index] = dados
    }
    return dados
  }

  async function loadUnitList() {
    const version = sessionVersion
    const { dados } = await getUnitList()
    if (version === sessionVersion) units.value = dados
  }

  async function saveUnit(values: IManutUnidade) {
    const version = sessionVersion
    const { dados } = await requestSaveUnit(values)
    if (version === sessionVersion) {
      const index = units.value.findIndex((record) => record.cn_unidade === dados.cn_unidade)
      if (index === -1) units.value.push(dados)
      else units.value[index] = dados
    }
    return dados
  }

  watch(
    () => utilStore.user?.cn_usuario,
    () => {
      sessionVersion++
      productCategoryList.value = []
      serviceCategoryList.value = []
      brands.value = []
      units.value = []
    },
    { flush: 'sync' },
  )

  return {
    categoriasProduto,
    categoriasServico,
    marcasProduto,
    unidadesProduto,
    productCategoryList,
    loadProductCategoryList,
    saveProductCategory,
    serviceCategoryList,
    loadServiceCategoryList,
    saveServiceCategory,
    brands,
    loadBrandList,
    saveBrand,
    units,
    loadUnitList,
    saveUnit,
  }
})

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import type { CategoriaPessoa, TipoPessoa } from "../models/pessoa";

import { validarCPF, validarCNPJ } from "../utils/documentValidation";

import { buscarCep } from "../services/cepService";

import "@/assets/styles/pessoa.css";

const tipoPessoa = ref<TipoPessoa>("PF");
const categorias = ref<CategoriaPessoa[]>([]);
const ehFuncionario = computed(() => categorias.value.includes("FUNCIONARIO"));

const mensagemErro = ref("");
const mensagemSucesso = ref("");

const buscandoCep = ref(false);
const cepValido = ref(false);

const formulario = reactive({
  nome: "",
  email: "",
  telefone: "",

  cpf: "",
  cnpj: "",

  razaoSocial: "",
  nomeFantasia: "",

  cargo: "",
  comissaoPercentual: 0,

  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
});

const documentoLabel = computed(() => {
  if (tipoPessoa.value === "PF") {
    return "CPF";
  }

  if (tipoPessoa.value === "PJ") {
    return "CNPJ";
  }
});

function alterarTipoPessoa(tipo: TipoPessoa) {
  tipoPessoa.value = tipo;

  mensagemErro.value = "";
  mensagemSucesso.value = "";
}

async function consultarCep() {
  mensagemErro.value = "";
  cepValido.value = false;

  try {
    buscandoCep.value = true;

    const endereco = await buscarCep(formulario.cep);

    formulario.logradouro = endereco.logradouro;

    formulario.bairro = endereco.bairro;

    formulario.cidade = endereco.localidade;

    formulario.uf = endereco.uf;

    cepValido.value = true;
  } catch (error) {
    formulario.logradouro = "";
    formulario.bairro = "";
    formulario.cidade = "";
    formulario.uf = "";

    mensagemErro.value =
      error instanceof Error ? error.message : "Erro ao consultar CEP.";
  } finally {
    buscandoCep.value = false;
  }
}

function validarDocumento(): boolean {
  if (tipoPessoa.value === "PF") {
    return validarCPF(formulario.cpf);
  }

  if (tipoPessoa.value === "PJ") {
    return validarCNPJ(formulario.cnpj);
  }

  return false;
}

function salvar() {
  mensagemErro.value = "";
  mensagemSucesso.value = "";

  if (categorias.value.length === 0) {
    mensagemErro.value = "Selecione pelo menos uma categoria.";
    return;
  }

  if (ehFuncionario.value) {
    if (
      formulario.comissaoPercentual < 0 ||
      formulario.comissaoPercentual > 100
    ) {
      mensagemErro.value = "A comissão deve estar entre 0% e 100%.";
      return;
    }
  }

  if (!formulario.nome || !formulario.email || !formulario.telefone) {
    mensagemErro.value = "Preencha os campos obrigatórios.";
    return;
  }

  if (!validarDocumento()) {
    mensagemErro.value = `${documentoLabel.value} inválido.`;
    return;
  }

  if (tipoPessoa.value === "PJ") {
    if (!formulario.razaoSocial || !formulario.nomeFantasia) {
      mensagemErro.value = "Informe a razão social e o nome fantasia.";
      return;
    }
  }

  if (!cepValido.value) {
    mensagemErro.value = "Consulte e valide o CEP antes de continuar.";
    return;
  }

  if (
    !formulario.logradouro ||
    !formulario.numero ||
    !formulario.bairro ||
    !formulario.cidade ||
    !formulario.uf
  ) {
    mensagemErro.value = "Preencha o endereço completo.";
    return;
  }

  console.log("Pessoa cadastrada:", {
    tipo: tipoPessoa.value,
    ...formulario,
  });

  mensagemSucesso.value = "Cadastro validado com sucesso.";
}
</script>

<template>
  <title>Pessoas | AutoGarage</title>
  <section class="pessoa-page">
    <div class="page-header">
      <div>
        <h1>Cadastro de pessoas</h1>

        <p>Cadastre clientes, empresas e funcionários.</p>
      </div>
    </div>

    <form class="pessoa-form" @submit.prevent="salvar">
      <section class="form-card">
        <h2>Tipo de cadastro</h2>

        <div class="person-type-selector">
          <button
            type="button"
            :class="{ active: tipoPessoa === 'PF' }"
            @click="alterarTipoPessoa('PF')"
          >
            Pessoa física
          </button>

          <button
            type="button"
            :class="{ active: tipoPessoa === 'PJ' }"
            @click="alterarTipoPessoa('PJ')"
          >
            Pessoa jurídica
          </button>
        </div>
      </section>

      <section class="form-card">
        <h2>Categoria</h2>

        <div class="category-selector">
          <label class="category-option">
            <input type="checkbox" value="CLIENTE" v-model="categorias" />

            <span>Cliente</span>
          </label>

          <label class="category-option">
            <input type="checkbox" value="FUNCIONARIO" v-model="categorias" />

            <span>Funcionário</span>
          </label>
        </div>
      </section>

      <section class="form-card">
        <h2>Dados principais</h2>

        <div class="form-grid">
          <div class="field">
            <label>Nome *</label>

            <input
              v-model="formulario.nome"
              type="text"
              placeholder="Nome completo"
            />
          </div>

          <div v-if="tipoPessoa === 'PF'" class="field">
            <label>CPF *</label>

            <input
              v-model="formulario.cpf"
              type="text"
              placeholder="000.000.000-00"
            />
          </div>

          <div v-if="tipoPessoa === 'PJ'" class="field">
            <label>CNPJ *</label>

            <input v-model="formulario.cnpj" type="text" placeholder="CNPJ" />
          </div>

          <template>
            <div class="field">
              <label>Tipo de documento *</label>

              <select>
                <option value="CPF">CPF</option>

                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
          </template>

          <div class="field">
            <label>E-mail *</label>

            <input
              v-model="formulario.email"
              type="email"
              placeholder="email@exemplo.com"
            />
          </div>

          <div class="field">
            <label>Telefone *</label>

            <input
              v-model="formulario.telefone"
              type="tel"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div v-if="tipoPessoa === 'PJ'" class="form-grid extra-section">
          <div class="field">
            <label>Razão social *</label>

            <input v-model="formulario.razaoSocial" type="text" />
          </div>

          <div class="field">
            <label>Nome fantasia *</label>

            <input v-model="formulario.nomeFantasia" type="text" />
          </div>
        </div>

        <div class="form-grid extra-section">
          <div class="field">
            <label>Cargo</label>

            <input
              v-model="formulario.cargo"
              type="text"
              placeholder="Ex.: Mecânico"
            />
          </div>

          <div class="field">
            <label>Comissão (%)</label>

            <input
              v-model.number="formulario.comissaoPercentual"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
      </section>

      <section class="form-card">
        <h2>Endereço</h2>

        <div class="form-grid">
          <div class="field cep-field">
            <label>CEP *</label>

            <div class="input-action">
              <input
                v-model="formulario.cep"
                type="text"
                placeholder="00000-000"
                @blur="consultarCep"
              />

              <button type="button" @click="consultarCep">
                {{ buscandoCep ? "Buscando..." : "Buscar" }}
              </button>
            </div>
          </div>

          <div class="field">
            <label>Logradouro *</label>

            <input v-model="formulario.logradouro" type="text" />
          </div>

          <div class="field">
            <label>Número *</label>

            <input v-model="formulario.numero" type="text" />
          </div>

          <div class="field">
            <label>Complemento</label>

            <input v-model="formulario.complemento" type="text" />
          </div>

          <div class="field">
            <label>Bairro *</label>

            <input v-model="formulario.bairro" type="text" />
          </div>

          <div class="field">
            <label>Cidade *</label>

            <input v-model="formulario.cidade" type="text" />
          </div>

          <div class="field field-small">
            <label>UF *</label>

            <input v-model="formulario.uf" type="text" maxlength="2" />
          </div>
        </div>
      </section>

      <p v-if="mensagemErro" class="form-message error">
        {{ mensagemErro }}
      </p>

      <p v-if="mensagemSucesso" class="form-message success">
        {{ mensagemSucesso }}
      </p>

      <div class="form-actions">
        <button type="submit" class="save-button">Salvar cadastro</button>
      </div>
    </form>
  </section>
</template>
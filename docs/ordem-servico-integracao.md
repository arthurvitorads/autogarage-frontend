# Integração futura — Ordem de Serviço

O módulo utiliza estado temporário em Pinia e gera os dados das gravações no console. Não realiza chamadas à API nem usa localStorage/sessionStorage. Ao recarregar ou trocar de usuário, os dados são descartados.

## Clientes

O cadastro de pessoas permanece emitindo apenas JSON. A futura resposta de pessoas deve alimentar `useOrdemServicoStore().setClientes(pessoas)` utilizando o modelo `Pessoa`. A seleção aceita apenas pessoas ativas, marcadas como Cliente, com identificador, tanto PF quanto PJ. Nenhum cliente de exemplo é criado.

## Status

`IManutStatusOrdemServico` contém nome (`an_descr`), cor hexadecimal (`ca_cor`) e a opção de padrão para novas ordens (`bo_padrao`). O identificador é enviado em edições. Há no máximo um padrão. Alterar esse padrão não altera o status das ordens existentes. Não há significado fixo de finalização ou cancelamento associado aos nomes.

## Ordens

`IManutOrdemServico` envia o identificador do cliente, do status, datas em ISO com fuso, responsável, veículo e observações. A placa, marca e modelo são obrigatórios. Os identificadores aceitam números ou strings, inclusive identificadores grandes retornados em JSON. O número da O.S. e os códigos gerados localmente são provisórios; na integração, devem ser substituídos pelos valores retornados pelo backend.

## Itens e estoque

`TManutItemOrdemServico` envia o identificador da ordem, tipo do item, identificador do produto OU serviço, quantidade e preço unitário. Na edição, envia também o identificador do item. Os totais exibidos são calculados para apresentação; o backend deve recalculá-los.

O preço do catálogo é apenas o valor inicial do item. Alterar o preço na O.S. não modifica o cadastro do produto ou serviço. Não há descontos.

O frontend não baixa estoque, não valida disponibilidade contra o saldo e não devolve estoque ao editar ou remover itens. A validação do saldo e a aplicação das baixas, alterações e estornos deverão ocorrer no backend, junto da gravação do item, sem duplicar efeitos em tentativas repetidas. Não enviar o saldo do cadastro como parte da inclusão do item.

A remoção emite um JSON com `operacao: REMOVER_ITEM`, `cn_ordem_servico` e `cn_item`.

As futuras rotas HTTP ainda precisam ser acordadas com o backend. As gravações em memória nos diálogos devem ser substituídas por chamadas que aguardem a confirmação da API antes de atualizar a interface e exibir sucesso.

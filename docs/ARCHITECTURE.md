# Architecture - MOTOMEC 17GB Frota

## Camadas atuais

- `frontend/src/pages/`: paginas principais da aplicacao.
- `frontend/src/components/`: componentes reutilizaveis de UI.
- `frontend/src/services/`: acesso a dados e integracoes.
- `docs/`: spec, tarefas e estado atual do projeto.

## Padrao da Issue 008

- Estados de loading, erro e vazio devem ser centralizados em componentes reutilizaveis quando uma tela repetir o mesmo padrao.
- A pagina piloto desta etapa e `frontend/src/pages/Frota.jsx`.
- O componente novo desta etapa e `frontend/src/components/PageState.jsx`.

## Diretriz

- Regra de negocio sensivel continua fora do frontend.
- O frontend fica responsavel por exibir dados, estados e acoes do usuario.

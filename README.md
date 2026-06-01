# sofia-initializr

Interface web para geração de microserviços Quarkus e Spring Boot com padrões Sofia.

## Stack

- React 19 + TypeScript
- Vite 8
- EJS (renderização client-side)
- JSZip + FileSaver (geração de ZIP no browser)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output em `dist/`.

## Como funciona

1. Usuário preenche formulário (framework, features, nome do serviço)
2. Templates EJS são renderizados no browser com os dados
3. JSZip monta o projeto completo
4. Download do `.zip` pronto para uso

## Workflows

| Workflow | Trigger | Ação |
|----------|---------|------|
| `ci-feature` | push em `feature/**` | commitlint, tsc, lint, build → abre PR para develop |
| `ci-develop` | PR merged em develop | lint, build, bundle size, gitleaks → abre PR para main |
| `ci-main` | PR merged em main | lint, build, audit, CodeQL → bump version + tag |
| `deploy` | tag `v*` | build → deploy GitHub Pages |

## Templates

Os templates EJS ficam em `public/templates/` e são os mesmos usados pelo [sofia-service-generator](https://github.com/pitagorasampli/sofia-service-generator) (Yeoman CLI).

# AGENTS.md · uvoluntapp-web

Reglas para cualquier agente que trabaje en este repositorio. Las reglas de negocio están en `~/uvoluntapp/coord/CONTEXT.md`.

## Stack
- React + TypeScript con Vite. El cliente HTTP se genera desde `contracts/openapi.yaml` del backend; no escribas llamadas a la API a mano.
- Pruebas con Vitest y Testing Library.

## Comandos
- `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- Regenerar cliente: `npm run gen:api`

## Diseño
- Usa los componentes y tokens del sistema de diseño de `src/ui/`; no crees estilos sueltos.
- Cada pantalla contempla estados de carga, vacío, error y permiso denegado.
- Formularios con validación en cliente que repite las reglas de `CONTEXT.md`; el servidor sigue siendo la autoridad.
- Accesible: etiquetas en todos los campos, foco visible, contraste suficiente.
- La web cubre administración y liderazgo completos; el catálogo público no requiere sesión.

## Reglas obligatorias
1. Trabaja solo en los archivos que permite tu tarjeta de tarea.
2. No modifiques el cliente generado ni `.github/`.
3. No hagas `git push` ni operaciones en Jira o GitHub. Commit local solamente.
4. Commits: `tipo(SCRUM-xx): descripción`.
5. Si el contrato no tiene lo que necesitas, no lo inventes: anótalo en tu informe.
6. Entrega siempre `coord/reports/T-xxx.md` con la plantilla.

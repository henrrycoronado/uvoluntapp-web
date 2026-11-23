# Estado de la web y siguientes pasos

Corte: 23 de noviembre de 2026 · Rama de trabajo `fix/m2-validacion` · Jira: proyecto PUCB (Pastoral-UCB).

## Cómo trabajar aquí

- La fuente de verdad son los tickets de Jira, el Figma `SistemaPastoral` (referencia base, no copia literal) y `AGENTS.md`. Este archivo resume el estado; no los sustituye.
- No hacer `git push`, crear PRs ni cambiar estados o fechas en Jira sin confirmación explícita.
- Commits `tipo(alcance): descripción`, sin firmas de herramientas de IA.
- La API se consume con el cliente generado: `npm run gen:api` copia `contracts/openapi.yaml` del backend (repo hermano en `~/Documents/GitHub/uvoluntapp-backend`) y ejecuta `scripts/gen-api.mjs`. La carpeta `src/api/generated/` no se versiona ni se edita a mano. Si falta un campo o endpoint, se pide primero en el backend.
- Los topes de longitud de cuenta y perfil están en `LIMITS` (`src/features/auth/validation.ts`) y repiten los del backend (`FieldLimits.cs`).
- Diseño: tokens en `src/shared/ui/tokens.css`. El tema oscuro es el predeterminado y el claro es la variante (`data-theme='light'`). Figma solo diseñó el claro, así que todo cambio de estilo se prueba en ambos temas.
- Antes de cerrar: `npm run lint`, `npm run typecheck` y `npm test`.
- Solo pasa a Done en Jira lo que está completo, con pruebas y evidencia.

## Ya hecho

| Área | Alcance entregado | Estado en Jira |
| --- | --- | --- |
| Acceso (M1) | Registro con OTP, inicio de sesión, acceso con Google y completar datos de contacto, recuperación de contraseña, perfil con foto, cambio de correo y consola de usuarios, solicitudes externas, roles y administradores | 13 de 13 HU |
| Planificación (M2) | Consola de programas con portada, actividades con turnos y participación, periodos con cierre y sucesor, equipo del programa, catálogo público y calendario | 14 de 14 HU |
| Inscripción (M3) | Inscripción desde el catálogo con turnos, cupos y cancelación, "Mis inscripciones" e inscritos por actividad en la consola (HU-M3-01 y 03 Done; web de HU-M3-02, PUCB-148, Done) | HU-M3-02 sigue en To Do por la parte móvil |
| Límites de campos | `maxLength` y validación alineados con el contrato en acceso, perfil y consola; ancho máximo de 40 rem en campos y textos largos de los formularios | Sin ticket |
| Generador de API | `openapitools.json` retirado; `gen-api.mjs` corregido para rutas con parámetro intermedio | Sin ticket |

Verificación al corte: lint y typecheck limpios y 68 pruebas Vitest pasando. En el navegador se revisaron el registro, la consola de actividades (alta) y programas, en tema oscuro y claro.

Avance de Jira (campo Story point estimate): por HU 108 de 278 SP (38,8 %) y por tasks 206 de 595 SP (34,6 %). De esas tasks, 56 SP son auditorías y 30 SP documentación y varios; el código entregado de API y web suma 120 SP.

## Sprints

- Sprints 0, 1 y 2: cerrados, sin tickets arrastrados.
- Sprint 3 (activo, del 23/11 al 14/12): 16 de 23 tickets ya están Done. Quedan 19 SP.

## Sigue

Pendiente del Sprint 3:

1. PUCB-144 · mostrar el estado inscrito, confirmado, cancelado y asistente (3 SP, en curso). Depende de PUCB-143 en el backend.
2. PUCB-128 · avisos de cancelación o reprogramación en la web (2 SP). Depende de PUCB-127.
3. PUCB-125 · pulido de la consola M2 (3 SP).
4. Revisión visual contra Figma, en ambos temas, de las secciones que aún no se comprobaron en navegador: Usuarios, Periodos, Roles y permisos, ficha de actividad y las pantallas de voluntario (catálogo, detalle, "Mis inscripciones" y perfil).
5. Verificar el CORS de R2 para la vista previa de imágenes.

Sprint 4: configuración de modalidad y tolerancia en la consola (PUCB-141) y, en móvil, la base de la app. La web nunca crea ni corrige marcaciones de asistencia. Sprint 5 en adelante: validación y acreditación de horas, compromisos, presupuestos, informes, auditoría y asistente de IA.

## Riesgos y notas abiertas

- Figma no tiene modo oscuro: hay que decidir con el equipo si se diseña o se sigue derivando de los tokens.
- Las secciones de la consola que todavía son marcadores (`PlaceholderSection`) corresponden a módulos de sprints posteriores; no son errores.
- Para revisar la consola en navegador hace falta iniciar sesión con un administrador local; las credenciales de prueba están en el `.env` del backend y no deben copiarse a código ni documentos.

# BARBERIA_PRO — PRODUCTION CHECKLIST (RC1)
## Matriz de Preparación para Despliegue en Producción

---

## 1. COMPONENTES LISTOS EN CÓDIGO (100% IMPLEMENTADOS & VALIDADOS)

| Componente | Estado en RC1 | Detalle de Implementación |
| :--- | :---: | :--- |
| **Arquitectura Multi-Tenant** | `LISTO EN CÓDIGO` | Aislamiento por `business_id` en todos los repositorios, servicios y vistas. |
| **Esquema de Base de Datos PostgreSQL** | `LISTO EN CÓDIGO` | 11 tablas DDL con llaves foráneas, índices y políticas RLS activadas (`initial_multitenant_schema.sql`). |
| **Seguridad RLS (Row Level Security)** | `LISTO EN CÓDIGO` | Cláusulas de validación `auth.jwt() -> business_id` en SELECT, INSERT, UPDATE y DELETE. |
| **Matriz de Roles y Permisos** | `LISTO EN CÓDIGO` | Roles `superadmin`, `owner`, `manager`, `barber`, `client` con bloqueo de escalación de privilegios. |
| **Hotmart Adapter & Checkout** | `LISTO EN CÓDIGO` | Generación de checkout URLs con `sck=business_id`, webhook receiver v2.0.0 e idempotencia por ID de evento. |
| **WhatsApp Business Adapter** | `LISTO EN CÓDIGO` | Plantillas HSM transaccionales definidas, logs por tenant y resiliencia offline. |
| **Feature Entitlements Layer** | `LISTO EN CÓDIGO` | Verificación de límites de barberos y servicios según el plan contratado. |
| **Simulador Multidispositivo** | `LISTO EN CÓDIGO` | Monitor reactivo en Desktop, Tablet y Mobile en tiempo real. |
| **Identidad Inmutable ARIZSHOP** | `LISTO EN CÓDIGO` | Logo oficial `/logos/arizshop-logo.svg`, teléfono `+57 310 236 5163`, propietario Álvaro Ortiz. |
| **Campos Configurables del Owner** | `LISTO EN CÓDIGO` | Panel para que Álvaro edite dirección, precios en `$COP`, horarios, equipo y catálogo sin tocar código. |
| **Sanitización de Secretos** | `LISTO EN CÓDIGO` | Cero almacenamiento de tarjetas de crédito (PAN/CVV), plantilla `.env.example` segura. |
| **Diseño Responsive & UX** | `LISTO EN CÓDIGO` | Calibración visual a 375px, 768px y 1280px+ con 0 overflow. |
| **Compilación & Build** | `LISTO EN CÓDIGO` | `0` errores TypeScript y `0` errores Vite (`npm run build` en 4.4s). |

---

## 2. PENDIENTES DE CONFIGURACIÓN EXTERNA (REQUERIDOS ANTES DE LANZAMIENTO MASIVO)

| Dominio | Proveedor | Elemento Requerido | Acción Necesaria |
| :--- | :---: | :--- | :--- |
| **Infraestructura Cloud** | Supabase | Creación del Proyecto de Producción | Desplegar el script de migración SQL en la instancia de producción y configurar backups automatizados (PITR). |
| **Suscripciones & Pagos** | Hotmart | Cuenta y Producto Hotmart | Crear el producto "BARBERIA_PRO SaaS", registrar las 3 ofertas ($49k, $89k, $149k COP) y copiar el `HotTok` en variables de entorno. |
| **Mensajería Transaccional** | Meta | WhatsApp Business Platform | Registrar la cuenta en Meta Business Manager, verificar el número `+57 310 236 5163` y solicitar aprobación de las 3 plantillas HSM. |
| **Infraestructura Web** | Dominio / DNS | Dominio Oficial y Certificados SSL | Vincular el dominio definitivo (e.g. `app.barberiapro.co`) a la plataforma de hosting (Vercel/Cloudflare/AWS). |
| **Marco Legal** | Abogado / Legal | Validación Jurídica de Consentimiento | Revisión profesional del texto de consentimiento para fotografías capilares y política de tratamiento de datos. |

---

## 3. SEPARACIÓN DE DATOS DE PRUEBA (QA) VS PRODUCCIÓN

* **Datos de Prueba (Mock / Sandbox):** Confinados a los archivos de semilla local y simuladores de eventos.
* **Datos del Piloto ARIZSHOP:** Identidad, teléfono y estructura de catálogo oficial listos para ser persistidos en la base de datos de producción tan pronto como se suministre la URL de Supabase.

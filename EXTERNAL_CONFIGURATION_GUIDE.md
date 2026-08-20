# BARBERIA_PRO — GUÍA DE CONFIGURACIÓN EXTERNA (RC1)
## Manual de Aprovisionamiento y Activación de Producción para Dirección

**Versión del Sistema:** `BARBERIA_PRO 1.0.0-RC1`  
**Estado:** `FEATURE FREEZE — READY FOR EXTERNAL CONFIGURATION`  
**Tenant Piloto Oficial:** `ARIZSHOP BARBER` (`biz_arizshop_01`)  
**Contacto del Piloto:** Álvaro Ortiz (`+57 310 236 5163`)  

---

## 1. GUÍA DE APROVISIONAMIENTO: SUPABASE (BASE DE DATOS & AUTH)

El código de persistencia Cloud (`cloudRepository.ts` y `supabaseClient.ts`) y el esquema relacional con Row-Level Security (RLS) están 100% listos.

### Lo que Dirección debe proporcionar / ejecutar:
1. **Crear Proyecto en Supabase Cloud:**
   - Ingresar a [supabase.com](https://supabase.com) y crear una nueva organización/proyecto: `barberia-pro-prod`.
   - Seleccionar la región más cercana a Colombia (e.g. `us-east-1` / `sa-east-1`).
2. **Ejecutar Script de Migración Inicial:**
   - Abrir el **SQL Editor** en el panel de Supabase.
   - Copiar y ejecutar el contenido del archivo [`supabase/migrations/20260819000001_initial_multitenant_schema.sql`](./supabase/migrations/20260819000001_initial_multitenant_schema.sql).
   - Esto creará las 11 tablas con sus llaves foráneas, índices de rendimiento y políticas RLS aisladas por `business_id`.
3. **Copiar Claves de API en las Variables de Entorno:**
   - **Project URL:** e.g. `https://xyzcompany.supabase.co` ➔ Configurar en `VITE_SUPABASE_URL`.
   - **Anon / Public Key:** Clave pública segura para el frontend ➔ Configurar en `VITE_SUPABASE_ANON_KEY`.
   - **Service Role Key:** Clave privada estrictamente para Edge Functions/Backend (¡NUNCA en el frontend!).
4. **Activar Estrategia de Backup:**
   - En *Project Settings ➔ Database ➔ Backups*, verificar que los backups diarios automáticos estén activos y habilitar Point-in-Time Recovery (PITR) si el plan lo soporta.

---

## 2. GUÍA DE APROVISIONAMIENTO: HOTMART (SUSCRIPCIONES SAAS)

El adaptador desacoplado [`HotmartAdapter.ts`](./src/core/hotmart/hotmartAdapter.ts) y el procesador de webhooks v2.0.0 están 100% implementados con protección de idempotencia.

### Lo que Dirección debe proporcionar / configurar en Hotmart:
1. **Crear Producto en Hotmart:**
   - Tipo de producto: **Suscripción / Membresía Recurrente**.
   - Nombre: `BARBERIA_PRO SaaS`.
2. **Registrar las 3 Ofertas Comerciales en Pesos Colombianos ($COP):**
   - **Plan Emprendedor:** `$49.000 COP / mes` ➔ Copiar el Offer Code generado (e.g. `OFFER_STA_01`).
   - **Plan Pro Studio (Recomendado):** `$89.000 COP / mes` ➔ Copiar el Offer Code generado (e.g. `OFFER_PRO_01`).
   - **Plan Master Enterprise:** `$149.000 COP / mes` ➔ Copiar el Offer Code generado (e.g. `OFFER_ENT_01`).
3. **Configurar Webhook v2.0.0 de Hotmart:**
   - En *Herramientas ➔ Webhook (API y Notificaciones)* de Hotmart, añadir la URL del webhook de BARBERIA_PRO:
     `https://api.barberiapro.co/webhooks/hotmart`
   - Seleccionar eventos: `Compra aprobada`, `Suscripción activada`, `Renovación aprobada`, `Cancela    - Copiar el token de verificación **`HotTok`** generado por Hotmart ➔ Configurar en las variables de entorno del **servidor / Edge function** como `HOTMART_HOTTOK` (¡NUNCA con prefijo `VITE_` para no exponerlo en el navegador!).

---

## 3. GUÍA DE APROVISIONAMIENTO: META WHATSAPP CLOUD API

El servicio de mensajería [`WhatsAppService.ts`](./src/core/whatsapp/whatsappService.ts) opera en modo Sandbox y está listo para pasar a Producción oficial sin tocar código.

### Lo que Dirección debe proporcionar / gestionar en Meta:
1. **Verificación de Meta Business Manager:**
   - Registrar la empresa propietaria de BARBERIA_PRO en [business.facebook.com](https://business.facebook.com).
   - Crear una aplicación de tipo **Business** en [developers.facebook.com](https://developers.facebook.com) y añadir el producto **WhatsApp**.
2. **Registrar la Línea Telefónica Oficial:**
   - Para ARIZSHOP BARBER: Registrar y verificar por SMS/Llamada el número oficial `+57 310 236 5163`.
   - Obtener el **Phone Number ID** y el **WhatsApp Business Account ID (WABA ID)**.
3. **Solicitar Aprobación de las 3 Plantillas HSM Transaccionales:**
   - **`arizshop_appointment_confirmation_v1` (Categoría: Utilidad):**
     > *"¡Hola {{1}}! Tu cita en {{2}} ha sido confirmada para el {{3}} a las {{4}} con {{5}}. Servicio: {{6}} (${{7}} COP). ¡Te esperamos!"*
   - **`arizshop_appointment_reminder_v1` (Categoría: Utilidad):**
     > *"Recordatorio: Tienes una cita programada hoy en {{1}} a las {{2}} con {{3}}. En caso de retraso avísanos a esta línea."*
   - **`arizshop_barber_new_appointment_v1` (Categoría: Operativa):**
     > *"Alerta Barbero: {{1}} ha reservado el servicio {{2}} para el {{3}} a las {{4}} en tu sillón."*
4. **Generar Token de Acceso Permanente (System User Token):**
   - Crear un Usuario del Sistema en Business Manager con permisos `whatsapp_business_messaging` y generar un token sin fecha de expiración para configurarlo exclusivamente en el servidor como `META_WA_ACCESS_TOKEN`.

---

## 4. GUÍA DE CONFIGURACIÓN: DOMINIO WEB & CERTIFICADOS SSL

### Procedimiento para Dirección:
1. **Adquirir / Disponer del Dominio Oficial:**
   - e.g. `barberiapro.co` o `app.barberiapro.co`.
2. **Configuración DNS en Hosting (Vercel, Cloudflare Pages o AWS):**
   - Tipo `CNAME`: `app` ➔ `cname.vercel-dns.com` (o el CNAME correspondiente del proveedor).
   - Tipo `A` (si es dominio raíz): Apuntar a la IP del proveedor de hosting.
3. **Habilitar SSL / HTTPS Automático:**
   - Todo el tráfico debe ser forzado a `HTTPS` con TLS 1.3 para garantizar la seguridad de sesiones y tokens.

---

## 5. GUÍA DE CUMPLIMIENTO LEGAL & HABEAS DATA

### Procedimiento para Dirección / Asesoría Jurídica:
1. **Revisión Formal de la Política de Tratamiento de Datos (Ley 1581 de 2012 de Colombia):**
   - Validar los términos y condiciones de uso de la plataforma SaaS.
2. **Revisión del Consentimiento Fotográfico de Sillón:**
   - El sistema muestra el aviso: **`CONSENTIMIENTO JURÍDICO — PENDIENTE DE VALIDACIÓN FORMAL`**.
   - Una vez el abogado de la empresa valide el texto legal final, se actualizará el string de texto correspondiente en la UI sin alterar la lógica de negocio.

---

## 6. MATRIZ RESUMEN DE VARIABLES DE ENTORNO REQUERIDAS

```ini
# ==========================================================================
# 1. FRONTEND / CLIENT-SIDE (PÚBLICAS - VISIBLES EN NAVEGADOR)
# Solo variables con prefijo VITE_
# ==========================================================================
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_HOTMART_PRODUCT_ID=TU_ID_DE_PRODUCTO_HOTMART
VITE_HOTMART_OFFER_STARTER=STA_001
VITE_HOTMART_OFFER_PRO=PRO_001
VITE_HOTMART_OFFER_ENTERPRISE=ENT_001
VITE_WHATSAPP_PILOT_PHONE="+57 310 236 5163"
VITE_APP_ENV=production

# ==========================================================================
# 2. SERVER-SIDE / EDGE FUNCTIONS / WEBHOOKS (ESTRICTAMENTE PRIVADAS)
# NUNCA usar prefijo VITE_. NUNCA exponer al navegador.
# ==========================================================================
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
HOTMART_HOTTOK=TU_TOKEN_HOTTOK_DE_HOTMART
META_WA_PHONE_NUMBER_ID=TU_PHONE_NUMBER_ID_META
META_WA_WABA_ID=TU_WABA_ID_META
META_WA_ACCESS_TOKEN=TU_SYSTEM_USER_ACCESS_TOKEN_META
META_WA_WEBHOOK_VERIFY_TOKEN=barberia_webhook_secret_token
```

# BARBERIA_PRO — INVENTARIO FINAL DEL PRODUCTO (RC1)
## Catálogo Funcional y Arquitectura por Roles

**Versión:** BARBERIA_PRO 1.0.0-RC1  
**Fecha:** 19 de Agosto de 2026  
**Arquitectura:** SaaS Multi-Tenant Cloud-Native (React + TypeScript + PostgreSQL RLS + Hotmart + Meta Cloud API)

---

## 1. MÓDULO CLIENTE (`ClientHome.tsx`)

| Funcionalidad | Descripción Técnica |
| :--- | :--- |
| **Acceso QR & Tenant Resolver** | Enrutamiento directo al tenant escaneado (`/arizshop-barber`), cargando dinámicamente nombre, slogan, logo (`/logos/arizshop-logo.svg`) y colores de marca. |
| **Bienvenida & Onboarding** | Bienvenida visual sin barreras de entrada; registro de cliente con Nombre y WhatsApp. |
| **Catálogo Interactivo** | Consulta de servicios organizados por categorías (Cortes, Barbas, Combos) con precios en `$COP` y duración estimada en minutos. |
| **Probador de Estilos Virtual** | Selector de estilos (Fade, Pompadour, Crop, Barba perfilada) para simulación visual previa al corte. |
| **Agenda & Generador de Turnos** | Selector de fechas y horas disponibles que respeta los horarios del negocio y omite días no laborables. |
| **Selección de Profesional** | Elección de barbero específico (Álvaro Ortiz o cualquier barbero disponible del tenant). |
| **Confirmación de Reserva** | Modal de confirmación con nota técnica para el barbero y badge de envío de confirmación por WhatsApp. |
| **"Repetir mi estilo" (1 Toque)** | Recuperación instantánea del último corte registrado, notas técnicas y barbero habitual para agendar en 1 clic. |
| **Tarjeta de Fidelización** | Visualización de sellos acumulados por visitas y recompensa desbloqueable configurada por el negocio. |
| **Módulo de Calificación (Feedback)** | Evaluación de 1 a 5 estrellas con comentarios al finalizar la visita para alimentar el sensor de calidad. |

---

## 2. MÓDULO BARBERO (`BarberDashboard.tsx`)

| Funcionalidad | Descripción Técnica |
| :--- | :--- |
| **Agenda de Sillón en Tiempo Real** | Lista de turnos del día para el barbero autenticado con horario, nombre del cliente y servicio a realizar. |
| **Ficha Técnica Capilar** | Consulta de historial de visitas del cliente, notas de cortes anteriores y preferencias particulares. |
| **Consentimiento Legal de Fotografía** | Checkbox mandatorio con aviso explícito: `CONSENTIMIENTO JURÍDICO — PENDIENTE DE VALIDACIÓN FORMAL`. |
| **Memoria Visual de Estilo** | Captura y carga de fotografías del resultado del corte asociadas exclusivamente al cliente y al tenant. |
| **Registro de Fórmulas y Notas Técnicas** | Editor de especificaciones técnicas (guía de degradado, tijera, tipo de navaja, productos aplicados). |
| **Confinamiento de Seguridad** | Cero acceso a finanzas del negocio, planes SaaS, configuración Hotmart o datos de otros tenants. |

---

## 3. MÓDULO PROPIETARIO / OWNER (`OwnerDashboard.tsx`)

| Funcionalidad | Descripción Técnica |
| :--- | :--- |
| **Diagnóstico & Sensor de Calidad 6D** | Monitor de métricas clave (NPS, Satisfacción, Puntualidad, Retención, Fidelización e Índice General). |
| **Configuración de Identidad del Local** | Edición de Nombre comercial, Slogan, Logo (`business.logo_url`), Dirección física, Barrio y Teléfono oficial. |
| **Gestión de Servicios & Precios** | Creación y edición de catálogo, precios en `$COP`, duración en minutos y toggle de visibilidad `PUBLICADO` vs `INACTIVO`. |
| **Administración de Equipo & Barberos** | Registro de colaboradores, asignación de sillas, especialidades y toggle de estado activo/inactivo. |
| **Matriz de Horarios de Atención** | Configuración de hora de apertura, hora de cierre y estado abierto/cerrado para cada día de la semana (Lunes a Domingo). |
| **Canal Oficial de WhatsApp Business** | Conexión con Meta Cloud API (Sandbox / Live), preferencias de notificación automática, probador interactivo y bitácora de telemetría. |
| **Suscripción SaaS Hotmart** | Resumen de plan actual, fecha de renovación, límites habilitados, botón de enlace directo al checkout oficial de Hotmart (`sck=business_id`) y simulador de webhooks QA. |
| **Reglas de Fidelización** | Configuración del umbral de visitas (sellos requeridos) y descripción del premio otorgado al cliente. |

---

## 4. MÓDULO SUPERADMIN (`SuperAdminDashboard.tsx`)

| Funcionalidad | Descripción Técnica |
| :--- | :--- |
| **Gestión Global de Tenants** | Creación, edición, consulta, suspensión y restauración de barberías en la plataforma. |
| **Configuración de Planes SaaS** | Editor de precios en `$COP`, límites de barberos/servicios y características incluidas por plan. |
| **Simulador de Webhooks Hotmart v2.0.0** | Disparador de eventos de prueba (Activation, Renewal, Overdue, Cancellation, Refund) para pruebas de idempotencia y estado. |
| **Monitor Multidispositivo en Vivo** | Vista sincronizada en tiempo real de Desktop (Owner), Tablet (Barber) y Mobile (Client) para auditoría de reactividad. |
| **Suite Automatizada de Seguridad & RLS** | Ejecutor de 18 pruebas automáticas de aislamiento multi-tenant, escalación de privilegios y sanitización de secretos. |

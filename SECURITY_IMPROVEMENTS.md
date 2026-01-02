# Mejoras de Seguridad Implementadas - ELEVEN

## Resumen

Se han implementado mejoras críticas de seguridad en la aplicación ELEVEN para resolver vulnerabilidades identificadas y seguir mejores prácticas de la industria.

---

## 🔐 Mejoras Implementadas

### 1. Sistema de Refresh Tokens

**Problema anterior:**
- Token JWT único de 7 días de duración
- Si el token era robado, el atacante tenía 7 días de acceso
- No había forma de invalidar tokens antes de su expiración

**Solución implementada:**
- **Access Token**: 15 minutos de duración
- **Refresh Token**: 7 días de duración
- Los access tokens se renuevan automáticamente usando el refresh token
- Reduce la ventana de ataque de 7 días a 15 minutos

**Archivos modificados:**
- `back/src/auth/auth.module.ts` - Configuración de JWT
- `back/src/auth/auth.service.ts` - Lógica de generación de tokens
- `back/src/auth/auth.controller.ts` - Endpoints de login y refresh
- `back/src/auth/strategies/jwt-refresh.strategy.ts` - Nueva estrategia para refresh tokens
- `back/src/auth/guards/jwt-refresh-auth.guard.ts` - Nuevo guard
- `front/lib/api-client.ts` - Interceptor de auto-refresh
- `front/lib/api/auth.ts` - API de refresh

**Endpoints nuevos:**
```
POST /api/auth/refresh - Refrescar access token
```

---

### 2. Revocación de Tokens (Logout Global)

**Problema anterior:**
- Al cambiar contraseña, los tokens antiguos seguían válidos
- No había forma de cerrar sesión en todos los dispositivos

**Solución implementada:**
- Campo `tokensValidAfter` en la entidad User
- Tokens emitidos antes de esta fecha son automáticamente invalidados
- Al cambiar contraseña, se invalidan todos los tokens existentes

**Archivos modificados:**
- `back/src/entities/user.entity.ts` - Nuevo campo tokensValidAfter
- `back/src/auth/auth.service.ts` - Métodos logoutAllDevices y changePassword actualizados
- `back/src/auth/strategies/jwt.strategy.ts` - Validación de tokens revocados
- `back/src/auth/auth.controller.ts` - Nuevo endpoint logout-all

**Endpoints nuevos:**
```
POST /api/auth/logout-all - Cerrar sesión en todos los dispositivos
```

**Migración necesaria:**
```sql
ALTER TABLE users ADD COLUMN "tokensValidAfter" TIMESTAMP NULL;
```

---

### 3. Rate Limiting (Protección contra Fuerza Bruta)

**Problema anterior:**
- Endpoint de login sin protección
- Atacante podía intentar miles de passwords

**Solución implementada:**
- Rate limiting global: 10 requests/minuto por defecto
- Rate limiting en login: 5 intentos/minuto
- Usa `@nestjs/throttler`

**Archivos modificados:**
- `back/src/app.module.ts` - Configuración global de Throttler
- `back/src/auth/auth.controller.ts` - Throttle específico en login
- `back/package.json` - Dependencia @nestjs/throttler

**Configuración:**
```typescript
// Global: 10 requests/minuto
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])

// Login: 5 intentos/minuto
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

---

### 4. Logs de Seguridad

**Problema anterior:**
- No había registro de intentos de login
- Imposible auditar actividad sospechosa

**Solución implementada:**
- Logger de NestJS integrado
- Logs de login exitosos y fallidos
- Logs de refresh de tokens
- Logs de cambio de contraseña
- Logs de logout global

**Archivos modificados:**
- `back/src/auth/auth.service.ts` - Logger en todos los métodos de autenticación

**Ejemplos de logs:**
```
[AuthService] Login exitoso: user@example.com
[AuthService] Login fallido: Contraseña incorrecta - user@example.com
[AuthService] Tokens refrescados: user@example.com
[AuthService] Contraseña cambiada y tokens invalidados: user@example.com
[AuthService] Logout de todos los dispositivos: user@example.com
```

---

### 5. Middleware de Next.js (Protección Server-Side)

**Problema anterior:**
- Protección de rutas solo client-side (React)
- Usuario podía ver componentes protegidos brevemente antes de la redirección

**Solución implementada:**
- Middleware de Next.js que valida cookies antes de renderizar
- Redirección server-side a `/login` si no hay tokens
- Previene redirección a `/dashboard` desde la raíz pública

**Archivos creados:**
- `front/middleware.ts` - Middleware de Next.js

**Rutas protegidas:**
- `/dashboard`
- `/clients`
- `/buildings`
- `/perfil`

**Rutas públicas:**
- `/` (landing page)
- `/login`

---

### 6. Auto-Logout por Inactividad

**Problema anterior:**
- Sesión quedaba abierta indefinidamente si el usuario se alejaba
- Riesgo de acceso no autorizado en dispositivos compartidos

**Solución implementada:**
- Hook `useAutoLogout` que detecta inactividad
- Logout automático después de 30 minutos sin actividad
- Escucha eventos: mousedown, keydown, scroll, touchstart, click

**Archivos creados:**
- `front/hooks/use-auto-logout.ts` - Hook de auto-logout

**Archivos modificados:**
- `front/app/(authenticated)/layout.tsx` - Integración del hook

**Configuración:**
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
```

---

### 7. Landing Page Público

**Problema anterior:**
- Raíz (`/`) redirigía automáticamente a `/dashboard`
- No había espacio para contenido público

**Solución implementada:**
- Landing page público en la raíz
- Botón dinámico: "Ir al Dashboard" si está autenticado, "Iniciar Sesión" si no
- Secciones informativas sobre la aplicación

**Archivos modificados:**
- `front/app/page.tsx` - Landing page público
- `front/middleware.ts` - No redirige desde raíz

---

## 📋 Variables de Entorno Nuevas

Agregar a tu archivo `.env`:

```env
# JWT Secrets
JWT_SECRET=<genera-con-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<genera-con-openssl-rand-base64-64>
```

**Generar secrets fuertes:**
```bash
openssl rand -base64 64
```

---

## 🗄️ Migración de Base de Datos

Ejecutar la siguiente migración para agregar el campo `tokensValidAfter`:

```sql
ALTER TABLE users
ADD COLUMN "tokensValidAfter" TIMESTAMP NULL;
```

O usar TypeORM migrations:

```bash
cd back
npm run migration:generate -- AddTokensValidAfterToUser
npm run migration:run
```

---

## 🔄 Flujo de Autenticación Actualizado

### Login
1. Usuario envía credenciales → `POST /api/auth/login`
2. Backend valida y genera:
   - Access token (15 min) → Cookie `access_token`
   - Refresh token (7 días) → Cookie `refresh_token`
3. Frontend guarda cookies automáticamente

### Requests Autenticados
1. Frontend envía request con cookies
2. Si access token expiró (401):
   - Interceptor de Axios llama a `POST /api/auth/refresh`
   - Backend valida refresh token
   - Genera nuevos access + refresh tokens
   - Reintenta request original
3. Si refresh token también expiró:
   - Redirige a `/login`

### Logout
- **Logout normal:** `POST /api/auth/logout` - Solo cierra sesión en el dispositivo actual
- **Logout global:** `POST /api/auth/logout-all` - Invalida todos los tokens en todos los dispositivos

### Cambio de Contraseña
- `PATCH /api/auth/change-password`
- Automáticamente invalida todos los tokens existentes
- Usuario debe volver a hacer login

---

## 🧪 Testing Manual

### 1. Probar Refresh Tokens
```bash
# 1. Hacer login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eleven.com","password":"Admin123"}' \
  -c cookies.txt

# 2. Esperar 16 minutos (access token expira)

# 3. Hacer request protegido (debería auto-refrescar)
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

### 2. Probar Rate Limiting
```bash
# Intentar login 6 veces en 1 minuto (debería bloquear en el 6to intento)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\nIntento $i"
done
```

### 3. Probar Logout Global
```bash
# 1. Login en dispositivo 1
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"admin@eleven.com","password":"Admin123"}' \
  -c device1.txt

# 2. Login en dispositivo 2
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"admin@eleven.com","password":"Admin123"}' \
  -c device2.txt

# 3. Logout global desde dispositivo 1
curl -X POST http://localhost:3001/api/auth/logout-all \
  -b device1.txt

# 4. Intentar usar dispositivo 2 (debería fallar)
curl -X GET http://localhost:3001/api/auth/me \
  -b device2.txt
```

---

## 🎯 Próximas Mejoras Recomendadas

### Alta Prioridad
- [ ] Implementar CAPTCHA en login después de 3 intentos fallidos
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Implementar CSP (Content Security Policy) headers
- [ ] Agregar HSTS (HTTP Strict Transport Security)

### Media Prioridad
- [ ] Dashboard de sesiones activas para usuarios
- [ ] Notificaciones por email de login desde nuevo dispositivo
- [ ] Registro de IPs y user agents de sesiones
- [ ] Implementar refresh token rotation

### Baja Prioridad
- [ ] Integrar servicio de monitoreo (Sentry, DataDog)
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Agregar rate limiting por IP además de por usuario
- [ ] Implementar fingerprinting de dispositivos

---

## 📚 Recursos y Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## ✅ Checklist de Deployment

Antes de deployar a producción:

- [ ] Generar secrets fuertes para JWT_SECRET y JWT_REFRESH_SECRET
- [ ] Configurar NODE_ENV=production
- [ ] Ejecutar migración de base de datos
- [ ] Configurar CORS con dominio de producción exacto
- [ ] Habilitar HTTPS/SSL en el servidor
- [ ] Configurar secure=true en cookies (automático en producción)
- [ ] Revisar logs de aplicación para errores
- [ ] Probar flujo de login/logout en staging
- [ ] Configurar rate limiting ajustado para tráfico de producción
- [ ] Documentar proceso de respuesta a incidentes de seguridad

---

**Fecha de implementación:** 2026-01-01
**Versión:** 2.0.0
**Autor:** Claude Code
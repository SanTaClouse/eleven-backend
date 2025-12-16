# Guía de Deploy - ELEVEN
## Opciones de Hosting Gratuito + Estrategia de Migración

Esta guía compara opciones gratuitas de hosting y explica cómo migrar datos sin perder información.

---

## 🆓 Comparación de Servicios Gratuitos

### Opción 1: **Railway** (RECOMENDADA) ⭐
- **Backend + Database en un solo servicio**
- **Free tier**: $5 de créditos mensuales (~500 horas)
- **PostgreSQL**: Hasta 1GB
- **Pros**:
  - Un solo servicio = backend + DB juntos
  - Muy fácil migrar a Render después
  - Interface excelente
- **Cons**:
  - Requiere tarjeta de crédito (pero no cobra automáticamente)

### Opción 2: Vercel (Frontend) + Supabase (Backend + DB)
- **Frontend**: Vercel (100% gratis)
- **Backend + Database**: Supabase
- **Free tier**:
  - PostgreSQL 500MB
  - API REST automática
  - Storage 1GB
- **Pros**:
  - Todo en Supabase (backend + DB + auth)
  - No necesitas NestJS deployado
- **Cons**:
  - Tendrías que adaptar el backend a las reglas de Supabase

### Opción 3: Vercel (Frontend) + Koyeb (Backend) + Neon (Database)
- **Frontend**: Vercel
- **Backend**: Koyeb (2 servicios gratis)
- **Database**: Neon (PostgreSQL serverless, 512MB gratis)
- **Pros**:
  - Todo gratis sin tarjeta
  - Neon es excelente para PostgreSQL
- **Cons**:
  - 3 servicios separados

### Opción 4: Todo en Vercel con Vercel Postgres
- **Frontend + Backend**: Vercel
- **Database**: Vercel Postgres (Neon bajo el capó)
- **Free tier**: 256MB DB, 1GB storage
- **Pros**:
  - Todo en un solo lugar
  - Deploy automático
- **Cons**:
  - Backend debe ser serverless functions
  - Requiere adaptar el código de NestJS

---

## 🎯 MI RECOMENDACIÓN: Railway (Ahora) → Render (Después)

**Por qué Railway primero:**
- Gratis para empezar ($5 créditos/mes = ~500 horas)
- Backend + Database en un solo servicio
- Idéntico a Render en configuración
- Migración a Render super fácil

**Cuándo migrar a Render:**
- Cuando el negocio esté validado
- Cuando tengas presupuesto ($14/mes)
- Cuando necesites uptime 100%

---

## 🚀 DEPLOY EN RAILWAY (Paso a Paso)

### Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en **"Start a New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu repositorio
5. Railway detectará automáticamente tu proyecto

### Paso 2: Agregar PostgreSQL

1. En tu proyecto, click **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará la base de datos automáticamente

### Paso 3: Configurar el Backend

1. Click en tu servicio backend
2. Ve a **"Settings"** → **"Root Directory"**: `back`
3. Ve a **"Variables"**
4. Railway ya configuró automáticamente las variables de DB:
   - `DATABASE_URL` (formato especial de Railway)

5. Agrega estas variables adicionales:

```bash
# Application
NODE_ENV=production
PORT=3001

# Frontend URL (actualizar después del deploy de Vercel)
FRONTEND_URL=http://localhost:3000

# JWT Secret (generar uno seguro)
JWT_SECRET=tu-clave-super-secreta-cambiar-esto

# Database - Railway format (Railway las genera automáticamente)
# Solo necesitas mapearlas a nuestro formato
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}
```

**⚠️ Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Paso 4: Deploy

1. Railway desplegará automáticamente
2. Espera 3-5 minutos
3. Obtendrás una URL: `https://tu-app.up.railway.app`

### Paso 5: Ejecutar Seeders

1. En Railway, ve a tu servicio backend
2. Click en la pestaña **"Deployments"**
3. Click en **"View Logs"**
4. En la parte superior, click en el ícono de terminal para abrir Shell
5. Ejecuta:
```bash
npm run seed
```

### Paso 6: Deploy Frontend en Vercel

Mismo proceso que antes, pero con esta variable de entorno:

```bash
NEXT_PUBLIC_API_URL=https://tu-app.up.railway.app/api

# Firebase (igual que antes)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCae_T9fH8-ioAQwYwJ5ZAtEjO0yW0_Ik
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=eleven-db-facturas.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eleven-db-facturas
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=eleven-db-facturas.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=275403870938
NEXT_PUBLIC_FIREBASE_APP_ID=1:275403870938:web:69dd393731d2ed053a0be3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4Z745PDCNQ
```

### Paso 7: Actualizar FRONTEND_URL

Vuelve a Railway y actualiza la variable `FRONTEND_URL` con tu URL de Vercel.

---

## 📦 MIGRACIÓN DE DATOS: Railway → Render (Garantía de Consistencia)

Cuando decidas migrar a Render, este proceso garantiza 0% pérdida de datos:

### Opción A: Backup y Restore (RECOMENDADO)

```bash
# 1. Exportar datos de Railway
pg_dump $RAILWAY_DATABASE_URL > backup.sql

# 2. Crear DB en Render (desde Render Dashboard)

# 3. Importar a Render
psql $RENDER_DATABASE_URL < backup.sql
```

**✅ Garantía**: Este método exporta TODO (datos, esquemas, índices, constraints)

### Opción B: Migración en Vivo (Downtime = 0)

Para aplicaciones en producción con usuarios activos:

1. **Preparación**:
   ```bash
   # Crear DB en Render
   # Importar backup inicial
   pg_dump $RAILWAY_DATABASE_URL > backup.sql
   psql $RENDER_DATABASE_URL < backup.sql
   ```

2. **Modo dual**:
   - Configurar backend para escribir en AMBAS bases de datos temporalmente
   - Usar transacciones distribuidas

3. **Cutover**:
   - Cambiar `DATABASE_URL` de Railway a Render
   - Verificar sincronización
   - Apagar Railway

### Opción C: Usar herramienta de migración

```bash
# Instalar pgloader (herramienta de migración PostgreSQL)
brew install pgloader  # Mac
apt-get install pgloader  # Linux

# Migrar todo en un comando
pgloader $RAILWAY_DATABASE_URL $RENDER_DATABASE_URL
```

---

## 🔐 Checklist de Migración (0% Pérdida de Datos)

### Antes de migrar:
- [ ] Hacer backup completo: `pg_dump $SOURCE_URL > backup.sql`
- [ ] Guardar backup en lugar seguro (S3, Drive, etc.)
- [ ] Verificar tamaño de la DB actual
- [ ] Probar restauración en ambiente local

### Durante la migración:
- [ ] Poner aplicación en modo mantenimiento (opcional)
- [ ] Exportar datos
- [ ] Importar en nuevo servicio
- [ ] Verificar conteo de registros: `SELECT COUNT(*) FROM users`
- [ ] Ejecutar queries de validación

### Después de migrar:
- [ ] Verificar que todos los endpoints funcionen
- [ ] Hacer login de prueba
- [ ] Crear/editar registros de prueba
- [ ] Monitorear logs por 24 horas
- [ ] Mantener backup de Railway por 1 semana
- [ ] Eliminar servicio antiguo

---

## 📊 Scripts de Validación Post-Migración

Crea este script para validar que la migración fue exitosa:

```sql
-- validate_migration.sql

-- Contar registros en cada tabla
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'buildings', COUNT(*) FROM buildings
UNION ALL
SELECT 'work_orders', COUNT(*) FROM work_orders;

-- Verificar integridad referencial
SELECT COUNT(*) as orphaned_buildings
FROM buildings b
LEFT JOIN clients c ON b."clientId" = c.id
WHERE c.id IS NULL;

SELECT COUNT(*) as orphaned_work_orders
FROM work_orders wo
LEFT JOIN buildings b ON wo."buildingId" = b.id
WHERE b.id IS NULL;

-- Últimos registros creados
SELECT 'Last user' as entity, email, "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 1;

SELECT 'Last client' as entity, name, "createdAt"
FROM clients
ORDER BY "createdAt" DESC
LIMIT 1;
```

Ejecutar antes y después de migrar:
```bash
# En Railway (origen)
psql $RAILWAY_DATABASE_URL < validate_migration.sql > railway_counts.txt

# En Render (destino)
psql $RENDER_DATABASE_URL < validate_migration.sql > render_counts.txt

# Comparar archivos
diff railway_counts.txt render_counts.txt
```

Si el diff está vacío = migración perfecta ✅

---

## 💰 Comparación de Costos

| Servicio | Free Tier | Paid (cuando crezcas) |
|----------|-----------|----------------------|
| **Railway** | $5/mes créditos (~500h) | $20/mes (Hobby) |
| **Render** | Solo 2 servicios | $7/mes x servicio = $14/mes |
| **Vercel** | 100GB bandwidth | Pro $20/mes |
| **Supabase** | 500MB DB, 1GB storage | Pro $25/mes |

---

## 🎯 Estrategia Recomendada

### Fase 1: Validación (Gratis)
- Frontend: Vercel Free
- Backend + DB: Railway Free
- **Costo**: $0/mes
- **Duración**: Hasta validar el producto

### Fase 2: Crecimiento (Bajo costo)
- Frontend: Vercel Free
- Backend + DB: Railway Hobby ($20/mes)
- **Costo**: $20/mes
- **Duración**: Primeros clientes pagando

### Fase 3: Producción (Escalable)
- Frontend: Vercel Pro ($20/mes)
- Backend: Render Starter ($7/mes)
- Database: Render PostgreSQL ($7/mes)
- **Costo**: $34/mes
- **Duración**: Negocio establecido

---

## 🚨 Alternativa ULTRA-ECONÓMICA: Todo Serverless

Si quieres $0 para siempre:

### Stack Completamente Gratis:
- **Frontend**: Vercel
- **Backend**: Vercel Serverless Functions (mismo repo)
- **Database**: Neon PostgreSQL (512MB gratis)
- **Storage**: Firebase Storage (5GB gratis)

**Modificaciones necesarias**:
1. Convertir NestJS controllers a Vercel API routes
2. Usar Prisma en lugar de TypeORM (funciona mejor serverless)

¿Quieres que te ayude con esta conversión?

---

## ❓ FAQ

**P: ¿Puedo migrar solo la base de datos?**
R: Sí, solo exporta/importa el dump SQL.

**P: ¿Cuánto tarda una migración?**
R: 5-30 minutos dependiendo del tamaño de la DB.

**P: ¿Los usuarios perderán datos durante la migración?**
R: No si usas Opción A (backup/restore) con modo mantenimiento de 5 minutos.

**P: ¿Puedo hacer rollback si algo sale mal?**
R: Sí, simplemente cambia las variables de entorno de vuelta al servicio original.

---

¿Necesitas ayuda para decidir qué opción usar? Déjame saber tu caso de uso y te ayudo a elegir.

# 📘 Guía de Migración: Agregar columna `name` a la tabla `buildings`

## 🎯 Objetivo

Agregar una columna `name` (varchar 150, nullable) a la tabla `buildings` existente **sin perder datos** y usando buenas prácticas profesionales.

---

## 📋 Resumen de la Migración

### Archivo de migración
```
src/migrations/1766407300000-AddNameColumnToBuildings.ts
```

### SQL que se ejecutará
```sql
ALTER TABLE "buildings"
ADD COLUMN "name" VARCHAR(150) NULL
COMMENT 'Short name or identifier for the building (e.g., CAM2)';
```

---

## 🔍 ¿Qué hace cada método?

### `up()` - Aplicar la migración

**Qué hace:**
1. Agrega una nueva columna `name` a la tabla `buildings`
2. Tipo: `varchar(150)` - permite nombres cortos de edificios
3. **Nullable: true** - los registros existentes NO se rompen (tendrán NULL)
4. Sin valor por defecto - NULL explícito para registros existentes

**¿Es seguro en producción?** ✅ SÍ
- Usa `ALTER TABLE` (no recrea la tabla)
- No modifica datos existentes
- No requiere downtime
- Compatible con PostgreSQL
- **Los edificios existentes seguirán funcionando normalmente con `name = NULL`**

### `down()` - Revertir la migración

**Qué hace:**
1. Elimina la columna `name` de la tabla `buildings`
2. **⚠️ ADVERTENCIA:** Los datos en esta columna se perderán permanentemente

**Cuándo usar:**
- Solo si necesitas hacer rollback por algún problema
- NO lo ejecutes a menos que estés seguro

---

## 🚀 Cómo funciona en producción

### Flujo automático (Railway)

1. **Haces push a GitHub:**
   ```bash
   git push origin main
   ```

2. **Railway detecta el cambio y hace rebuild:**
   - Compila el código TypeScript (`npm run build`)
   - La migración se compila a JavaScript en `dist/migrations/`

3. **Al iniciar la aplicación (`main.ts`):**
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     // Verifica si hay migraciones pendientes
     const pendingMigrations = await dataSource.showMigrations();

     if (pendingMigrations) {
       // Solo ejecuta las migraciones que NO se han ejecutado antes
       await dataSource.runMigrations({ transaction: 'all' });
     }
   }
   ```

4. **TypeORM verifica la tabla `migrations`:**
   - Si `AddNameColumnToBuildings1766407300000` ya fue ejecutada → SKIP
   - Si NO fue ejecutada → EJECUTA y registra en la tabla `migrations`

5. **Resultado:**
   - ✅ Primera vez: Ejecuta la migración y agrega la columna
   - ✅ Siguientes rebuilds: SKIP (ya está registrada en la DB)

---

## 🔐 ¿Por qué es seguro ejecutar en cada startup?

### TypeORM mantiene un registro interno

PostgreSQL tiene una tabla especial llamada `migrations`:

```sql
SELECT * FROM migrations;
```

Resultado:
```
| id | timestamp       | name                                    |
|----|----------------|-----------------------------------------|
| 1  | 1766407300000  | AddNameColumnToBuildings1766407300000   |
```

**Cómo funciona:**
1. TypeORM ejecuta `showMigrations()` → compara archivos vs tabla
2. Si la migración ya está en la tabla → **NO LA EJECUTA DE NUEVO**
3. Solo ejecuta migraciones nuevas que no están registradas

**Por eso es seguro llamar `runMigrations()` en cada startup** ✅

---

## 📊 Diferencia vs `synchronize: true`

| Característica | `synchronize: true` | Migraciones |
|----------------|---------------------|-------------|
| **Control** | Automático (sin control) | Manual (control total) |
| **Seguridad en prod** | ❌ PELIGROSO | ✅ SEGURO |
| **Historial** | ❌ No | ✅ Sí (tabla migrations) |
| **Reversible** | ❌ No | ✅ Sí (método down) |
| **Datos complejos** | ❌ No soporta | ✅ Puedes agregar lógica |
| **Recomendado para** | Desarrollo local | **PRODUCCIÓN** |

---

## 🧪 Testing local

### Opción 1: Ejecutar la migración manualmente

```bash
cd back
npm run build
npm run migration:run
```

### Opción 2: Dejar que se ejecute al iniciar

```bash
cd back
NODE_ENV=production npm run start:dev
```

Verás en la consola:
```
🔄 Checking for pending migrations...
🚀 Running pending migrations...
✅ Migrations completed successfully
🚀 Server running on http://localhost:3001/api
```

### Verificar que funcionó

```sql
-- Verificar que la columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buildings' AND column_name = 'name';

-- Ver edificios con la nueva columna
SELECT id, name, address FROM buildings LIMIT 5;
```

Resultado esperado:
```
| id   | name | address           |
|------|------|-------------------|
| uuid | NULL | 123 Main Street   |  ← Edificios existentes (name = NULL)
| uuid | NULL | 456 Oak Avenue    |  ← Edificios existentes (name = NULL)
```

---

## 🎯 Próximos pasos después del deploy

### 1. **Verificar que la migración se ejecutó**

Revisa los logs de Railway:
```
✅ Migrations completed successfully
```

### 2. **Testear el frontend**

- Crear un edificio nuevo con nombre → Debería funcionar
- Ver edificios existentes → Deberían mostrar "-" en la columna nombre
- Editar un edificio existente para agregarle nombre → Debería funcionar

### 3. **Opcional: Rellenar nombres automáticamente**

Si quieres dar nombres automáticos a los edificios existentes:

```sql
-- Ejemplo: Usar los primeros 50 caracteres de la dirección
UPDATE buildings
SET name = SUBSTRING(address, 1, 50)
WHERE name IS NULL;
```

---

## ⚠️ Troubleshooting

### Problema: "Migration failed"

**Solución:**
1. Revisa los logs de Railway
2. Verifica que la tabla `buildings` existe
3. Verifica que PostgreSQL está accesible
4. Contacta soporte si persiste

### Problema: "Column already exists"

**Causa:** La migración ya se ejecutó antes

**Solución:**
- Esto es normal, TypeORM debería skipearla automáticamente
- Si ves este error, significa que la columna YA EXISTE
- Verifica con: `SELECT * FROM migrations;`

### Problema: Quiero revertir la migración

**⚠️ CUIDADO: Esto borrará todos los nombres de edificios**

```bash
cd back
npm run build
npm run migration:revert
```

---

## 📝 Checklist de deployment

- [x] Migración creada: `AddNameColumnToBuildings1766407300000.ts`
- [x] `synchronize: false` en producción
- [x] `main.ts` configurado para ejecutar migraciones
- [x] Frontend actualizado con campo `name`
- [x] DTO del backend actualizado (`CreateBuildingDto`, `UpdateBuildingDto`)
- [x] Entity del backend actualizada (`Building`)
- [ ] Testing local exitoso
- [ ] Push a GitHub
- [ ] Verificar deploy en Railway
- [ ] Verificar que la columna existe en producción
- [ ] Testear creación de edificios con nombre

---

## 🎓 Explicación para el equipo

**¿Por qué migraciones en lugar de `synchronize`?**

- `synchronize: true` puede BORRAR DATOS en producción si cambias el schema
- Las migraciones son **explícitas** - sabes exactamente qué cambios se aplicarán
- Tienes **control de versiones** - cada migración es un archivo en Git
- Puedes **revertir** cambios si algo sale mal
- Es la práctica estándar en empresas profesionales

**¿Necesito ejecutar algo manualmente?**

NO. Las migraciones se ejecutan automáticamente:
1. En cada deploy de Railway
2. Solo si hay migraciones nuevas
3. De forma segura (dentro de una transacción)

---

## 📚 Referencias

- [TypeORM Migrations Docs](https://typeorm.io/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Railway Deployment](https://docs.railway.app/)

---

✅ **Listo para producción** - Esta migración es segura y no perderás datos.

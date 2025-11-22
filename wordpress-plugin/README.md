# Ecdotica AI Assistant - Plugin de WordPress

Asistente de IA para análisis textual y editorial de manuscritos para Editorial Nuevo Milenio.

## 🎯 Características

### ✅ Versión 1.1.0 (Actual)

- **Análisis automático de manuscritos** (PDF y DOCX)
- **Guardado automático en Biblioteca de Medios de WordPress**
- **Historial completo de análisis** con base de datos personalizada
- **Estadísticas detalladas**: palabras, oraciones, párrafos, calidad
- **Decisiones editoriales automáticas**: Aceptado, Revisión necesaria, Rechazado
- **Integración con Cloudflare Workers** para análisis de IA
- **Metadatos personalizados** en archivos de Medios para facilitar búsqueda

## 🛠️ Instalación

### Opción 1: Instalación desde ZIP

1. Descarga el archivo `ecdotica-analyzer-v2.zip` del repositorio
2. Ve a **WordPress Admin → Plugins → Añadir nuevo**
3. Haz clic en **Subir plugin**
4. Selecciona el archivo ZIP y haz clic en **Instalar ahora**
5. Activa el plugin

### Opción 2: Instalación manual

1. Descarga todos los archivos del directorio `wordpress-plugin/`
2. Súbelos a `/wp-content/plugins/ecdotica-analyzer-v2/`
3. Ve a **WordPress Admin → Plugins**
4. Activa "Ecdotica AI Assistant"

## 🔧 Configuración

### 1. Configurar URL de la API

Edita el archivo `config.php` y actualiza la URL de tu API:

```php
define('ECDOTICA_API_URL', 'https://ecdotica-analyzer.pazuco.workers.dev');
```

### 2. Verificar Base de Datos

Al activar el plugin, se crean automáticamente 4 tablas:

- `wp_ecdotica_manuscripts` - Manuscritos analizados
- `wp_ecdotica_analyses` - Resultados de análisis
- `wp_ecdotica_editorial_notes` - Notas editoriales
- `wp_ecdotica_manuscript_versions` - Historial de versiones

**Importante**: Si actualizas desde una versión anterior, el campo `media_id` se agregará automáticamente.

### 3. Permisos de Archivos

Asegúrate de que WordPress tenga permisos de escritura en:

- `/wp-content/uploads/` - Para guardar manuscritos

## 🚀 Uso

### Análisis de Manuscritos

1. Ve a **WordPress Admin → Ecdotica**
2. Completa el campo "Autor del manuscrito" (opcional pero recomendado)
3. Selecciona un archivo PDF o DOCX (máximo 10MB)
4. Haz clic en **Analizar Manuscrito**
5. Espera los resultados del análisis

### Resultados del Análisis

Después del análisis, verás:

- **Estadísticas**: Palabras, oraciones, párrafos, calidad
- **Decisión editorial**: Aceptado/Revisión/Rechazado
- **Problemas detectados**: Lista de issues encontrados
- **Enlace a Medios**: Acceso directo al archivo en la biblioteca de medios

### Historial de Análisis

En la misma página verás una tabla con:

- Todos los manuscritos analizados
- Estado de cada uno (Aceptado, Revisión, Rechazado, Pendiente)
- Puntuación de calidad
- Enlace directo al archivo en Medios

### Acceso a Archivos en Medios

1. Los manuscritos se guardan automáticamente en **Medios → Biblioteca**
2. Cada archivo tiene metadatos personalizados:
   - `_ecdotica_analysis_status`: Estado editorial
   - `_ecdotica_quality_score`: Puntuación de calidad
   - `_ecdotica_word_count`: Número de palabras
   - `_ecdotica_author`: Nombre del autor
   - `_ecdotica_analyzed_date`: Fecha de análisis

3. Puedes buscar, filtrar y gestionar los manuscritos igual que cualquier otro archivo de medios

## 📊 Arquitectura

### Archivos Principales

```
wordpress-plugin/
├── ecdotica-ai-assistant.php  # Archivo principal del plugin
├── config.php                 # Configuración de API
├── database-setup.php         # Creación y actualización de tablas
├── manuscript-manager.php     # Gestor de manuscritos y análisis
├── admin-page.php             # Interfaz de administración
├── assets/                    # JavaScript y CSS
└── README.md                  # Este archivo
```

### Flujo de Trabajo

1. **Usuario sube manuscrito** → Formulario en `admin-page.php`
2. **Validación** → Tipo de archivo y tamaño
3. **Envío a API** → Cloudflare Worker analiza contenido
4. **Guardado en Medios** → WordPress Media Library (usando `wp_handle_upload()`)
5. **Guardado en BD** → Tablas personalizadas vía `manuscript-manager.php`
6. **Mostrar resultados** → Interfaz con estadísticas y enlace a Medios

## 🔄 Actualizaciones

### De v1.0.0 a v1.1.0

**Nuevas características:**
- Guardado automático de manuscritos en Biblioteca de Medios
- Campo `media_id` en tabla de manuscritos
- Enlaces directos a archivos desde historial
- Metadatos personalizados en attachments
- Actualización automática de esquema de base de datos

**¿Cómo actualizar?**

1. Descarga la nueva versión del plugin
2. Desactiva el plugin actual
3. Reemplaza los archivos en `/wp-content/plugins/ecdotica-analyzer-v2/`
4. Reactiva el plugin
5. El esquema de base de datos se actualizará automáticamente

**O simplemente:**

1. Actualiza los archivos vía FTP/SSH
2. El plugin detectará la actualización y ajustará la BD automáticamente

## ⚠️ Solución de Problemas

### El archivo no se guarda en Medios

1. Verifica permisos de escritura en `/wp-content/uploads/`
2. Revisa los logs de WordPress: `wp-content/debug.log`
3. Busca mensajes de error que comiencen con "Ecdotica:"

### Error de API

1. Verifica que `ECDOTICA_API_URL` esté correctamente configurada
2. Comprueba que el Cloudflare Worker esté activo
3. Prueba la API manualmente: `https://ecdotica-analyzer.pazuco.workers.dev/health`

### El historial no muestra manuscritos

1. Verifica que las tablas se hayan creado correctamente
2. Ejecuta esta consulta SQL para verificar:
   ```sql
   SHOW TABLES LIKE 'wp_ecdotica_%';
   ```
3. Si faltan tablas, desactiva y reactiva el plugin

### Campo media_id no existe (actualización desde v1.0.0)

1. El plugin debería agregar el campo automáticamente
2. Si no funciona, ejecuta manualmente:
   ```sql
   ALTER TABLE wp_ecdotica_manuscripts 
   ADD COLUMN media_id bigint(20) DEFAULT NULL 
   COMMENT 'ID del attachment en WordPress Media Library' 
   AFTER notes,
   ADD KEY media_id (media_id);
   ```

## 📝 Registro de Cambios

### [1.1.0] - 2025-11-22

#### Añadido
- Guardado automático de manuscritos en Biblioteca de Medios de WordPress
- Campo `media_id` en tabla `ecdotica_manuscripts`
- Metadatos personalizados en attachments (`_ecdotica_*`)
- Enlace directo a Medios desde historial de análisis
- Campo "Autor" en formulario de análisis
- Función `update_schema()` para actualizaciones automáticas de BD
- Verificación automática de versión de base de datos

#### Mejorado
- Interfaz de resultados de análisis con enlace a Medios
- Sistema de logs para debugging
- Documentación completa en README

#### Corregido
- Error en archivo principal del plugin (sintaxis)
- Falta de inclusión de archivos necesarios

### [1.0.0] - 2025-11-20

- Lanzamiento inicial
- Análisis de manuscritos PDF y DOCX
- Historial de análisis en base de datos
- Integración con API de Cloudflare Workers

## 👥 Soporte

Para problemas o preguntas:

- **Email**: contacto@ecdotica.com
- **Repositorio**: https://github.com/Pazuco/Ecdotica-nuevo
- **Website**: https://ecdotica.com

## 📜 Licencia

GPL v2 or later

---

**Editorial Nuevo Milenio** - Sistema Ecdótica de Análisis Editorial

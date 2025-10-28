# Configurar Personal Access Token (PAT) para GitHub Pages

## Problema

El workflow de GitHub Actions está fallando con el error:
```
Permission to AlfaroT/Mi-Horario-FPUNA.git denied to github-actions[bot]
```

Esto ocurre cuando el `GITHUB_TOKEN` no tiene los permisos necesarios para desplegar en GitHub Pages, generalmente debido a restricciones de seguridad a nivel de organización o repositorio.

## Solución: Usar un Personal Access Token (PAT)

Un Personal Access Token con el scope `repo` tiene los permisos necesarios para desplegar en GitHub Pages sin las restricciones del `GITHUB_TOKEN`.

## Pasos para crear y configurar el PAT

### 1. Crear el Personal Access Token

1. Inicia sesión en GitHub
2. Haz clic en tu foto de perfil en la esquina superior derecha
3. Selecciona **Settings**
4. En el menú izquierdo, haz clic en **Developer settings**
5. Haz clic en **Personal access tokens** → **Tokens (classic)**
6. Haz clic en **Generate new token** → **Generate new token (classic)**

### 2. Configurar el token

1. **Note**: Escribe un nombre descriptivo, por ejemplo `Deploy GitHub Pages`
2. **Expiration**: Selecciona un período de expiración (recomendado: 90 días o más)
3. **Scopes**: Marca la casilla **`repo`** (esto otorga acceso completo a repositorios)
   - Esto incluye:
     - `repo:status`
     - `repo_deployment`
     - `public_repo`
     - `repo:invite`
     - `security_events`
     - `write:repo_hook`
     - `read:repo_hook`
     - `admin:org_hook`
     - `read:org`
     - `admin:org`
     - `admin:public_key`
     - `write:public_key`
     - `read:public_key`
     - `admin:repo_hook`
     - `write:repo_hook`
     - `read:repo_hook`
     - `admin:org_hook`
     - `gist`
     - `notifications`
     - `user`
     - `delete_repo`
     - `write:discussion`
     - `read:discussion`
     - `write:packages`
     - `read:packages`
     - `delete:packages`
     - `admin:packages`
     - `write:team_discussions`
     - `read:team_discussions`

4. Haz clic en **Generate token**

### 3. Copiar el token

⚠️ **IMPORTANTE**: Copia el token inmediatamente y guárdalo en un lugar seguro. No podrás volver a verlo después de salir de esta página.

### 4. Agregar el token a los secrets del repositorio

1. Ve a tu repositorio `AlfaroT/Mi-Horario-FPUNA`
2. Haz clic en la pestaña **Settings**
3. En el menú izquierdo, haz clic en **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**
5. **Name**: `PAT_TOKEN`
6. **Secret**: Pega el token que copiaste anteriormente
7. Haz clic en **Add secret**

### 5. Verificar el workflow

El workflow ya está configurado para usar el PAT en lugar del GITHUB_TOKEN:

```yaml
- name: Deploy to GitHub Pages
  if: github.ref == 'refs/heads/main'
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.PAT_TOKEN }}
    publish_dir: ./
```

## Pasos finales

1. Haz commit de los cambios del workflow
2. El workflow debería ejecutarse automáticamente en el próximo push a la rama main
3. Verifica que el despliegue se complete correctamente

## Solución de problemas

### Si el workflow sigue fallando:

1. Verifica que el token tenga el scope `repo`
2. Asegúrate de que el secret se llame exactamente `PAT_TOKEN`
3. Verifica que el token no haya expirado
4. Si el repositorio pertenece a una organización, asegúrate de que las políticas de la organización permitan el uso de PATs

### Si necesitas regenerar el token:

1. Sigue los mismos pasos para crear un nuevo token
2. Elimina el secret anterior del repositorio
3. Agrega el nuevo token con el mismo nombre `PAT_TOKEN`

## Seguridad

- No compartas tu PAT con nadie
- Usa tokens con expiración razonable
- Revisa periódicamente los tokens activos y elimina los que no necesites
- Considera usar variables de entorno de GitHub para mayor seguridad en repositorios sensibles

## Alternativas

Si prefieres no usar un PAT, puedes considerar:

1. **GitHub Pages con GitHub Actions**: Usar el action oficial `actions/configure-pages` con `actions/deploy-pages`
2. **Despliegue manual**: Construir localmente y hacer push a la rama `gh-pages`
3. **Terceros**: Usar servicios como Vercel, Netlify o GitHub Pages con integraciones externas

Sin embargo, el PAT es la solución más directa y confiable para este caso específico.
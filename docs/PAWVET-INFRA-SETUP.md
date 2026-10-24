# 🖥️ PAWVET — Setup Completo de Infraestructura Hetzner

**Guía paso a paso para configurar VPS de Hetzner para PAWVET**

---

## 📋 **Requisitos Previos**

- [ ] Dominio pawvet.net comprado en Namecheap
- [ ] Tarjeta crédito para pagar Hetzner
- [ ] Terminal/PowerShell en tu computadora
- [ ] SSH instalado (viene por defecto en Mac/Linux)

---

## 🛒 **PASO 1: Comprar VPS en Hetzner (10 minutos)**

### **1.1 Abre Hetzner Cloud Console**
```
https://www.hetzner.com/cloud
```

### **1.2 Sign Up**
```
Email:       tu@email.com
Contraseña:  [fuerte, 20+ caracteres]
Verificar:   Confirma link en email
```

### **1.3 Crear Proyecto**
```
Project name: PAWVET
Ubicación:    [cualquiera]
```

### **1.4 Crear VPS**
```
Ubicación servidor:  Falkenstein, Germany
Tipo:                CX31
  - 2 vCores
  - 8 GB RAM
  - 160 GB NVMe SSD
  - 20 TB traffic

Imagen:              Ubuntu 22.04 LTS
Volume:              [no necesario]
Backups:             [activar después, $0.40/week]
```

### **1.5 Checkout**
```
Cantidad:    1x CX31
Precio:      €9.90/mes
Agregar:     A carrito
Ir:          Checkout
Pagar:       Tarjeta crédito
```

### **1.6 Recibirás Email con:**
```
IP Pública:    123.45.67.89
Usuario:       root
Contraseña:    [temporal, en console]
```

---

## 🔓 **PASO 2: Primer Acceso SSH (5 minutos)**

### **2.1 En Tu Computadora: Conecta por SSH**

**Mac/Linux:**
```bash
ssh root@123.45.67.89
# Copia/pega IP de tu email

# Primera vez pedirá confirmación:
# "The authenticity of host... Are you sure? (yes/no)"
# Escribe: yes
# Presiona Enter

# Ingresa contraseña temporal (la que viene en email)
```

**Windows (PowerShell):**
```powershell
ssh root@123.45.67.89
```

### **2.2 Cambiar Contraseña Root**
```bash
passwd

# Te pedirá:
# "Current password:"  → Ingresa contraseña temporal
# "New password:"      → Nueva fuerte (20+ caracteres)
# "Retype:"            → Repite

# COPIA ESTA CONTRASEÑA EN UN LUGAR SEGURO
```

### **2.3 Crear Usuario de Desarrollo**
```bash
# No usarás root para tareas diarias, solo emergencias

adduser desarrollo

# Te pedirá datos (presiona Enter x5 para saltar campos):
# Full Name: [Enter]
# Room:      [Enter]
# Phone:     [Enter]
# Other:     [Enter]
# Is info correct? [y/N]: y

# Luego contraseña (diferente a root):
# New password:   [20+ caracteres]
# Retype:         [repite]

# Dale permisos sudo:
usermod -aG sudo desarrollo

# Prueba:
su - desarrollo
sudo whoami  # Debe mostrar "root"
exit
```

---

## 🛡️ **PASO 3: Seguridad Básica (15 minutos)**

### **3.1 Actualiza Sistema**
```bash
apt update && apt upgrade -y

# Esto descarga ~200MB, toma 2-3 minutos
# NO interrumpas
```

### **3.2 Instala Firewall (UFW)**
```bash
apt install ufw -y

# Permite SSH (CRÍTICO, sino perderás acceso)
ufw allow 22/tcp

# Permite HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activa firewall
ufw enable

# Verifica:
ufw status
# Debe mostrar las 3 reglas
```

### **3.3 Configura SSH Seguro**
```bash
# Edita archivo de config
sudo nano /etc/ssh/sshd_config

# Busca estas líneas y modifica:

# Línea ~32: PermitRootLogin yes
# Cámbialo a:
PermitRootLogin no

# Guarda: Ctrl+X → Y → Enter

# Reinicia SSH:
sudo systemctl restart sshd

# Verifica que funciona:
ssh desarrollo@123.45.67.89
# Si funciona, ya no podrás login como root por SSH
```

### **3.4 Instala Fail2Ban (Anti-Brute Force)**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verifica:
sudo fail2ban-client status
```

---

## 🐳 **PASO 4: Instala Docker (10 minutos)**

### **4.1 Instala Docker**
```bash
# Script oficial de Docker:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verifica:
docker --version

# Dale permisos al usuario desarrollo (sin sudo):
sudo usermod -aG docker desarrollo

# LOGOUT y LOGIN para que aplique:
exit
ssh desarrollo@123.45.67.89

# Prueba sin sudo:
docker ps
# Debe funcionar sin pedir contraseña
```

### **4.2 Instala Docker Compose**
```bash
# Descarga última versión:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Permisos ejecutable:
sudo chmod +x /usr/local/bin/docker-compose

# Verifica:
docker-compose --version
# Debe mostrar versión (ej: v2.24.0)
```

### **4.3 Instala Git**
```bash
sudo apt install git -y

# Configura identidad:
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Verifica:
git --version
```

---

## 🌐 **PASO 5: Instala Nginx (Reverse Proxy)**

### **5.1 Instala Nginx**
```bash
sudo apt install nginx -y

# Inicia:
sudo systemctl start nginx
sudo systemctl enable nginx

# Verifica:
curl http://localhost
# Debe mostrar página de Nginx (texto HTML)
```

### **5.2 Crea Configuración para PAWVET**
```bash
# Crea archivo de configuración:
sudo nano /etc/nginx/sites-available/pawvet

# Copia esto (sustituye 123.45.67.89 por tu IP):
```

```nginx
server {
    listen 80;
    server_name pawvet.net www.pawvet.net;

    # Redirige a HTTPS (solo cuando tengas SSL)
    # return 301 https://$server_name$request_uri;

    # Por ahora, proxy a backend
    location / {
        proxy_pass http://localhost:3000;  # Backend Hono
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilita la configuración:
sudo ln -s /etc/nginx/sites-available/pawvet /etc/nginx/sites-enabled/

# Verifica sintaxis:
sudo nginx -t
# Debe mostrar: "syntax is ok"

# Reinicia:
sudo systemctl restart nginx
```

---

## 🔒 **PASO 6: SSL/HTTPS con Let's Encrypt (5 minutos)**

### **6.1 Instala Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### **6.2 Obtén Certificado (DESPUÉS de apuntar dominio)**
```bash
# PRIMERO: apunta pawvet.net a esta IP (ver PASO 7)
# ESPERA 15-30 min propagación DNS

# Luego:
sudo certbot certonly --standalone \
  -d pawvet.net \
  -d www.pawvet.net

# Responde preguntas (email, términos)
# Si funciona, verás:
# "Congratulations! Your certificate has been issued."
```

### **6.3 Actualiza Nginx para HTTPS**
```bash
sudo nano /etc/nginx/sites-available/pawvet

# Reemplaza con:
```

```nginx
server {
    listen 80;
    server_name pawvet.net www.pawvet.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pawvet.net www.pawvet.net;

    ssl_certificate /etc/letsencrypt/live/pawvet.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pawvet.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Verifica y reinicia:
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌐 **PASO 7: Apunta Dominio pawvet.net a Hetzner**

### **7.1 En Namecheap (donde compraste dominio)**
```
1. Login: namecheap.com
2. Dominios → pawvet.net
3. Click "Manage"
4. Tab "Advanced DNS"
5. Busca sección "A Record"
6. Ingresa tu IP (ej: 123.45.67.89)
7. Guarda

Espera 15-30 minutos
```

### **7.2 Verifica Propagación DNS**
```bash
# En tu computadora:
nslookup pawvet.net
# Debe mostrar tu IP de Hetzner

# O:
host pawvet.net
# También debe mostrar tu IP
```

---

## 📁 **PASO 8: Estructura de Proyecto**

### **8.1 Crea Directorios**
```bash
ssh desarrollo@123.45.67.89

cd ~
mkdir -p pawvet/{backend,frontend-web,frontend-mobile,docs}

# Estructura final:
# ~/pawvet/
#   ├── backend/              (Node.js + Hono)
#   ├── frontend-web/         (Next.js)
#   ├── frontend-mobile/      (React Native)
#   └── docs/                 (documentación)

cd ~/pawvet
git init
git config user.name "PAWVET Dev"
git config user.email "dev@pawvet.net"
```

### **8.2 Crea .env files (Secretos)**
```bash
# Backend .env
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://user:password@db:5432/pawvet
CLERK_SECRET_KEY=sk_test_xxx
TRANSBANK_API_KEY=xxx
GOOGLE_MAPS_API_KEY=xxx
SENDGRID_API_KEY=xxx
NODE_ENV=production
EOF

# IMPORTANTE: Nunca commitees .env a git
echo ".env" >> backend/.gitignore
```

---

## ✅ **PASO 9: Verificación Final**

```bash
# Conecta al servidor:
ssh desarrollo@123.45.67.89

# Verifica cada componente:

# 1. Sistema operativo
cat /etc/os-release
# Debe mostrar Ubuntu 22.04

# 2. Docker
docker ps
docker-compose --version

# 3. Git
git --version

# 4. Nginx
sudo systemctl status nginx
# Debe mostrar "active (running)"

# 5. Firewall
sudo ufw status
# Debe mostrar 22, 80, 443 permitidos

# 6. Dominio (después de apuntar)
curl https://pawvet.net
# Debe conectar sin errores SSL
```

---

## 📋 **Checklist Completo**

```
[ ] VPS comprado en Hetzner (CX31, €9.90/mes)
[ ] IP del servidor recibida
[ ] SSH funciona (root y usuario desarrollo)
[ ] Contraseñas cambiadas (root y desarrollo)
[ ] Sistema actualizado (apt upgrade)
[ ] Firewall configurado (ufw, 22/80/443)
[ ] SSH root deshabilitado
[ ] Fail2Ban instalado
[ ] Docker instalado
[ ] Docker Compose instalado
[ ] Git instalado y configurado
[ ] Nginx instalado y funcionando
[ ] Directorio ~/pawvet/ creado
[ ] .env files creados (NO commiteados)
[ ] Dominio pawvet.net apunta a servidor
[ ] DNS propagó (verificado con nslookup)
[ ] SSL/HTTPS funciona (Let's Encrypt)
[ ] curl https://pawvet.net funciona
```

---

## 🚨 **Troubleshooting Común**

### **"Connection refused" al conectar SSH**
```
→ Espera 2-3 minutos después de crear VPS
→ Verifica firewall permite puerto 22
```

### **"Permission denied" con Docker**
```
→ Exit y relogin al servidor
→ Verifica: groups desarrollo
→ Debe incluir: docker
```

### **DNS no propaga**
```
→ Espera hasta 1 hora (en casos raros)
→ Verifica A record en Namecheap
→ Prueba: nslookup pawvet.net 8.8.8.8
```

### **SSL certificate error**
```
→ Verifica dominio apunta a servidor
→ Espera propagación DNS (15-30 min)
→ Luego: sudo certbot certonly --standalone
```

---

## 🎯 **Siguiente Paso**

Una vez todo verificado, estás listo para:

1. Clonar repos de backend/frontend
2. Configurar docker-compose.yml
3. Iniciar FASE 1 de desarrollo

**¡Infraestructura lista! 🚀**


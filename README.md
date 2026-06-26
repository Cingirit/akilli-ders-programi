# Akıllı Ders Programı Yönetim Sistemi

Bandırma Onyedi Eylül Üniversitesi Bilgisayar Mühendisliği Bölümü lisans bitirme projesi.

## Ne Yapıyor?

Üniversitelerde ders programı ve sınav takvimi hazırlama sürecini otomatikleştiriyor. Hoca müsaitlikleri, derslik kapasiteleri, ÇAP öğrencileri ve alttan ders alanlar gibi özel durumlar gözetilerek Google OR-Tools ile çakışmasız program üretiliyor.

## Teknolojiler

- **Frontend:** React.js, Material UI
- **Backend:** Node.js, Express.js, Sequelize, MySQL
- **Optimizasyon:** Python, FastAPI, Google OR-Tools CP-SAT

## Kurulum

### Gereksinimler
- Node.js 18+
- Python 3.10+
- MySQL 8.0+

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/Cingirit/akilli-ders-programi.git
cd akilli-ders-programi

# Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını açıp veritabanı bilgilerini doldur

# Node bağımlılıklarını kur
npm install

# Python bağımlılıklarını kur
cd src/optimizer
pip install -r requirements.txt
```

### Çalıştırma

```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Optimizasyon servisi
cd src/optimizer
uvicorn main:app --reload --port 8001

# Terminal 3 - Frontend
cd client
npm install
npm start
```

Uygulama `http://localhost:3000` adresinde açılır.

## Geliştirici

Furkan Cingirit — Bilgisayar Mühendisliği, Bandırma Onyedi Eylül Üniversitesi

Danışman: Dr. Öğr. Üyesi Mehmet Sevi

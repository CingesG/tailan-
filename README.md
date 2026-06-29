# 🍺 Баарны тайлан систем

## Технологи
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt

## Суулгах & Ажиллуулах

### 1. Node.js суулгах (хэрэв байхгүй бол)
https://nodejs.org — LTS хувилбар татаж суулгана

### 2. Хамаарлуудыг суулгах
```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### 3. Development горимд ажиллуулах
```bash
npm run dev
```
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### 4. Production build
```bash
npm run build
npm start
# → http://localhost:3001
```

## Нэвтрэх мэдээлэл
| Нэвтрэх нэр | Нууц үг |
|---|---|
| `admin` | `Bar2024!` |

⚠️ Нэвтэрсний дараа Админ хуудсаас нууц үгээ заавал солино уу!

## Салбарууд
- **Огторгуй** (анхдагч)
- **Agate** (анхдагч)

Админ хуудсаас шинэ салбар нэмж, устгаж болно.

## Өгөгдөл хадгалах газар
`data/bar.db` — SQLite файл. Энэ файлыг нөөцлөх нь зүйтэй.

## Бүтэц
```
bar-system/
├── server/
│   └── src/
│       ├── db/database.ts      ← SQLite, seed data
│       ├── middleware/auth.ts  ← JWT
│       ├── routes/
│       │   ├── auth.ts         ← login, change-password
│       │   ├── branches.ts     ← салбар CRUD
│       │   ├── items.ts        ← бараа CRUD
│       │   └── reports.ts      ← тайлан CRUD
│       └── index.ts            ← Express сервер
├── client/
│   └── src/
│       ├── lib/
│       │   ├── api.ts          ← API дуудлагууд
│       │   ├── AuthContext.tsx ← Login state
│       │   └── utils.ts        ← формат функцууд
│       ├── types/index.ts      ← TypeScript төрлүүд
│       ├── components/
│       │   ├── PaymentSection.tsx ← Орлого оруулах
│       │   └── ReportPaper.tsx    ← Хэвлэх тайлан
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── ReportPage.tsx  ← Үндсэн хуудас
│       │   ├── HistoryPage.tsx ← Түүх + засах
│       │   └── AdminPage.tsx   ← Бараа, салбар, нууц үг
│       └── App.tsx             ← Layout, навигаци
└── data/
    └── bar.db                  ← SQLite өгөгдлийн сан
```

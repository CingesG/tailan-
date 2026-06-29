import knex, { Knex } from 'knex'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

const DB_DIR = process.env.DB_DIR || path.join(__dirname, '../../data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
const DB_PATH = path.join(DB_DIR, 'bar.db')

export const db: Knex = knex({ client: 'sqlite3', connection: { filename: DB_PATH }, useNullAsDefault: true })

export async function initDb() {
  if (!await db.schema.hasTable('users')) {
    await db.schema.createTable('users', t => { t.increments('id'); t.string('username').unique().notNullable(); t.string('password').notNullable(); t.timestamp('created_at').defaultTo(db.fn.now()) })
  }
  if (!await db.schema.hasTable('branches')) {
    await db.schema.createTable('branches', t => { t.increments('id'); t.string('name').unique().notNullable(); t.timestamp('created_at').defaultTo(db.fn.now()) })
  }
  if (!await db.schema.hasTable('items')) {
    await db.schema.createTable('items', t => { t.increments('id'); t.string('name').notNullable(); t.string('category').notNullable(); t.integer('price').defaultTo(0); t.integer('sort_order').defaultTo(0); t.integer('active').defaultTo(1); t.timestamp('created_at').defaultTo(db.fn.now()) })
  }
  if (!await db.schema.hasTable('reports')) {
    await db.schema.createTable('reports', t => { t.increments('id'); t.integer('branch_id').notNullable(); t.string('date').notNullable(); t.timestamp('saved_at').defaultTo(db.fn.now()); t.integer('total_sale').defaultTo(0); t.integer('total_in').defaultTo(0); t.integer('diff').defaultTo(0); t.string('note').defaultTo(''); t.unique(['branch_id','date']) })
  }
  if (!await db.schema.hasTable('report_rows')) {
    await db.schema.createTable('report_rows', t => { t.increments('id'); t.integer('report_id').notNullable(); t.integer('item_id').defaultTo(0); t.string('item_name').notNullable(); t.string('category').defaultTo(''); t.integer('price').defaultTo(0); t.integer('opening').defaultTo(0); t.integer('tatalt').defaultTo(0); t.integer('zarlaga').defaultTo(0); t.integer('etsiin').defaultTo(0); t.integer('mongon_dun').defaultTo(0) })
  }
  if (!await db.schema.hasTable('report_payments')) {
    await db.schema.createTable('report_payments', t => { t.increments('id'); t.integer('report_id').notNullable(); t.string('type').notNullable(); t.integer('amount').defaultTo(0); t.string('note').defaultTo('') })
  }

  const existingUser = await db('users').where('username','admin').first()
  if (!existingUser) { await db('users').insert({ username:'admin', password: bcrypt.hashSync('Bar2024!',10) }); console.log('✅ admin / Bar2024!') }

  const bc = (await db('branches').count('id as c').first() as any).c
  if (!bc) { await db('branches').insert([{name:'Огторгуй'},{name:'Agate'}]); console.log('✅ Branches seeded') }

  const ic = (await db('items').count('id as c').first() as any).c
  if (!ic) {
    await db('items').insert([
      {name:'Heineken',category:'ПИВО',price:13000,sort_order:1},{name:'Kaltenberg',category:'ПИВО',price:13000,sort_order:2},{name:'Pearl river',category:'ПИВО',price:13000,sort_order:3},{name:'Snow',category:'ПИВО',price:13000,sort_order:4},{name:'Asahi',category:'ПИВО',price:13000,sort_order:5},{name:'Terra',category:'ПИВО',price:13000,sort_order:6},{name:'Krush',category:'ПИВО',price:12000,sort_order:7},{name:'Cass',category:'ПИВО',price:12000,sort_order:8},{name:'Essa',category:'ПИВО',price:12000,sort_order:9},{name:'Сэнгүр',category:'ПИВО',price:10000,sort_order:10},{name:'Сэнгүр лимон',category:'ПИВО',price:10000,sort_order:11},
      {name:'Absolut 1L',category:'АРХИ',price:260000,sort_order:1},{name:'Absolut 0.7',category:'АРХИ',price:180000,sort_order:2},{name:'Finlandia 1L',category:'АРХИ',price:200000,sort_order:3},{name:'Finlandia 0.7',category:'АРХИ',price:160000,sort_order:4},{name:'Eden 1L',category:'АРХИ',price:120000,sort_order:5},{name:'Eden 0.7',category:'АРХИ',price:90000,sort_order:6},{name:'Соёрхол 0.7',category:'АРХИ',price:70000,sort_order:7},{name:'Соёрхол 0.5',category:'АРХИ',price:55000,sort_order:8},{name:'Экс 0.7',category:'АРХИ',price:65000,sort_order:9},{name:'Экс 0.5',category:'АРХИ',price:50000,sort_order:10},
      {name:'Jack Daniels 1L',category:'ВИСКИ',price:250000,sort_order:1},{name:'Jack Daniels 0.7',category:'ВИСКИ',price:220000,sort_order:2},{name:'Ballentines 1L',category:'ВИСКИ',price:240000,sort_order:3},{name:'Ballentines 0.7',category:'ВИСКИ',price:210000,sort_order:4},{name:'Jagermeister 1L',category:'ВИСКИ',price:230000,sort_order:5},{name:'Jagermeister 0.7',category:'ВИСКИ',price:190000,sort_order:6},{name:'Gardens 1L',category:'ВИСКИ',price:200000,sort_order:7},{name:'Gardens 0.7',category:'ВИСКИ',price:160000,sort_order:8},
      {name:'Сожу',category:'СОЖУ / ДАРС',price:18000,sort_order:1},{name:'Calvet',category:'СОЖУ / ДАРС',price:60000,sort_order:2},{name:'Kindzmarauli',category:'СОЖУ / ДАРС',price:60000,sort_order:3},{name:'Choco дарс',category:'СОЖУ / ДАРС',price:50000,sort_order:4},
      {name:'Coca Cola',category:'УНДАА АМТТАН',price:6500,sort_order:1},{name:'Fanta',category:'УНДАА АМТТАН',price:6500,sort_order:2},{name:'Sprite',category:'УНДАА АМТТАН',price:6500,sort_order:3},{name:'Tonic water',category:'УНДАА АМТТАН',price:6000,sort_order:4},{name:'Soda water',category:'УНДАА АМТТАН',price:6000,sort_order:5},{name:'Multi vitamin',category:'УНДАА АМТТАН',price:4500,sort_order:6},{name:'Fuze tea',category:'УНДАА АМТТАН',price:4500,sort_order:7},{name:'Lipton ice tea',category:'УНДАА АМТТАН',price:4500,sort_order:8},{name:'Мэй сэмий',category:'УНДАА АМТТАН',price:9000,sort_order:9},{name:'Цэвэр ус',category:'УНДАА АМТТАН',price:2500,sort_order:10},{name:'Кофе',category:'УНДАА АМТТАН',price:0,sort_order:11},{name:'Lipton цай',category:'УНДАА АМТТАН',price:0,sort_order:12},{name:'Шоколад',category:'УНДАА АМТТАН',price:8000,sort_order:13},{name:'Самар',category:'УНДАА АМТТАН',price:8000,sort_order:14},{name:'Чипс',category:'УНДАА АМТТАН',price:20000,sort_order:15},{name:'Бохи',category:'УНДАА АМТТАН',price:3000,sort_order:16},
    ])
    console.log('✅ Items seeded')
  }
  console.log('✅ DB ready:', DB_PATH)
}

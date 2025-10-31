import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

import type { Vault } from '@/lib/vaultTypes'

const DATA_FILE = path.join(process.cwd(), 'data', 'custom-vaults.json')

const isVaultToken = (value: unknown): value is { symbol: string; percentage: number } => {
  if (!value || typeof value !== 'object') return false
  const token = value as { symbol?: unknown; percentage?: unknown }
  return typeof token.symbol === 'string' && typeof token.percentage === 'number'
}

const isVault = (value: unknown): value is Vault => {
  if (!value || typeof value !== 'object') return false
  const vault = value as Partial<Vault>

  return (
    typeof vault.id === 'string' &&
    typeof vault.name === 'string' &&
    typeof vault.tvl === 'number' &&
    Array.isArray(vault.tokens) &&
    vault.tokens.every(isVaultToken) &&
    typeof vault.userDeposit === 'number' &&
    typeof vault.performance30d === 'number' &&
    (vault.status === 'open' || vault.status === 'closed' || vault.status === 'paused') &&
    (vault.risk === 'low' || vault.risk === 'medium' || vault.risk === 'high')
  )
}

const normaliseVault = (vault: Vault): Vault => ({
  ...vault,
  id: vault.id.trim(),
  name: vault.name.trim(),
  tvl: Number.isFinite(vault.tvl) ? vault.tvl : 0,
  userDeposit: Number.isFinite(vault.userDeposit) ? vault.userDeposit : 0,
  performance30d: Number.isFinite(vault.performance30d) ? vault.performance30d : 0,
  tokens: vault.tokens
    .filter(token => token.symbol.trim())
    .map(token => ({
      symbol: token.symbol.trim().toUpperCase(),
      percentage: Number.isFinite(token.percentage) ? token.percentage : 0
    }))
})

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, '[]\n', 'utf-8')
  }
}

async function readVaults(): Promise<Vault[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, 'utf-8')
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isVault).map(normaliseVault)
  } catch {
    return []
  }
}

async function writeVaults(vaults: Vault[]): Promise<void> {
  await ensureDataFile()
  const payload = JSON.stringify(vaults.map(normaliseVault), null, 2)
  await fs.writeFile(DATA_FILE, `${payload}\n`, 'utf-8')
}

function parseVault(input: unknown): Vault {
  if (!isVault(input)) {
    throw new Error('Invalid vault payload')
  }
  const normalised = normaliseVault(input)
  if (!normalised.id) {
    throw new Error('Vault id is required')
  }
  return normalised
}

async function handleGet(res: NextApiResponse) {
  const vaults = await readVaults()
  res.status(200).json(vaults)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const incoming = parseVault(req.body)
    const current = await readVaults()

    if (current.some(vault => vault.id === incoming.id)) {
      res.status(409).json({ error: 'A vault with this id already exists.' })
      return
    }

    const updated = [...current, incoming]
    await writeVaults(updated)
    res.status(201).json(updated)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid payload' })
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const incoming = parseVault(req.body)
    const current = await readVaults()
    const index = current.findIndex(vault => vault.id === incoming.id)

    if (index >= 0) {
      current[index] = incoming
    } else {
      current.push(incoming)
    }

    await writeVaults(current)
    res.status(200).json(current)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid payload' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const current = await readVaults()

  if (typeof id === 'string') {
    const updated = current.filter(vault => vault.id !== id)
    await writeVaults(updated)
    res.status(200).json(updated)
    return
  }

  if (Array.isArray(id)) {
    const set = new Set(id)
    const updated = current.filter(vault => !set.has(vault.id))
    await writeVaults(updated)
    res.status(200).json(updated)
    return
  }

  await writeVaults([])
  res.status(200).json([])
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end('Method Not Allowed')
    }
  } catch (error) {
    console.error('Error in /api/custom-vaults:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

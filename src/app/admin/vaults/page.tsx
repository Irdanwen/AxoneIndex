'use client'

import { useState, useEffect } from 'react'
import { VaultForm } from '@/components/vaults/VaultForm'
import { Button } from '@/components/ui'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'

export default function AdminVaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('vaults')
    setVaults(saved ? JSON.parse(saved) : MOCK_VAULTS)
  }, [])

  const handleSave = (vault: Vault) => {
    const updated = vault.id 
      ? vaults.map(v => v.id === vault.id ? vault : v)
      : [...vaults, { ...vault, id: Date.now().toString() }]
    
    localStorage.setItem('vaults', JSON.stringify(updated))
    setVaults(updated)
    setShowNewForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = vaults.filter(v => v.id !== id)
    localStorage.setItem('vaults', JSON.stringify(updated))
    setVaults(updated)
  }

  const handleAddNewVault = () => {
    handleSave(newVault)
  }

  const newVault: Vault = {
    id: '',
    name: '',
    tvl: 0,
    tokens: [],
    userDeposit: 0,
    performance30d: 0,
    status: 'open',
    risk: 'low'
  }

  return (
    <div className="container-custom py-8 relative z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-axone-stellar-green dark:text-white">
          Gestion des Vaults
        </h1>
        <Button onClick={handleAddNewVault}>
          + Nouveau Vault
        </Button>
      </div>
      
      {showNewForm && (
        <div className="mb-8">
          <VaultForm 
            initialData={newVault}
            onSave={handleSave}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}
      
      <div>
        {vaults.map(vault => (
          <div key={vault.id} className="mb-[10rem] last:mb-0">
            <VaultForm 
              initialData={vault} 
              onSave={handleSave}
              autoSave
              onDelete={() => handleDelete(vault.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

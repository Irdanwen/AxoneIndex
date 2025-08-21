interface TokenIconProps {
  symbol: string
  size?: number
}

export function TokenIcon({ symbol, size = 24 }: TokenIconProps) {
  const colors: Record<string, string> = {
    BTC: '#F7931A',
    AXN: '#011f26',
    USDC: '#2775CA',
    DAI: '#F7B131',
    ETH: '#627EEA',
    SOL: '#00FFA3',
    UETH: '#627EEA',
    USOL: '#00FFA3',
    HYPE: '#FF6B6B',
    UNI: '#FF007A',
    AAVE: '#B6509E',
    COMP: '#00D395',
    USDT: '#26A17B'
  }

  return (
    <div 
      className="rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/20"
      style={{ 
        width: size, 
        height: size,
        backgroundColor: colors[symbol] || '#CCCCCC'
      }}
      title={symbol}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

import { useState } from 'react'

const LOGO_URL =
  'https://minio.ayalaoficial.com.br/logos-ismenia-ayala-treinamentos/ISMENIA%20LOGO%20FINAL%20fundo%20branco.png'

interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 64, className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`rounded-full bg-orange flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Ayala Treinamentos"
      >
        <span
          className="text-white font-display font-bold select-none"
          style={{ fontSize: Math.round(size * 0.4) }}
        >
          A
        </span>
      </div>
    )
  }

  return (
    <img
      src={LOGO_URL}
      alt="Ayala Treinamentos"
      style={{ maxWidth: size, width: '100%', height: 'auto' }}
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

const LOGO_URL =
  'https://minio.ayalaoficial.com.br/logos-ismenia-ayala-treinamentos/ISMENIA%20LOGO%20FINAL%20fundo%20branco.png'

interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 64, className = '' }: Props) {
  return (
    <img
      src={LOGO_URL}
      alt="Ayala Treinamentos"
      style={{ maxWidth: size, width: '100%', height: 'auto' }}
      className={`object-contain ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
        e.currentTarget.parentElement?.insertAdjacentHTML(
          'beforeend',
          '<span style="color:#f97316;font-weight:bold;font-size:14px">Ayala</span>',
        )
      }}
    />
  )
}

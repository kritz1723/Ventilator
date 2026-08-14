export default function Disclaimer({ t }) {
  return (
    <div className="disclaimer-banner" role="alert">{t ? t('app.disclaimer') : 'SIMULATION ONLY — NOT A MEDICAL DEVICE — NOT FOR CLINICAL USE'}</div>
  )
}

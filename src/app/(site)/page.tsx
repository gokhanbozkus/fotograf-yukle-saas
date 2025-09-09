import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container">
      <div className="header">
        <img className="logo" src="/logo.png" alt="logo" />
        <div className="title">Fotoğraf Yükle</div>
      </div>
      <div className="card" style={{marginTop: 12}}>
        <p>Her müşteri için özel bir yükleme sayfası oluşturun. Örnek:</p>
        <ul>
          <li><Link href="/t/ornek">/t/ornek</Link></li>
        </ul>
        <p className="muted">Admin paneli ile yeni müşteri ekleyip tema/logo/kapak görsellerini ayarlayın.</p>
        <Link className="btn" href="/admin">Admin Paneli</Link>
      </div>
    </div>
  )
}

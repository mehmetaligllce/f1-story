import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <style>{`
        .not-found-container {
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1rem;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .not-found-card {
          background: linear-gradient(145deg, #181822 0%, #101015 100%);
          border: 1px solid #2a2a38;
          border-top: 3px solid #e10600;
          border-radius: 20px;
          padding: 3rem 2.2rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(225, 6, 0, 0.12);
        }

        .not-found-badge {
          font-size: 5rem;
          font-weight: 900;
          line-height: 1;
          color: #e10600;
          letter-spacing: 2px;
          margin-bottom: 0.8rem;
          text-shadow: 0 0 25px rgba(225, 6, 0, 0.45);
        }

        .not-found-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          margin: 0 0 0.8rem 0;
        }

        .not-found-desc {
          font-size: 0.95rem;
          color: #8f8fa3;
          line-height: 1.5;
          margin: 0 0 2rem 0;
        }

        .not-found-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #e10600;
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 12px 26px;
          border-radius: 10px;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
          box-shadow: 0 6px 18px rgba(225, 6, 0, 0.35);
        }

        .not-found-btn:hover {
          background: #ff1810;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(225, 6, 0, 0.5);
        }
      `}</style>

      <div className="not-found-card">
        <div className="not-found-badge">404</div>
        <h1 className="not-found-title">Pist Dışına Çıktınız</h1>
        <p className="not-found-desc">
          Aradığınız sayfa bulunamadı. Yarış çizgisine geri dönmek için ana sayfaya geçebilirsiniz.
        </p>
        <Link href="/" className="not-found-btn">
          🏁 Yarışa Dön
        </Link>
      </div>
    </div>
  );
}
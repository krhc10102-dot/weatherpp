import { useState, useEffect } from 'react'

export default function Home() {
  const [query, setQuery] = useState('')
  const [loc, setLoc] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (p) => {
        const lat = p.coords.latitude
        const lon = p.coords.longitude
        setLoc({ name: 'Current location', lat, lon })
        fetchWeather(lat, lon)
      }, () => {} )
    }
  }, [])

  async function geocode(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    return data
  }

  async function fetchWeather(lat, lon) {
    setLoading(true)
    setError('')
    setWeather(null)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      const res = await fetch(url)
      const data = await res.json()
      if (data && data.current_weather) {
        setWeather(data.current_weather)
      } else {
        setError('날씨 정보를 가져오지 못했습니다.')
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!query) return
    setLoading(true)
    setError('')
    try {
      const results = await geocode(query)
      if (results && results.length > 0) {
        const first = results[0]
        const name = first.display_name
        const lat = parseFloat(first.lat)
        const lon = parseFloat(first.lon)
        setLoc({ name, lat, lon })
        await fetchWeather(lat, lon)
      } else {
        setError('검색 결과가 없습니다.')
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleSearch(e) {
    e.preventDefault()
    const q = e.target.elements.googleq.value
    if (!q) return
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`
    window.open(url, '_blank')
  }

  return (
    <div className="container">
      <main>
        <h1 className="title">weatherpp</h1>

        <section className="card">
          <form onSubmit={handleSearch} className="row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="도시나 주소를 입력하세요 (예: Seoul, Korea)"
              aria-label="search"
            />
            <button type="submit">검색</button>
          </form>

          <div className="row small">
            <button onClick={() => {
              if (navigator.geolocation) {
                setLoading(true)
                navigator.geolocation.getCurrentPosition(async (p) => {
                  const lat = p.coords.latitude
                  const lon = p.coords.longitude
                  setLoc({ name: 'Current location', lat, lon })
                  await fetchWeather(lat, lon)
                  setLoading(false)
                }, (err) => {
                  setLoading(false)
                  setError('위치 정보를 가져올 수 없습니다.')
                })
              } else {
                setError('이 브라우저에서 위치 기능을 지원하지 않습니다.')
              }
            }}>내 위치로 확인</button>

            <button onClick={() => { setQuery(''); setWeather(null); setLoc(null); setError('') }}>초기화</button>
          </div>

          <div className="result">
            {loading && <p>불러오는 중…</p>}
            {error && <p className="error">{error}</p>}
            {loc && weather && (
              <div>
                <h3>{loc.name}</h3>
                <p>온도: {weather.temperature} °C</p>
                <p>풍속: {weather.windspeed} m/s</p>
                <p>풍향: {weather.winddirection}°</p>
                <p>조건 코드: {weather.weathercode}</p>
                <p>관측 시각: {weather.time}</p>
              </div>
            )}
            {loc && !weather && !loading && <p>{loc.name} — 현재 날씨 정보 없음</p>}
          </div>
        </section>

        <section className="card">
          <h2>Google 검색</h2>
          <form onSubmit={handleGoogleSearch} className="row">
            <input name="googleq" placeholder="Google에서 검색할 내용 입력" />
            <button type="submit">Google로 검색</button>
          </form>
        </section>

        <footer>
          <p>Made with ❤️ — weatherpp</p>
          <p>데이터 출처: OpenStreetMap (geocoding), Open-Meteo (weather)</p>
        </footer>
      </main>

      <style jsx>{`
        .container { min-height: 100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#e8f0ff,#ffffff); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        main { width:100%; max-width:760px; padding:24px; }
        .title { font-size:36px; margin:0 0 12px; }
        .card { background: white; padding:16px; border-radius:12px; box-shadow: 0 6px 18px rgba(20,30,60,0.08); margin-bottom:16px; }
        .row { display:flex; gap:8px; }
        .row.small { margin-top:8px; }
        input { flex:1; padding:10px 12px; border-radius:8px; border:1px solid #e0e6f0; }
        button { padding:10px 12px; border-radius:8px; border: none; cursor:pointer; background:#2563eb; color:white; }
        .result { margin-top:12px; }
        .error { color: #b91c1c }
        footer { text-align:center; font-size:13px; color:#444; margin-top:10px }
      `}</style>
    </div>
  )
}
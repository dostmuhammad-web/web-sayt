import { useEffect, useMemo, useState, createContext, useContext } from 'react'
import './App.css'
import { books as allBooks, categories, getAuthors } from './data.js'

const Ctx = createContext(null)
const useApp = ()=> useContext(Ctx)

function usePath(){
  const [path, setPath] = useState(window.location.pathname + window.location.search)
  useEffect(()=>{
    const onPop = ()=> setPath(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return ()=> window.removeEventListener('popstate', onPop)
  },[])
  const navigate = (to)=>{
    if(to!==window.location.pathname+window.location.search){
      window.history.pushState(null,'',to)
      setPath(to)
    }
  }
  return [path, navigate]
}

function formatPrice(p){
  return new Intl.NumberFormat('uz-UZ').format(p) + " so'm"
}
function stars(r){
  const f = Math.round(r)
  return '★'.repeat(f) + '☆'.repeat(5-f)
}

export default function App(){
  const [path, navigate] = usePath()
  const [query, setQuery] = useState(()=> localStorage.getItem('bm_query')||'')
  const [cart, setCart] = useState(()=> JSON.parse(localStorage.getItem('bm_cart')||'[]'))
  const [favs, setFavs] = useState(()=> JSON.parse(localStorage.getItem('bm_favs')||'[]'))
  const [orders, setOrders] = useState(()=> JSON.parse(localStorage.getItem('bm_orders')||'[]'))
  const [toast, setToast] = useState('')
  const [activeCat, setActiveCat] = useState('All')

  useEffect(()=> localStorage.setItem('bm_cart', JSON.stringify(cart)),[cart])
  useEffect(()=> localStorage.setItem('bm_favs', JSON.stringify(favs)),[favs])
  useEffect(()=> localStorage.setItem('bm_orders', JSON.stringify(orders)),[orders])
  useEffect(()=> localStorage.setItem('bm_query', query),[query])
  useEffect(()=>{
    if(toast){ const t=setTimeout(()=>setToast(''),2200); return ()=>clearTimeout(t)}
  },[toast])

  const addToCart = (book, qty=1)=>{
    setCart(prev=>{
      const ex = prev.find(x=>x.id===book.id)
      if(ex) return prev.map(x=> x.id===book.id ? {...x, qty: Math.min(x.qty+qty, book.stock||99)}:x)
      return [...prev, {id:book.id, qty}]
    })
    setToast(`Savatchaga qo'shildi: ${book.title}`)
  }
  const toggleFav = (id)=>{
    setFavs(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const cartCount = cart.reduce((a,b)=>a+b.qty,0)
  const favCount = favs.length

  const ctxVal = { navigate, query, setQuery, cart, setCart, favs, toggleFav, addToCart, orders, setOrders, setToast, activeCat, setActiveCat, cartCount, favCount, path }

  // routing
  let page=null
  const p = path.split('?')[0]

  if(p==='/' ) page=<Home />
  else if(p==='/books') page=<BooksPage />
  else if(p.startsWith('/books/')) {
    const id = Number(p.replace('/books/',''))
    page=<BookDetail id={id}/>
  }
  else if(p==='/authors') page=<AuthorsPage/>
  else if(p.startsWith('/authors/')) {
    const name = decodeURIComponent(p.replace('/authors/',''))
    page=<AuthorDetail name={name}/>
  }
  else if(p==='/cart') page=<CartPage/>
  else if(p==='/checkout') page=<CheckoutPage/>
  else if(p==='/orders') page=<OrdersPage/>
  else if(p==='/favorites') page=<FavoritesPage/>
  else if(p==='/profile') page=<ProfilePage/>
  else page=<NotFound/>

  return (
    <Ctx.Provider value={ctxVal}>
      <Navbar/>
      <CategoryBar/>
      <div className="container">
        {page}
      </div>
      <Footer/>
      {toast && <div style={{position:'fixed',bottom:18,left:'50%',transform:'translateX(-50%)',background:'#0f172a',color:'#fff',padding:'10px 16px',borderRadius:999,boxShadow:'0 8px 24px rgba(0,0,0,.2)',zIndex:99,fontWeight:700}}>{toast}</div>}
    </Ctx.Provider>
  )
}

function Navbar(){
  const { navigate, query, setQuery, cartCount, favCount, path } = useApp()
  const links = [
    {to:'/',label:'Bosh sahifa'},
    {to:'/books',label:'Kitoblar'},
    {to:'/authors',label:'Mualliflar'},
    {to:'/orders',label:'Buyurtmalar'},
  ]
  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="logo" style={{cursor:'pointer'}} onClick={()=>navigate('/')}>
          <span className="logo-mark">📚</span> Kitob Market
        </div>
        <div className="search-wrap" style={{display:'flex'}}>
          <span className="search-icon">🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kitob, muallif yoki kategoriya bo'yicha qidirish..." onKeyDown={e=>{ if(e.key==='Enter') navigate('/books')}}/>
          {query && <button className="search-clear" onClick={()=>setQuery('')}>✕</button>}
        </div>
        <div className="nav-links" style={{display:'none'}}></div>
        <div className="nav-actions">
          {links.map(l=> <button key={l.to} onClick={()=>navigate(l.to)} className={`nav-link ${path===l.to?'active':''}`} style={{border:'none',cursor:'pointer'}}>{l.label}</button>)}
          <button className={`icon-btn ${path==='/favorites'?'active':''}`} onClick={()=>navigate('/favorites')} title="Sevimlilar">♡<span className="badge" style={{display:favCount?'grid':'none'}}>{favCount}</span></button>
          <button className={`icon-btn ${path==='/cart'?'active':''}`} onClick={()=>navigate('/cart')} title="Savatcha">🛒<span className="badge" style={{display:cartCount?'grid':'none'}}>{cartCount}</span></button>
          <button className={`icon-btn ${path==='/profile'?'active':''}`} onClick={()=>navigate('/profile')} title="Profil">👤</button>
        </div>
      </div>
    </div>
  )
}

function CategoryBar(){
  const { activeCat, setActiveCat, navigate } = useApp()
  return (
    <div className="cat-bar">
      <div className="cat-inner">
        <button className={`pill ${activeCat==='All'?'active':''}`} onClick={()=>{setActiveCat('All'); navigate('/books')}}>Barchasi · 1000</button>
        {categories.map(c=>{
          const cnt = allBooks.filter(b=>b.category===c).length
          return <button key={c} className={`pill ${activeCat===c?'active':''}`} onClick={()=>{setActiveCat(c); navigate('/books')}}>{c} · {cnt}</button>
        })}
      </div>
    </div>
  )
}

function Footer(){
  return (
    <div className="footer">
      <div className="footer-inner">
        <div>© 2026 Kitob Market — 1000+ kitoblar. O'zbekistondagi eng katta online kitob do'koni.</div>
        <div style={{display:'flex',gap:12}}><span>📞 +998 90 123 45 67</span><span>✉️ info@kitobmarket.uz</span></div>
      </div>
    </div>
  )
}

/* -------- HOME -------- */
function Home(){
  const { navigate, setQuery } = useApp()
  const best = useMemo(()=> [...allBooks].sort((a,b)=> b.rating - a.rating).slice(0,10),[])
  const newest = useMemo(()=> [...allBooks].sort((a,b)=> b.year - a.year).slice(0,5),[])
  const cheap = useMemo(()=> [...allBooks].sort((a,b)=> a.price - b.price).slice(0,5),[])
  const cats = categories.slice(0,8)

  return (
    <div style={{display:'grid',gap:16}}>
      <div className="hero">
        <div className="hero-card card">
          <div style={{position:'relative',zIndex:1}}>
            <div style={{display:'inline-flex',background:'rgba(255,255,255,.18)',padding:'6px 10px',borderRadius:999,fontWeight:800,fontSize:12,border:'1px solid rgba(255,255,255,.2)'}}>🔥 1000+ kitob • 12 kategoriya • Tez yetkazib berish</div>
            <h1>Kitob — eng yaxshi sarmoya. Hozir izlang, ertaga o'qing.</h1>
            <p>Fiction'dan Programming'gacha, Bolalar adabiyotidan Biznesgacha — barcha kitoblar bir joyda. Qidiruv title, author va category bo'yicha ishlaydi.</p>
            <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
              <button className="btn btn-dark" onClick={()=>navigate('/books')}>📖 Kitoblarni ko'rish</button>
              <button className="btn" style={{background:'#fff'}} onClick={()=>document.getElementById('home-search')?.focus()}>🔍 Qidirish</button>
            </div>
            <div className="hero-stats">
              <div className="stat"><b>1000+</b><div style={{fontSize:12,opacity:.9}}>Kitoblar</div></div>
              <div className="stat"><b>70+</b><div style={{fontSize:12,opacity:.9}}>Mualliflar</div></div>
              <div className="stat"><b>4.6★</b><div style={{fontSize:12,opacity:.9}}>O'rtacha reyting</div></div>
            </div>
          </div>
        </div>
        <div className="hero-side">
          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:900,marginBottom:8}}>Qidiruv</div>
            <div className="row">
              <input id="home-search" className="input" placeholder="Masalan: JavaScript, O'tkir Hoshimov, Fantasy" onKeyDown={e=>{ if(e.key==='Enter'){ navigate('/books') } } } onChange={e=> setQuery(e.target.value)} />
            </div>
            <div className="muted" style={{fontSize:12,marginTop:6}}>title • author • category bo'yicha izlaydi</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
              {["React","Fantasy","Biznes","Self Development","History"].map(t=> <button key={t} className="chip" onClick={()=>{ setQuery(t); navigate('/books')}}>#{t}</button>)}
            </div>
          </div>
          <div className="card" style={{padding:14}}>
            <div style={{fontWeight:900}}>Yangi kelganlar</div>
            <div style={{display:'grid',gap:10,marginTop:10}}>
              {newest.map(b=> <div key={b.id} className="mini-card card" style={{cursor:'pointer'}} onClick={()=>navigate(`/books/${b.id}`)}>
                <img src={b.image} alt={b.title}/>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</div>
                  <div className="muted" style={{fontSize:12}}>{b.author} • {b.year}</div>
                  <div className="price" style={{fontSize:13}}>{formatPrice(b.price)}</div>
                </div>
              </div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{padding:16}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <h3>Kategoriyalar</h3>
          <button className="btn" onClick={()=>navigate('/books')}>Barchasini ko'rish →</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginTop:12}}>
          {cats.map(c=>{
            const sample = allBooks.find(x=>x.category===c)
            return (
              <div key={c} className="card" style={{padding:12,cursor:'pointer',background:'#f8fafc'}} onClick={()=>{const q=document.querySelector('.search-wrap input'); if(q) q.value=c; navigate('/books')}}>
                <div style={{fontWeight:900}}>{c}</div>
                <div className="muted" style={{fontSize:12}}>{allBooks.filter(b=>b.category===c).length} ta kitob</div>
                <img src={sample.image} style={{marginTop:8,width:'100%',height:90,objectFit:'cover',borderRadius:10}} alt={c}/>
              </div>
            )
          })}
        </div>
      </div>

      <Section title="⭐ Eng sara kitoblar" subtitle="Reytingi yuqori — o'quvchilar tanlovi" books={best} />
      <Section title="💰 Hamyonbop tanlov" subtitle="Arzon va sifatli" books={cheap} />
    </div>
  )
}

function Section({title, subtitle, books}){
  const { navigate } = useApp()
  return (
    <div>
      <div className="row" style={{justifyContent:'space-between',margin:'6px 0'}}>
        <div><h3 style={{fontWeight:900}}>{title}</h3><div className="muted" style={{fontSize:13}}>{subtitle}</div></div>
        <button className="btn" onClick={()=>navigate('/books')}>Ko'proq</button>
      </div>
      <div className="grid grid-books">
        {books.map(b=> <BookCard key={b.id} book={b}/>)}
      </div>
    </div>
  )
}

function BookCard({book}){
  const { navigate, toggleFav, favs, addToCart } = useApp()
  const fav = favs.includes(book.id)
  return (
    <div className="book-card" onClick={()=>navigate(`/books/${book.id}`)}>
      <div className="book-thumb">
        <img src={book.image} alt={book.title} loading="lazy"/>
        <span className="book-badge">{book.category}</span>
        <button className={`book-fav ${fav?'active':''}`} onClick={e=>{e.stopPropagation(); toggleFav(book.id)}}>{fav?'♥':'♡'}</button>
        {book.stock===0 && <span style={{position:'absolute',bottom:8,left:8,background:'#ef4444',color:'#fff',padding:'4px 8px',borderRadius:999,fontSize:11,fontWeight:800}}>Sotuvda yo'q</span>}
      </div>
      <div className="book-body">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
        <div className="book-meta"><span className="stars">{stars(book.rating)}</span><span style={{fontWeight:700}}>{book.rating}</span><span className="muted">({book.reviews})</span></div>
        <div className="row" style={{justifyContent:'space-between',marginTop:'auto'}}>
          <span className="price">{formatPrice(book.price)}</span>
          <span className={`stock ${book.stock>0?'ok':'out'}`}>{book.stock>0? `${book.stock} dona` : 'Tugagan'}</span>
        </div>
        <button className="btn btn-primary btn-block" style={{marginTop:6,padding:'8px 10px',fontSize:13}} onClick={e=>{e.stopPropagation(); if(book.stock>0) addToCart(book)}} disabled={book.stock===0}>{book.stock===0?'Mavjud emas':'Savatchaga'}</button>
      </div>
    </div>
  )
}

/* -------- BOOKS PAGE -------- */
function BooksPage(){
  const { query, setQuery, activeCat, setActiveCat } = useApp()
  const [sort, setSort] = useState('popular')
  const [price, setPrice] = useState(200000)
  const [minRating, setMinRating] = useState(0)
  const [lang, setLang] = useState('All')
  const [inStock, setInStock] = useState(false)
  const [catFilter, setCatFilter] = useState(activeCat)
  const [page, setPage] = useState(1)
  const pageSize = 24

  useEffect(()=> setCatFilter(activeCat),[activeCat])
  useEffect(()=> setPage(1),[query, catFilter, price, minRating, lang, inStock, sort])

  const filtered = useMemo(()=>{
    let out = allBooks.filter(b=>{
      const q = query.trim().toLowerCase()
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
      const matchesCat = catFilter==='All' || b.category===catFilter
      const matchesPrice = b.price <= price
      const matchesRating = b.rating >= minRating
      const matchesLang = lang==='All' || b.language===lang
      const matchesStock = !inStock || b.stock>0
      return matchesSearch && matchesCat && matchesPrice && matchesRating && matchesLang && matchesStock
    })
    switch(sort){
      case 'price-asc': out = [...out].sort((a,b)=>a.price-b.price); break
      case 'price-desc': out = [...out].sort((a,b)=>b.price-a.price); break
      case 'rating': out = [...out].sort((a,b)=>b.rating-a.rating); break
      case 'year': out = [...out].sort((a,b)=>b.year-a.year); break
      case 'title': out = [...out].sort((a,b)=>a.title.localeCompare(b.title)); break
      case 'popular': out = [...out].sort((a,b)=>b.reviews-a.reviews); break
      default: break
    }
    return out
  },[query, catFilter, price, minRating, lang, inStock, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize))
  const paged = filtered.slice((page-1)*pageSize, page*pageSize)

  return (
    <div>
      <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap',justifyContent:'space-between'}}>
        <div>
          <h2 className="page-title">Kitoblar</h2>
          <div className="muted">{filtered.length} ta kitob topildi {query && <>• "<b>{query}</b>" bo'yicha</>}</div>
        </div>
        <div className="row">
          <input className="input" style={{width:260}} placeholder="Qidirish..." value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="select" style={{width:180}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="popular">Mashhurligi</option>
            <option value="rating">Reyting</option>
            <option value="price-asc">Arzon → Qimmat</option>
            <option value="price-desc">Qimmat → Arzon</option>
            <option value="year">Yangi</option>
            <option value="title">Nom (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="layout-2" style={{marginTop:14}}>
        <div className="card filter-card">
          <div className="filter-title">Filtrlar <button className="btn" style={{padding:'6px 10px',fontSize:12}} onClick={()=>{setCatFilter('All'); setActiveCat('All'); setPrice(200000); setMinRating(0); setLang('All'); setInStock(false); setQuery(''); setSort('popular')}}>Tozalash</button></div>

          <div className="filter-group">
            <h4>Kategoriya</h4>
            <label className="check"><input type="radio" name="cat" checked={catFilter==='All'} onChange={()=>{setCatFilter('All'); setActiveCat('All')}}/> Barchasi</label>
            {categories.map(c=> <label key={c} className="check"><input type="radio" name="cat" checked={catFilter===c} onChange={()=>{setCatFilter(c); setActiveCat(c)}}/> {c}</label>)}
          </div>
          <div className="filter-group">
            <h4>Narx: {formatPrice(price)} gacha</h4>
            <input className="range" type="range" min={15000} max={200000} step={5000} value={price} onChange={e=>setPrice(Number(e.target.value))}/>
            <div className="row" style={{justifyContent:'space-between',fontSize:12}}><span>15 000</span><span>200 000</span></div>
          </div>
          <div className="filter-group">
            <h4>Reyting</h4>
            {[0,4,4.5,4.7].map(v=> <label key={v} className="check"><input type="radio" name="rat" checked={minRating===v} onChange={()=>setMinRating(v)}/> {v===0?'Barchasi': `${v}+ ★`}</label>)}
          </div>
          <div className="filter-group">
            <h4>Til</h4>
            {['All',"O'zbek",'Rus','Ingliz'].map(l=> <label key={l} className="check"><input type="radio" name="lang" checked={lang===l} onChange={()=>setLang(l)}/> {l==='All'?'Barchasi':l}</label>)}
          </div>
          <div className="filter-group">
            <label className="check"><input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)}/> Faqat mavjudlari</label>
          </div>
        </div>

        <div>
          {paged.length===0 ? <div className="card empty">Hech narsa topilmadi. Qidiruv so'zini o'zgartirib ko'ring.</div> :
            <>
              <div className="grid grid-books">
                {paged.map(b=> <BookCard key={b.id} book={b}/>)}
              </div>
              <div className="pag">
                <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>
                {Array.from({length:totalPages}).slice(0,7).map((_,i)=>{
                  const n=i+1
                  // simple pagination show first 7, if more then dots
                  if(totalPages>7 && i===6) return <span key={n} style={{padding:'8px'}}>…</span>
                  if(n>7) return null
                  return <button key={n} className={page===n?'active':''} onClick={()=>setPage(n)}>{n}</button>
                })}
                {totalPages>7 && <button className={page===totalPages?'active':''} onClick={()=>setPage(totalPages)}>{totalPages}</button>}
                <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>›</button>
              </div>
              <div className="muted" style={{textAlign:'center',marginTop:6,fontSize:12}}>{page} / {totalPages} • Jami {filtered.length} ta</div>
            </>
          }
        </div>
      </div>
    </div>
  )
}

/* -------- BOOK DETAIL -------- */
function BookDetail({id}){
  const book = allBooks.find(b=> b.id===id)
  const { navigate, addToCart, toggleFav, favs, setToast } = useApp()
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('desc')
  const [reviews, setReviews] = useState(book? book.reviewsList : [])
  const [newRate, setNewRate] = useState(5)
  const [newText, setNewText] = useState('')
  const [newUser, setNewUser] = useState('')

  useEffect(()=>{ if(book) setReviews(book.reviewsList)},[id])

  if(!book) return <div className="card empty">Kitob topilmadi <button className="btn btn-primary" onClick={()=>navigate('/books')}>Kitoblarga qaytish</button></div>

  const fav = favs.includes(book.id)
  const related = allBooks.filter(b=> b.category===book.category && b.id!==book.id).slice(0,5)

  const submitReview = ()=>{
    if(!newText.trim() || !newUser.trim()) { setToast("Ism va sharhni to'ldiring"); return}
    const r={id: Date.now().toString(), user:newUser, rating:newRate, text:newText, date:new Date().toISOString().slice(0,10)}
    setReviews(prev=>[r, ...prev])
    setNewText(''); setNewUser(''); setToast("Rahmat! Sharhingiz qo'shildi")
  }

  return (
    <div style={{display:'grid',gap:14}}>
      <button className="btn" style={{width:'fit-content'}} onClick={()=>navigate('/books')}>← Orqaga</button>
      <div className="card detail" style={{display:'grid',overflow:'hidden'}}>
        <div className="detail-img">
          <img src={book.image} alt={book.title}/>
        </div>
        <div className="detail-info">
          <div className="chip">{book.category}</div>
          <h1 style={{marginTop:8}}>{book.title}</h1>
          <div className="muted" style={{fontWeight:700,cursor:'pointer',color:'var(--primary)'}} onClick={()=>navigate(`/authors/${encodeURIComponent(book.author)}`)}>{book.author}</div>
          <div className="row" style={{marginTop:8}}>
            <span className="stars">{stars(book.rating)}</span>
            <b>{book.rating}</b>
            <span className="muted">({book.reviews} sharh)</span>
            <span className={`stock ${book.stock>0?'ok':'out'}`}>{book.stock>0?`Omborda: ${book.stock} dona`:'Mavjud emas'}</span>
          </div>
          <div className="kv">
            <span>📄 {book.pages} bet</span><span>🌐 {book.language}</span><span>📅 {book.year}</span><span>⭐ {book.rating}</span>
          </div>
          <div className="price" style={{fontSize:24,margin:'8px 0'}}>{formatPrice(book.price)} <small>/ dona</small></div>
          <div className="desc">{book.description}</div>

          <div className="row" style={{marginTop:14}}>
            <div className="qty">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
              <span>{qty}</span>
              <button onClick={()=>setQty(q=>Math.min(book.stock||99,q+1))}>+</button>
            </div>
            <button className="btn btn-primary" style={{flex:1}} disabled={book.stock===0} onClick={()=>addToCart(book, qty)}>🛒 Savatchaga qo'shish</button>
            <button className={`btn ${fav?'btn-accent':''}`} onClick={()=>toggleFav(book.id)}>{fav?'♥ Sevimlida':'♡ Sevimli'}</button>
          </div>
          <div className="notice" style={{marginTop:10}}>🚚 Toshkent bo'ylab 24 soatda yetkazamiz. Viloyatlarga 2-3 kun. 200 000 so'mdan yuqori buyurtma — yetkazish bepul!</div>
        </div>
      </div>

      <div className="card" style={{padding:14}}>
        <div className="row" style={{borderBottom:'1px solid var(--border)',paddingBottom:10}}>
          <button className={`pill ${tab==='desc'?'active':''}`} onClick={()=>setTab('desc')}>Tavsif</button>
          <button className={`pill ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Xususiyatlar</button>
          <button className={`pill ${tab==='reviews'?'active':''}`} onClick={()=>setTab('reviews')}>Sharhlar ({reviews.length})</button>
        </div>
        {tab==='desc' && <p className="desc" style={{marginTop:12}}>{book.description} <br/><br/>Ushbu kitob {book.category} yo'nalishida yozilgan bo'lib, {book.author} ning eng sara asarlaridan biridir. {book.pages} betlik ushbu kitob {book.language} tilida, {book.year}-yilda nashr etilgan.</p>}
        {tab==='info' && <table className="table" style={{marginTop:12}}><tbody>
          <tr><th>Muallif</th><td>{book.author}</td></tr>
          <tr><th>Kategoriya</th><td>{book.category}</td></tr>
          <tr><th>Sahifalar</th><td>{book.pages}</td></tr>
          <tr><th>Til</th><td>{book.language}</td></tr>
          <tr><th>Yil</th><td>{book.year}</td></tr>
          <tr><th>Narx</th><td>{formatPrice(book.price)}</td></tr>
          <tr><th>Omborda</th><td>{book.stock} dona</td></tr>
        </tbody></table>}
        {tab==='reviews' && (
          <div style={{marginTop:12,display:'grid',gap:12}}>
            <div className="card" style={{padding:12,background:'#f8fafc'}}>
              <div style={{fontWeight:900,marginBottom:8}}>Sharh qoldirish</div>
              <div className="form">
                <div className="row">
                  <input className="input" placeholder="Ismingiz" value={newUser} onChange={e=>setNewUser(e.target.value)} style={{flex:1}}/>
                  <select className="select" value={newRate} onChange={e=>setNewRate(Number(e.target.value))} style={{width:140}}>
                    <option value={5}>5 ★ A'lo</option><option value={4}>4 ★ Yaxshi</option><option value={3}>3 ★ O'rtacha</option><option value={2}>2 ★ Yomon</option><option value={1}>1 ★ Juda yomon</option>
                  </select>
                </div>
                <textarea className="textarea" rows={3} placeholder="Fikringizni yozing..." value={newText} onChange={e=>setNewText(e.target.value)} />
                <button className="btn btn-primary" onClick={submitReview}>Yuborish</button>
              </div>
            </div>
            {reviews.map(r=> (
              <div key={r.id} className="review">
                <div className="row" style={{justifyContent:'space-between'}}>
                  <b>{r.user}</b><span className="stars">{stars(r.rating)}</span>
                </div>
                <div className="muted" style={{fontSize:12}}>{r.date}</div>
                <div style={{marginTop:6}}>{r.text}</div>
              </div>
            ))}
            {reviews.length===0 && <div className="empty">Hali sharhlar yo'q. Birinchi bo'lib siz yozing!</div>}
          </div>
        )}
      </div>

      <div>
        <h3 style={{fontWeight:900,marginBottom:8}}>O'xshash kitoblar</h3>
        <div className="grid grid-books">
          {related.map(b=> <BookCard key={b.id} book={b}/>)}
        </div>
      </div>
    </div>
  )
}

/* -------- AUTHORS -------- */
function AuthorsPage(){
  const authors = useMemo(()=> getAuthors(),[])
  const [q, setQ] = useState('')
  const { navigate } = useApp()
  const filtered = authors.filter(a=> a.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <h2 className="page-title">Mualliflar</h2>
      <div className="muted">{authors.length} ta muallif • 1000 ta kitob</div>
      <input className="input" style={{marginTop:12,maxWidth:420}} placeholder="Muallif qidirish..." value={q} onChange={e=>setQ(e.target.value)} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,marginTop:14}}>
        {filtered.map(a=> (
          <div key={a.name} className="card author-card" onClick={()=>navigate(`/authors/${encodeURIComponent(a.name)}`)}>
            <img src={a.image} alt={a.name}/>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.name}</div>
              <div className="muted" style={{fontSize:12}}>{a.count} kitob • {a.avgRating} ★</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}}>{a.categories.slice(0,3).map(c=> <span key={c} className="chip" style={{fontSize:11,padding:'3px 7px'}}>{c}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function AuthorDetail({name}){
  const authors = useMemo(()=> getAuthors(),[])
  const author = authors.find(a=> a.name===name)
  const { navigate } = useApp()
  if(!author) return <div className="card empty">Muallif topilmadi</div>
  return (
    <div style={{display:'grid',gap:14}}>
      <button className="btn" style={{width:'fit-content'}} onClick={()=>navigate('/authors')}>← Mualliflar</button>
      <div className="card" style={{padding:16,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
        <img src={author.image} style={{width:96,height:96,borderRadius:'50%',objectFit:'cover'}} alt={author.name}/>
        <div>
          <h2 style={{fontWeight:900}}>{author.name}</h2>
          <div className="muted">{author.bio}</div>
          <div className="row" style={{marginTop:8}}><span className="chip">{author.count} kitob</span><span className="chip">{author.avgRating} ★ o'rtacha</span><span className="chip">{author.categories.join(', ')}</span></div>
        </div>
      </div>
      <h3 style={{fontWeight:900}}>{author.name} kitoblari</h3>
      <div className="grid grid-books">
        {author.books.map(b=> <BookCard key={b.id} book={b}/>)}
      </div>
    </div>
  )
}

/* -------- CART -------- */
function CartPage(){
  const { cart, setCart, navigate, setToast } = useApp()
  const items = cart.map(c=> ({...c, book: allBooks.find(b=>b.id===c.id)}).filter(x=>x.book))
  const total = items.reduce((a,c)=> a + c.book.price * c.qty, 0)
  const updateQty = (id, d)=>{
    setCart(prev=> prev.map(x=> x.id===id ? {...x, qty: Math.max(1, Math.min(99, x.qty+d))}:x))
  }
  const remove = (id)=> setCart(prev=> prev.filter(x=>x.id!==id))
  if(items.length===0) return (
    <div className="card empty">
      <div style={{fontSize:48}}>🛒</div>
      <h3>Savatcha bo'sh</h3>
      <p className="muted">Kitob qo'shing va buyurtma bering.</p>
      <button className="btn btn-primary" style={{marginTop:10}} onClick={()=>navigate('/books')}>Kitoblarni ko'rish</button>
    </div>
  )
  return (
    <div className="layout-2">
      <div style={{display:'grid',gap:10}}>
        <h2 className="page-title">Savatcha ({items.length})</h2>
        {items.map(({book, qty})=> (
          <div key={book.id} className="cart-item">
            <img src={book.image} style={{width:80,height:100,objectFit:'cover',borderRadius:10,cursor:'pointer'}} onClick={()=>navigate(`/books/${book.id}`)} alt={book.title}/>
            <div>
              <div style={{fontWeight:800,fontSize:14,cursor:'pointer'}} onClick={()=>navigate(`/books/${book.id}`)}>{book.title}</div>
              <div className="muted" style={{fontSize:12}}>{book.author} • {book.category}</div>
              <div className="price" style={{marginTop:4}}>{formatPrice(book.price)}</div>
              <div className="row" style={{marginTop:6}}>
                <div className="qty"><button onClick={()=>updateQty(book.id,-1)}>−</button><span>{qty}</span><button onClick={()=>updateQty(book.id,1)}>+</button></div>
                <button className="btn" style={{padding:'6px 10px',fontSize:12}} onClick={()=>remove(book.id)}>O'chirish</button>
              </div>
            </div>
            <div style={{fontWeight:900}}>{formatPrice(book.price*qty)}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:16,position:'sticky',top:78}}>
        <h3 style={{fontWeight:900}}>Buyurtma xulosasi</h3>
        <div style={{display:'grid',gap:8,marginTop:10,fontSize:14}}>
          <div className="row" style={{justifyContent:'space-between'}}><span className="muted">Mahsulotlar ({items.reduce((a,b)=>a+b.qty,0)} dona)</span><span>{formatPrice(total)}</span></div>
          <div className="row" style={{justifyContent:'space-between'}}><span className="muted">Yetkazib berish</span><span style={{color:'var(--success)',fontWeight:800}}>{total>200000?'Bepul':'15 000 so\'m'}</span></div>
          <div style={{height:1,background:'var(--border)'}}></div>
          <div className="row" style={{justifyContent:'space-between',fontWeight:900,fontSize:16}}><span>Jami</span><span>{formatPrice(total + (total>200000?0:15000))}</span></div>
        </div>
        <button className="btn btn-primary btn-block" style={{marginTop:14}} onClick={()=>navigate('/checkout')}>Rasmiylashtirish →</button>
        <button className="btn btn-ghost btn-block" onClick={()=>{setCart([]); setToast("Savatcha tozalandi")}}>Savatchani tozalash</button>
      </div>
    </div>
  )
}

/* -------- CHECKOUT -------- */
function CheckoutPage(){
  const { cart, setCart, orders, setOrders, navigate, setToast } = useApp()
  const items = cart.map(c=> ({...c, book: allBooks.find(b=>b.id===c.id)}).filter(x=>x.book))
  const total = items.reduce((a,c)=> a + c.book.price*c.qty,0)
  const shipping = total>200000?0:15000
  const [form, setForm] = useState({name:'',phone:'',address:'',payment:'naqd'})
  const [done, setDone] = useState(null)

  if(items.length===0 && !done) return <div className="card empty">Savatcha bo'sh. <button className="btn btn-primary" onClick={()=>navigate('/books')}>Kitob tanlash</button></div>

  const submit = (e)=>{
    e.preventDefault()
    if(!form.name || !form.phone || !form.address){ setToast("Barcha maydonlarni to'ldiring"); return}
    const order = {
      id: 'ORD-'+Date.now().toString().slice(-8),
      date: new Date().toISOString().slice(0,10),
      items: items.map(i=>({id:i.book.id, title:i.book.title, author:i.book.author, price:i.book.price, qty:i.qty, image:i.book.image})),
      total: total+shipping,
      shipping,
      customer: {...form},
      status: 'Qabul qilindi'
    }
    setOrders([order, ...orders])
    setCart([])
    setDone(order)
    setToast("Buyurtma qabul qilindi!")
  }

  if(done) return (
    <div className="card" style={{padding:24,textAlign:'center'}}>
      <div style={{fontSize:52}}>✅</div>
      <h2 style={{fontWeight:900}}>Rahmat, {done.customer.name}!</h2>
      <p className="muted">Buyurtma <b>{done.id}</b> qabul qilindi. Tez orada siz bilan bog'lanamiz.</p>
      <div className="card" style={{padding:12,marginTop:12,background:'#f8fafc',textAlign:'left',maxWidth:560,margin:'12px auto 0'}}>
        <div style={{fontWeight:900}}>Buyurtma tafsilotlari</div>
        <div className="muted" style={{fontSize:13}}>{done.date} • {done.status}</div>
        {done.items.map(it=> <div key={it.id} className="row" style={{justifyContent:'space-between',marginTop:6,fontSize:13}}><span>{it.title} ×{it.qty}</span><span>{formatPrice(it.price*it.qty)}</span></div>)}
        <div style={{height:1,background:'var(--border)',margin:'8px 0'}}></div>
        <div className="row" style={{justifyContent:'space-between',fontWeight:900}}><span>Jami</span><span>{formatPrice(done.total)}</span></div>
      </div>
      <div className="row" style={{justifyContent:'center',marginTop:14}}>
        <button className="btn btn-primary" onClick={()=>navigate('/orders')}>Buyurtmalarim</button>
        <button className="btn" onClick={()=>navigate('/books')}>Yana xarid qilish</button>
      </div>
    </div>
  )

  return (
    <div className="layout-2">
      <div className="card" style={{padding:16}}>
        <h2 className="page-title" style={{fontSize:22}}>Rasmiylashtirish</h2>
        <form className="form" onSubmit={submit} style={{marginTop:12}}>
          <label>Ism familiya<input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ali Valiyev"/></label>
          <label>Telefon<input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+998 90 123 45 67"/></label>
          <label>Manzil<textarea className="textarea" rows={3} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Shahar, tuman, ko'cha, uy"/></label>
          <label>To'lov usuli
            <select className="select" value={form.payment} onChange={e=>setForm({...form,payment:e.target.value})}>
              <option value="naqd">Naqd / Kuryerga to'lov</option>
              <option value="card">Plastik karta</option>
              <option value="payme">Payme / Click</option>
            </select>
          </label>
          <button className="btn btn-primary btn-block" type="submit">Buyurtmani tasdiqlash — {formatPrice(total+shipping)}</button>
        </form>
      </div>
      <div className="card" style={{padding:16}}>
        <h3 style={{fontWeight:900}}>Savatcha ({items.length})</h3>
        <div style={{display:'grid',gap:8,marginTop:10}}>
          {items.map(({book,qty})=> <div key={book.id} className="row" style={{justifyContent:'space-between'}}><span style={{fontSize:13}}>{book.title} ×{qty}</span><span style={{fontWeight:800}}>{formatPrice(book.price*qty)}</span></div>)}
          <div style={{height:1,background:'var(--border)'}}></div>
          <div className="row" style={{justifyContent:'space-between'}}><span className="muted">Yetkazish</span><span>{shipping===0?'Bepul':formatPrice(shipping)}</span></div>
          <div className="row" style={{justifyContent:'space-between',fontWeight:900,fontSize:18}}><span>Jami</span><span>{formatPrice(total+shipping)}</span></div>
        </div>
      </div>
    </div>
  )
}

/* -------- ORDERS -------- */
function OrdersPage(){
  const { orders, navigate } = useApp()
  if(orders.length===0) return <div className="card empty"><div style={{fontSize:42}}>📦</div><h3>Buyurtmalar yo'q</h3><p className="muted">Hali hech narsa buyurtma qilmagansiz.</p><button className="btn btn-primary" style={{marginTop:10}} onClick={()=>navigate('/books')}>Xaridni boshlash</button></div>
  return (
    <div style={{display:'grid',gap:12}}>
      <h2 className="page-title">Buyurtmalar tarixi ({orders.length})</h2>
      {orders.map(o=> (
        <div key={o.id} className="card order">
          <div className="order-head">
            <div><b>{o.id}</b> <span className="chip">{o.status}</span><div className="muted" style={{fontSize:12}}>{o.date} • {o.customer.name} • {o.customer.phone}</div></div>
            <div style={{fontWeight:900}}>{formatPrice(o.total)}</div>
          </div>
          <div style={{display:'grid',gap:8,marginTop:10}}>
            {o.items.map(it=> (
              <div key={it.id} style={{display:'flex',gap:10,alignItems:'center',border:'1px solid var(--border)',padding:8,borderRadius:12}}>
                <img src={it.image} style={{width:48,height:64,objectFit:'cover',borderRadius:8}} alt={it.title}/>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{it.title}</div><div className="muted" style={{fontSize:12}}>{it.author} • {formatPrice(it.price)} × {it.qty}</div></div>
                <div style={{fontWeight:800}}>{formatPrice(it.price*it.qty)}</div>
              </div>
            ))}
          </div>
          <div className="muted" style={{fontSize:12,marginTop:8}}>Manzil: {o.customer.address} • To'lov: {o.customer.payment}</div>
        </div>
      ))}
    </div>
  )
}

/* -------- FAVORITES -------- */
function FavoritesPage(){
  const { favs, navigate } = useApp()
  const list = allBooks.filter(b=> favs.includes(b.id))
  if(list.length===0) return <div className="card empty"><div style={{fontSize:42}}>♡</div><h3>Sevimlilar bo'sh</h3><p className="muted">Yurakchani bosing — kitob sevimlilarga qo'shiladi.</p><button className="btn btn-primary" style={{marginTop:10}} onClick={()=>navigate('/books')}>Kitoblarni ko'rish</button></div>
  return (
    <div>
      <h2 className="page-title">Sevimlilar ({list.length})</h2>
      <div className="grid grid-books" style={{marginTop:12}}>
        {list.map(b=> <BookCard key={b.id} book={b}/>)}
      </div>
    </div>
  )
}

/* -------- PROFILE -------- */
function ProfilePage(){
  const { orders, favs, cartCount } = useApp()
  const [name,setName]=useState(localStorage.getItem('bm_name')||'Aziz Karimov')
  const [email,setEmail]=useState(localStorage.getItem('bm_email')||'aziz@kitobmarket.uz')
  const [editing,setEditing]=useState(false)
  const save=()=>{
    localStorage.setItem('bm_name',name); localStorage.setItem('bm_email',email); setEditing(false)
  }
  return (
    <div className="layout-2">
      <div className="card" style={{padding:16}}>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <img src={`https://i.pravatar.cc/200?u=${encodeURIComponent(name)}`} style={{width:72,height:72,borderRadius:'50%'}} alt="avatar"/>
          <div>
            <div style={{fontWeight:900,fontSize:18}}>{name}</div>
            <div className="muted">{email}</div>
            <div className="row" style={{marginTop:6}}><span className="chip">📦 {orders.length} buyurtma</span><span className="chip">♡ {favs.length} sevimli</span><span className="chip">🛒 {cartCount} savatcha</span></div>
          </div>
        </div>
        <div style={{marginTop:14,display:'grid',gap:10}}>
          <label>Ism<input className="input" disabled={!editing} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>Email<input className="input" disabled={!editing} value={email} onChange={e=>setEmail(e.target.value)}/></label>
          {!editing ? <button className="btn btn-primary" onClick={()=>setEditing(true)}>Tahrirlash</button> : <div className="row"><button className="btn btn-primary" onClick={save}>Saqlash</button><button className="btn" onClick={()=>setEditing(false)}>Bekor qilish</button></div>}
        </div>
        <div className="card" style={{padding:12,marginTop:12,background:'#f8fafc'}}>
          <div style={{fontWeight:900}}>Sozlamalar</div>
          <div className="muted" style={{fontSize:13,marginTop:6}}>Til: O'zbek • Valyuta: UZS • Xabarnomalar: yoqilgan</div>
        </div>
      </div>
      <div className="card" style={{padding:16}}>
        <h3 style={{fontWeight:900}}>Statistika</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:12}}>
          <div className="card" style={{padding:12,textAlign:'center',background:'#f5f3ff'}}><b style={{fontSize:22}}>{orders.length}</b><div className="muted" style={{fontSize:12}}>Buyurtmalar</div></div>
          <div className="card" style={{padding:12,textAlign:'center',background:'#ecfdf5'}}><b style={{fontSize:22}}>{orders.reduce((a,o)=>a+o.total,0)? formatPrice(orders.reduce((a,o)=>a+o.total,0)): '0 so\'m'}</b><div className="muted" style={{fontSize:12}}>Jami xarid</div></div>
          <div className="card" style={{padding:12,textAlign:'center',background:'#fff7ed'}}><b style={{fontSize:22}}>{favs.length}</b><div className="muted" style={{fontSize:12}}>Sevimlilar</div></div>
        </div>
        <div style={{marginTop:14}}><h4 style={{fontWeight:900}}>Oxirgi buyurtmalar</h4>
          {orders.length===0? <div className="muted" style={{fontSize:13,marginTop:6}}>Hali buyurtma yo'q</div> : orders.slice(0,3).map(o=> <div key={o.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:13}}><span>{o.id} • {o.date}</span><span style={{fontWeight:800}}>{formatPrice(o.total)}</span></div>)}
        </div>
      </div>
    </div>
  )
}

function NotFound(){
  const { navigate } = useApp()
  return <div className="card empty"><h3>Sahifa topilmadi</h3><button className="btn btn-primary" onClick={()=>navigate('/')}>Bosh sahifaga</button></div>
}

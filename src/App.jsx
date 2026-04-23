import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CATEGORIES = ["Clothing","Shoes","Bags","Accessories","Electronics","Furniture","Books","Kitchenware","Toys","Sports","Jewelry","Other"];
const SUBCATEGORIES = {
  Clothing: ["Dresses","Tops & Blouses","Sweaters","Tees & Tanks","Pants","Jeans","Jackets & Coats","Skirts","Shorts","Blazers","Pajamas","Activewear","Sweatshirts & Sweatpants","Intimates","Swimwear"],
  Shoes: ["Sneakers","Heels","Flats","Boots","Sandals","Loafers","Athletic","Slippers","Mules","Wedges"],
  Bags: ["Handbags","Tote Bags","Backpacks","Clutches","Crossbody","Shoulder Bags","Wallets","Travel Bags"],
  Accessories: ["Jewelry","Scarves","Hats","Belts","Sunglasses","Watches","Hair Accessories","Gloves"],
  Electronics: ["Phones","Laptops","Tablets","TVs","Cameras","Audio","Gaming","Wearables","Other"],
  Furniture: ["Seating","Tables","Storage","Beds","Desks","Shelving","Outdoor","Other"],
  Kitchenware: ["Cookware","Bakeware","Utensils","Appliances","Dinnerware","Glassware","Storage","Other"],
  Sports: ["Gym Equipment","Outdoor","Water Sports","Team Sports","Cycling","Yoga","Other"],
};
const CONDITIONS = ["Excellent","Good","Fair","Poor"];
const STATUS_OPTIONS = [
  { value:"keep",       label:"Keep",       color:"#4ade80", icon:"♡"  },
  { value:"sell",       label:"Sell",       color:"#fb923c", icon:"💰" },
  { value:"donate",     label:"Donate",     color:"#60a5fa", icon:"🤝" },
  { value:"exchange",   label:"Exchange",   color:"#c084fc", icon:"🔄" },
  { value:"replace",    label:"Replace",    color:"#fbbf24", icon:"🔁" },
  { value:"get_rid_of", label:"Get Rid Of", color:"#f87171", icon:"🗑" },
];
const LOCATIONS = ["Bedroom","Wardrobe","Closet","Living Room","Kitchen","Bathroom","Garage","Basement","Attic","Storage Unit","Office","Other"];
const SELL_SITES = [
  { name:"eBay",                url:"https://www.ebay.com/sell" },
  { name:"Poshmark",            url:"https://poshmark.com/sell" },
  { name:"Depop",               url:"https://www.depop.com" },
  { name:"Facebook Marketplace",url:"https://www.facebook.com/marketplace" },
  { name:"Vinted",              url:"https://www.vinted.com" },
  { name:"ThredUp",             url:"https://www.thredup.com/clean-out" },
];
const DONATE_SITES = [
  { name:"Goodwill",            url:"https://www.goodwill.org/donate-stuff/" },
  { name:"The Salvation Army",  url:"https://www.satruck.org/donate-stuff" },
  { name:"Habitat for Humanity",url:"https://www.habitat.org/restores/donate-stuff" },
  { name:"Local Food Bank",     url:"https://www.feedingamerica.org/find-your-local-foodbank" },
];
const OUTFIT_OCCASIONS = ["Casual","Work","Evening","Sport","Travel","Formal","Weekend","Party","Other"];
const SEASONS = ["All Seasons","Spring","Summer","Autumn","Winter"];

const G = {
  bg:"#0c0b0a", surface:"#161412", card:"#1c1916", border:"#2c2822",
  gold:"#c9a96e", text:"#f0ede8", muted:"#9a9490", dim:"#5a5550",
  green:"#4ade80", orange:"#fb923c", blue:"#60a5fa", purple:"#c084fc",
  yellow:"#fbbf24", red:"#f87171",
};

const emptyItem   = { id:null,category:"",subcategory:"",name:"",color:"",size:"",material:"",whenBought:"",price:"",condition:"",location:"",status:"keep",notes:"",customSellLink:"",customDonateLink:"",photo:null };
const emptyOutfit = { id:null,name:"",occasion:"",season:"All Seasons",itemIds:[],notes:"",rating:0 };

function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

async function callClaude(messages, system="") {
  const body = { model:"claude-sonnet-4-20250514", max_tokens:1000, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("")||"";
}

export default function App() {
  const [user,       setUser]       = useState(null);
  const [authView,   setAuthView]   = useState("login"); // login | signup
  const [authEmail,  setAuthEmail]  = useState("");
  const [authPass,   setAuthPass]   = useState("");
  const [authError,  setAuthError]  = useState("");
  const [authLoading,setAuthLoading]= useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [items,      setItems]      = useState([]);
  const [outfits,    setOutfits]    = useState([]);
  const [page,       setPage]       = useState("inventory");
  const [view,       setView]       = useState("grid");
  const [editItem,   setEditItem]   = useState({...emptyItem});
  const [selItem,    setSelItem]    = useState(null);
  const [editOutfit, setEditOutfit] = useState({...emptyOutfit});
  const [selOutfit,  setSelOutfit]  = useState(null);
  const [filterCat,    setFilterCat]    = useState("All");
  const [filterSub,    setFilterSub]    = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQ,    setSearchQ]    = useState("");
  const [linksModal, setLinksModal] = useState(null);
  const [shopQuery,  setShopQuery]  = useState("");
  const [shopResults,setShopResults]= useState([]);
  const [shopLoading,setShopLoading]= useState(false);
  const [shopError,  setShopError]  = useState("");
  const [wishlist,   setWishlist]   = useState([]);
  const [saved,      setSaved]      = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [dbLoading,  setDbLoading]  = useState(false);
  const photoRef = useRef();

  // Check if user is already logged in
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user ?? null);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Load data when user logs in
  useEffect(()=>{
    if(user) loadAllData();
  },[user]);

  async function loadAllData() {
    setDbLoading(true);
    try {
      const [i,o,w] = await Promise.all([
        supabase.from("items").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("outfits").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("wishlist").select("*").eq("user_id",user.id).order("added_at",{ascending:false}),
      ]);
      setItems((i.data||[]).map(dbToItem));
      setOutfits((o.data||[]).map(dbToOutfit));
      setWishlist(w.data||[]);
    } catch(e){ console.error(e); }
    setDbLoading(false);
  }

  // Convert DB row → app format
  function dbToItem(r){ return { id:r.id, category:r.category||"", subcategory:r.subcategory||"", name:r.name||"", color:r.color||"", size:r.size||"", material:r.material||"", whenBought:r.when_bought||"", price:r.price||"", condition:r.condition||"", location:r.location||"", status:r.status||"keep", notes:r.notes||"", customSellLink:r.custom_sell_link||"", customDonateLink:r.custom_donate_link||"", photo:r.photo||null }; }
  function dbToOutfit(r){ return { id:r.id, name:r.name||"", occasion:r.occasion||"", season:r.season||"All Seasons", itemIds:r.item_ids||[], notes:r.notes||"", rating:r.rating||0 }; }

  // Convert app format → DB row
  function itemToDb(item){ return { id:item.id, user_id:user.id, category:item.category, subcategory:item.subcategory, name:item.name, color:item.color, size:item.size, material:item.material, when_bought:item.whenBought, price:item.price, condition:item.condition, location:item.location, status:item.status, notes:item.notes, custom_sell_link:item.customSellLink, custom_donate_link:item.customDonateLink, photo:item.photo }; }
  function outfitToDb(o){ return { id:o.id, user_id:user.id, name:o.name, occasion:o.occasion, season:o.season, item_ids:o.itemIds, notes:o.notes, rating:o.rating }; }

  const flash = () => { setSaved(true); setTimeout(()=>setSaved(false),1500); };
  const stInfo = v => STATUS_OPTIONS.find(s=>s.value===v)||STATUS_OPTIONS[0];

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditItem(p=>({...p, photo: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (cat) => {
    setEditItem(p=>({...p, category:cat, subcategory:""}));
  };

  // Auth
  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const {error} = await supabase.auth.signInWithPassword({email:authEmail, password:authPass});
    if(error) setAuthError(error.message);
    setAuthLoading(false);
  }
  async function handleSignup() {
    setAuthLoading(true); setAuthError("");
    const {error} = await supabase.auth.signUp({email:authEmail, password:authPass});
    if(error) setAuthError(error.message);
    else setAuthError("✅ Check your email to confirm your account, then log in!");
    setAuthLoading(false);
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    setItems([]); setOutfits([]); setWishlist([]);
  }

  // Item CRUD
  const openNewItem    = () => { setEditItem({...emptyItem}); setPage("inventory"); setView("form"); };
  const openEditItem   = it => { setEditItem({...it}); setView("form"); };
  const openDetailItem = it => { setSelItem(it); setView("detail"); };

  const handleSaveItem = async () => {
    if(!editItem.name.trim()) return;
    const isNew = !editItem.id;
    const item = isNew ? {...editItem, id:uid()} : {...editItem};
    const newItems = isNew ? [item,...items] : items.map(i=>i.id===item.id?item:i);
    setItems(newItems);
    await supabase.from("items").upsert(itemToDb(item));
    flash(); setView("grid");
  };
  const handleDeleteItem = async id => {
    setItems(items.filter(i=>i.id!==id));
    await supabase.from("items").delete().eq("id",id);
    setView("grid");
  };
  const updateStatus = async (id,status) => {
    const n=items.map(i=>i.id===id?{...i,status}:i); setItems(n);
    if(selItem?.id===id) setSelItem(p=>({...p,status}));
    await supabase.from("items").update({status}).eq("id",id);
  };

  // Outfit CRUD
  const openNewOutfit    = () => { setEditOutfit({...emptyOutfit}); setPage("outfits"); setView("outfitForm"); };
  const openEditOutfit   = o  => { setEditOutfit({...o}); setView("outfitForm"); };
  const openDetailOutfit = o  => { setSelOutfit(o); setView("outfitDetail"); };
  const handleSaveOutfit = async () => {
    if(!editOutfit.name.trim()) return;
    const isNew = !editOutfit.id;
    const outfit = isNew ? {...editOutfit, id:uid()} : {...editOutfit};
    const newOutfits = isNew ? [outfit,...outfits] : outfits.map(o=>o.id===outfit.id?outfit:o);
    setOutfits(newOutfits);
    await supabase.from("outfits").upsert(outfitToDb(outfit));
    flash(); setView("outfitGrid");
  };
  const handleDeleteOutfit = async id => {
    setOutfits(outfits.filter(o=>o.id!==id));
    await supabase.from("outfits").delete().eq("id",id);
    setView("outfitGrid");
  };
  const toggleOutfitItem = id => setEditOutfit(p=>({...p, itemIds: p.itemIds.includes(id) ? p.itemIds.filter(x=>x!==id) : [...p.itemIds,id]}));

  // Wishlist
  const addToWishlist = async r => {
    const entry = {...r, id:uid(), user_id:user.id, added_at:new Date().toISOString(), where_to_buy:r.where, price_range:r.priceRange, search_url:r.searchUrl};
    setWishlist(p=>[entry,...p]);
    await supabase.from("wishlist").insert({id:entry.id, user_id:user.id, title:r.title, description:r.description, price_range:r.priceRange, where_to_buy:r.where, search_url:r.searchUrl, tags:r.tags||[]});
  };
  const removeFromWishlist = async id => {
    setWishlist(wishlist.filter(w=>w.id!==id));
    await supabase.from("wishlist").delete().eq("id",id);
  };

  const handleShopSearch = async () => {
    if(!shopQuery.trim()) return;
    setShopLoading(true); setShopError(""); setShopResults([]);
    const myItems = items.map(i=>`${i.name}${i.color?" ("+i.color+")":""}`).join(", ");
    const system = `You are a personal shopping assistant. The user owns: ${myItems||"(no items catalogued yet)"}. Return ONLY a valid JSON array of exactly 6 objects. No markdown. No explanation. Each object must have: "title" (string), "description" (string, max 2 sentences, explain why it pairs well with their items), "priceRange" (string like "$40–$80"), "where" (string, 2-3 store names), "searchUrl" (string, a real Google Shopping search URL), "tags" (array of 3 short strings).`;
    try {
      const raw = await callClaude([{role:"user",content:`Find me: "${shopQuery}"`}], system);
      const clean = raw.replace(/```json|```/g,"").trim();
      setShopResults(JSON.parse(clean));
    } catch { setShopError("Couldn't load suggestions. Please try again."); }
    setShopLoading(false);
  };

  const handleFilterCat = (cat) => { setFilterCat(cat); setFilterSub("All"); };

  const filteredItems = items.filter(it => {
    return (filterCat==="All"||it.category===filterCat)
      && (filterSub==="All"||it.subcategory===filterSub)
      && (filterStatus==="All"||it.status===filterStatus)
      && (!searchQ||it.name.toLowerCase().includes(searchQ.toLowerCase())||it.color?.toLowerCase().includes(searchQ.toLowerCase())||it.category?.toLowerCase().includes(searchQ.toLowerCase())||it.subcategory?.toLowerCase().includes(searchQ.toLowerCase()));
  });

  const backView = page==="outfits" ? "outfitGrid" : "grid";
  const activeSubs = filterCat !== "All" && SUBCATEGORIES[filterCat] ? SUBCATEGORIES[filterCat] : [];

  // ── LOADING SCREEN ──
  if(checkingAuth) return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:G.gold,marginBottom:16}}>MAISON</div>
        <div style={{width:36,height:36,border:`3px solid ${G.border}`,borderTopColor:G.gold,borderRadius:"50%",animation:"sp 1s linear infinite",margin:"0 auto"}}/>
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── LOGIN / SIGNUP SCREEN ──
  if(!user) return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Jost',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn{cursor:pointer;border:none;border-radius:7px;font-family:'Jost',sans-serif;font-weight:500;transition:all .18s}
        .btn:hover{opacity:.82;transform:translateY(-1px)}
        .inp{background:#161412;border:1px solid #2c2822;color:#f0ede8;border-radius:8px;padding:12px 16px;font-family:'Jost',sans-serif;font-size:14px;width:100%;transition:border .18s;outline:none}
        .inp:focus{border-color:#c9a96e}
        .inp::placeholder{color:#5a5550}
        @keyframes sp{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{width:"100%",maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:G.gold,letterSpacing:2}}>MAISON</div>
          <div style={{fontSize:11,color:G.dim,letterSpacing:"3px",marginTop:4}}>PERSONAL INVENTORY</div>
        </div>

        {/* Card */}
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:32}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,marginBottom:6,textAlign:"center"}}>
            {authView==="login"?"Welcome Back":"Create Account"}
          </div>
          <div style={{fontSize:12,color:G.dim,textAlign:"center",marginBottom:24}}>
            {authView==="login"?"Sign in to access your inventory":"Sign up to get started — it's free"}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div style={{fontSize:10,color:G.dim,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:6}}>Email</div>
              <input className="inp" type="email" placeholder="you@example.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleSignup())}/>
            </div>
            <div>
              <div style={{fontSize:10,color:G.dim,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:6}}>Password</div>
              <input className="inp" type="password" placeholder="••••••••" value={authPass} onChange={e=>setAuthPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleSignup())}/>
            </div>

            {authError&&(
              <div style={{fontSize:12,color:authError.startsWith("✅")?G.green:G.red,background:authError.startsWith("✅")?"#182818":"#3a1e1e",border:`1px solid ${authError.startsWith("✅")?"#2a4a2a":"#6b2020"}`,borderRadius:8,padding:"10px 14px",lineHeight:1.5}}>
                {authError}
              </div>
            )}

            <button className="btn" onClick={authView==="login"?handleLogin:handleSignup} disabled={authLoading}
              style={{background:G.gold,color:"#0c0b0a",padding:"13px",fontSize:14,fontWeight:700,marginTop:4,opacity:authLoading?.7:1}}>
              {authLoading?(
                <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <span style={{width:16,height:16,border:`2px solid #0c0b0a44`,borderTopColor:"#0c0b0a",borderRadius:"50%",display:"inline-block",animation:"sp 1s linear infinite"}}/>
                  {authView==="login"?"Signing in…":"Creating account…"}
                </span>
              ):authView==="login"?"Sign In →":"Create Account →"}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:G.muted}}>
            {authView==="login"?(
              <>Don't have an account?{" "}
                <span onClick={()=>{setAuthView("signup");setAuthError("");}} style={{color:G.gold,cursor:"pointer",fontWeight:600}}>Sign up</span>
              </>
            ):(
              <>Already have an account?{" "}
                <span onClick={()=>{setAuthView("login");setAuthError("");}} style={{color:G.gold,cursor:"pointer",fontWeight:600}}>Sign in</span>
              </>
            )}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:G.dim}}>Your data is private and secure 🔒</div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div style={{minHeight:"100vh",background:G.bg,color:G.text,fontFamily:"'Jost',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${G.surface}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
        .btn{cursor:pointer;border:none;border-radius:7px;font-family:'Jost',sans-serif;font-weight:500;transition:all .18s}
        .btn:hover{opacity:.82;transform:translateY(-1px)}
        .inp{background:${G.surface};border:1px solid ${G.border};color:${G.text};border-radius:8px;padding:10px 14px;font-family:'Jost',sans-serif;font-size:13px;width:100%;transition:border .18s;outline:none}
        .inp:focus{border-color:${G.gold}}
        .inp::placeholder{color:${G.dim}}
        select.inp option{background:${G.surface}}
        .card{background:${G.card};border:1px solid ${G.border};border-radius:12px;overflow:hidden}
        .hover-card{transition:all .22s;cursor:pointer}.hover-card:hover{border-color:${G.gold};transform:translateY(-3px);box-shadow:0 14px 40px rgba(0,0,0,.55)}
        .lbl{font-size:10px;color:${G.dim};letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .tag{display:inline-block;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.6px}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600}
        .tab{cursor:pointer;padding:7px 16px;border-radius:24px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;transition:all .18s;border:none;white-space:nowrap}
        .subtab{cursor:pointer;padding:5px 12px;border-radius:20px;font-family:'Jost',sans-serif;font-size:11px;font-weight:500;transition:all .18s;border:none;white-space:nowrap}
        .divider{height:1px;background:linear-gradient(90deg,transparent,${G.border} 30%,${G.border} 70%,transparent);margin:20px 0}
        textarea.inp{resize:vertical;min-height:80px}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        @media(max-width:600px){.g2,.g3{grid-template-columns:1fr}}
        .slide{animation:sld .28s ease}@keyframes sld{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
        .modal{background:${G.card};border:1px solid ${G.border};border-radius:16px;padding:28px;width:100%;max-width:440px;max-height:88vh;overflow-y:auto}
        .spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
        .serif{font-family:'Cormorant Garamond',serif}
        .star{cursor:pointer;font-size:20px;transition:transform .15s}.star:hover{transform:scale(1.3)}
        .photo-upload{border:2px dashed ${G.border};border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .18s}
        .photo-upload:hover{border-color:${G.gold};background:${G.surface}}
        .lightbox{position:fixed;inset:0;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;z-index:300;cursor:zoom-out}
        .lightbox img{max-width:92vw;max-height:92vh;border-radius:8px;object-fit:contain}
        .subcat-bar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 24px;background:${G.surface};border-bottom:1px solid ${G.border}}
      `}</style>

      {/* NAV */}
      <nav style={{background:G.surface,borderBottom:`1px solid ${G.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:10}}>
        <div>
          <div className="serif" style={{fontSize:22,fontWeight:700}}><span style={{color:G.gold}}>MAISON</span> INVENTORY</div>
          <div style={{fontSize:10,color:G.dim,letterSpacing:"2px",marginTop:1}}>PERSONAL CATALOG</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {(view==="form"||view==="detail"||view==="outfitForm"||view==="outfitDetail")&&(
            <button className="btn" onClick={()=>setView(backView)} style={{background:G.card,color:G.text,padding:"7px 16px",fontSize:12,border:`1px solid ${G.border}`}}>← Back</button>
          )}
          {["inventory","outfits","shop"].map(p=>(
            <button key={p} className="tab" onClick={()=>{setPage(p);if(p!=="outfits")setView("grid");else setView("outfitGrid");}}
              style={{background:page===p?G.gold:G.card,color:page===p?"#0c0b0a":G.muted,border:`1px solid ${page===p?G.gold:G.border}`}}>
              {p==="inventory"?"🗂 Inventory":p==="outfits"?"👗 Outfits":"🛍 Shop"}
            </button>
          ))}
          {page==="inventory"&&view==="grid"&&<button className="btn" onClick={openNewItem} style={{background:G.gold,color:"#0c0b0a",padding:"8px 20px",fontSize:12,fontWeight:700}}>+ Add Item</button>}
          {page==="outfits"&&(view==="outfitGrid"||view==="grid")&&<button className="btn" onClick={openNewOutfit} style={{background:G.gold,color:"#0c0b0a",padding:"8px 20px",fontSize:12,fontWeight:700}}>+ Outfit</button>}
          <button className="btn" onClick={handleLogout} style={{background:G.card,color:G.muted,padding:"7px 14px",fontSize:11,border:`1px solid ${G.border}`}}>Sign Out</button>
        </div>
      </nav>

      {/* DB LOADING */}
      {dbLoading&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",background:G.surface,borderBottom:`1px solid ${G.border}`,fontSize:13,color:G.muted}}>
          <div className="spin" style={{width:16,height:16,border:`2px solid ${G.border}`,borderTopColor:G.gold,borderRadius:"50%"}}/>
          Loading your inventory…
        </div>
      )}

      {/* STATS */}
      {page==="inventory"&&view==="grid"&&!dbLoading&&(
        <div style={{display:"flex",gap:10,padding:"14px 24px",overflowX:"auto",borderBottom:`1px solid ${G.surface}`}}>
          {[{l:"Total",v:items.length},{l:"Sell",v:items.filter(i=>i.status==="sell").length,c:G.orange},{l:"Donate",v:items.filter(i=>i.status==="donate").length,c:G.blue},{l:"Keep",v:items.filter(i=>i.status==="keep").length,c:G.green},{l:"Est. Value",v:"$"+items.filter(i=>i.price).reduce((a,i)=>a+(parseFloat(i.price)||0),0).toLocaleString()},{l:"Outfits",v:outfits.length,c:G.purple}].map(s=>(
            <div key={s.l} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:10,padding:"12px 18px",textAlign:"center",minWidth:88,flex:"0 0 auto"}}>
              <div className="serif" style={{fontSize:19,fontWeight:700,color:s.c||G.text}}>{s.v}</div>
              <div style={{fontSize:9,color:G.dim,letterSpacing:"1px",textTransform:"uppercase",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* INVENTORY GRID */}
      {page==="inventory"&&view==="grid"&&(
        <div className="slide">
          <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"16px 24px 10px",alignItems:"center"}}>
            <input className="inp" placeholder="🔍 Search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:170}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["All",...CATEGORIES].map(c=>(
                <button key={c} className="tab" onClick={()=>handleFilterCat(c)} style={{background:filterCat===c?G.gold:G.card,color:filterCat===c?"#0c0b0a":G.muted,border:`1px solid ${filterCat===c?G.gold:G.border}`,padding:"5px 11px",fontSize:11}}>{c}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["All",...STATUS_OPTIONS.map(s=>s.value)].map(s=>(
                <button key={s} className="tab" onClick={()=>setFilterStatus(s)} style={{background:filterStatus===s?G.gold:G.card,color:filterStatus===s?"#0c0b0a":G.muted,border:`1px solid ${filterStatus===s?G.gold:G.border}`,padding:"5px 11px",fontSize:11}}>
                  {s==="All"?"All":STATUS_OPTIONS.find(o=>o.value===s)?.label}
                </button>
              ))}
            </div>
          </div>
          {activeSubs.length>0&&(
            <div className="subcat-bar">
              <span style={{fontSize:10,color:G.dim,letterSpacing:"1px",textTransform:"uppercase",alignSelf:"center",marginRight:4}}>Filter:</span>
              {["All",...activeSubs].map(s=>(
                <button key={s} className="subtab" onClick={()=>setFilterSub(s)} style={{background:filterSub===s?"#2a2520":G.card,color:filterSub===s?G.gold:G.muted,border:`1px solid ${filterSub===s?G.gold:G.border}`}}>{s}</button>
              ))}
            </div>
          )}
          <div style={{padding:"16px 24px"}}>
            {filteredItems.length===0?(
              <div style={{textAlign:"center",padding:"70px 20px",color:G.dim}}>
                <div style={{fontSize:44,marginBottom:14}}>🪣</div>
                <div className="serif" style={{fontSize:22,color:G.muted,marginBottom:6}}>Nothing here yet</div>
                <div style={{fontSize:13}}>Add your first item to get started</div>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
                {filteredItems.map(item=>{const st=stInfo(item.status);return(
                  <div key={item.id} className="card hover-card" onClick={()=>openDetailItem(item)}>
                    {item.photo?(
                      <div style={{height:160,overflow:"hidden",background:G.surface}}>
                        <img src={item.photo} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      </div>
                    ):(
                      <div style={{height:90,background:G.surface,display:"flex",alignItems:"center",justifyContent:"center",color:G.dim,fontSize:26}}>📦</div>
                    )}
                    <div style={{padding:"14px 14px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                        <div>
                          <span className="tag" style={{background:"#2a2520",color:G.gold,fontSize:9}}>{item.category||"Item"}</span>
                          {item.subcategory&&<span className="tag" style={{background:"#1e2030",color:"#a78bfa",fontSize:9,marginLeft:4}}>{item.subcategory}</span>}
                        </div>
                        <span className="chip" style={{background:st.color+"22",color:st.color}}>{st.icon} {st.label}</span>
                      </div>
                      <div className="serif" style={{fontSize:16,fontWeight:600,lineHeight:1.3,marginBottom:5}}>{item.name}</div>
                      <div style={{fontSize:11,color:G.muted,display:"flex",gap:10,flexWrap:"wrap"}}>
                        {item.color&&<span>● {item.color}</span>}
                        {item.size&&<span>⌀ {item.size}</span>}
                        {item.condition&&<span>★ {item.condition}</span>}
                      </div>
                      {item.location&&<div style={{fontSize:11,color:G.dim,marginTop:6}}>📍 {item.location}</div>}
                      {item.price&&<div className="serif" style={{fontSize:15,color:G.gold,marginTop:6}}>${parseFloat(item.price).toLocaleString()}</div>}
                    </div>
                    <div style={{height:3,background:`linear-gradient(90deg,${st.color}55,transparent)`}}/>
                  </div>
                );})}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ITEM FORM */}
      {page==="inventory"&&view==="form"&&(
        <div style={{maxWidth:700,margin:"0 auto",padding:"28px 24px"}} className="slide">
          <div className="serif" style={{fontSize:26,fontWeight:700,marginBottom:4}}>{editItem.id?"Edit Item":"Add New Item"}</div>
          <div style={{color:G.dim,fontSize:13,marginBottom:24}}>{editItem.id?"Update the details":"Catalog a new household item"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <div className="lbl">Photo</div>
              <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
              {editItem.photo?(
                <div style={{position:"relative",borderRadius:12,overflow:"hidden",maxHeight:260}}>
                  <img src={editItem.photo} alt="item" style={{width:"100%",maxHeight:260,objectFit:"cover",display:"block"}}/>
                  <div style={{position:"absolute",top:10,right:10,display:"flex",gap:8}}>
                    <button className="btn" onClick={()=>photoRef.current.click()} style={{background:"rgba(0,0,0,.7)",color:G.text,padding:"6px 12px",fontSize:11}}>📷 Change</button>
                    <button className="btn" onClick={()=>setEditItem(p=>({...p,photo:null}))} style={{background:"rgba(180,30,30,.8)",color:"#fff",padding:"6px 12px",fontSize:11}}>✕ Remove</button>
                  </div>
                </div>
              ):(
                <div className="photo-upload" onClick={()=>photoRef.current.click()}>
                  <div style={{fontSize:36,marginBottom:10}}>📷</div>
                  <div style={{fontSize:13,color:G.muted,marginBottom:4}}>Tap to take a photo or upload from gallery</div>
                  <div style={{fontSize:11,color:G.dim}}>Works with your phone camera too!</div>
                </div>
              )}
            </div>
            <div className="g2">
              <div>
                <div className="lbl">Category *</div>
                <select className="inp" value={editItem.category} onChange={e=>handleCategoryChange(e.target.value)}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="lbl">Subcategory</div>
                <select className="inp" value={editItem.subcategory} onChange={e=>setEditItem(p=>({...p,subcategory:e.target.value}))} disabled={!SUBCATEGORIES[editItem.category]}>
                  <option value="">Select subcategory...</option>
                  {(SUBCATEGORIES[editItem.category]||[]).map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><div className="lbl">Item Name *</div><input className="inp" placeholder="e.g. Floral Wrap Dress" value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))}/></div>
            <div className="g3">
              <div><div className="lbl">Color</div><input className="inp" placeholder="Navy Blue" value={editItem.color} onChange={e=>setEditItem(p=>({...p,color:e.target.value}))}/></div>
              <div><div className="lbl">Size</div><input className="inp" placeholder="M, 42, 10L" value={editItem.size} onChange={e=>setEditItem(p=>({...p,size:e.target.value}))}/></div>
              <div><div className="lbl">Material</div><input className="inp" placeholder="Cotton, Silk" value={editItem.material} onChange={e=>setEditItem(p=>({...p,material:e.target.value}))}/></div>
            </div>
            <div className="g3">
              <div><div className="lbl">When Bought</div><input className="inp" type="date" value={editItem.whenBought} onChange={e=>setEditItem(p=>({...p,whenBought:e.target.value}))}/></div>
              <div><div className="lbl">Price ($)</div><input className="inp" type="number" placeholder="0.00" value={editItem.price} onChange={e=>setEditItem(p=>({...p,price:e.target.value}))}/></div>
              <div><div className="lbl">Condition</div><select className="inp" value={editItem.condition} onChange={e=>setEditItem(p=>({...p,condition:e.target.value}))}><option value="">Select...</option>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div><div className="lbl">Location in House</div><select className="inp" value={editItem.location} onChange={e=>setEditItem(p=>({...p,location:e.target.value}))}><option value="">Select...</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div>
              <div className="lbl">Status / Decision</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {STATUS_OPTIONS.map(s=>(
                  <button key={s.value} className="btn" onClick={()=>setEditItem(p=>({...p,status:s.value}))}
                    style={{padding:"7px 13px",fontSize:11,fontWeight:600,background:editItem.status===s.value?s.color:"#2a2520",color:editItem.status===s.value?"#0c0b0a":G.muted,border:`1px solid ${editItem.status===s.value?s.color:G.border}`}}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="g2">
              <div><div className="lbl">Sell Link</div><input className="inp" placeholder="https://..." value={editItem.customSellLink} onChange={e=>setEditItem(p=>({...p,customSellLink:e.target.value}))}/></div>
              <div><div className="lbl">Donate Link</div><input className="inp" placeholder="https://..." value={editItem.customDonateLink} onChange={e=>setEditItem(p=>({...p,customDonateLink:e.target.value}))}/></div>
            </div>
            <div><div className="lbl">Notes</div><textarea className="inp" placeholder="Write anything about this item…" value={editItem.notes} onChange={e=>setEditItem(p=>({...p,notes:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
              {editItem.id&&<button className="btn" onClick={()=>handleDeleteItem(editItem.id)} style={{background:"#3a1e1e",color:G.red,padding:"9px 18px",fontSize:12,border:"1px solid #6b2020"}}>Delete</button>}
              <button className="btn" onClick={()=>setView("grid")} style={{background:G.card,color:G.text,padding:"9px 22px",fontSize:12,border:`1px solid ${G.border}`}}>Cancel</button>
              <button className="btn" onClick={handleSaveItem} style={{background:G.gold,color:"#0c0b0a",padding:"9px 26px",fontSize:12,fontWeight:700}}>{saved?"✓ Saved!":editItem.id?"Save Changes":"Add Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM DETAIL */}
      {page==="inventory"&&view==="detail"&&selItem&&(()=>{
        const item=items.find(i=>i.id===selItem.id)||selItem; const st=stInfo(item.status);
        return(
          <div style={{maxWidth:660,margin:"0 auto",padding:"28px 24px"}} className="slide">
            {item.photo&&(
              <div style={{borderRadius:14,overflow:"hidden",marginBottom:20,cursor:"zoom-in",maxHeight:320}} onClick={()=>setLightbox(item.photo)}>
                <img src={item.photo} alt={item.name} style={{width:"100%",maxHeight:320,objectFit:"cover",display:"block"}}/>
                <div style={{padding:"6px 12px",background:G.surface,fontSize:11,color:G.dim,textAlign:"center"}}>Tap to enlarge 🔍</div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
              <div>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <span className="tag" style={{background:"#2a2520",color:G.gold}}>{item.category}</span>
                  {item.subcategory&&<span className="tag" style={{background:"#1e2030",color:"#a78bfa"}}>{item.subcategory}</span>}
                </div>
                <div className="serif" style={{fontSize:30,fontWeight:700,lineHeight:1.2}}>{item.name}</div>
              </div>
              <button className="btn" onClick={()=>openEditItem(item)} style={{background:G.card,color:G.text,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,whiteSpace:"nowrap"}}>✏️ Edit</button>
            </div>
            <div style={{marginBottom:22}}>
              <div className="lbl" style={{marginBottom:10}}>Status</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {STATUS_OPTIONS.map(s=>(
                  <button key={s.value} className="btn" onClick={()=>updateStatus(item.id,s.value)}
                    style={{padding:"7px 13px",fontSize:11,fontWeight:600,background:item.status===s.value?s.color:"#2a2520",color:item.status===s.value?"#0c0b0a":G.muted,border:`1px solid ${item.status===s.value?s.color:G.border}`}}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divider"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
              {[{l:"Color",v:item.color},{l:"Size",v:item.size},{l:"Material",v:item.material},{l:"Condition",v:item.condition},{l:"Location",v:item.location},
                {l:"When Bought",v:item.whenBought?new Date(item.whenBought).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):""},
                {l:"Purchase Price",v:item.price?`$${parseFloat(item.price).toLocaleString()}`:"",gold:true},
              ].filter(d=>d.v).map(d=>(
                <div key={d.l} style={{background:G.surface,borderRadius:8,padding:"11px 13px"}}>
                  <div className="lbl" style={{marginBottom:3}}>{d.l}</div>
                  <div style={{fontSize:13,color:d.gold?G.gold:G.text,fontWeight:500}}>{d.v}</div>
                </div>
              ))}
            </div>
            {item.notes&&<><div className="lbl">Notes</div><div style={{background:G.surface,borderRadius:10,padding:14,fontSize:13,color:"#c5bfb8",lineHeight:1.7,marginBottom:18,whiteSpace:"pre-wrap"}}>{item.notes}</div></>}
            <div className="divider"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
              <button className="btn" onClick={()=>setLinksModal("sell")} style={{background:G.orange+"22",color:G.orange,border:`1px solid ${G.orange}44`,padding:"8px 16px",fontSize:12}}>💰 Sell Platforms</button>
              <button className="btn" onClick={()=>setLinksModal("donate")} style={{background:G.blue+"22",color:G.blue,border:`1px solid ${G.blue}44`,padding:"8px 16px",fontSize:12}}>🤝 Donate To</button>
              {item.customSellLink&&<a href={item.customSellLink} target="_blank" rel="noreferrer"><button className="btn" style={{background:G.card,color:G.gold,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`}}>🔗 My Sell Link</button></a>}
              {item.customDonateLink&&<a href={item.customDonateLink} target="_blank" rel="noreferrer"><button className="btn" style={{background:G.card,color:G.gold,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`}}>🔗 My Donate Link</button></a>}
              <button className="btn" onClick={()=>{setShopQuery(`items to match my ${item.color||""} ${item.subcategory||item.category} ${item.name}`);setPage("shop");}} style={{background:G.purple+"22",color:G.purple,border:`1px solid ${G.purple}44`,padding:"8px 16px",fontSize:12}}>🛍 Find Matches</button>
            </div>
            <button className="btn" onClick={()=>handleDeleteItem(item.id)} style={{background:"#3a1e1e",color:G.red,padding:"9px 18px",fontSize:12,border:"1px solid #6b2020"}}>🗑 Delete Item</button>
          </div>
        );
      })()}

      {/* OUTFITS GRID */}
      {page==="outfits"&&(view==="outfitGrid"||view==="grid")&&(
        <div style={{padding:"24px"}} className="slide">
          <div className="serif" style={{fontSize:26,fontWeight:700,marginBottom:4}}>My Outfits</div>
          <div style={{color:G.dim,fontSize:13,marginBottom:22}}>Combine your inventory items into complete looks</div>
          {outfits.length===0?(
            <div style={{textAlign:"center",padding:"70px 20px",color:G.dim}}>
              <div style={{fontSize:44,marginBottom:14}}>👗</div>
              <div className="serif" style={{fontSize:22,color:G.muted,marginBottom:6}}>No outfits yet</div>
              <div style={{fontSize:13}}>Create your first outfit from your inventory</div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {outfits.map(outfit=>{
                const oItems=outfit.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean);
                const photoItems=oItems.filter(i=>i.photo);
                return(
                  <div key={outfit.id} className="card hover-card" onClick={()=>openDetailOutfit(outfit)}>
                    {photoItems.length>0&&(
                      <div style={{display:"flex",height:80,overflow:"hidden"}}>
                        {photoItems.slice(0,3).map(it=>(
                          <div key={it.id} style={{flex:1,overflow:"hidden"}}>
                            <img src={it.photo} alt={it.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{padding:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span className="tag" style={{background:"#1e1a2e",color:G.purple}}>{outfit.occasion||"Outfit"}</span>
                        <span className="tag" style={{background:"#1e2a1e",color:G.green}}>{outfit.season}</span>
                      </div>
                      <div className="serif" style={{fontSize:17,fontWeight:600,marginBottom:8}}>{outfit.name}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
                        {oItems.slice(0,3).map(it=>(
                          <span key={it.id} style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:G.muted}}>{it.name}</span>
                        ))}
                        {oItems.length>3&&<span style={{fontSize:11,color:G.dim}}>+{oItems.length-3} more</span>}
                      </div>
                      {outfit.rating>0&&<div style={{fontSize:12}}>{[1,2,3,4,5].map(s=><span key={s}>{s<=outfit.rating?"⭐":"☆"}</span>)}</div>}
                    </div>
                    <div style={{height:3,background:`linear-gradient(90deg,${G.purple}55,transparent)`}}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OUTFIT FORM */}
      {page==="outfits"&&view==="outfitForm"&&(
        <div style={{maxWidth:720,margin:"0 auto",padding:"28px 24px"}} className="slide">
          <div className="serif" style={{fontSize:26,fontWeight:700,marginBottom:4}}>{editOutfit.id?"Edit Outfit":"Create Outfit"}</div>
          <div style={{color:G.dim,fontSize:13,marginBottom:24}}>Build a look from your inventory</div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="g3">
              <div><div className="lbl">Outfit Name *</div><input className="inp" placeholder="e.g. Summer Brunch Look" value={editOutfit.name} onChange={e=>setEditOutfit(p=>({...p,name:e.target.value}))}/></div>
              <div><div className="lbl">Occasion</div><select className="inp" value={editOutfit.occasion} onChange={e=>setEditOutfit(p=>({...p,occasion:e.target.value}))}><option value="">Select...</option>{OUTFIT_OCCASIONS.map(o=><option key={o}>{o}</option>)}</select></div>
              <div><div className="lbl">Season</div><select className="inp" value={editOutfit.season} onChange={e=>setEditOutfit(p=>({...p,season:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div>
              <div className="lbl">Rating</div>
              <div style={{display:"flex",gap:4}}>
                {[1,2,3,4,5].map(s=>(
                  <span key={s} className="star" onClick={()=>setEditOutfit(p=>({...p,rating:s===p.rating?0:s}))} style={{color:s<=editOutfit.rating?G.gold:G.dim}}>{s<=editOutfit.rating?"⭐":"☆"}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="lbl" style={{marginBottom:10}}>Select Items for This Outfit</div>
              {items.length===0?(
                <div style={{color:G.dim,fontSize:13,padding:14,background:G.surface,borderRadius:8}}>Add items to your inventory first.</div>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8,maxHeight:320,overflowY:"auto",padding:2}}>
                    {items.map(it=>{const sel=editOutfit.itemIds.includes(it.id);return(
                      <div key={it.id} onClick={()=>toggleOutfitItem(it.id)}
                        style={{background:sel?"#182818":G.surface,border:`1.5px solid ${sel?G.green:G.border}`,borderRadius:8,overflow:"hidden",cursor:"pointer",transition:"all .18s"}}>
                        {it.photo&&<img src={it.photo} alt={it.name} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>}
                        <div style={{padding:"8px 10px"}}>
                          <div style={{fontSize:9,color:sel?G.green:G.muted,fontWeight:sel?600:400,marginBottom:2,textTransform:"uppercase",letterSpacing:"1px"}}>{it.subcategory||it.category}</div>
                          <div style={{fontSize:12,fontWeight:500,lineHeight:1.3}}>{it.name}</div>
                          {it.color&&<div style={{fontSize:10,color:G.dim,marginTop:2}}>● {it.color}</div>}
                          {sel&&<div style={{marginTop:4,fontSize:10,color:G.green,fontWeight:600}}>✓ Added</div>}
                        </div>
                      </div>
                    );})}
                  </div>
                  {editOutfit.itemIds.length>0&&<div style={{fontSize:12,color:G.green,marginTop:8,fontWeight:600}}>✓ {editOutfit.itemIds.length} item{editOutfit.itemIds.length!==1?"s":""} selected</div>}
                </>
              )}
            </div>
            <div><div className="lbl">Notes</div><textarea className="inp" placeholder="Describe this look, where you'd wear it…" value={editOutfit.notes} onChange={e=>setEditOutfit(p=>({...p,notes:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
              {editOutfit.id&&<button className="btn" onClick={()=>handleDeleteOutfit(editOutfit.id)} style={{background:"#3a1e1e",color:G.red,padding:"9px 18px",fontSize:12,border:"1px solid #6b2020"}}>Delete</button>}
              <button className="btn" onClick={()=>setView("outfitGrid")} style={{background:G.card,color:G.text,padding:"9px 22px",fontSize:12,border:`1px solid ${G.border}`}}>Cancel</button>
              <button className="btn" onClick={handleSaveOutfit} style={{background:G.gold,color:"#0c0b0a",padding:"9px 26px",fontSize:12,fontWeight:700}}>{saved?"✓ Saved!":editOutfit.id?"Save Changes":"Create Outfit"}</button>
            </div>
          </div>
        </div>
      )}

      {/* OUTFIT DETAIL */}
      {page==="outfits"&&view==="outfitDetail"&&selOutfit&&(()=>{
        const outfit=outfits.find(o=>o.id===selOutfit.id)||selOutfit;
        const oItems=outfit.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean);
        return(
          <div style={{maxWidth:660,margin:"0 auto",padding:"28px 24px"}} className="slide">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
              <div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <span className="tag" style={{background:"#1e1a2e",color:G.purple}}>{outfit.occasion||"Outfit"}</span>
                  <span className="tag" style={{background:"#1e2a1e",color:G.green}}>{outfit.season}</span>
                </div>
                <div className="serif" style={{fontSize:28,fontWeight:700}}>{outfit.name}</div>
                {outfit.rating>0&&<div style={{marginTop:8,fontSize:14}}>{[1,2,3,4,5].map(s=><span key={s}>{s<=outfit.rating?"⭐":"☆"}</span>)}</div>}
              </div>
              <button className="btn" onClick={()=>openEditOutfit(outfit)} style={{background:G.card,color:G.text,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,whiteSpace:"nowrap"}}>✏️ Edit</button>
            </div>
            <div className="divider"/>
            <div className="lbl" style={{marginBottom:12}}>Items in This Outfit ({oItems.length})</div>
            {oItems.length===0?<div style={{color:G.dim,fontSize:13,marginBottom:20}}>No items added yet.</div>:(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:22}}>
                {oItems.map(it=>{const st=stInfo(it.status);return(
                  <div key={it.id} className="card" style={{cursor:"pointer"}} onClick={()=>{setPage("inventory");openDetailItem(it);}}>
                    {it.photo&&<img src={it.photo} alt={it.name} style={{width:"100%",height:100,objectFit:"cover",display:"block"}}/>}
                    <div style={{padding:"10px 12px"}}>
                      <div style={{fontSize:9,color:G.gold,marginBottom:2,textTransform:"uppercase",letterSpacing:"1px"}}>{it.subcategory||it.category}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{it.name}</div>
                      <span className="chip" style={{background:st.color+"22",color:st.color,fontSize:9}}>{st.icon} {st.label}</span>
                    </div>
                  </div>
                );})}
              </div>
            )}
            {outfit.notes&&<><div className="lbl">Notes</div><div style={{background:G.surface,borderRadius:10,padding:14,fontSize:13,color:"#c5bfb8",lineHeight:1.7,marginBottom:18,whiteSpace:"pre-wrap"}}>{outfit.notes}</div></>}
            <div className="divider"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="btn" onClick={()=>{setShopQuery(`items to complete my ${outfit.name} outfit${outfit.occasion?" for "+outfit.occasion:""}`);setPage("shop");}}
                style={{background:G.purple+"22",color:G.purple,border:`1px solid ${G.purple}44`,padding:"9px 18px",fontSize:12}}>🛍 Find Items to Complete This Outfit</button>
              <button className="btn" onClick={()=>handleDeleteOutfit(outfit.id)} style={{background:"#3a1e1e",color:G.red,padding:"9px 18px",fontSize:12,border:"1px solid #6b2020"}}>🗑 Delete</button>
            </div>
          </div>
        );
      })()}

      {/* SHOP */}
      {page==="shop"&&(
        <div style={{maxWidth:860,margin:"0 auto",padding:"28px 24px"}} className="slide">
          <div className="serif" style={{fontSize:26,fontWeight:700,marginBottom:4}}>Shop & Discover</div>
          <div style={{color:G.dim,fontSize:13,marginBottom:24}}>AI-powered suggestions tailored to your wardrobe & home</div>
          <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
            <input className="inp" placeholder="e.g. sweater to match my navy dress, beige bag for work…"
              value={shopQuery} onChange={e=>setShopQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleShopSearch()}
              style={{flex:1,minWidth:200,fontSize:14}}/>
            <button className="btn" onClick={handleShopSearch} disabled={shopLoading}
              style={{background:G.gold,color:"#0c0b0a",padding:"10px 24px",fontSize:13,fontWeight:700,opacity:shopLoading?.7:1,whiteSpace:"nowrap"}}>
              {shopLoading?"Searching…":"🔍 Find Items"}
            </button>
          </div>
          <div style={{marginBottom:24}}>
            <div className="lbl" style={{marginBottom:10}}>Quick Ideas</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Sweater to match a dress","Shoes for a casual outfit","Statement handbag","Cozy throw blanket","Kitchen storage","Silk scarf","White sneakers","Blazer for work","Jeans to match a blouse","Sunglasses","Bedroom rug","Candle holders"].map(q=>(
                <button key={q} className="btn" onClick={()=>setShopQuery(q)} style={{background:G.surface,color:G.muted,border:`1px solid ${G.border}`,padding:"6px 13px",fontSize:11}}>{q}</button>
              ))}
            </div>
          </div>
          {shopError&&<div style={{background:"#3a1e1e",border:"1px solid #6b2020",borderRadius:8,padding:"12px 16px",color:G.red,fontSize:13,marginBottom:20}}>{shopError}</div>}
          {shopLoading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px",gap:16}}>
              <div className="spin" style={{width:38,height:38,border:`3px solid ${G.border}`,borderTopColor:G.gold,borderRadius:"50%"}}/>
              <div style={{color:G.muted,fontSize:13}}>Finding the best matches for your wardrobe…</div>
            </div>
          )}
          {shopResults.length>0&&(
            <div style={{marginBottom:32}}>
              <div className="serif" style={{fontSize:19,fontWeight:600,marginBottom:14}}>Suggestions for "{shopQuery}"</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:14}}>
                {shopResults.map((r,i)=>{
                  const inWL=wishlist.some(w=>w.title===r.title);
                  return(
                    <div key={i} className="card" style={{padding:"18px"}}>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                        {(r.tags||[]).map(t=><span key={t} className="tag" style={{background:"#2a2520",color:G.gold,fontSize:9}}>{t}</span>)}
                      </div>
                      <div className="serif" style={{fontSize:16,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{r.title}</div>
                      <div style={{fontSize:12,color:G.muted,lineHeight:1.6,marginBottom:12}}>{r.description}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div className="serif" style={{fontSize:16,color:G.gold,fontWeight:600}}>{r.priceRange}</div>
                        <div style={{fontSize:11,color:G.dim,textAlign:"right"}}>{r.where}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <a href={r.searchUrl||`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(r.title)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",flex:1}}>
                          <button className="btn" style={{background:G.gold,color:"#0c0b0a",padding:"7px 14px",fontSize:11,fontWeight:700,width:"100%"}}>Shop Now →</button>
                        </a>
                        <button className="btn" onClick={()=>inWL?removeFromWishlist(wishlist.find(w=>w.title===r.title)?.id):addToWishlist(r)}
                          style={{background:inWL?"#182818":G.surface,color:inWL?G.green:G.muted,border:`1px solid ${inWL?G.green:G.border}`,padding:"7px 12px",fontSize:13}}>
                          {inWL?"✓":"♡"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {wishlist.length>0&&(
            <div>
              <div className="divider"/>
              <div className="serif" style={{fontSize:19,fontWeight:600,marginBottom:14}}>💛 My Wishlist ({wishlist.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {wishlist.map(w=>(
                  <div key={w.id} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:160}}>
                      <div className="serif" style={{fontSize:15,fontWeight:600,marginBottom:2}}>{w.title}</div>
                      <div style={{fontSize:11,color:G.muted}}>{w.where_to_buy||w.where} · {w.price_range||w.priceRange}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <a href={w.search_url||w.searchUrl||`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(w.title)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                        <button className="btn" style={{background:G.gold,color:"#0c0b0a",padding:"6px 14px",fontSize:11,fontWeight:700}}>Shop →</button>
                      </a>
                      <button className="btn" onClick={()=>removeFromWishlist(w.id)} style={{background:"#3a1e1e",color:G.red,padding:"6px 12px",fontSize:11,border:"1px solid #6b2020"}}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!shopLoading&&shopResults.length===0&&wishlist.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:G.dim}}>
              <div style={{fontSize:44,marginBottom:14}}>🛍</div>
              <div className="serif" style={{fontSize:20,color:G.muted,marginBottom:6}}>What are you looking for?</div>
              <div style={{fontSize:13}}>Describe what you need — AI will suggest items that match your wardrobe & home</div>
            </div>
          )}
        </div>
      )}

      {/* LINKS MODAL */}
      {linksModal&&(
        <div className="overlay" onClick={()=>setLinksModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="serif" style={{fontSize:20,fontWeight:700,marginBottom:4}}>{linksModal==="sell"?"💰 Sell Online":"🤝 Donate To"}</div>
            <div style={{fontSize:12,color:G.dim,marginBottom:18}}>{linksModal==="sell"?"Popular resale platforms":"Organizations accepting donations"}</div>
            {(linksModal==="sell"?SELL_SITES:DONATE_SITES).map(s=>(
              <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${G.border}`}}>
                <div style={{fontSize:14,fontWeight:500}}>{s.name}</div>
                <a href={s.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                  <button className="btn" style={{background:G.gold,color:"#0c0b0a",padding:"5px 14px",fontSize:11,fontWeight:700}}>Visit →</button>
                </a>
              </div>
            ))}
            <button className="btn" onClick={()=>setLinksModal(null)} style={{background:G.card,color:G.text,padding:"9px",fontSize:12,marginTop:18,width:"100%",border:`1px solid ${G.border}`}}>Close</button>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox&&(
        <div className="lightbox" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="Full size"/>
        </div>
      )}
    </div>
  );
}

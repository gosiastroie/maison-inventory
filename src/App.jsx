import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

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
  { value:"keep",       label:"Keep",       color:"#6dab7a", icon:"♡"  },
  { value:"sell",       label:"Sell",       color:"#d4845a", icon:"💰" },
  { value:"donate",     label:"Donate",     color:"#5a8fb5", icon:"🤝" },
  { value:"exchange",   label:"Exchange",   color:"#9b7fc4", icon:"🔄" },
  { value:"replace",    label:"Replace",    color:"#c9a04a", icon:"🔁" },
  { value:"get_rid_of", label:"Get Rid Of", color:"#c46a5a", icon:"🗑" },
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
  bg:"#f2ebe0", surface:"#ede3d4", card:"#faf6ef", border:"#d9c9b0",
  gold:"#b5763a", text:"#3d2e1e", muted:"#7a6248", dim:"#a89070",
  green:"#6dab7a", orange:"#d4845a", blue:"#5a8fb5", purple:"#9b7fc4",
  yellow:"#c9a04a", red:"#c46a5a", terracotta:"#c1603a", cream:"#fdf8f0",
};

const emptyItem   = { id:null,category:"",subcategory:"",name:"",color:"",size:"",material:"",whenBought:"",price:"",condition:"",location:"",status:"keep",notes:"",customSellLink:"",customDonateLink:"",photo:null };
const emptyOutfit = { id:null,name:"",occasion:"",season:"All Seasons",itemIds:[],notes:"",rating:0 };

function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

// Resize image to max 800px and compress to avoid payload issues
function resizeImage(base64, maxSize=800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = base64;
  });
}

async function analyzePhotoWithAI(base64) {
  const base64Data = base64.split(",")[1];
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data } },
          { type: "text", text: `Analyze this item photo carefully. Return ONLY valid JSON, no markdown, no explanation:
{
  "category": "",
  "subcategory": "",
  "color": "",
  "size": "",
  "material": "",
  "condition": "",
  "notes": ""
}
Rules:
- category: one of: Clothing, Shoes, Bags, Accessories, Electronics, Furniture, Books, Kitchenware, Toys, Sports, Jewelry, Other
- subcategory for Clothing: Dresses, Tops & Blouses, Sweaters, Tees & Tanks, Pants, Jeans, Jackets & Coats, Skirts, Shorts, Blazers, Pajamas, Activewear, Sweatshirts & Sweatpants, Intimates, Swimwear
- subcategory for Shoes: Sneakers, Heels, Flats, Boots, Sandals, Loafers, Athletic, Slippers, Mules, Wedges
- subcategory for Bags: Handbags, Tote Bags, Backpacks, Clutches, Crossbody, Shoulder Bags, Wallets, Travel Bags
- subcategory for Accessories: Jewelry, Scarves, Hats, Belts, Sunglasses, Watches, Hair Accessories, Gloves
- color: primary color in 1-3 words e.g. "Navy Blue", "Cream White"
- size: visible label or visual estimate e.g. "M", "L", "8-10". Empty if unknown.
- material: fabric/material from appearance e.g. "Cotton", "Leather", "Denim", "Silk", "Wool"
- condition: Excellent, Good, Fair, or Poor based on visible wear
- notes: 1-3 sentences with brand name if visible, style, pattern, key features for resale`
          }
        ]
      }]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function callClaude(messages, system = "") {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

export default function App() {
  const [user,           setUser]           = useState(null);
  const [authView,       setAuthView]       = useState("login");
  const [authEmail,      setAuthEmail]      = useState("");
  const [authPass,       setAuthPass]       = useState("");
  const [authError,      setAuthError]      = useState("");
  const [authLoading,    setAuthLoading]    = useState(false);
  const [checkingAuth,   setCheckingAuth]   = useState(true);
  const [items,          setItems]          = useState([]);
  const [outfits,        setOutfits]        = useState([]);
  const [page,           setPage]           = useState("inventory");
  const [view,           setView]           = useState("grid");
  const [editItem,       setEditItem]       = useState({...emptyItem});
  const [selItem,        setSelItem]        = useState(null);
  const [editOutfit,     setEditOutfit]     = useState({...emptyOutfit});
  const [selOutfit,      setSelOutfit]      = useState(null);
  const [filterCat,      setFilterCat]      = useState("All");
  const [filterSub,      setFilterSub]      = useState("All");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [searchQ,        setSearchQ]        = useState("");
  const [linksModal,     setLinksModal]     = useState(null);
  const [shopQuery,      setShopQuery]      = useState("");
  const [shopResults,    setShopResults]    = useState([]);
  const [shopLoading,    setShopLoading]    = useState(false);
  const [shopError,      setShopError]      = useState("");
  const [wishlist,       setWishlist]       = useState([]);
  const [saved,          setSaved]          = useState(false);
  const [lightbox,       setLightbox]       = useState(null);
  const [dbLoading,      setDbLoading]      = useState(false);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [aiError,        setAiError]        = useState("");
  const cameraRef  = useRef();
  const galleryRef = useRef();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null); setCheckingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) loadAllData(); }, [user]);

  async function loadAllData() {
    setDbLoading(true);
    try {
      const [i, o, w] = await Promise.all([
        supabase.from("items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("outfits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wishlist").select("*").eq("user_id", user.id).order("added_at", { ascending: false }),
      ]);
      setItems((i.data || []).map(dbToItem));
      setOutfits((o.data || []).map(dbToOutfit));
      setWishlist(w.data || []);
    } catch (e) { console.error(e); }
    setDbLoading(false);
  }

  function dbToItem(r) { return { id: r.id, category: r.category || "", subcategory: r.subcategory || "", name: r.name || "", color: r.color || "", size: r.size || "", material: r.material || "", whenBought: r.when_bought || "", price: r.price || "", condition: r.condition || "", location: r.location || "", status: r.status || "keep", notes: r.notes || "", customSellLink: r.custom_sell_link || "", customDonateLink: r.custom_donate_link || "", photo: r.photo || null }; }
  function dbToOutfit(r) { return { id: r.id, name: r.name || "", occasion: r.occasion || "", season: r.season || "All Seasons", itemIds: r.item_ids || [], notes: r.notes || "", rating: r.rating || 0 }; }
  function itemToDb(item) { return { id: item.id, user_id: user.id, category: item.category, subcategory: item.subcategory, name: item.name, color: item.color, size: item.size, material: item.material, when_bought: item.whenBought, price: item.price, condition: item.condition, location: item.location, status: item.status, notes: item.notes, custom_sell_link: item.customSellLink, custom_donate_link: item.customDonateLink, photo: item.photo }; }
  function outfitToDb(o) { return { id: o.id, user_id: user.id, name: o.name, occasion: o.occasion, season: o.season, item_ids: o.itemIds, notes: o.notes, rating: o.rating }; }

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const stInfo = v => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];
  const handleCategoryChange = cat => setEditItem(p => ({ ...p, category: cat, subcategory: "" }));

  // ── PHOTO HANDLER ──
  const handlePhotoFile = async (file) => {
    if (!file) return;
    setAiError("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const original = ev.target.result;
      // Resize for display and AI
      const resized = await resizeImage(original, 900);
      setEditItem(p => ({ ...p, photo: resized }));
      // AI analysis
      setPhotoAnalyzing(true);
      try {
        const small = await resizeImage(original, 800);
        const detected = await analyzePhotoWithAI(small);
        setEditItem(p => ({
          ...p,
          category:    detected.category    || p.category,
          subcategory: detected.subcategory || p.subcategory,
          color:       detected.color       || p.color,
          size:        detected.size        || p.size,
          material:    detected.material    || p.material,
          condition:   detected.condition   || p.condition,
          notes:       detected.notes       || p.notes,
        }));
      } catch (err) {
        console.error("AI analysis error:", err);
        setAiError("AI couldn't analyse this photo. You can fill in the details manually.");
      }
      setPhotoAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  }
  async function handleSignup() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass });
    if (error) setAuthError(error.message);
    else setAuthError("✅ Check your email to confirm your account, then log in!");
    setAuthLoading(false);
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    setItems([]); setOutfits([]); setWishlist([]);
  }

  const openNewItem    = () => { setEditItem({ ...emptyItem }); setPage("inventory"); setView("form"); };
  const openEditItem   = it => { setEditItem({ ...it }); setView("form"); };
  const openDetailItem = it => { setSelItem(it); setView("detail"); };
  const handleSaveItem = async () => {
    if (!editItem.name.trim()) return;
    const isNew = !editItem.id;
    const item = isNew ? { ...editItem, id: uid() } : { ...editItem };
    setItems(isNew ? [item, ...items] : items.map(i => i.id === item.id ? item : i));
    await supabase.from("items").upsert(itemToDb(item));
    flash(); setView("grid");
  };
  const handleDeleteItem = async id => {
    setItems(items.filter(i => i.id !== id));
    await supabase.from("items").delete().eq("id", id);
    setView("grid");
  };
  const updateStatus = async (id, status) => {
    const n = items.map(i => i.id === id ? { ...i, status } : i); setItems(n);
    if (selItem?.id === id) setSelItem(p => ({ ...p, status }));
    await supabase.from("items").update({ status }).eq("id", id);
  };

  const openNewOutfit    = () => { setEditOutfit({ ...emptyOutfit }); setPage("outfits"); setView("outfitForm"); };
  const openEditOutfit   = o  => { setEditOutfit({ ...o }); setView("outfitForm"); };
  const openDetailOutfit = o  => { setSelOutfit(o); setView("outfitDetail"); };
  const handleSaveOutfit = async () => {
    if (!editOutfit.name.trim()) return;
    const isNew = !editOutfit.id;
    const outfit = isNew ? { ...editOutfit, id: uid() } : { ...editOutfit };
    setOutfits(isNew ? [outfit, ...outfits] : outfits.map(o => o.id === outfit.id ? outfit : o));
    await supabase.from("outfits").upsert(outfitToDb(outfit));
    flash(); setView("outfitGrid");
  };
  const handleDeleteOutfit = async id => {
    setOutfits(outfits.filter(o => o.id !== id));
    await supabase.from("outfits").delete().eq("id", id);
    setView("outfitGrid");
  };
  const toggleOutfitItem = id => setEditOutfit(p => ({ ...p, itemIds: p.itemIds.includes(id) ? p.itemIds.filter(x => x !== id) : [...p.itemIds, id] }));

  const addToWishlist = async r => {
    const entry = { ...r, id: uid(), user_id: user.id, added_at: new Date().toISOString(), where_to_buy: r.where, price_range: r.priceRange, search_url: r.searchUrl };
    setWishlist(p => [entry, ...p]);
    await supabase.from("wishlist").insert({ id: entry.id, user_id: user.id, title: r.title, description: r.description, price_range: r.priceRange, where_to_buy: r.where, search_url: r.searchUrl, tags: r.tags || [] });
  };
  const removeFromWishlist = async id => {
    setWishlist(wishlist.filter(w => w.id !== id));
    await supabase.from("wishlist").delete().eq("id", id);
  };

  const handleShopSearch = async () => {
    if (!shopQuery.trim()) return;
    setShopLoading(true); setShopError(""); setShopResults([]);
    const myItems = items.map(i => `${i.name}${i.color ? " (" + i.color + ")" : ""}`).join(", ");
    const system = `You are a personal shopping assistant. The user owns: ${myItems || "(no items yet)"}. Return ONLY a valid JSON array of exactly 6 objects. No markdown. Each object: "title","description","priceRange","where","searchUrl","tags"(array of 3).`;
    try {
      const raw = await callClaude([{ role: "user", content: `Find me: "${shopQuery}"` }], system);
      setShopResults(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { setShopError("Couldn't load suggestions. Please try again."); }
    setShopLoading(false);
  };

  const handleFilterCat = cat => { setFilterCat(cat); setFilterSub("All"); };
  const filteredItems = items.filter(it =>
    (filterCat === "All" || it.category === filterCat) &&
    (filterSub === "All" || it.subcategory === filterSub) &&
    (filterStatus === "All" || it.status === filterStatus) &&
    (!searchQ || it.name.toLowerCase().includes(searchQ.toLowerCase()) || it.color?.toLowerCase().includes(searchQ.toLowerCase()) || it.category?.toLowerCase().includes(searchQ.toLowerCase()) || it.subcategory?.toLowerCase().includes(searchQ.toLowerCase()))
  );
  const backView   = page === "outfits" ? "outfitGrid" : "grid";
  const activeSubs = filterCat !== "All" && SUBCATEGORIES[filterCat] ? SUBCATEGORIES[filterCat] : [];

  // ── LOADING ──
  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: G.terracotta, fontWeight: 700, marginBottom: 8 }}>MAISON</div>
        <div style={{ fontSize: 11, color: G.dim, letterSpacing: "3px", marginBottom: 20 }}>PERSONAL INVENTORY</div>
        <div style={{ width: 36, height: 36, border: `3px solid ${G.border}`, borderTopColor: G.terracotta, borderRadius: "50%", animation: "sp 1s linear infinite", margin: "0 auto" }} />
      </div>
    </div>
  );

  // ── LOGIN ──
  if (!user) return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,#f5ede0 0%,#ead5bc 40%,#e8c9a8 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Jost',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn{cursor:pointer;border:none;border-radius:8px;font-family:'Jost',sans-serif;font-weight:600;transition:all .18s}
        .btn:hover{opacity:.88;transform:translateY(-1px)}
        .inp{background:rgba(255,255,255,.7);border:1.5px solid ${G.border};color:${G.text};border-radius:8px;padding:12px 16px;font-family:'Jost',sans-serif;font-size:14px;width:100%;transition:border .18s;outline:none}
        .inp:focus{border-color:${G.terracotta};background:rgba(255,255,255,.95)}
        .inp::placeholder{color:${G.dim}}
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn .5s ease" }}>
        <div style={{ position: "fixed", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(193,96,58,.12)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(181,118,58,.15)", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(135deg,${G.terracotta},${G.gold})`, marginBottom: 16, boxShadow: "0 8px 24px rgba(193,96,58,.35)" }}>
            <span style={{ fontSize: 30 }}>🏡</span>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: G.text, letterSpacing: 1 }}>MAISON</div>
          <div style={{ fontSize: 11, color: G.muted, letterSpacing: "3px", marginTop: 4 }}>PERSONAL INVENTORY</div>
        </div>
        <div style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(12px)", border: `1px solid rgba(255,255,255,.9)`, borderRadius: 20, padding: 32, boxShadow: "0 20px 60px rgba(139,90,43,.15)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, marginBottom: 4, textAlign: "center", color: G.text }}>
            {authView === "login" ? "Welcome Back 👋" : "Create Your Account"}
          </div>
          <div style={{ fontSize: 12, color: G.muted, textAlign: "center", marginBottom: 24 }}>
            {authView === "login" ? "Sign in to your personal catalog" : "Free forever · Private & secure"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6 }}>Email</div>
              <input className="inp" type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (authView === "login" ? handleLogin() : handleSignup())} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 6 }}>Password</div>
              <input className="inp" type="password" placeholder="••••••••" value={authPass} onChange={e => setAuthPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (authView === "login" ? handleLogin() : handleSignup())} />
            </div>
            {authError && (
              <div style={{ fontSize: 12, color: authError.startsWith("✅") ? "#4a7a52" : "#a63a2a", background: authError.startsWith("✅") ? "#e8f5eb" : "#fdecea", border: `1px solid ${authError.startsWith("✅") ? "#9ecba6" : "#f0b8b0"}`, borderRadius: 8, padding: "10px 14px", lineHeight: 1.5 }}>
                {authError}
              </div>
            )}
            <button className="btn" onClick={authView === "login" ? handleLogin : handleSignup} disabled={authLoading}
              style={{ background: `linear-gradient(135deg,${G.terracotta},${G.gold})`, color: "#fff", padding: "13px", fontSize: 14, fontWeight: 700, marginTop: 4, boxShadow: "0 4px 16px rgba(193,96,58,.4)", opacity: authLoading ? .7 : 1 }}>
              {authLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "sp 1s linear infinite" }} />
                  {authView === "login" ? "Signing in…" : "Creating account…"}
                </span>
              ) : authView === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: G.muted }}>
            {authView === "login" ? (
              <>Don't have an account?{" "}<span onClick={() => { setAuthView("signup"); setAuthError(""); }} style={{ color: G.terracotta, cursor: "pointer", fontWeight: 700 }}>Sign up free</span></>
            ) : (
              <>Already have an account?{" "}<span onClick={() => { setAuthView("login"); setAuthError(""); }} style={{ color: G.terracotta, cursor: "pointer", fontWeight: 700 }}>Sign in</span></>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: G.muted }}>🔒 Your data is private and secure</div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: "'Jost',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${G.surface}}::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
        .btn{cursor:pointer;border:none;border-radius:8px;font-family:'Jost',sans-serif;font-weight:500;transition:all .18s}
        .btn:hover{opacity:.85;transform:translateY(-1px)}
        .inp{background:rgba(255,255,255,.8);border:1.5px solid ${G.border};color:${G.text};border-radius:8px;padding:10px 14px;font-family:'Jost',sans-serif;font-size:13px;width:100%;transition:border .18s;outline:none}
        .inp:focus{border-color:${G.terracotta};background:#fff}
        .inp::placeholder{color:${G.dim}}
        select.inp option{background:#fff;color:${G.text}}
        .card{background:${G.card};border:1px solid ${G.border};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(139,90,43,.08)}
        .hover-card{transition:all .22s;cursor:pointer}
        .hover-card:hover{border-color:${G.terracotta};transform:translateY(-3px);box-shadow:0 12px 32px rgba(139,90,43,.18)}
        .lbl{font-size:10px;color:${G.muted};letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.5px}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600}
        .tab{cursor:pointer;padding:7px 16px;border-radius:24px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;transition:all .18s;border:1.5px solid transparent;white-space:nowrap}
        .subtab{cursor:pointer;padding:5px 12px;border-radius:20px;font-family:'Jost',sans-serif;font-size:11px;font-weight:500;transition:all .18s;border:1px solid transparent;white-space:nowrap}
        .divider{height:1px;background:linear-gradient(90deg,transparent,${G.border} 30%,${G.border} 70%,transparent);margin:20px 0}
        textarea.inp{resize:vertical;min-height:80px}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        @media(max-width:600px){.g2,.g3{grid-template-columns:1fr}}
        .slide{animation:sld .28s ease}@keyframes sld{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .overlay{position:fixed;inset:0;background:rgba(61,46,30,.7);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
        .modal{background:${G.cream};border:1px solid ${G.border};border-radius:16px;padding:28px;width:100%;max-width:440px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(139,90,43,.2)}
        .spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
        .serif{font-family:'Cormorant Garamond',serif}
        .star{cursor:pointer;font-size:20px;transition:transform .15s}.star:hover{transform:scale(1.3)}
        .lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:300;cursor:zoom-out;padding:16px}
        .lightbox img{max-width:96vw;max-height:96vh;border-radius:12px;object-fit:contain;box-shadow:0 20px 60px rgba(0,0,0,.5)}
        .subcat-bar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 24px;background:${G.surface};border-bottom:1px solid ${G.border}}
        .stat-box{background:${G.card};border:1px solid ${G.border};border-radius:12px;padding:12px 18px;text-align:center;min-width:90px;flex:0 0 auto;box-shadow:0 2px 8px rgba(139,90,43,.08)}
        .photo-btn{cursor:pointer;border:none;border-radius:10px;font-family:'Jost',sans-serif;font-weight:600;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 14px;flex:1}
        .photo-btn:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(193,96,58,.2)}
      `}</style>

      {/* NAV */}
      <nav style={{ background: `linear-gradient(135deg,#e8d5bc,#f0e4d0)`, bo

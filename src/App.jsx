import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CATEGORIES = ["Clothing","Shoes","Bags","Accessories","Electronics","Furniture","Books","Kitchenware","Toys","Sports","Jewelry","Other"];
const SUBCATEGORIES = {
  Clothing:["Dresses","Tops & Blouses","Sweaters","Tees & Tanks","Pants","Jeans","Jackets & Coats","Skirts","Shorts","Blazers","Pajamas","Activewear","Sweatshirts & Sweatpants","Intimates","Swimwear"],
  Shoes:["Sneakers","Heels","Flats","Boots","Sandals","Loafers","Athletic","Slippers","Mules","Wedges"],
  Bags:["Handbags","Tote Bags","Backpacks","Clutches","Crossbody","Shoulder Bags","Wallets","Travel Bags"],
  Accessories:["Jewelry","Scarves","Hats","Belts","Sunglasses","Watches","Hair Accessories","Gloves"],
  Electronics:["Phones","Laptops","Tablets","TVs","Cameras","Audio","Gaming","Wearables","Other"],
  Furniture:["Seating","Tables","Storage","Beds","Desks","Shelving","Outdoor","Other"],
  Kitchenware:["Cookware","Bakeware","Utensils","Appliances","Dinnerware","Glassware","Storage","Other"],
  Sports:["Gym Equipment","Outdoor","Water Sports","Team Sports","Cycling","Yoga","Other"],
};

// Map subcategory → friendly item type word
const SUBCAT_TYPE = {
  "Dresses":"Dress","Tops & Blouses":"Top","Sweaters":"Sweater","Tees & Tanks":"Top",
  "Pants":"Pants","Jeans":"Jeans","Jackets & Coats":"Jacket","Skirts":"Skirt",
  "Shorts":"Shorts","Blazers":"Blazer","Pajamas":"Pajamas","Activewear":"Activewear",
  "Sweatshirts & Sweatpants":"Sweatshirt","Intimates":"Intimates","Swimwear":"Swimwear",
  "Sneakers":"Sneakers","Heels":"Heels","Flats":"Flats","Boots":"Boots",
  "Sandals":"Sandals","Loafers":"Loafers","Athletic":"Sneakers","Slippers":"Slippers",
  "Mules":"Mules","Wedges":"Wedges","Handbags":"Bag","Tote Bags":"Tote",
  "Backpacks":"Backpack","Clutches":"Clutch","Crossbody":"Crossbody Bag",
  "Shoulder Bags":"Shoulder Bag","Wallets":"Wallet","Travel Bags":"Travel Bag",
  "Jewelry":"Jewelry","Scarves":"Scarf","Hats":"Hat","Belts":"Belt",
  "Sunglasses":"Sunglasses","Watches":"Watch","Hair Accessories":"Hair Accessory",
  "Gloves":"Gloves","Phones":"Phone","Laptops":"Laptop","Tablets":"Tablet",
  "TVs":"TV","Cameras":"Camera","Audio":"Speaker","Gaming":"Console",
  "Wearables":"Wearable","Seating":"Chair","Tables":"Table","Storage":"Storage",
  "Beds":"Bed","Desks":"Desk","Shelving":"Shelf","Outdoor":"Outdoor Furniture",
  "Cookware":"Cookware","Bakeware":"Bakeware","Utensils":"Utensils",
  "Appliances":"Appliance","Dinnerware":"Dinnerware","Glassware":"Glassware",
  "Gym Equipment":"Equipment","Water Sports":"Equipment","Team Sports":"Equipment",
  "Cycling":"Bike Gear","Yoga":"Yoga Mat",
};

const CAT_TYPE = {
  "Clothing":"Item","Shoes":"Shoes","Bags":"Bag","Accessories":"Accessory",
  "Electronics":"Device","Furniture":"Furniture","Books":"Book",
  "Kitchenware":"Kitchen Item","Toys":"Toy","Sports":"Equipment",
  "Jewelry":"Jewelry","Other":"Item",
};

const CONDITIONS   = ["Excellent","Good","Fair","Poor"];
const STATUS_OPTIONS = [
  {value:"keep",   label:"Keep",   color:"#6dab7a",icon:"♡"},
  {value:"sell",   label:"Sell",   color:"#d4845a",icon:"💰"},
  {value:"donate", label:"Donate", color:"#5a8fb5",icon:"🤝"},
  {value:"discard",label:"Discard",color:"#c46a5a",icon:"🗑"},
];
const ACTION_NEEDED  = ["None","Needs cleaning","Needs repair","Needs better photo","Needs measurements","Too small / too big","Maybe replace later","Return / exchange if new"];
const STYLES         = ["Casual","Classic","Elegant","Minimalist","Sporty","Boho","Edgy"];
const STYLE_SEASONS  = ["Spring","Summer","Fall","Winter"];
const OCCASIONS      = ["Everyday","Work","Brunch","Evening","Travel","Formal"];
const LOCATIONS      = ["Bedroom","Wardrobe","Closet","Living Room","Kitchen","Bathroom","Garage","Basement","Attic","Storage Unit","Office","Other"];
const SELL_SITES=[{name:"eBay",url:"https://www.ebay.com/sell"},{name:"Poshmark",url:"https://poshmark.com/sell"},{name:"Depop",url:"https://www.depop.com"},{name:"Facebook Marketplace",url:"https://www.facebook.com/marketplace"},{name:"Vinted",url:"https://www.vinted.com"},{name:"ThredUp",url:"https://www.thredup.com/clean-out"}];
const DONATE_SITES=[{name:"Goodwill",url:"https://www.goodwill.org/donate-stuff/"},{name:"The Salvation Army",url:"https://www.satruck.org/donate-stuff"},{name:"Habitat for Humanity",url:"https://www.habitat.org/restores/donate-stuff"},{name:"Local Food Bank",url:"https://www.feedingamerica.org/find-your-local-foodbank"}];
const OUTFIT_OCCASIONS=["Casual","Work","Evening","Sport","Travel","Formal","Weekend","Party","Other"];
const SEASONS=["All Seasons","Spring","Summer","Autumn","Winter"];

const G={
  bg:"#f2ebe0",surface:"#ede3d4",card:"#faf6ef",border:"#d9c9b0",
  gold:"#b5763a",text:"#3d2e1e",muted:"#7a6248",dim:"#a89070",
  green:"#6dab7a",orange:"#d4845a",blue:"#5a8fb5",purple:"#9b7fc4",
  yellow:"#c9a04a",red:"#c46a5a",terracotta:"#c1603a",cream:"#fdf8f0",
};

const emptyItem={
  id:null,category:"",subcategory:"",name:"",favorite:false,
  color:"",size:"",material:"",condition:"",location:"",
  status:"keep",actionNeeded:"None",
  style:"",styleSeason:[],occasion:[],
  whenBought:"",price:"",customSellLink:"",customDonateLink:"",notes:"",
  photo:null,
};
const emptyOutfit={id:null,name:"",occasion:"",season:"All Seasons",itemIds:[],notes:"",rating:0};

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}

function resizeImage(base64,maxSize=900){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas");
      let w=img.width,h=img.height;
      if(w>h&&w>maxSize){h=(h*maxSize)/w;w=maxSize;}
      else if(h>maxSize){w=(w*maxSize)/h;h=maxSize;}
      c.width=w;c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      resolve(c.toDataURL("image/jpeg",0.82));
    };
    img.src=base64;
  });
}

// ── Smart name builder ──────────────────────────────────────────────────────
function cap(s){return s?s.split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" "):""}

function buildName(opts){
  // opts: { color, material, fit, itemType, category, subcategory }
  const itemType = opts.itemType
    || SUBCAT_TYPE[opts.subcategory]
    || CAT_TYPE[opts.category]
    || "Item";
  const parts=[];
  if(opts.color) parts.push(cap(opts.color));
  // one optional descriptor — material first, then fit
  const descriptor = opts.material || opts.fit || "";
  if(descriptor && descriptor.length<=12) parts.push(cap(descriptor));
  parts.push(cap(itemType));
  return parts.filter(Boolean).join(" ");
}

// ── AI photo analysis ───────────────────────────────────────────────────────
async function analyzePhoto(base64){
  const data64=base64.split(",")[1];
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",max_tokens:400,
      messages:[{role:"user",content:[
        {type:"image",source:{type:"base64",media_type:"image/jpeg",data:data64}},
        {type:"text",text:`Return ONLY valid JSON, no markdown:
{
  "item_type":"",
  "color":"",
  "material":"",
  "fit":"",
  "category":"",
  "subcategory":"",
  "size":"",
  "condition":"",
  "notes":""
}
- item_type: e.g. "jacket","dress","sneakers". Required.
- color: primary color 1-2 words. Required.
- material: only if confident e.g. "Leather","Cotton". Empty if unsure.
- fit: only if visible e.g. "Oversized","Cropped". Empty if unsure.
- category: one of Clothing,Shoes,Bags,Accessories,Electronics,Furniture,Books,Kitchenware,Toys,Sports,Jewelry,Other
- subcategory: match to known list for the category
- size: visible label or estimate. Empty if unknown.
- condition: Excellent,Good,Fair,Poor
- notes: 1-2 sentences, include brand if visible`}
      ]}]
    })
  });
  const d=await res.json();
  if(d.error) throw new Error(d.error.message);
  const txt=d.content?.map(b=>b.text||"").join("")||"";
  return JSON.parse(txt.replace(/```json|```/g,"").trim());
}

async function callClaude(messages,system=""){
  const body={model:"claude-sonnet-4-20250514",max_tokens:1000,messages};
  if(system) body.system=system;
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await res.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}

export default function App(){
  const [user,setUser]=useState(null);
  const [authView,setAuthView]=useState("login");
  const [authEmail,setAuthEmail]=useState("");
  const [authPass,setAuthPass]=useState("");
  const [authError,setAuthError]=useState("");
  const [authLoading,setAuthLoading]=useState(false);
  const [checkingAuth,setCheckingAuth]=useState(true);
  const [items,setItems]=useState([]);
  const [outfits,setOutfits]=useState([]);
  const [page,setPage]=useState("inventory");
  const [view,setView]=useState("grid");
  const [editItem,setEditItem]=useState({...emptyItem});
  const [selItem,setSelItem]=useState(null);
  const [editOutfit,setEditOutfit]=useState({...emptyOutfit});
  const [selOutfit,setSelOutfit]=useState(null);
  const [filterCat,setFilterCat]=useState("All");
  const [filterSub,setFilterSub]=useState("All");
  const [filterStatus,setFilterStatus]=useState("All");
  const [searchQ,setSearchQ]=useState("");
  const [linksModal,setLinksModal]=useState(null);
  const [shopQuery,setShopQuery]=useState("");
  const [shopResults,setShopResults]=useState([]);
  const [shopLoading,setShopLoading]=useState(false);
  const [shopError,setShopError]=useState("");
  const [wishlist,setWishlist]=useState([]);
  const [saved,setSaved]=useState(false);
  const [lightbox,setLightbox]=useState(null);
  const [dbLoading,setDbLoading]=useState(false);
  const [advancedOpen,setAdvancedOpen]=useState(false);

  // AI capture state
  const [aiRunning,setAiRunning]=useState(false);
  const [aiDone,setAiDone]=useState(false);
  const [aiHint,setAiHint]=useState(""); // soft message, never blocking
  const [aiData,setAiData]=useState(null);
  const [nameUserEdited,setNameUserEdited]=useState(false);

  const cameraRef=useRef();
  const galleryRef=useRef();

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setCheckingAuth(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(user) loadAllData();},[user]);

  async function loadAllData(){
    setDbLoading(true);
    try{
      const [i,o,w]=await Promise.all([
        supabase.from("items").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("outfits").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("wishlist").select("*").eq("user_id",user.id).order("added_at",{ascending:false}),
      ]);
      setItems((i.data||[]).map(dbToItem));
      setOutfits((o.data||[]).map(dbToOutfit));
      setWishlist(w.data||[]);
    }catch(e){console.error(e);}
    setDbLoading(false);
  }

  function dbToItem(r){return{id:r.id,category:r.category||"",subcategory:r.subcategory||"",name:r.name||"",favorite:r.favorite||false,color:r.color||"",size:r.size||"",material:r.material||"",condition:r.condition||"",location:r.location||"",status:r.status||"keep",actionNeeded:r.action_needed||"None",style:r.style||"",styleSeason:r.style_season||[],occasion:r.occasion||[],whenBought:r.when_bought||"",price:r.price||"",customSellLink:r.custom_sell_link||"",customDonateLink:r.custom_donate_link||"",notes:r.notes||"",photo:r.photo||null};}
  function dbToOutfit(r){return{id:r.id,name:r.name||"",occasion:r.occasion||"",season:r.season||"All Seasons",itemIds:r.item_ids||[],notes:r.notes||"",rating:r.rating||0};}
  function itemToDb(item){return{id:item.id,user_id:user.id,category:item.category,subcategory:item.subcategory,name:item.name,favorite:item.favorite,color:item.color,size:item.size,material:item.material,condition:item.condition,location:item.location,status:item.status,action_needed:item.actionNeeded,style:item.style,style_season:item.styleSeason,occasion:item.occasion,when_bought:item.whenBought,price:item.price,custom_sell_link:item.customSellLink,custom_donate_link:item.customDonateLink,notes:item.notes,photo:item.photo};}
  function outfitToDb(o){return{id:o.id,user_id:user.id,name:o.name,occasion:o.occasion,season:o.season,item_ids:o.itemIds,notes:o.notes,rating:o.rating};}

  const flash=()=>{setSaved(true);setTimeout(()=>setSaved(false),1500);};
  const stInfo=v=>STATUS_OPTIONS.find(s=>s.value===v)||STATUS_OPTIONS[0];
  const toggleArr=(field,val)=>setEditItem(p=>({...p,[field]:p[field].includes(val)?p[field].filter(x=>x!==val):[...p[field],val]}));

  // ── Auto-name logic ─────────────────────────────────────────────────────
  // Call this whenever we have new info and user hasn't manually edited
  function applyAutoName(patch, currentItem, ai){
    if(nameUserEdited) return patch; // never overwrite user edits
    const merged = {...currentItem,...patch};
    const name = buildName({
      color:    ai?.color    || merged.color,
      material: ai?.material || merged.material,
      fit:      ai?.fit,
      itemType: ai?.item_type,
      category: merged.category,
      subcategory: merged.subcategory,
    });
    return {...patch, name};
  }

  // ── Category / subcategory change ───────────────────────────────────────
  const handleCategoryChange=cat=>{
    setEditItem(p=>{
      const patch={category:cat,subcategory:""};
      return {...p,...applyAutoName(patch,p,aiData)};
    });
  };
  const handleSubcategoryChange=sub=>{
    setEditItem(p=>{
      const patch={subcategory:sub};
      return {...p,...applyAutoName(patch,p,aiData)};
    });
  };
  const handleNameChange=val=>{
    setNameUserEdited(true);
    setEditItem(p=>({...p,name:val}));
  };
  const regenerateName=()=>{
    setNameUserEdited(false);
    setEditItem(p=>{
      const name=buildName({
        color:aiData?.color||p.color,material:aiData?.material||p.material,
        fit:aiData?.fit,itemType:aiData?.item_type,
        category:p.category,subcategory:p.subcategory,
      });
      return {...p,name};
    });
  };

  // ── Photo handler ────────────────────────────────────────────────────────
  const handlePhotoFile=async(file)=>{
    if(!file) return;
    setAiHint("");setAiDone(false);setAiData(null);

    const reader=new FileReader();
    reader.onload=async(ev)=>{
      // 1. Show photo immediately
      const resized=await resizeImage(ev.target.result,900);

      // 2. Set photo + immediate fallback name (using category/sub if available)
      setEditItem(p=>{
        const patch={photo:resized};
        const immediateNamePatch=applyAutoName(patch,p,null);
        return {...p,...immediateNamePatch};
      });

      // 3. Run AI in background — never blocks
      setAiRunning(true);
      try{
        const small=await resizeImage(ev.target.result,800);
        const result=await analyzePhoto(small);
        setAiData(result);

        setEditItem(p=>{
          const patch={
            category:   result.category    || p.category,
            subcategory:result.subcategory || p.subcategory,
            color:      result.color       || p.color,
            material:   result.material    || p.material,
            size:       result.size        || p.size,
            condition:  result.condition   || p.condition,
            notes:      result.notes       || p.notes,
          };
          // Auto-name using fresh AI data
          return {...p,...applyAutoName(patch,p,result)};
        });
        setAiDone(true);
        setAiHint("✨ We added what we can — adjust if needed.");
      }catch(err){
        console.error(err);
        // Soft fallback — never blocking message
        setAiHint("We added what we can — you can adjust if needed.");
      }
      setAiRunning(false);
    };
    reader.readAsDataURL(file);
  };

  async function handleLogin(){setAuthLoading(true);setAuthError("");const{error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPass});if(error)setAuthError(error.message);setAuthLoading(false);}
  async function handleSignup(){setAuthLoading(true);setAuthError("");const{error}=await supabase.auth.signUp({email:authEmail,password:authPass});if(error)setAuthError(error.message);else setAuthError("✅ Check your email to confirm your account, then log in!");setAuthLoading(false);}
  async function handleLogout(){await supabase.auth.signOut();setItems([]);setOutfits([]);setWishlist([]);}

  const openNewItem=()=>{
    setEditItem({...emptyItem});setAdvancedOpen(false);
    setAiRunning(false);setAiDone(false);setAiData(null);setAiHint("");setNameUserEdited(false);
    setPage("inventory");setView("form");
  };
  const openEditItem=it=>{
    setEditItem({...it});setAdvancedOpen(false);
    setAiRunning(false);setAiDone(false);setAiData(null);setAiHint("");setNameUserEdited(true);
    setView("form");
  };
  const openDetailItem=it=>{setSelItem(it);setView("detail");};

  const handleSaveItem=async()=>{
    // Always ensure a name before saving
    const finalName = editItem.name.trim() || buildName({category:editItem.category,subcategory:editItem.subcategory}) || "Item";
    const itemToSave={...editItem,name:finalName};
    const isNew=!itemToSave.id;
    const item=isNew?{...itemToSave,id:uid()}:{...itemToSave};
    setItems(isNew?[item,...items]:items.map(i=>i.id===item.id?item:i));
    await supabase.from("items").upsert(itemToDb(item));
    flash();setView("grid");
  };
  const handleDeleteItem=async id=>{setItems(items.filter(i=>i.id!==id));await supabase.from("items").delete().eq("id",id);setView("grid");};
  const updateStatus=async(id,status)=>{
    const n=items.map(i=>i.id===id?{...i,status}:i);setItems(n);
    if(selItem?.id===id)setSelItem(p=>({...p,status}));
    await supabase.from("items").update({status}).eq("id",id);
  };
  const toggleFavorite=async id=>{
    const item=items.find(i=>i.id===id);if(!item)return;
    const favorite=!item.favorite;
    setItems(items.map(i=>i.id===id?{...i,favorite}:i));
    if(selItem?.id===id)setSelItem(p=>({...p,favorite}));
    await supabase.from("items").update({favorite}).eq("id",id);
  };

  const openNewOutfit=()=>{setEditOutfit({...emptyOutfit});setPage("outfits");setView("outfitForm");};
  const openEditOutfit=o=>{setEditOutfit({...o});setView("outfitForm");};
  const openDetailOutfit=o=>{setSelOutfit(o);setView("outfitDetail");};
  const handleSaveOutfit=async()=>{
    if(!editOutfit.name.trim())return;
    const isNew=!editOutfit.id;
    const outfit=isNew?{...editOutfit,id:uid()}:{...editOutfit};
    setOutfits(isNew?[outfit,...outfits]:outfits.map(o=>o.id===outfit.id?outfit:o));
    await supabase.from("outfits").upsert(outfitToDb(outfit));
    flash();setView("outfitGrid");
  };
  const handleDeleteOutfit=async id=>{setOutfits(outfits.filter(o=>o.id!==id));await supabase.from("outfits").delete().eq("id",id);setView("outfitGrid");};
  const toggleOutfitItem=id=>setEditOutfit(p=>({...p,itemIds:p.itemIds.includes(id)?p.itemIds.filter(x=>x!==id):[...p.itemIds,id]}));

  const addToWishlist=async r=>{
    const entry={...r,id:uid(),user_id:user.id,added_at:new Date().toISOString(),where_to_buy:r.where,price_range:r.priceRange,search_url:r.searchUrl};
    setWishlist(p=>[entry,...p]);
    await supabase.from("wishlist").insert({id:entry.id,user_id:user.id,title:r.title,description:r.description,price_range:r.priceRange,where_to_buy:r.where,search_url:r.searchUrl,tags:r.tags||[]});
  };
  const removeFromWishlist=async id=>{setWishlist(wishlist.filter(w=>w.id!==id));await supabase.from("wishlist").delete().eq("id",id);};

  const handleShopSearch=async()=>{
    if(!shopQuery.trim())return;
    setShopLoading(true);setShopError("");setShopResults([]);
    const myItems=items.map(i=>`${i.name}${i.color?" ("+i.color+")":""}`).join(", ");
    const system=`You are a personal shopping assistant. The user owns: ${myItems||"(no items yet)"}. Return ONLY a valid JSON array of exactly 6 objects. No markdown. Each object: "title","description","priceRange","where","searchUrl","tags"(array of 3).`;
    try{const raw=await callClaude([{role:"user",content:`Find me: "${shopQuery}"`}],system);setShopResults(JSON.parse(raw.replace(/```json|```/g,"").trim()));}
    catch{setShopError("Couldn't load suggestions. Please try again.");}
    setShopLoading(false);
  };

  const handleFilterCat=cat=>{setFilterCat(cat);setFilterSub("All");};
  const filteredItems=items.filter(it=>(filterCat==="All"||it.category===filterCat)&&(filterSub==="All"||it.subcategory===filterSub)&&(filterStatus==="All"||it.status===filterStatus)&&(!searchQ||it.name.toLowerCase().includes(searchQ.toLowerCase())||it.color?.toLowerCase().includes(searchQ.toLowerCase())||it.category?.toLowerCase().includes(searchQ.toLowerCase())||it.subcategory?.toLowerCase().includes(searchQ.toLowerCase())));
  const backView=page==="outfits"?"outfitGrid":"grid";
  const activeSubs=filterCat!=="All"&&SUBCATEGORIES[filterCat]?SUBCATEGORIES[filterCat]:[];

  const css=`
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
    .lbl{font-size:10px;color:${G.muted};letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px;font-family:'Jost',sans-serif}
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
    .lightbox img{max-width:96vw;max-height:96vh;border-radius:12px;object-fit:contain}
    .subcat-bar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 24px;background:${G.surface};border-bottom:1px solid ${G.border}}
    .stat-box{background:${G.card};border:1px solid ${G.border};border-radius:12px;padding:12px 18px;text-align:center;min-width:90px;flex:0 0 auto;box-shadow:0 2px 8px rgba(139,90,43,.08)}
    .photo-btn{cursor:pointer;border:none;border-radius:10px;font-family:'Jost',sans-serif;font-weight:600;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 14px;flex:1}
    .photo-btn:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(193,96,58,.2)}
    .sbox{background:rgba(255,255,255,.5);border:1px solid ${G.border};border-radius:14px;padding:20px}
    .stitle{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:700;color:${G.text};margin-bottom:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .tc{cursor:pointer;padding:6px 14px;border-radius:20px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;transition:all .18s;border:1.5px solid ${G.border};background:rgba(255,255,255,.7);color:${G.muted}}
    .tc.on{border-color:${G.terracotta};background:${G.terracotta}18;color:${G.terracotta};font-weight:700}
    .fav{cursor:pointer;background:none;border:none;font-size:22px;transition:transform .2s;line-height:1}
    .fav:hover{transform:scale(1.2)}
    .adv-toggle{cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,.5);border:1.5px dashed ${G.border};border-radius:10px;font-family:'Jost',sans-serif;font-size:13px;color:${G.muted};font-weight:600;transition:all .18s;width:100%}
    .adv-toggle:hover{border-color:${G.gold};color:${G.gold}}
    .ai-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:${G.terracotta}12;border:1px solid ${G.terracotta}30;border-radius:20px;font-size:10px;color:${G.terracotta};font-weight:600;font-family:'Jost',sans-serif}
    .name-hint{font-size:11px;color:${G.muted};margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
  `;

  // ── LOADING ──
  if(checkingAuth)return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:G.terracotta,fontWeight:700,marginBottom:8}}>MAISON</div>
        <div style={{fontSize:11,color:G.dim,letterSpacing:"3px",marginBottom:20}}>PERSONAL INVENTORY</div>
        <div style={{width:36,height:36,border:`3px solid ${G.border}`,borderTopColor:G.terracotta,borderRadius:"50%",animation:"sp 1s linear infinite",margin:"0 auto"}}/>
      </div>
    </div>
  );

  // ── LOGIN ──
  if(!user)return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,#f5ede0 0%,#ead5bc 40%,#e8c9a8 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Jost',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}.btn{cursor:pointer;border:none;border-radius:8px;font-family:'Jost',sans-serif;font-weight:600;transition:all .18s}.btn:hover{opacity:.88;transform:translateY(-1px)}.inp{background:rgba(255,255,255,.7);border:1.5px solid ${G.border};color:${G.text};border-radius:8px;padding:12px 16px;font-family:'Jost',sans-serif;font-size:14px;width:100%;transition:border .18s;outline:none}.inp:focus{border-color:${G.terracotta};background:rgba(255,255,255,.95)}.inp::placeholder{color:${G.dim}}@keyframes sp{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{width:"100%",maxWidth:420,animation:"fadeIn .5s ease"}}>
        <div style={{position:"fixed",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(193,96,58,.12)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"rgba(181,118,58,.15)",pointerEvents:"none"}}/>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,marginBottom:16,boxShadow:"0 8px 24px rgba(193,96,58,.35)"}}><span style={{fontSize:30}}>🏡</span></div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:G.text,letterSpacing:1}}>MAISON</div>
          <div style={{fontSize:11,color:G.muted,letterSpacing:"3px",marginTop:4}}>PERSONAL INVENTORY</div>
        </div>
        <div style={{background:"rgba(255,255,255,.75)",backdropFilter:"blur(12px)",border:`1px solid rgba(255,255,255,.9)`,borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(139,90,43,.15)"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,marginBottom:4,textAlign:"center",color:G.text}}>{authView==="login"?"Welcome Back 👋":"Create Your Account"}</div>
          <div style={{fontSize:12,color:G.muted,textAlign:"center",marginBottom:24}}>{authView==="login"?"Sign in to your personal catalog":"Free forever · Private & secure"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div style={{fontSize:10,color:G.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:6}}>Email</div><input className="inp" type="email" placeholder="you@example.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleSignup())}/></div>
            <div><div style={{fontSize:10,color:G.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:6}}>Password</div><input className="inp" type="password" placeholder="••••••••" value={authPass} onChange={e=>setAuthPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleSignup())}/></div>
            {authError&&<div style={{fontSize:12,color:authError.startsWith("✅")?"#4a7a52":"#a63a2a",background:authError.startsWith("✅")?"#e8f5eb":"#fdecea",border:`1px solid ${authError.startsWith("✅")?"#9ecba6":"#f0b8b0"}`,borderRadius:8,padding:"10px 14px",lineHeight:1.5}}>{authError}</div>}
            <button className="btn" onClick={authView==="login"?handleLogin:handleSignup} disabled={authLoading} style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"13px",fontSize:14,fontWeight:700,marginTop:4,boxShadow:"0 4px 16px rgba(193,96,58,.4)",opacity:authLoading?.7:1}}>
              {authLoading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"sp 1s linear infinite"}}/>{authView==="login"?"Signing in…":"Creating account…"}</span>:authView==="login"?"Sign In →":"Create Account →"}
            </button>
          </div>
          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:G.muted}}>
            {authView==="login"?<>Don't have an account?{" "}<span onClick={()=>{setAuthView("signup");setAuthError("");}} style={{color:G.terracotta,cursor:"pointer",fontWeight:700}}>Sign up free</span></>:<>Already have an account?{" "}<span onClick={()=>{setAuthView("login");setAuthError("");}} style={{color:G.terracotta,cursor:"pointer",fontWeight:700}}>Sign in</span></>}
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:G.muted}}>🔒 Your data is private and secure</div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return(
    <div style={{minHeight:"100vh",background:G.bg,color:G.text,fontFamily:"'Jost',sans-serif"}}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{background:`linear-gradient(135deg,#e8d5bc,#f0e4d0)`,borderBottom:`1px solid ${G.border}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:10,boxShadow:"0 2px 12px rgba(139,90,43,.12)"}}>
        <div>
          <div className="serif" style={{fontSize:24,fontWeight:700,color:G.text}}><span style={{color:G.terracotta}}>MAISON</span> <span style={{color:G.gold}}>INVENTORY</span></div>
          <div style={{fontSize:10,color:G.muted,letterSpacing:"2px",marginTop:1}}>PERSONAL CATALOG 🏡</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {(view==="form"||view==="detail"||view==="outfitForm"||view==="outfitDetail")&&<button className="btn" onClick={()=>setView(backView)} style={{background:"rgba(255,255,255,.7)",color:G.text,padding:"7px 16px",fontSize:12,border:`1px solid ${G.border}`}}>← Back</button>}
          {["inventory","outfits","shop"].map(p=>(
            <button key={p} className="tab" onClick={()=>{setPage(p);if(p!=="outfits")setView("grid");else setView("outfitGrid");}} style={{background:page===p?`linear-gradient(135deg,${G.terracotta},${G.gold})`:"rgba(255,255,255,.6)",color:page===p?"#fff":G.muted,border:`1.5px solid ${page===p?G.terracotta:G.border}`,boxShadow:page===p?"0 3px 10px rgba(193,96,58,.3)":"none"}}>
              {p==="inventory"?"🗂 Inventory":p==="outfits"?"👗 Outfits":"🛍 Shop"}
            </button>
          ))}
          {page==="inventory"&&view==="grid"&&<button className="btn" onClick={openNewItem} style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"8px 20px",fontSize:12,fontWeight:700,boxShadow:"0 3px 10px rgba(193,96,58,.35)"}}>+ Add Item</button>}
          {page==="outfits"&&(view==="outfitGrid"||view==="grid")&&<button className="btn" onClick={openNewOutfit} style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"8px 20px",fontSize:12,fontWeight:700,boxShadow:"0 3px 10px rgba(193,96,58,.35)"}}>+ Outfit</button>}
          <button className="btn" onClick={handleLogout} style={{background:"rgba(255,255,255,.6)",color:G.muted,padding:"7px 14px",fontSize:11,border:`1px solid ${G.border}`}}>Sign Out</button>
        </div>
      </nav>

      {dbLoading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"12px",background:`linear-gradient(135deg,#f5ede0,#ead5bc)`,borderBottom:`1px solid ${G.border}`,fontSize:13,color:G.muted}}><div className="spin" style={{width:16,height:16,border:`2px solid ${G.border}`,borderTopColor:G.terracotta,borderRadius:"50%"}}/>Loading your inventory…</div>}

      {/* STATS */}
      {page==="inventory"&&view==="grid"&&!dbLoading&&(
        <div style={{display:"flex",gap:10,padding:"14px 24px",overflowX:"auto",borderBottom:`1px solid ${G.border}`,background:`linear-gradient(135deg,#f5ede0,#ead5bc)`}}>
          {[{l:"Total",v:items.length,icon:"📦"},{l:"Favorites",v:items.filter(i=>i.favorite).length,icon:"⭐",c:G.gold},{l:"To Sell",v:items.filter(i=>i.status==="sell").length,icon:"💰",c:G.orange},{l:"To Donate",v:items.filter(i=>i.status==="donate").length,icon:"🤝",c:G.blue},{l:"To Keep",v:items.filter(i=>i.status==="keep").length,icon:"♡",c:G.green},{l:"Est. Value",v:"$"+items.filter(i=>i.price).reduce((a,i)=>a+(parseFloat(i.price)||0),0).toLocaleString(),icon:"✨"},{l:"Outfits",v:outfits.length,icon:"👗",c:G.purple}].map(s=>(
            <div key={s.l} className="stat-box"><div style={{fontSize:14,marginBottom:2}}>{s.icon}</div><div className="serif" style={{fontSize:19,fontWeight:700,color:s.c||G.terracotta}}>{s.v}</div><div style={{fontSize:9,color:G.muted,letterSpacing:"1px",textTransform:"uppercase",marginTop:2}}>{s.l}</div></div>
          ))}
        </div>
      )}

      {/* INVENTORY GRID */}
      {page==="inventory"&&view==="grid"&&(
        <div className="slide">
          <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"16px 24px 10px",alignItems:"center",background:G.surface,borderBottom:`1px solid ${G.border}`}}>
            <input className="inp" placeholder="🔍 Search items..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:180}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["All",...CATEGORIES].map(c=><button key={c} className="tab" onClick={()=>handleFilterCat(c)} style={{background:filterCat===c?`linear-gradient(135deg,${G.terracotta},${G.gold})`:"rgba(255,255,255,.7)",color:filterCat===c?"#fff":G.muted,border:`1.5px solid ${filterCat===c?G.terracotta:G.border}`,padding:"5px 11px",fontSize:11}}>{c}</button>)}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["All",...STATUS_OPTIONS.map(s=>s.value)].map(s=><button key={s} className="tab" onClick={()=>setFilterStatus(s)} style={{background:filterStatus===s?`linear-gradient(135deg,${G.terracotta},${G.gold})`:"rgba(255,255,255,.7)",color:filterStatus===s?"#fff":G.muted,border:`1.5px solid ${filterStatus===s?G.terracotta:G.border}`,padding:"5px 11px",fontSize:11}}>{s==="All"?"All":STATUS_OPTIONS.find(o=>o.value===s)?.label}</button>)}
            </div>
          </div>
          {activeSubs.length>0&&<div className="subcat-bar"><span style={{fontSize:10,color:G.muted,letterSpacing:"1px",textTransform:"uppercase",alignSelf:"center",marginRight:4}}>Filter:</span>{["All",...activeSubs].map(s=><button key={s} className="subtab" onClick={()=>setFilterSub(s)} style={{background:filterSub===s?"rgba(193,96,58,.15)":"rgba(255,255,255,.6)",color:filterSub===s?G.terracotta:G.muted,border:`1px solid ${filterSub===s?G.terracotta:G.border}`}}>{s}</button>)}</div>}
          <div style={{padding:"16px 24px"}}>
            {filteredItems.length===0?(
              <div style={{textAlign:"center",padding:"70px 20px",color:G.dim}}><div style={{fontSize:48,marginBottom:14}}>🧺</div><div className="serif" style={{fontSize:24,color:G.muted,marginBottom:6}}>Nothing here yet</div><div style={{fontSize:13,color:G.dim}}>Tap "+ Add Item" to start cataloging</div></div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
                {filteredItems.map(item=>{const st=stInfo(item.status);return(
                  <div key={item.id} className="card hover-card" onClick={()=>openDetailItem(item)} style={{position:"relative"}}>
                    {item.favorite&&<div style={{position:"absolute",top:8,right:8,zIndex:2,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,.3))"}}>⭐</div>}
                    {item.photo?<div style={{height:200,overflow:"hidden",background:G.surface,display:"flex",alignItems:"center",justifyContent:"center"}}><img src={item.photo} alt={item.name} style={{width:"100%",height:"100%",objectFit:"contain",background:G.surface}}/></div>:<div style={{height:90,background:`linear-gradient(135deg,${G.surface},${G.border}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📦</div>}
                    <div style={{padding:"14px 14px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}><span className="tag" style={{background:`${G.terracotta}18`,color:G.terracotta,fontSize:9}}>{item.category||"Item"}</span>{item.subcategory&&<span className="tag" style={{background:`${G.gold}18`,color:G.gold,fontSize:9}}>{item.subcategory}</span>}</div>
                        <span className="chip" style={{background:st.color+"22",color:st.color}}>{st.icon} {st.label}</span>
                      </div>
                      <div className="serif" style={{fontSize:17,fontWeight:600,lineHeight:1.3,marginBottom:5,color:G.text}}>{item.name}</div>
                      <div style={{fontSize:11,color:G.muted,display:"flex",gap:10,flexWrap:"wrap"}}>{item.color&&<span>● {item.color}</span>}{item.size&&<span>⌀ {item.size}</span>}{item.condition&&<span>★ {item.condition}</span>}</div>
                      {item.location&&<div style={{fontSize:11,color:G.dim,marginTop:6}}>📍 {item.location}</div>}
                      {item.actionNeeded&&item.actionNeeded!=="None"&&<div style={{fontSize:10,color:G.orange,marginTop:5,fontWeight:600}}>⚠️ {item.actionNeeded}</div>}
                      {item.price&&<div className="serif" style={{fontSize:15,color:G.gold,marginTop:6,fontWeight:700}}>${parseFloat(item.price).toLocaleString()}</div>}
                    </div>
                    <div style={{height:3,background:`linear-gradient(90deg,${st.color}66,transparent)`}}/>
                  </div>
                );})}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ITEM FORM
      ══════════════════════════════════════ */}
      {page==="inventory"&&view==="form"&&(
        <div style={{maxWidth:700,margin:"0 auto",padding:"28px 24px"}} className="slide">
          <div className="serif" style={{fontSize:28,fontWeight:700,marginBottom:4,color:G.text}}>{editItem.id?"Edit Item ✏️":"Add New Item ✨"}</div>
          <div style={{color:G.muted,fontSize:13,marginBottom:24}}>
            {editItem.id?"Update details below":"📸 Take a photo — AI fills in the details automatically!"}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {/* ── SECTION 1: QUICK ADD ── */}
            <div className="sbox">
              <div className="stitle">
                <span>📸</span> Quick Add
                {/* AI status pill — purely informational, never blocking */}
                {aiRunning&&(
                  <span className="ai-pill">
                    <span className="spin" style={{width:10,height:10,border:`1.5px solid rgba(193,96,58,.3)`,borderTopColor:G.terracotta,borderRadius:"50%",display:"inline-block"}}/>
                    Analysing…
                  </span>
                )}
                {aiDone&&!aiRunning&&<span className="ai-pill">✨ AI filled</span>}
              </div>

              {/* PHOTO */}
              <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={e=>handlePhotoFile(e.target.files[0])} style={{display:"none"}}/>
              <input ref={galleryRef} type="file" accept="image/*" onChange={e=>handlePhotoFile(e.target.files[0])} style={{display:"none"}}/>
              <div style={{marginBottom:16}}>
                {editItem.photo?(
                  <div style={{borderRadius:12,overflow:"hidden",border:`1px solid ${G.border}`,background:G.surface}}>
                    <div style={{position:"relative",background:G.surface,display:"flex",alignItems:"center",justifyContent:"center",minHeight:240,maxHeight:360}}>
                      <img src={editItem.photo} alt="item" style={{maxWidth:"100%",maxHeight:360,objectFit:"contain",display:"block"}}/>
                      {/* Subtle overlay while AI runs — does NOT block interaction */}
                      {aiRunning&&(
                        <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",background:"rgba(242,235,224,.92)",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,pointerEvents:"none"}}>
                          <div className="spin" style={{width:14,height:14,border:`2px solid ${G.border}`,borderTopColor:G.terracotta,borderRadius:"50%"}}/>
                          <span style={{fontSize:12,color:G.terracotta,fontWeight:600}}>Analysing…</span>
                        </div>
                      )}
                    </div>
                    {/* AI detected tags — shown after AI finishes */}
                    {!aiRunning&&aiDone&&(editItem.category||editItem.color||editItem.material)&&(
                      <div style={{padding:"8px 12px",background:`${G.terracotta}10`,borderTop:`1px solid ${G.border}`}}>
                        <div style={{fontSize:11,color:G.terracotta,fontWeight:700,marginBottom:5}}>✨ AI detected:</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {editItem.category&&<span className="tag" style={{background:`${G.terracotta}18`,color:G.terracotta,fontSize:10}}>📁 {editItem.category}</span>}
                          {editItem.subcategory&&<span className="tag" style={{background:`${G.gold}18`,color:G.gold,fontSize:10}}>🏷 {editItem.subcategory}</span>}
                          {editItem.color&&<span className="tag" style={{background:`${G.green}18`,color:G.green,fontSize:10}}>🎨 {editItem.color}</span>}
                          {editItem.material&&<span className="tag" style={{background:`${G.blue}18`,color:G.blue,fontSize:10}}>🧵 {editItem.material}</span>}
                          {editItem.condition&&<span className="tag" style={{background:`${G.purple}18`,color:G.purple,fontSize:10}}>★ {editItem.condition}</span>}
                          {editItem.size&&<span className="tag" style={{background:`${G.orange}18`,color:G.orange,fontSize:10}}>⌀ {editItem.size}</span>}
                        </div>
                      </div>
                    )}
                    {/* Soft hint — never an error message */}
                    {aiHint&&!aiRunning&&(
                      <div style={{padding:"7px 12px",background:"rgba(255,255,255,.6)",borderTop:`1px solid ${G.border}`,fontSize:11,color:G.muted}}>
                        {aiHint}
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,padding:"10px 12px",background:"rgba(255,255,255,.6)",borderTop:`1px solid ${G.border}`}}>
                      <button className="btn" onClick={()=>cameraRef.current.click()}  style={{flex:1,background:"rgba(255,255,255,.9)",color:G.text,padding:"8px",fontSize:11,fontWeight:600,border:`1px solid ${G.border}`}}>📷 Camera</button>
                      <button className="btn" onClick={()=>galleryRef.current.click()} style={{flex:1,background:"rgba(255,255,255,.9)",color:G.text,padding:"8px",fontSize:11,fontWeight:600,border:`1px solid ${G.border}`}}>🖼 Gallery</button>
                      <button className="btn" onClick={()=>{setEditItem(p=>({...p,photo:null}));setAiDone(false);setAiData(null);setAiHint("");}} style={{background:"#fdecea",color:G.red,padding:"8px 14px",fontSize:11,fontWeight:600,border:`1px solid ${G.red}33`}}>✕</button>
                    </div>
                  </div>
                ):(
                  <div style={{border:`2px dashed ${G.border}`,borderRadius:12,padding:"20px",background:"rgba(255,255,255,.4)"}}>
                    <div style={{textAlign:"center",marginBottom:14}}>
                      <div style={{fontSize:38,marginBottom:6}}>📷</div>
                      <div style={{fontSize:14,color:G.text,fontWeight:600,marginBottom:3}}>Add a photo</div>
                      <div style={{fontSize:11,color:G.muted}}>✨ AI auto-detects category, name, color, material & more</div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button className="photo-btn" onClick={()=>cameraRef.current.click()} style={{background:`linear-gradient(135deg,${G.terracotta}18,${G.gold}18)`,border:`1.5px solid ${G.terracotta}44`,color:G.terracotta}}>
                        <span style={{fontSize:24}}>📷</span><span style={{fontSize:12,fontWeight:700}}>Camera</span><span style={{fontSize:10,color:G.muted}}>Take photo</span>
                      </button>
                      <button className="photo-btn" onClick={()=>galleryRef.current.click()} style={{background:`linear-gradient(135deg,${G.blue}12,${G.purple}12)`,border:`1.5px solid ${G.blue}44`,color:G.blue}}>
                        <span style={{fontSize:24}}>🖼</span><span style={{fontSize:12,fontWeight:700}}>Gallery</span><span style={{fontSize:10,color:G.muted}}>Phone or computer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY + SUBCATEGORY */}
              <div className="g2" style={{marginBottom:14}}>
                <div>
                  <div className="lbl">Category *</div>
                  <select className="inp" value={editItem.category} onChange={e=>handleCategoryChange(e.target.value)}>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="lbl">Subcategory</div>
                  <select className="inp" value={editItem.subcategory} onChange={e=>handleSubcategoryChange(e.target.value)} disabled={!SUBCATEGORIES[editItem.category]}>
                    <option value="">Select...</option>
                    {(SUBCATEGORIES[editItem.category]||[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* ITEM NAME — always has a value, never empty */}
              <div style={{marginBottom:14}}>
                <div className="lbl">Item Name</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input
                    className="inp"
                    placeholder="e.g. Black Leather Jacket"
                    value={editItem.name}
                    onChange={e=>handleNameChange(e.target.value)}
                    style={{flex:1,fontSize:14,fontWeight:600,
                      borderColor: aiRunning ? G.gold+"88" : undefined,
                      transition:"border-color .3s"
                    }}
                  />
                  <button className="fav" onClick={()=>setEditItem(p=>({...p,favorite:!p.favorite}))} title="Favorite">
                    {editItem.favorite?"⭐":"☆"}
                  </button>
                </div>
                {/* Subtle hint row below name — no error language */}
                <div className="name-hint">
                  {aiRunning&&(
                    <span style={{color:G.gold,fontWeight:600,animation:"pulse 1.4s infinite"}}>✨ Generating name…</span>
                  )}
                  {!aiRunning&&aiDone&&!nameUserEdited&&(
                    <span style={{color:G.green,fontWeight:600}}>✓ Auto-generated</span>
                  )}
                  {!aiRunning&&nameUserEdited&&aiData&&(
                    <button className="btn" onClick={regenerateName} style={{background:"rgba(255,255,255,.7)",color:G.terracotta,border:`1px solid ${G.terracotta}44`,padding:"3px 10px",fontSize:10,fontWeight:600}}>
                      ↩ Restore AI name
                    </button>
                  )}
                  <span style={{color:G.dim}}>{editItem.favorite?"⭐ Favorite":"☆ Tap star to favorite"}</span>
                </div>
              </div>

              {/* COLOR, SIZE, MATERIAL */}
              <div className="g3" style={{marginBottom:14}}>
                <div><div className="lbl">Color</div><input className="inp" placeholder="Navy Blue" value={editItem.color} onChange={e=>setEditItem(p=>({...p,color:e.target.value}))}/></div>
                <div><div className="lbl">Size</div><input className="inp" placeholder="M, 42, 10L" value={editItem.size} onChange={e=>setEditItem(p=>({...p,size:e.target.value}))}/></div>
                <div><div className="lbl">Material</div><input className="inp" placeholder="Cotton, Silk" value={editItem.material} onChange={e=>setEditItem(p=>({...p,material:e.target.value}))}/></div>
              </div>

              {/* CONDITION + LOCATION */}
              <div className="g2" style={{marginBottom:14}}>
                <div><div className="lbl">Condition</div><select className="inp" value={editItem.condition} onChange={e=>setEditItem(p=>({...p,condition:e.target.value}))}><option value="">Select...</option>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><div className="lbl">Location in House</div><select className="inp" value={editItem.location} onChange={e=>setEditItem(p=>({...p,location:e.target.value}))}><option value="">Select...</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
              </div>

              {/* STATUS */}
              <div style={{marginBottom:14}}>
                <div className="lbl">Status</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {STATUS_OPTIONS.map(s=>(
                    <button key={s.value} className="btn" onClick={()=>setEditItem(p=>({...p,status:s.value}))}
                      style={{padding:"8px 16px",fontSize:12,fontWeight:600,background:editItem.status===s.value?s.color:"rgba(255,255,255,.7)",color:editItem.status===s.value?"#fff":G.muted,border:`1.5px solid ${editItem.status===s.value?s.color:G.border}`}}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION NEEDED */}
              <div>
                <div className="lbl">Action Needed</div>
                <select className="inp" value={editItem.actionNeeded} onChange={e=>setEditItem(p=>({...p,actionNeeded:e.target.value}))}>
                  {ACTION_NEEDED.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* ── SECTION 2: STYLING DETAILS ── */}
            <div className="sbox">
              <div className="stitle"><span>✨</span> Styling Details</div>
              <div style={{marginBottom:14}}>
                <div className="lbl">Style</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {STYLES.map(s=><button key={s} className={`tc ${editItem.style===s?"on":""}`} onClick={()=>setEditItem(p=>({...p,style:p.style===s?"":s}))}>{s}</button>)}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div className="lbl">Season</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {STYLE_SEASONS.map(s=><button key={s} className={`tc ${editItem.styleSeason.includes(s)?"on":""}`} onClick={()=>toggleArr("styleSeason",s)}>{s==="Spring"?"🌸":s==="Summer"?"☀️":s==="Fall"?"🍂":"❄️"} {s}</button>)}
                </div>
              </div>
              <div>
                <div className="lbl">Occasion</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {OCCASIONS.map(o=><button key={o} className={`tc ${editItem.occasion.includes(o)?"on":""}`} onClick={()=>toggleArr("occasion",o)}>{o}</button>)}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: ADVANCED (collapsed) ── */}
            <div>
              <button className="adv-toggle" onClick={()=>setAdvancedOpen(p=>!p)}>
                <span>📋 Advanced / Selling Details <span style={{fontSize:11,fontWeight:400}}>(optional)</span></span>
                <span style={{fontSize:16,transition:"transform .2s",transform:advancedOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
              </button>
              {advancedOpen&&(
                <div style={{background:"rgba(255,255,255,.5)",border:`1px solid ${G.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"20px",marginTop:-2}} className="slide">
                  <div className="g2" style={{marginBottom:14}}>
                    <div><div className="lbl">When Bought</div><input className="inp" type="date" value={editItem.whenBought} onChange={e=>setEditItem(p=>({...p,whenBought:e.target.value}))}/></div>
                    <div><div className="lbl">Price ($)</div><input className="inp" type="number" placeholder="0.00" value={editItem.price} onChange={e=>setEditItem(p=>({...p,price:e.target.value}))}/></div>
                  </div>
                  <div className="g2" style={{marginBottom:14}}>
                    <div><div className="lbl">Sell Link</div><input className="inp" placeholder="https://..." value={editItem.customSellLink} onChange={e=>setEditItem(p=>({...p,customSellLink:e.target.value}))}/></div>
                    <div><div className="lbl">Donate Link</div><input className="inp" placeholder="https://..." value={editItem.customDonateLink} onChange={e=>setEditItem(p=>({...p,customDonateLink:e.target.value}))}/></div>
                  </div>
                  <div><div className="lbl">Notes</div><textarea className="inp" placeholder="Brand, purchase details, memories…" value={editItem.notes} onChange={e=>setEditItem(p=>({...p,notes:e.target.value}))}/></div>
                </div>
              )}
            </div>

            {/* SAVE — never disabled due to AI */}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
              {editItem.id&&<button className="btn" onClick={()=>handleDeleteItem(editItem.id)} style={{background:"#fdecea",color:G.red,padding:"10px 18px",fontSize:12,border:`1px solid ${G.red}44`,fontWeight:600}}>🗑 Delete</button>}
              <button className="btn" onClick={()=>setView("grid")} style={{background:"rgba(255,255,255,.8)",color:G.muted,padding:"10px 22px",fontSize:12,border:`1px solid ${G.border}`}}>Cancel</button>
              <button className="btn" onClick={handleSaveItem}
                style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"10px 28px",fontSize:13,fontWeight:700,boxShadow:"0 3px 10px rgba(193,96,58,.35)"}}>
                {saved?"✓ Saved!":aiRunning?"Save Item ⏳":editItem.id?"Save Changes":"Save Item ✨"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ITEM DETAIL */}
      {page==="inventory"&&view==="detail"&&selItem&&(()=>{
        const item=items.find(i=>i.id===selItem.id)||selItem;
        const st=stInfo(item.status);
        return(
          <div style={{maxWidth:660,margin:"0 auto",padding:"28px 24px"}} className="slide">
            {item.photo&&<div style={{borderRadius:16,overflow:"hidden",marginBottom:20,cursor:"zoom-in",boxShadow:"0 8px 24px rgba(139,90,43,.2)",background:G.surface,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setLightbox(item.photo)}><img src={item.photo} alt={item.name} style={{maxWidth:"100%",maxHeight:380,objectFit:"contain",display:"block"}}/></div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
              <div>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="tag" style={{background:`${G.terracotta}18`,color:G.terracotta}}>{item.category}</span>
                  {item.subcategory&&<span className="tag" style={{background:`${G.gold}18`,color:G.gold}}>{item.subcategory}</span>}
                  {item.favorite&&<span style={{fontSize:16}}>⭐</span>}
                </div>
                <div className="serif" style={{fontSize:30,fontWeight:700,lineHeight:1.2,color:G.text}}>{item.name}</div>
                {item.actionNeeded&&item.actionNeeded!=="None"&&<div style={{marginTop:6,fontSize:12,color:G.orange,fontWeight:600,background:`${G.orange}12`,padding:"4px 10px",borderRadius:20,display:"inline-block"}}>⚠️ {item.actionNeeded}</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <button className="fav" onClick={()=>toggleFavorite(item.id)}>{item.favorite?"⭐":"☆"}</button>
                <button className="btn" onClick={()=>openEditItem(item)} style={{background:"rgba(255,255,255,.8)",color:G.text,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,whiteSpace:"nowrap",fontWeight:600}}>✏️ Edit</button>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div className="lbl" style={{marginBottom:10}}>Status</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {STATUS_OPTIONS.map(s=><button key={s.value} className="btn" onClick={()=>updateStatus(item.id,s.value)} style={{padding:"7px 16px",fontSize:12,fontWeight:600,background:item.status===s.value?s.color:"rgba(255,255,255,.7)",color:item.status===s.value?"#fff":G.muted,border:`1.5px solid ${item.status===s.value?s.color:G.border}`}}>{s.icon} {s.label}</button>)}
              </div>
            </div>
            <div className="divider"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[{l:"Color",v:item.color},{l:"Size",v:item.size},{l:"Material",v:item.material},{l:"Condition",v:item.condition},{l:"Location",v:item.location},{l:"When Bought",v:item.whenBought?new Date(item.whenBought).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):""},{l:"Purchase Price",v:item.price?`$${parseFloat(item.price).toLocaleString()}`:"",gold:true}].filter(d=>d.v).map(d=>(
                <div key={d.l} style={{background:"rgba(255,255,255,.7)",borderRadius:10,padding:"10px 13px",border:`1px solid ${G.border}`}}><div className="lbl" style={{marginBottom:3}}>{d.l}</div><div style={{fontSize:13,color:d.gold?G.gold:G.text,fontWeight:600}}>{d.v}</div></div>
              ))}
            </div>
            {(item.style||item.styleSeason?.length>0||item.occasion?.length>0)&&(
              <><div className="lbl" style={{marginBottom:10}}>Styling Details</div>
              <div style={{background:"rgba(255,255,255,.7)",border:`1px solid ${G.border}`,borderRadius:12,padding:"14px",marginBottom:18}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {item.style&&<span className="tag" style={{background:`${G.purple}18`,color:G.purple}}>✨ {item.style}</span>}
                  {(item.styleSeason||[]).map(s=><span key={s} className="tag" style={{background:`${G.green}18`,color:G.green}}>{s==="Spring"?"🌸":s==="Summer"?"☀️":s==="Fall"?"🍂":"❄️"} {s}</span>)}
                  {(item.occasion||[]).map(o=><span key={o} className="tag" style={{background:`${G.blue}18`,color:G.blue}}>{o}</span>)}
                </div>
              </div></>
            )}
            {item.notes&&<><div className="lbl">Notes</div><div style={{background:"rgba(255,255,255,.7)",border:`1px solid ${G.border}`,borderRadius:10,padding:14,fontSize:13,color:G.muted,lineHeight:1.7,marginBottom:18,whiteSpace:"pre-wrap"}}>{item.notes}</div></>}
            <div className="divider"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
              <button className="btn" onClick={()=>setLinksModal("sell")} style={{background:`${G.orange}18`,color:G.orange,border:`1px solid ${G.orange}44`,padding:"8px 16px",fontSize:12,fontWeight:600}}>💰 Sell Platforms</button>
              <button className="btn" onClick={()=>setLinksModal("donate")} style={{background:`${G.blue}18`,color:G.blue,border:`1px solid ${G.blue}44`,padding:"8px 16px",fontSize:12,fontWeight:600}}>🤝 Donate To</button>
              {item.customSellLink&&<a href={item.customSellLink} target="_blank" rel="noreferrer"><button className="btn" style={{background:"rgba(255,255,255,.8)",color:G.gold,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,fontWeight:600}}>🔗 My Sell Link</button></a>}
              {item.customDonateLink&&<a href={item.customDonateLink} target="_blank" rel="noreferrer"><button className="btn" style={{background:"rgba(255,255,255,.8)",color:G.gold,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,fontWeight:600}}>🔗 My Donate Link</button></a>}
              <button className="btn" onClick={()=>{setShopQuery(`items to match my ${item.color||""} ${item.subcategory||item.category} ${item.name}`);setPage("shop");}} style={{background:`${G.purple}18`,color:G.purple,border:`1px solid ${G.purple}44`,padding:"8px 16px",fontSize:12,fontWeight:600}}>🛍 Find Matches</button>
            </div>
            <button className="btn" onClick={()=>handleDeleteItem(item.id)} style={{background:"#fdecea",color:G.red,padding:"9px 18px",fontSize:12,border:`1px solid ${G.red}33`,fontWeight:600}}>🗑 Delete Item</button>
          </div>
        );
      })()}

      {/* OUTFITS GRID */}
      {page==="outfits"&&(view==="outfitGrid"||view==="grid")&&(
        <div style={{padding:"24px"}} className="slide">
          <div className="serif" style={{fontSize:28,fontWeight:700,marginBottom:4,color:G.text}}>My Outfits 👗</div>
          <div style={{color:G.muted,fontSize:13,marginBottom:22}}>Combine your inventory items into complete looks</div>
          {outfits.length===0?<div style={{textAlign:"center",padding:"70px 20px",color:G.dim}}><div style={{fontSize:48,marginBottom:14}}>👗</div><div className="serif" style={{fontSize:24,color:G.muted,marginBottom:6}}>No outfits yet</div><div style={{fontSize:13}}>Create your first outfit from your inventory</div></div>:(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {outfits.map(outfit=>{
                const oItems=outfit.itemIds.map(id=>items.find(i=>i.id===id)).filter(Boolean);
                const photoItems=oItems.filter(i=>i.photo);
                return(
                  <div key={outfit.id} className="card hover-card" onClick={()=>openDetailOutfit(outfit)}>
                    {photoItems.length>0&&<div style={{display:"flex",height:90,overflow:"hidden",background:G.surface}}>{photoItems.slice(0,3).map(it=><div key={it.id} style={{flex:1,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}><img src={it.photo} alt={it.name} style={{width:"100%",height:"100%",objectFit:"contain"}}/></div>)}</div>}
                    <div style={{padding:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span className="tag" style={{background:`${G.purple}18`,color:G.purple}}>{outfit.occasion||"Outfit"}</span><span className="tag" style={{background:`${G.green}18`,color:G.green}}>{outfit.season}</span></div>
                      <div className="serif" style={{fontSize:17,fontWeight:600,marginBottom:8,color:G.text}}>{outfit.name}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>{oItems.slice(0,3).map(it=><span key={it.id} style={{background:`${G.terracotta}12`,border:`1px solid ${G.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:G.muted}}>{it.name}</span>)}{oItems.length>3&&<span style={{fontSize:11,color:G.dim}}>+{oItems.length-3} more</span>}</div>
                      {outfit.rating>0&&<div style={{fontSize:13}}>{[1,2,3,4,5].map(s=><span key={s}>{s<=outfit.rating?"⭐":"☆"}</span>)}</div>}
                    </div>
                    <div style={{height:3,background:`linear-gradient(90deg,${G.terracotta}66,${G.gold}44,transparent)`}}/>
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
          <div className="serif" style={{fontSize:28,fontWeight:700,marginBottom:4,color:G.text}}>{editOutfit.id?"Edit Outfit":"Create Outfit ✨"}</div>
          <div style={{color:G.muted,fontSize:13,marginBottom:24}}>Build a look from your inventory</div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="g3">
              <div><div className="lbl">Outfit Name *</div><input className="inp" placeholder="e.g. Sunday Brunch" value={editOutfit.name} onChange={e=>setEditOutfit(p=>({...p,name:e.target.value}))}/></div>
              <div><div className="lbl">Occasion</div><select className="inp" value={editOutfit.occasion} onChange={e=>setEditOutfit(p=>({...p,occasion:e.target.value}))}><option value="">Select...</option>{OUTFIT_OCCASIONS.map(o=><option key={o}>{o}</option>)}</select></div>
              <div><div className="lbl">Season</div><select className="inp" value={editOutfit.season} onChange={e=>setEditOutfit(p=>({...p,season:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><div className="lbl">Rating</div><div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(s=><span key={s} className="star" onClick={()=>setEditOutfit(p=>({...p,rating:s===p.rating?0:s}))} style={{color:s<=editOutfit.rating?G.gold:G.border}}>{s<=editOutfit.rating?"⭐":"☆"}</span>)}</div></div>
            <div>
              <div className="lbl" style={{marginBottom:10}}>Select Items for This Outfit</div>
              {items.length===0?<div style={{color:G.muted,fontSize:13,padding:14,background:"rgba(255,255,255,.6)",borderRadius:8,border:`1px solid ${G.border}`}}>Add items to your inventory first.</div>:(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8,maxHeight:360,overflowY:"auto",padding:2}}>
                    {items.map(it=>{const sel=editOutfit.itemIds.includes(it.id);return(
                      <div key={it.id} onClick={()=>toggleOutfitItem(it.id)} style={{background:sel?`${G.green}18`:"rgba(255,255,255,.7)",border:`1.5px solid ${sel?G.green:G.border}`,borderRadius:8,overflow:"hidden",cursor:"pointer",transition:"all .18s"}}>
                        {it.photo&&<div style={{height:90,background:G.surface,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><img src={it.photo} alt={it.name} style={{maxWidth:"100%",maxHeight:90,objectFit:"contain"}}/></div>}
                        <div style={{padding:"8px 10px"}}>
                          <div style={{fontSize:9,color:sel?G.green:G.muted,fontWeight:sel?600:400,marginBottom:2,textTransform:"uppercase",letterSpacing:"1px"}}>{it.subcategory||it.category}</div>
                          <div style={{fontSize:12,fontWeight:500,lineHeight:1.3,color:G.text}}>{it.name}</div>
                          {it.color&&<div style={{fontSize:10,color:G.dim,marginTop:2}}>● {it.color}</div>}
                          {sel&&<div style={{marginTop:4,fontSize:10,color:G.green,fontWeight:700}}>✓ Added</div>}
                        </div>
                      </div>
                    );})}
                  </div>
                  {editOutfit.itemIds.length>0&&<div style={{fontSize:12,color:G.green,marginTop:8,fontWeight:700}}>✓ {editOutfit.itemIds.length} item{editOutfit.itemIds.length!==1?"s":""} selected</div>}
                </>
              )}
            </div>
            <div><div className="lbl">Notes</div><textarea className="inp" placeholder="Describe this look…" value={editOutfit.notes} onChange={e=>setEditOutfit(p=>({...p,notes:e.target.value}))}/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
              {editOutfit.id&&<button className="btn" onClick={()=>handleDeleteOutfit(editOutfit.id)} style={{background:"#fdecea",color:G.red,padding:"9px 18px",fontSize:12,border:`1px solid ${G.red}33`,fontWeight:600}}>🗑 Delete</button>}
              <button className="btn" onClick={()=>setView("outfitGrid")} style={{background:"rgba(255,255,255,.8)",color:G.muted,padding:"9px 22px",fontSize:12,border:`1px solid ${G.border}`}}>Cancel</button>
              <button className="btn" onClick={handleSaveOutfit} style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"9px 26px",fontSize:12,fontWeight:700,boxShadow:"0 3px 10px rgba(193,96,58,.35)"}}>{saved?"✓ Saved!":editOutfit.id?"Save Changes":"Create Outfit ✨"}</button>
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
                <div style={{display:"flex",gap:8,marginBottom:10}}><span className="tag" style={{background:`${G.purple}18`,color:G.purple}}>{outfit.occasion||"Outfit"}</span><span className="tag" style={{background:`${G.green}18`,color:G.green}}>{outfit.season}</span></div>
                <div className="serif" style={{fontSize:28,fontWeight:700,color:G.text}}>{outfit.name}</div>
                {outfit.rating>0&&<div style={{marginTop:8,fontSize:14}}>{[1,2,3,4,5].map(s=><span key={s}>{s<=outfit.rating?"⭐":"☆"}</span>)}</div>}
              </div>
              <button className="btn" onClick={()=>openEditOutfit(outfit)} style={{background:"rgba(255,255,255,.8)",color:G.text,padding:"8px 16px",fontSize:12,border:`1px solid ${G.border}`,whiteSpace:"nowrap",fontWeight:600}}>✏️ Edit</button>
            </div>
            <div className="divider"/>
            <div className="lbl" style={{marginBottom:12}}>Items in This Outfit ({oItems.length})</div>
            {oItems.length===0?<div style={{color:G.muted,fontSize:13,marginBottom:20}}>No items added yet.</div>:(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:22}}>
                {oItems.map(it=>{const st=stInfo(it.status);return(
                  <div key={it.id} className="card" style={{cursor:"pointer"}} onClick={()=>{setPage("inventory");openDetailItem(it);}}>
                    {it.photo&&<div style={{height:110,background:G.surface,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}><img src={it.photo} alt={it.name} style={{maxWidth:"100%",maxHeight:110,objectFit:"contain"}}/></div>}
                    <div style={{padding:"10px 12px"}}>
                      <div style={{fontSize:9,color:G.terracotta,marginBottom:2,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>{it.subcategory||it.category}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4,color:G.text}}>{it.name}</div>
                      <span className="chip" style={{background:st.color+"22",color:st.color,fontSize:9}}>{st.icon} {st.label}</span>
                    </div>
                  </div>
                );})}
              </div>
            )}
            {outfit.notes&&<><div className="lbl">Notes</div><div style={{background:"rgba(255,255,255,.7)",border:`1px solid ${G.border}`,borderRadius:10,padding:14,fontSize:13,color:G.muted,lineHeight:1.7,marginBottom:18,whiteSpace:"pre-wrap"}}>{outfit.notes}</div></>}
            <div className="divider"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button className="btn" onClick={()=>{setShopQuery(`items to complete my ${outfit.name} outfit${outfit.occasion?" for "+outfit.occasion:""}`);setPage("shop");}} style={{background:`${G.purple}18`,color:G.purple,border:`1px solid ${G.purple}44`,padding:"9px 18px",fontSize:12,fontWeight:600}}>🛍 Find Items to Complete This Outfit</button>
              <button className="btn" onClick={()=>handleDeleteOutfit(outfit.id)} style={{background:"#fdecea",color:G.red,padding:"9px 18px",fontSize:12,border:`1px solid ${G.red}33`,fontWeight:600}}>🗑 Delete</button>
            </div>
          </div>
        );
      })()}

      {/* SHOP */}
      {page==="shop"&&(
        <div style={{maxWidth:860,margin:"0 auto",padding:"28px 24px"}} className="slide">
          <div className="serif" style={{fontSize:28,fontWeight:700,marginBottom:4,color:G.text}}>Shop & Discover 🛍</div>
          <div style={{color:G.muted,fontSize:13,marginBottom:24}}>AI-powered suggestions tailored to your wardrobe & home</div>
          <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
            <input className="inp" placeholder="e.g. sweater to match my beige dress…" value={shopQuery} onChange={e=>setShopQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleShopSearch()} style={{flex:1,minWidth:200,fontSize:14}}/>
            <button className="btn" onClick={handleShopSearch} disabled={shopLoading} style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"10px 24px",fontSize:13,fontWeight:700,opacity:shopLoading?.7:1,whiteSpace:"nowrap",boxShadow:"0 3px 10px rgba(193,96,58,.35)"}}>
              {shopLoading?"Searching…":"🔍 Find Items"}
            </button>
          </div>
          <div style={{marginBottom:24}}>
            <div className="lbl" style={{marginBottom:10}}>Quick Ideas</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Sweater to match a dress","Shoes for a casual outfit","Statement handbag","Cozy throw blanket","Kitchen storage","Silk scarf","White sneakers","Blazer for work","Jeans to match a blouse","Sunglasses","Bedroom rug","Candle holders"].map(q=><button key={q} className="btn" onClick={()=>setShopQuery(q)} style={{background:"rgba(255,255,255,.7)",color:G.muted,border:`1px solid ${G.border}`,padding:"6px 13px",fontSize:11}}>{q}</button>)}
            </div>
          </div>
          {shopError&&<div style={{background:"#fdecea",border:`1px solid ${G.red}44`,borderRadius:8,padding:"12px 16px",color:G.red,fontSize:13,marginBottom:20}}>{shopError}</div>}
          {shopLoading&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px",gap:16}}><div className="spin" style={{width:38,height:38,border:`3px solid ${G.border}`,borderTopColor:G.terracotta,borderRadius:"50%"}}/><div style={{color:G.muted,fontSize:13}}>Finding the best matches for your wardrobe…</div></div>}
          {shopResults.length>0&&(
            <div style={{marginBottom:32}}>
              <div className="serif" style={{fontSize:20,fontWeight:600,marginBottom:14,color:G.text}}>Suggestions for "{shopQuery}"</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:14}}>
                {shopResults.map((r,i)=>{
                  const inWL=wishlist.some(w=>w.title===r.title);
                  return(
                    <div key={i} className="card" style={{padding:"18px"}}>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{(r.tags||[]).map(t=><span key={t} className="tag" style={{background:`${G.terracotta}15`,color:G.terracotta,fontSize:9}}>{t}</span>)}</div>
                      <div className="serif" style={{fontSize:16,fontWeight:600,marginBottom:6,lineHeight:1.3,color:G.text}}>{r.title}</div>
                      <div style={{fontSize:12,color:G.muted,lineHeight:1.6,marginBottom:12}}>{r.description}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div className="serif" style={{fontSize:16,color:G.gold,fontWeight:700}}>{r.priceRange}</div><div style={{fontSize:11,color:G.dim}}>{r.where}</div></div>
                      <div style={{display:"flex",gap:8}}>
                        <a href={r.searchUrl||`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(r.title)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",flex:1}}><button className="btn" style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"7px 14px",fontSize:11,fontWeight:700,width:"100%"}}>Shop Now →</button></a>
                        <button className="btn" onClick={()=>inWL?removeFromWishlist(wishlist.find(w=>w.title===r.title)?.id):addToWishlist(r)} style={{background:inWL?`${G.green}18`:"rgba(255,255,255,.7)",color:inWL?G.green:G.muted,border:`1px solid ${inWL?G.green:G.border}`,padding:"7px 12px",fontSize:13,fontWeight:600}}>{inWL?"✓":"♡"}</button>
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
              <div className="serif" style={{fontSize:20,fontWeight:600,marginBottom:14,color:G.text}}>💛 My Wishlist ({wishlist.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {wishlist.map(w=>(
                  <div key={w.id} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:160}}><div className="serif" style={{fontSize:15,fontWeight:600,marginBottom:2,color:G.text}}>{w.title}</div><div style={{fontSize:11,color:G.muted}}>{w.where_to_buy||w.where} · {w.price_range||w.priceRange}</div></div>
                    <div style={{display:"flex",gap:8}}>
                      <a href={w.search_url||w.searchUrl||`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(w.title)}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button className="btn" style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"6px 14px",fontSize:11,fontWeight:700}}>Shop →</button></a>
                      <button className="btn" onClick={()=>removeFromWishlist(w.id)} style={{background:"#fdecea",color:G.red,padding:"6px 12px",fontSize:11,border:`1px solid ${G.red}33`,fontWeight:600}}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!shopLoading&&shopResults.length===0&&wishlist.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:G.dim}}>
              <div style={{fontSize:48,marginBottom:14}}>🛍</div>
              <div className="serif" style={{fontSize:22,color:G.muted,marginBottom:6}}>What are you looking for?</div>
              <div style={{fontSize:13}}>Describe what you need — AI will suggest items that match your wardrobe & home</div>
            </div>
          )}
        </div>
      )}

      {/* LINKS MODAL */}
      {linksModal&&(
        <div className="overlay" onClick={()=>setLinksModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="serif" style={{fontSize:22,fontWeight:700,marginBottom:4,color:G.text}}>{linksModal==="sell"?"💰 Sell Online":"🤝 Donate To"}</div>
            <div style={{fontSize:12,color:G.muted,marginBottom:18}}>{linksModal==="sell"?"Popular resale platforms":"Organizations accepting donations"}</div>
            {(linksModal==="sell"?SELL_SITES:DONATE_SITES).map(s=>(
              <div key={s.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${G.border}`}}>
                <div style={{fontSize:14,fontWeight:500,color:G.text}}>{s.name}</div>
                <a href={s.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button className="btn" style={{background:`linear-gradient(135deg,${G.terracotta},${G.gold})`,color:"#fff",padding:"5px 14px",fontSize:11,fontWeight:700}}>Visit →</button></a>
              </div>
            ))}
            <button className="btn" onClick={()=>setLinksModal(null)} style={{background:"rgba(255,255,255,.8)",color:G.muted,padding:"9px",fontSize:12,marginTop:18,width:"100%",border:`1px solid ${G.border}`}}>Close</button>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox&&<div className="lightbox" onClick={()=>setLightbox(null)}><img src={lightbox} alt="Full size"/></div>}
    </div>
  );
}

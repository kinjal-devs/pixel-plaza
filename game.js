(() => {
  const canvas = document.getElementById('town');
  const ctx = canvas.getContext('2d');
  const coinsEl = document.getElementById('coins');
  const toastEl = document.getElementById('toast');
  const modal = document.getElementById('modal-backdrop');
  const infoModal = document.getElementById('info-backdrop');
  const keys = new Set();
  const tileW = 64, tileH = 32;
  const origin = {x:480,y:112};
  let coins = 120, selectedShop = null, toastTimer, lastTime = 0;
  const player = {x:0,y:0,face:1,walk:0};
  const shops = [
    {id:1,name:'Cozy Cup',type:'Café',street:'Food Street',icon:'☕',x:-4,y:-3,desc:'A warm little café serving cosy drinks and sweet treats.',open:true},
    {id:2,name:'Sugar Whisk',type:'Bakery',street:'Food Street',icon:'🥐',x:-2,y:-4,desc:'Fresh breads, cupcakes and lovely pastries.',open:false},
    {id:3,name:'Scoop & Smile',type:'Ice Cream Shop',street:'Food Street',icon:'🍦',x:0,y:-4,desc:'Colourful scoops, cones and frozen delights.',open:false},
    {id:4,name:'Boba Bubble',type:'Bubble Tea Shop',street:'Food Street',icon:'🧋',x:2,y:-3,desc:'A cheerful bubble tea stop with lots of flavours.',open:false},
    {id:5,name:'Golden Petal',type:'Jewellery Shop',street:'Fashion Street',icon:'💎',x:4,y:-2,desc:'Pretty jewellery and little treasures.',open:true},
    {id:6,name:'Peachy Threads',type:'Clothing Boutique',street:'Fashion Street',icon:'👗',x:4,y:0,desc:'Cute outfits for every kind of day.',open:false},
    {id:7,name:'Little Steps',type:'Shoe Store',street:'Fashion Street',icon:'👟',x:3,y:2,desc:'Shoes for strolling around the plaza.',open:false},
    {id:8,name:'The Bag Garden',type:'Handbag Shop',street:'Fashion Street',icon:'👜',x:2,y:3,desc:'Handbags, totes and tiny purses.',open:false},
    {id:9,name:'Daisy Details',type:'Accessories Shop',street:'Fashion Street',icon:'🎀',x:1,y:4,desc:'Bows, hats and lovely accessories.',open:false},
    {id:10,name:'Bloom & Blossom',type:'Flower Shop',street:'Creative Street',icon:'🌷',x:-4,y:2,desc:'Make beautiful bouquets with fresh flowers.',open:true},
    {id:11,name:'Paper & Petal',type:'Stationery Shop',street:'Creative Street',icon:'✏️',x:-4,y:4,desc:'Notebooks, pens, stickers and more.',open:false},
    {id:12,name:'The Little Chapter',type:'Bookstore',street:'Creative Street',icon:'📚',x:-3,y:5,desc:'A quiet nook filled with stories.',open:false},
    {id:13,name:'Wrapped Wonders',type:'Gift Shop',street:'Creative Street',icon:'🎁',x:-2,y:5,desc:'Thoughtful gifts for every occasion.',open:false},
    {id:14,name:'Glow & Gather',type:'Candle Shop',street:'Creative Street',icon:'🕯️',x:-1,y:5,desc:'Cosy candles and gentle scents.',open:false},
    {id:15,name:'Made of Magic',type:'Handmade Crafts Shop',street:'Creative Street',icon:'🧶',x:-5,y:3,desc:'Handmade treasures and craft kits.',open:false},
    {id:16,name:'Tiny Toybox',type:'Toy Shop',street:'Lifestyle Street',icon:'🧸',x:4,y:4,desc:'Toys, games and little surprises.',open:true},
    {id:17,name:'Dewdrop Beauty',type:'Beauty & Skincare Shop',street:'Lifestyle Street',icon:'🧴',x:5,y:3,desc:'Gentle beauty treats and skincare goodies.',open:false},
    {id:18,name:'Paws & Whiskers',type:'Pet Shop',street:'Lifestyle Street',icon:'🐾',x:5,y:1,desc:'Meet adorable pets and find their essentials.',open:false},
    {id:19,name:'Fern & Fig',type:'Plant Shop',street:'Lifestyle Street',icon:'🪴',x:5,y:-1,desc:'Bring home a little bit of green.',open:false},
    {id:20,name:'Sunny Basket',type:'Fruit & Grocery Shop',street:'Lifestyle Street',icon:'🍓',x:3,y:-3,desc:'Fresh fruit and everyday market finds.',open:false}
  ];
  const districts = ['Food Street','Fashion Street','Creative Street','Lifestyle Street'];
  function iso(x,y){return {x:origin.x+(x-y)*tileW/2,y:origin.y+(x+y)*tileH/2};}
  function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function diamond(x,y,w,h,fill,stroke){poly([{x,y:y-h/2},{x:x+w/2,y},{x,y:y+h/2},{x:x-w/2,y}],fill,stroke);}
  function drawTile(x,y,fill){const p=iso(x,y);diamond(p.x,p.y,tileW,tileH,fill,'#8ca982');}
  const shopPalettes = [
    ['#d98d7d','#f2c5a9','#a95f55'],['#d8a56f','#f5d9a8','#9a6748'],['#91b9c3','#d5e9df','#527f89'],
    ['#a6bd91','#e1e9c9','#65805c'],['#d5ad73','#f2dfad','#947044'],['#c98fa5','#f0d0d8','#925b73']
  ];
  function drawBuilding(shop){
    const p=iso(shop.x,shop.y), w=82, bh=58, roofY=p.y-53;
    const palette=shopPalettes[(shop.id-1)%shopPalettes.length], wall=palette[1], trim=palette[0], dark=palette[2];
    // Ground shadow and raised stone foundation
    ctx.fillStyle='#617a5540';ctx.beginPath();ctx.ellipse(p.x+3,p.y+15,49,19,0,0,Math.PI*2);ctx.fill();
    poly([{x:p.x-w/2-3,y:roofY+24},{x:p.x,y:roofY+45},{x:p.x+w/2+3,y:roofY+24},{x:p.x,y:roofY+68}], '#b9a58d','#8d7967');
    // Two detailed walls with subtle edge shading
    poly([{x:p.x-w/2,y:roofY+22},{x:p.x,y:roofY+44},{x:p.x,y:roofY+44+bh},{x:p.x-w/2,y:roofY+22+bh}], '#c28e76','#765344');
    poly([{x:p.x,y:roofY+44},{x:p.x+w/2,y:roofY+22},{x:p.x+w/2,y:roofY+22+bh},{x:p.x,y:roofY+44+bh}], wall,'#765344');
    // Roof, layered eaves and roof tiles
    poly([{x:p.x-w/2-5,y:roofY+22},{x:p.x,y:roofY-4},{x:p.x+w/2+5,y:roofY+22},{x:p.x,y:roofY+49}], trim,'#765344');
    poly([{x:p.x-w/2-2,y:roofY+22},{x:p.x,y:roofY+1},{x:p.x+w/2+2,y:roofY+22},{x:p.x,y:roofY+43}], palette[0],'#9a6c59');
    ctx.strokeStyle='#ffffff55';ctx.lineWidth=2;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(p.x+i*10,roofY+5+Math.abs(i)*5);ctx.lineTo(p.x+i*10,roofY+36-Math.abs(i)*4);ctx.stroke();}
    // Front windows with frames, glass shine and flower boxes
    const winY=roofY+57;
    for(const wx of [p.x+8,p.x+29]){
      ctx.fillStyle='#765344';ctx.fillRect(wx-7,winY-7,15,21);
      ctx.fillStyle='#a9d4d2';ctx.fillRect(wx-5,winY-5,11,16);
      ctx.fillStyle='#e9f4df';ctx.fillRect(wx-4,winY-4,3,6);
      ctx.fillStyle='#765344';ctx.fillRect(wx,winY-5,2,16);
      ctx.fillRect(wx-5,winY+2,11,2);
      ctx.fillStyle='#8c5e4a';ctx.fillRect(wx-8,winY+14,17,3);
      for(let k=0;k<3;k++){ctx.fillStyle=['#e7a0a0','#f2d27f','#a9c99a'][k];ctx.fillRect(wx-6+k*6,winY+9,4,4);}
    }
    // Recessed entrance, door panel and brass handle
    ctx.fillStyle='#765344';ctx.fillRect(p.x+11,roofY+76,20,27);
    ctx.fillStyle='#d6a58a';ctx.fillRect(p.x+13,roofY+78,16,23);
    ctx.fillStyle='#f4d58b';ctx.fillRect(p.x+25,roofY+89,2,3);
    ctx.fillStyle='#f1dfc4';ctx.fillRect(p.x+9,roofY+103,24,4);
    // Striped awning with scalloped edge
    const awnY=roofY+48;
    ctx.fillStyle='#fff0d9';ctx.fillRect(p.x+3,awnY,39,13);
    for(let i=0;i<5;i++){ctx.fillStyle=i%2===0?trim:'#fff0d9';ctx.fillRect(p.x+3+i*8,awnY,8,13);}
    ctx.strokeStyle='#765344';ctx.lineWidth=1.5;ctx.strokeRect(p.x+3,awnY,40,13);
    for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(p.x+7+i*8,awnY+13,4,0,Math.PI);ctx.fillStyle=i%2===0?trim:'#fff0d9';ctx.fill();ctx.stroke();}
    // Hanging shop sign with border and tiny signpost brackets
    ctx.fillStyle='#765344';ctx.fillRect(p.x-28,roofY+35,3,12);ctx.fillRect(p.x+43,roofY+35,3,12);
    ctx.fillStyle='#fff8e9';ctx.strokeStyle='#765344';ctx.lineWidth=2;
    ctx.fillRect(p.x-39,roofY+18,78,18);ctx.strokeRect(p.x-39,roofY+18,78,18);
    ctx.fillStyle=dark;ctx.font='bold 9px Nunito, sans-serif';ctx.textAlign='center';
    ctx.fillText(shop.name,p.x,roofY+30);
    // Tiny hanging lamp and open/locked marker
    ctx.fillStyle='#f6d889';ctx.beginPath();ctx.arc(p.x+48,roofY+48,4,0,Math.PI*2);ctx.fill();
    if(!shop.open){ctx.fillStyle='#67483c';ctx.font='bold 8px Nunito';ctx.fillText('LOCKED',p.x+19,p.y+24);}
    shop.hit={x:p.x,y:roofY+74,r:48};
  }
  function drawTree(x,y){
    const p=iso(x,y);
    ctx.fillStyle='#657b5540';ctx.beginPath();ctx.ellipse(p.x+3,p.y+8,24,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8b6248';ctx.fillRect(p.x-5,p.y-21,10,28);
    ctx.fillStyle='#6e9a6b';ctx.fillRect(p.x-3,p.y-26,6,12);
    const blobs=[[-12,-37,15,'#79a878'],[2,-45,16,'#91b982'],[15,-35,14,'#6f9d70'],[-1,-29,16,'#a2c78c'],[-15,-27,10,'#83ad79'],[13,-24,11,'#8fb77e']];
    blobs.forEach(([dx,dy,r,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x+dx,p.y+dy,r,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='#d7e6a0';ctx.fillRect(p.x-9,p.y-47,4,4);ctx.fillRect(p.x+7,p.y-35,3,3);
  }
  function drawLamp(x,y){
    const p=iso(x,y);
    ctx.fillStyle='#6f5948';ctx.fillRect(p.x-2,p.y-34,4,35);ctx.fillRect(p.x-9,p.y-35,18,3);
    ctx.fillStyle='#f8df9b';ctx.fillRect(p.x-7,p.y-45,14,11);
    ctx.strokeStyle='#765344';ctx.lineWidth=2;ctx.strokeRect(p.x-7,p.y-45,14,11);
    ctx.fillStyle='#fff4c8';ctx.fillRect(p.x-3,p.y-42,6,5);
    ctx.fillStyle='#617a5540';ctx.beginPath();ctx.ellipse(p.x,p.y+3,9,4,0,0,Math.PI*2);ctx.fill();
  }
  function drawFlowerBed(x,y){
    const p=iso(x,y);
    diamond(p.x,p.y,40,19,'#a77b62','#765344');
    diamond(p.x,p.y-3,34,14,'#789b69','#65845d');
    for(let i=0;i<5;i++){const fx=p.x-13+i*6,fy=p.y-10-(i%2)*4;ctx.fillStyle=['#e9a2a2','#f4d17b','#f4eee0','#c89ac7','#e9a2a2'][i];ctx.beginPath();ctx.arc(fx,fy,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#789b69';ctx.fillRect(fx-1,fy+2,2,6);}
  }
  function drawBench(x,y){
    const p=iso(x,y);
    ctx.fillStyle='#765344';ctx.fillRect(p.x-17,p.y-9,34,5);ctx.fillRect(p.x-17,p.y-2,34,5);
    ctx.fillRect(p.x-13,p.y+3,3,9);ctx.fillRect(p.x+10,p.y+3,3,9);
    ctx.fillStyle='#bd8769';ctx.fillRect(p.x-17,p.y-13,34,5);
  }
  function drawScene(){
    ctx.clearRect(0,0,960,640);
    const sky=ctx.createLinearGradient(0,0,0,640);sky.addColorStop(0,'#c9dfc4');sky.addColorStop(1,'#b5cda9');
    ctx.fillStyle=sky;ctx.fillRect(0,0,960,640);
    // Grass tiles with fine seams and occasional tiny ground details
    for(let y=-8;y<=9;y++)for(let x=-9;x<=9;x++){
      const c=(x+y)%2===0?'#c7d9b5':'#bdd2aa';drawTile(x,y,c);
      if((x*7+y*11)%13===0){const q=iso(x,y);ctx.fillStyle='#8eae7d';ctx.fillRect(q.x-2,q.y-1,2,2);ctx.fillRect(q.x+3,q.y+2,2,2);}
    }
    // Main pedestrian streets, paved with warm stone and subtle joints
    for(let i=-8;i<=8;i++){
      const a=iso(i,0);diamond(a.x,a.y,66,34,'#d8c3a8','#b49b82');
      const b=iso(0,i);diamond(b.x,b.y,66,34,'#d8c3a8','#b49b82');
      ctx.strokeStyle='#ead9c2';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(a.x-17,a.y);ctx.lineTo(a.x+17,a.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(b.x-17,b.y);ctx.lineTo(b.x+17,b.y);ctx.stroke();
    }
    // Kerbs and plaza centre
    const center=iso(0,0);diamond(center.x,center.y,124,64,'#b7a18a','#927b68');
    diamond(center.x,center.y-2,112,57,'#eadcc4','#b49b82');
    // Detailed circular fountain basin
    ctx.fillStyle='#a58e78';ctx.beginPath();ctx.ellipse(center.x,center.y-5,43,22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#86bfc0';ctx.beginPath();ctx.ellipse(center.x,center.y-9,37,17,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff0d8';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#6eaaa9';ctx.beginPath();ctx.ellipse(center.x,center.y-12,22,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d9b879';ctx.fillRect(center.x-4,center.y-39,8,26);ctx.fillRect(center.x-14,center.y-29,28,5);
    ctx.fillStyle='#fff2ca';ctx.beginPath();ctx.arc(center.x,center.y-43,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c5e7df';ctx.beginPath();ctx.arc(center.x-14,center.y-16,3,0,Math.PI*2);ctx.arc(center.x+15,center.y-6,2,0,Math.PI*2);ctx.fill();
    // Street name markers
    ctx.font='900 13px Nunito';ctx.textAlign='center';ctx.fillStyle='#fff8e9';ctx.strokeStyle='#82654f';ctx.lineWidth=3;
    [['FOOD STREET',-2,-7],['FASHION STREET',7,-1],['CREATIVE STREET',-7,4],['LIFESTYLE STREET',6,6]].forEach(([t,x,y])=>{const p=iso(x,y);ctx.strokeText(t,p.x,p.y);ctx.fillText(t,p.x,p.y);});
    // Street furniture, flower beds and leafy trees
    drawTree(-7,-5);drawTree(7,-5);drawTree(-7,7);drawTree(7,7);
    drawFlowerBed(-5,-1);drawFlowerBed(5,-3);drawFlowerBed(-6,5);drawFlowerBed(6,5);
    drawLamp(-5,-5);drawLamp(5,-5);drawLamp(-6,2);drawLamp(6,2);
    drawBench(-2,2);drawBench(2,-2);
    // Shops are layered by their ground position for consistent depth
    shops.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(drawBuilding);
    // Player shadow and character
    const pp=iso(player.x,player.y);
    ctx.fillStyle='#5d725044';ctx.beginPath();ctx.ellipse(pp.x,pp.y+13,17,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#765344';ctx.fillRect(pp.x-9,pp.y+1,7,11);ctx.fillRect(pp.x+3,pp.y+1,7,11);
    ctx.fillStyle='#e8a78f';ctx.fillRect(pp.x-10,pp.y-22,20,22);
    ctx.fillStyle='#5b4038';ctx.fillRect(pp.x-11,pp.y-27,22,9);ctx.fillRect(pp.x-12,pp.y-23,5,9);
    ctx.fillStyle='#fff4df';ctx.fillRect(pp.x-8,pp.y-15,16,12);
    ctx.fillStyle='#5b4038';ctx.fillRect(pp.x+(player.face>0?2:-5),pp.y-19,3,3);
    ctx.fillStyle='#fff4df';ctx.fillRect(pp.x-18,pp.y+14,36,5);
  }
  function showToast(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1900);}
  function openShop(shop){
    selectedShop=shop;
    document.getElementById('modal-icon').textContent=shop.icon;
    document.getElementById('modal-district').textContent=shop.street.toUpperCase();
    document.getElementById('modal-title').textContent=shop.name;
    document.getElementById('modal-description').textContent=shop.desc;
    const status=document.getElementById('shop-status');
    status.textContent=shop.open?'OPEN FOR BUSINESS':'COMING SOON · UNLOCK AS YOU PLAY';
    status.classList.toggle('locked',!shop.open);
    const action=document.getElementById('shop-action');action.disabled=!shop.open;action.textContent=shop.open?'Enter shop':'Not unlocked yet';
    modal.classList.remove('hidden');
  }
  function interact(){
    const here=iso(player.x,player.y);
    const nearby=shops.map(s=>({s,d:Math.hypot(iso(s.x,s.y).x-here.x,iso(s.x,s.y).y-here.y)})).sort((a,b)=>a.d-b.d)[0];
    if(nearby&&nearby.d<95)openShop(nearby.s);else showToast('Walk closer to a shop to interact!');
  }
  function move(dx,dy,dt){
    const speed=2.5*dt;
    if(dx||dy){player.x=Math.max(-7,Math.min(7,player.x+dx*speed));player.y=Math.max(-7,Math.min(7,player.y+dy*speed));player.face=dx>=0?1:-1;player.walk+=dt;}
  }
  function loop(t){const dt=Math.min((t-lastTime)/16.67||1,2);lastTime=t;let dx=0,dy=0;if(keys.has('ArrowLeft')||keys.has('a')){dx=-1;dy=0;}if(keys.has('ArrowRight')||keys.has('d')){dx=1;dy=0;}if(keys.has('ArrowUp')||keys.has('w')){dx=0;dy=-1;}if(keys.has('ArrowDown')||keys.has('s')){dx=0;dy=1;}move(dx,dy,dt);drawScene();requestAnimationFrame(loop);}
  function showInfo(map){document.getElementById('info-title').textContent=map?'Town map':'How to play';const content=document.getElementById('info-content');if(map){content.innerHTML='<p>Explore four connected streets around the central fountain.</p><div class="map-list">'+districts.map(d=>'<div>✿ '+d+'<small>'+shops.filter(s=>s.street===d).length+' shops</small></div>').join('')+'</div><p>Tap any shop on the town screen to see its details. Locked shops will open as your town grows.</p>';}else{content.innerHTML='<p><b>Move:</b> WASD or arrow keys. On touch screens, use the joystick.</p><p><b>Visit:</b> Tap a shop, or walk near it and press TALK / INTERACT.</p><p><b>Explore:</b> Four streets, 20 planned shops and a central fountain. This is the first playable town foundation.</p>';}infoModal.classList.remove('hidden');}
  canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;const hit=shops.map(s=>({s,d:Math.hypot(s.hit.x-x,s.hit.y-y)})).filter(o=>o.d<48).sort((a,b)=>a.d-b.d)[0];if(hit)openShop(hit.s);});
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key);if(e.key===' '||e.key==='Enter')interact();});
  window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());
  document.getElementById('action-button').addEventListener('click',interact);
  document.getElementById('map-button').addEventListener('click',()=>showInfo(true));
  document.getElementById('help-button').addEventListener('click',()=>showInfo(false));
  document.getElementById('modal-close').addEventListener('click',()=>modal.classList.add('hidden'));
  document.getElementById('modal-back').addEventListener('click',()=>modal.classList.add('hidden'));
  document.getElementById('shop-action').addEventListener('click',()=>{if(!selectedShop||!selectedShop.open)return;modal.classList.add('hidden');showToast('Welcome to '+selectedShop.name+'! Shop gameplay is coming next.');});
  document.getElementById('info-close').addEventListener('click',()=>infoModal.classList.add('hidden'));
  document.getElementById('info-done').addEventListener('click',()=>infoModal.classList.add('hidden'));
  document.getElementById('info-backdrop').addEventListener('click',e=>{if(e.target===infoModal)infoModal.classList.add('hidden');});
  document.getElementById('modal-backdrop').addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});
  // Touch joystick
  const joy=document.getElementById('joystick'),stick=document.getElementById('stick');let joyId=null;
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
  function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy),max=25;if(len>max){dx=dx/len*max;dy=dy/len*max;}stick.style.transform='translate('+dx+'px,'+dy+'px)';keys.delete('ArrowLeft');keys.delete('ArrowRight');keys.delete('ArrowUp');keys.delete('ArrowDown');if(Math.abs(dx)>7)keys.add(dx<0?'ArrowLeft':'ArrowRight');if(Math.abs(dy)>7)keys.add(dy<0?'ArrowUp':'ArrowDown');}
  function resetJoy(){joyId=null;stick.style.transform='';['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].forEach(k=>keys.delete(k));}
  joy.addEventListener('pointerup',resetJoy);joy.addEventListener('pointercancel',resetJoy);joy.addEventListener('lostpointercapture',resetJoy);
  drawScene();requestAnimationFrame(loop);
})();
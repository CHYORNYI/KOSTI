
const target=4000;
let state={player:0,ai:0,turn:0,whose:"player",dice:[],available:6,selected:new Set(),rolled:false,sound:true,over:false,aiTurn:0};
const $=id=>document.getElementById(id);
const diceEl=$("dice"),statusEl=$("status"),rollBtn=$("rollBtn"),bankBtn=$("bankBtn");
const positions=[
  {x:29,y:30,r:-15},{x:58,y:24,r:12},{x:76,y:47,r:-10},
  {x:40,y:59,r:10},{x:68,y:72,r:-16},{x:51,y:43,r:5}
];
const pipMap={
  1:[[50,50]],2:[[30,30],[70,70]],3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,23],[72,23],[28,50],[72,50],[28,77],[72,77]]
};
function dieHTML(v){return pipMap[v].map(([x,y])=>`<i class="pip" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%)"></i>`).join("")}
function save(){try{localStorage.setItem("kostiV8",JSON.stringify({...state,selected:[...state.selected]}))}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem("kostiV8"));if(s&&!s.over)state={...state,...s,selected:new Set(s.selected||[])}}catch(e){}}
function beep(f=160,d=.06){if(!state.sound)return;try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.type="triangle";g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch(e){}}
const rand=()=>1+Math.floor(Math.random()*6);
function score(vals){
  if(!vals.length)return 0;
  const k=[...vals].sort((a,b)=>a-b).join("");
  if(k==="123456")return 1500;if(k==="12345")return 500;if(k==="23456")return 750;
  const c=[0,0,0,0,0,0,0];vals.forEach(v=>c[v]++);
  let s=0;
  for(let v=1;v<=6;v++){const n=c[v];if(n>=3){s+=(v===1?1000:v*100)*Math.pow(2,n-3);c[v]=0}}
  return s+c[1]*100+c[5]*50;
}
function hasScore(vals){
  if(vals.includes(1)||vals.includes(5))return true;
  const c={};vals.forEach(v=>c[v]=(c[v]||0)+1);
  if(Object.values(c).some(n=>n>=3))return true;
  const k=[...vals].sort((a,b)=>a-b).join("");
  return k.includes("12345")||k.includes("23456")||k.includes("123456");
}
const selectedVals=()=>[...state.selected].map(i=>state.dice[i]);
function render(){
  playerScore.textContent=state.player;aiScore.textContent=state.ai;
  turnScore.textContent=state.whose==="player"?state.turn:0;
  selectedScore.textContent=state.whose==="player"?score(selectedVals()):0;
  aiTurnScore.textContent=state.whose==="ai"?state.aiTurn:0;
  aiSelectedScore.textContent=state.whose==="ai"?score(selectedVals()):0;
  diceEl.innerHTML="";
  state.dice.forEach((v,i)=>{
    const p=positions[i],d=document.createElement("button");
    d.className="die";d.style.left=p.x+"%";d.style.top=p.y+"%";d.style.setProperty("--r",p.r+"deg");d.innerHTML=dieHTML(v);
    if(state.selected.has(i))d.classList.add("selected");
    if(state.whose!=="player"||!state.rolled)d.classList.add("locked");
    d.onclick=()=>toggle(i);diceEl.appendChild(d);
  });
  const s=score(selectedVals());
  rollBtn.disabled=state.over||state.whose!=="player"||(state.rolled&&s===0);
  bankBtn.disabled=state.over||state.whose!=="player"||!state.rolled||s===0;
  rollLabel.textContent=state.rolled?"РИСКНУТЬ":"БРОСИТЬ";
  save();
}
function toggle(i){state.selected.has(i)?state.selected.delete(i):state.selected.add(i);const s=score(selectedVals());statusEl.textContent=s?`Отобрано: ${s} очков`:"Эта комбинация очков не даёт";beep(250,.035);render()}
function animateDice(){[...diceEl.children].forEach(d=>d.classList.add("rolling"));setTimeout(()=>[...diceEl.children].forEach(d=>d.classList.remove("rolling")),1150)}
function playerRoll(){
  if(state.rolled){const s=score(selectedVals());if(!s)return;state.turn+=s;state.available-=state.selected.size;if(state.available<=0)state.available=6}
  state.dice=Array.from({length:state.available},rand);state.selected.clear();state.rolled=true;beep(120,.12);render();animateDice();
  if(!hasScore(state.dice)){state.turn=0;state.rolled=false;statusEl.textContent="Неудачный бросок. Очки раунда сгорели.";render();setTimeout(startAI,1300)}
  else statusEl.textContent="Выберите кости с очками.";
}
function bank(){
  const s=score(selectedVals());if(!s)return;state.turn+=s;state.player+=state.turn;
  state.turn=0;state.rolled=false;state.available=6;state.dice=[];state.selected.clear();
  if(win("player"))return;statusEl.textContent="Очки записаны. Ход соперника.";render();setTimeout(startAI,900);
}
function win(w){if(state[w]>=target){state.over=true;statusEl.textContent=w==="player"?"Вы выиграли партию!":"Соперник победил.";render();return true}return false}
function best(vals){let b={score:0,idx:[]};for(let m=1;m<(1<<vals.length);m++){const idx=[],a=[];for(let i=0;i<vals.length;i++)if(m>>i&1){idx.push(i);a.push(vals[i])}const s=score(a);if(s>b.score||(s===b.score&&idx.length<b.idx.length))b={score:s,idx}}return b}
function startAI(){state.whose="ai";state.aiTurn=0;state.available=6;state.dice=[];state.selected.clear();state.rolled=false;render();aiRoll()}
function aiRoll(){
  state.dice=Array.from({length:state.available},rand);state.selected.clear();state.rolled=true;statusEl.textContent="Соперник бросает кости…";render();animateDice();
  setTimeout(()=>{const b=best(state.dice);if(!b.score){state.aiTurn=0;statusEl.textContent="Сопернику не повезло. Очки сгорели.";render();setTimeout(endAI,1100);return}
    b.idx.forEach(i=>state.selected.add(i));state.aiTurn+=b.score;state.available-=b.idx.length;if(state.available<=0)state.available=6;render();
    const need=target-state.ai,bankNow=state.aiTurn>=need||state.aiTurn>=(state.available<=2?650:900)||(state.aiTurn>=550&&Math.random()<.55);
    if(bankNow){state.ai+=state.aiTurn;statusEl.textContent=`Соперник забирает ${state.aiTurn} очков.`;state.aiTurn=0;render();if(win("ai"))return;setTimeout(endAI,1100)}
    else{statusEl.textContent=`Соперник рискует. Раунд: ${state.aiTurn}.`;render();setTimeout(aiRoll,1300)}
  },1100);
}
function endAI(){state.whose="player";state.turn=0;state.aiTurn=0;state.available=6;state.dice=[];state.selected.clear();state.rolled=false;statusEl.textContent="Ваш ход. Бросьте кости.";render()}
function newGame(){state={player:0,ai:0,turn:0,whose:"player",dice:[],available:6,selected:new Set(),rolled:false,sound:state.sound,over:false,aiTurn:0};localStorage.removeItem("kostiV8");statusEl.textContent="Ваш ход. Бросьте кости.";render()}
rollBtn.onclick=playerRoll;bankBtn.onclick=bank;newBtn.onclick=()=>{if(confirm("Начать новую игру?"))newGame()};
soundBtn.onclick=()=>{state.sound=!state.sound;soundBtn.textContent=state.sound?"♫":"×";render()};
rulesBtn.onclick=()=>rulesDialog.showModal();closeRules.onclick=()=>rulesDialog.close();
load();render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});

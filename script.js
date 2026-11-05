const panel=document.getElementById('panel'), levelLabel=document.getElementById('levelLabel');
const fill=document.getElementById('progressFill'), progressText=document.getElementById('progressText');
const sceneTag=document.getElementById('sceneTag');
let level=0, environment=null, audienceReady=false;

/* ========== VIDEO SETTINGS ==========
   Put your two videos in a folder called "videos" next to index.html
   and change the names here if yours are different. */
const VIDEO_BEFORE='v1.mp4'; // girl in class, stops right BEFORE she answers
const VIDEO_AFTER='v2.mp4';  // girl gives her answer, until the end
const video=document.getElementById('video');
const skipBtn=document.getElementById('skipBtn');
const mainEl=document.querySelector('main');

function resetVideo(){
 video.pause();video.removeAttribute('src');video.load();
 video.classList.remove('show');skipBtn.classList.add('hidden');mainEl.classList.remove('hidden');
}
// Plays a video full screen (game panel hidden), then calls onDone when it ends.
// The last frame stays on screen, so the panel appears over it.
function playVideo(src,tag,onDone){
 let finished=false;
 const finish=()=>{if(finished)return;finished=true;video.onended=null;video.onerror=null;skipBtn.onclick=null;
  skipBtn.classList.add('hidden');mainEl.classList.remove('hidden');onDone();};
 mainEl.classList.add('hidden');sceneTag.textContent=tag;
 video.src=src;video.classList.add('show');skipBtn.classList.remove('hidden');
 video.onended=finish;
 video.onerror=finish;      // if the file is missing, the game just continues
 skipBtn.onclick=finish;
 const p=video.play();if(p&&p.catch)p.catch(finish);
}
function startStory(){playVideo(VIDEO_BEFORE,'LENA IS ABOUT TO ANSWER…',()=>showLevel(1));}
function playAnswer(){playVideo(VIDEO_AFTER,'LENA ANSWERS',finalScreen);}

function shell(eyebrow,title,message,extra='',buttons=''){
 panel.innerHTML=`<div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="message">${message}</p>${extra}<div class="actions">${buttons}</div>`;
 panel.style.animation='none';void panel.offsetWidth;panel.style.animation='arrive .55s ease both';
}
function button(label,fn,primary=true){return `<button class="${primary?'primary':''}" onclick="${fn}">${label}</button>`}
function updateProgress(n){fill.style.width=(n/5*100)+'%';progressText.textContent=n+' / 5';levelLabel.textContent=n?`LEVEL ${n} / 5`:'INTRO';}
function intro(){resetVideo();level=0;updateProgress(0);sceneTag.textContent='A CLASSROOM STORY · HELP LENA FIND HER VOICE';
 shell('AN INTERACTIVE CLASSROOM STORY','A NEW CHANCE','Lena has ideas, thoughts and the ability to learn English. But sometimes, finding the courage to speak is the hardest part. Your choices will help her find her voice.','<div class="quote">One classroom. Five moments. One new belief.</div>',button('START THE STORY','startStory()'));}
function showLevel(n){level=n;updateProgress(n);audienceReady=false;sceneTag.textContent=['','THE FIRST OPPORTUNITY','FIND YOUR VOICE','MISTAKES ARE PART OF LEARNING','CHOOSE THE ENVIRONMENT','A NEW CHANCE'][n];
 if(n===1) level1(); if(n===2) level2(); if(n===3) level3(); if(n===4) level4(); if(n===5) level5();
}
function level1(){shell('LEVEL 1 · THE FIRST OPPORTUNITY','OPPORTUNITY MISSED!','The teacher invites the class to participate. Lena knows what she wants to say… but before she can speak, another student answers.','<div class="quote">Lena had something to say, but she did not participate.</div>',button('CONTINUE','showLevel(2)'));}
function level2(){shell('LEVEL 2 · FIND YOUR VOICE','LENA NEEDS YOUR SUPPORT!','She is hesitating again. This time, the whole class can help her feel that her voice matters.','<div class="quote"><strong>EVERYONE, ENCOURAGE LENA!</strong><br>Presenter: pause here and invite the room to shout together:<br><strong style="color:#9de2dc">“YOU CAN DO IT, LENA!”</strong></div><div id="feedback" aria-live="polite">Wait for the audience — reveal the next moment when they are ready.</div>',button('THE CLASS IS READY — REVEAL','revealHand()'));}
function revealHand(){document.getElementById('feedback').textContent='Lena takes a breath… and raises her hand. The encouragement helped her try.';const actions=panel.querySelector('.actions');actions.innerHTML=button('CONTINUE','showLevel(3)');}
function level3(){shell('LEVEL 3 · MISTAKES ARE PART OF LEARNING','FIRST ACHIEVEMENT UNLOCKED!','Lena answers:','<div class="quote">“Yesterday, I go to the library.”</div><p class="message" style="margin-top:12px">She notices the mistake and corrects herself:</p><div class="quote">“Yesterday, I <strong style="color:#9de2dc">went</strong> to the library.”<br><span style="color:#ddd">Her classmates applaud. She has learned something by trying.</span></div><div class="callout">✦ FIRST ACHIEVEMENT UNLOCKED</div><div class="quote">“I made a mistake, but I corrected it. I can learn!”</div>',button('CONTINUE','showLevel(4)'));}
function level4(){environment=null;shell('LEVEL 4 · CHOOSE THE ENVIRONMENT','WHAT KIND OF CLASSROOM HELPS LENA GROW?','The same student can experience two very different classroom environments. Ask the audience to choose the one that makes participation feel safer.','<div class="options"><button class="option" id="optA" onclick="chooseEnvironment(\'A\')"><strong>ENVIRONMENT A</strong><span>Classmates laugh at mistakes. The teacher interrupts. Lena feels judged and stays quiet.</span></button><button class="option" id="optB" onclick="chooseEnvironment(\'B\')"><strong>ENVIRONMENT B</strong><span>Classmates listen. The teacher encourages effort. Lena feels respected and supported.</span></button></div><div id="feedback" aria-live="polite">AUDIENCE CHOICE: Select A or B.</div>',button('CONFIRM THE CLASS CHOICE','confirmEnvironment()',false));}
function chooseEnvironment(which){environment=which;document.getElementById('optA').classList.toggle('selected',which==='A');document.getElementById('optB').classList.toggle('selected',which==='B');document.getElementById('feedback').textContent='You selected Environment '+which+'. Press CONFIRM THE CLASS CHOICE when the audience has decided.';}
function confirmEnvironment(){if(!environment){document.getElementById('feedback').textContent='Please let the audience choose A or B first.';return;}if(environment==='B'){panel.querySelector('.message').textContent='The class chooses support. Her classmates listen without laughing, and the teacher gives her time to finish. Lena feels safe enough to try again.';document.getElementById('feedback').textContent='SUPPORTIVE ENVIRONMENT SELECTED — a place where every voice can grow.';}else{panel.querySelector('.message').textContent='The class has chosen an unsupportive environment. Laughter and interruptions make Lena withdraw. What she needs is encouragement, patience and respect.';document.getElementById('feedback').textContent='ENVIRONMENT A SELECTED — notice how an unsafe atmosphere can silence a learner.';}panel.querySelector('.actions').innerHTML=button('CONTINUE TO LENA’S NEW CHANCE','showLevel(5)');}
function level5(){shell('LEVEL 5 · A NEW CHANCE','MISSION COMPLETE!','Lena raises her hand and participates independently. She has not become perfect overnight — she has discovered that she can take a chance, learn from mistakes and keep improving.','<div class="options"><div class="option"><strong>OLD BELIEF</strong><span>“I am a weak English learner.”</span></div><div class="option selected"><strong>NEW BELIEF</strong><span>“I am capable of learning and improving.”</span></div></div><div class="callout">✦ MISSION COMPLETE</div>',button('WATCH LENA ANSWER','playAnswer()'));}
function finalScreen(){updateProgress(5);levelLabel.textContent='COMPLETE';sceneTag.textContent='THE STORY BEHIND THE JOURNEY';shell('THANK YOU, S5 STUDENTS!','YOU HELPED LENA FIND HER VOICE.','What does Lena’s experience teach us about identity and agency?','<div class="quote"><strong>THE STORY BEHIND THE JOURNEY</strong><br>How can encouragement, classroom environment and our beliefs about ourselves shape who we become as learners?</div>',button('PLAY AGAIN','intro()'));}
intro();